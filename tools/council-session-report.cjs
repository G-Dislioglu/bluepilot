#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { getCouncilPaths, loadSession } = require('./council-agent-client.cjs');
const { listEvidenceReadiness } = require('./council-evidence-readiness.cjs');

const VERSION = '0.1.0';

function nowIso() {
  return new Date().toISOString();
}

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

function readAgents(paths) {
  if (!fs.existsSync(paths.agentsDir)) return [];
  return fs.readdirSync(paths.agentsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => readJson(path.join(paths.agentsDir, file), null))
    .filter(Boolean)
    .map((agent) => ({
      agent_id: agent.agent_id,
      agent_name: agent.agent_name || agent.agent_id,
      status: agent.status || null,
      current_task_id: agent.current_task_id || null,
      status_revision: Number.isInteger(agent.status_revision) ? agent.status_revision : null,
      task_attempt: Number.isInteger(agent.task_attempt) ? agent.task_attempt : null,
      last_updated: agent.last_updated || null,
      blockers: Array.isArray(agent.blockers) ? agent.blockers : [],
    }));
}

function readEvents(paths) {
  if (!fs.existsSync(paths.eventsFile)) {
    return { count: 0, by_type: {}, invalid_lines: 0, last_event: null };
  }

  const lines = fs.readFileSync(paths.eventsFile, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const byType = {};
  let invalidLines = 0;
  let lastEvent = null;

  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      const type = event.type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
      lastEvent = event;
    } catch (_err) {
      invalidLines += 1;
    }
  }

  return {
    count: lines.length,
    by_type: byType,
    invalid_lines: invalidLines,
    last_event: lastEvent,
  };
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function statusIsTerminal(status) {
  return ['done', 'skipped', 'hard_stop'].includes(status);
}

function buildGates(session, readiness) {
  const tasks = Array.isArray(session.task_queue) ? session.task_queue : [];
  const hardStops = Array.isArray(session.hard_stop_log) ? session.hard_stop_log : [];
  const readinessTasks = readiness.tasks || [];
  const hasTasks = tasks.length > 0;

  return {
    all_tasks_terminal: hasTasks && tasks.every((task) => statusIsTerminal(task.status)),
    all_tasks_done_or_skipped: hasTasks && tasks.every((task) => ['done', 'skipped'].includes(task.status)),
    no_hard_stop: hardStops.length === 0 && session.status !== 'paused',
    all_tasks_have_evidence: hasTasks && readinessTasks.every((task) => task.evidence_count > 0),
    all_technical_evidence_ready: hasTasks && readinessTasks.every((task) => task.technical_ready),
    human_ui_review_complete: hasTasks && readinessTasks.every((task) => task.human_ui_review === true),
  };
}

function buildNextActions(gates) {
  const actions = [];
  if (!gates.all_tasks_terminal) actions.push('complete_or_close_open_tasks');
  if (!gates.no_hard_stop) actions.push('resolve_hard_stop_before_continuing');
  if (!gates.all_tasks_have_evidence) actions.push('attach_pipeline_evidence_to_missing_tasks');
  if (!gates.all_technical_evidence_ready) actions.push('rerun_or_fix_failed_technical_evidence');
  if (!gates.human_ui_review_complete) actions.push('keep_human_ui_review_as_separate_gate');
  if (actions.length === 0) actions.push('session_ready_for_operator_closeout_review');
  return actions;
}

function summarizeTasks(session, readiness) {
  const readinessByTask = new Map((readiness.tasks || []).map((task) => [task.task_id, task]));
  return (session.task_queue || []).map((task) => {
    const evidence = readinessByTask.get(task.task_id) || null;
    return {
      task_id: task.task_id,
      title: task.title || task.task_id,
      status: task.status || null,
      assigned_to: task.assigned_to || null,
      priority: task.priority || null,
      depends_on: Array.isArray(task.depends_on) ? task.depends_on : [],
      evidence_count: evidence ? evidence.evidence_count : 0,
      technical_ready: evidence ? evidence.technical_ready : false,
      human_ui_review: evidence ? evidence.human_ui_review : false,
      missing_gates: evidence ? evidence.missing_gates : ['pipeline_evidence'],
    };
  });
}

function buildSessionReport(options) {
  const councilRoot = path.resolve(options.councilRoot || process.cwd());
  const paths = getCouncilPaths(councilRoot);
  const session = loadSession(councilRoot);
  const readiness = listEvidenceReadiness({ councilRoot });
  const tasks = summarizeTasks(session, readiness);
  const agents = readAgents(paths);
  const events = readEvents(paths);
  const gates = buildGates(session, readiness);

  return {
    tool: 'council-session-report',
    version: VERSION,
    generated_at: nowIso(),
    read_only: true,
    session: {
      session_id: session.session_id,
      status: session.status || null,
      opened_at: session.opened_at || null,
      closed_at: session.closed_at || null,
      goal_ref: session.goal_ref || null,
    },
    tasks: {
      total: tasks.length,
      by_status: countBy(tasks, 'status'),
      items: tasks,
    },
    agents: {
      total: agents.length,
      by_status: countBy(agents, 'status'),
      items: agents,
    },
    events,
    evidence: readiness.summary,
    gates,
    next_actions: buildNextActions(gates),
    claims: {
      session_mutated: false,
      event_appended: false,
      agent_spawned: false,
      human_ui_review_inferred: false,
    },
  };
}

function writeReport(outPath, report) {
  const resolved = path.resolve(outPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return resolved;
}

function usage() {
  return [
    'Usage:',
    '  node tools/council-session-report.cjs --council-root <root> [--out report.json]',
  ].join('\n');
}

function getArg(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] || null;
}

function runCli(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  const councilRoot = getArg(argv, '--council-root');
  const outPath = getArg(argv, '--out');
  if (!councilRoot) throw new Error('Missing required --council-root path.');
  if (argv.includes('--out') && !outPath) throw new Error('Missing value after --out.');

  const report = buildSessionReport({ councilRoot });
  const result = outPath ? { written: writeReport(outPath, report), report } : report;
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  VERSION,
  buildGates,
  buildNextActions,
  buildSessionReport,
  readEvents,
  summarizeTasks,
  writeReport,
};
