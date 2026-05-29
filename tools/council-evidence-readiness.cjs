#!/usr/bin/env node

'use strict';

const path = require('path');
const { loadSession } = require('./council-agent-client.cjs');

const VERSION = '0.1.0';

function latestEvidence(task) {
  const refs = Array.isArray(task.evidence_refs) ? task.evidence_refs : [];
  return refs[refs.length - 1] || null;
}

function missingGates(ref) {
  const missing = [];
  if (!ref) {
    return ['pipeline_evidence'];
  }
  if (ref.pipeline_passed !== true) missing.push('pipeline_passed');
  if (ref.browser_automation !== true) missing.push('browser_automation');
  if (ref.screenshot_check !== true) missing.push('screenshot_check');
  return missing;
}

function summarizeTaskEvidence(task) {
  const refs = Array.isArray(task.evidence_refs) ? task.evidence_refs : [];
  const latest = latestEvidence(task);
  const missing = missingGates(latest);
  return {
    task_id: task.task_id,
    title: task.title || task.task_id,
    status: task.status || null,
    evidence_count: refs.length,
    latest_evidence: latest ? {
      evidence_id: latest.evidence_id,
      evidence_path: latest.evidence_path,
      assigned_at: latest.assigned_at || null,
      pipeline_passed: Boolean(latest.pipeline_passed),
      browser_automation: Boolean(latest.browser_automation),
      screenshot_check: Boolean(latest.screenshot_check),
      human_ui_review: Boolean(latest.human_ui_review),
      risk_flags_count: Number.isInteger(latest.risk_flags_count) ? latest.risk_flags_count : null,
      summary: latest.summary || null,
    } : null,
    technical_ready: missing.length === 0,
    human_ui_review: latest ? Boolean(latest.human_ui_review) : false,
    missing_gates: missing,
  };
}

function listEvidenceReadiness(options) {
  const councilRoot = path.resolve(options.councilRoot || process.cwd());
  const session = loadSession(councilRoot);
  const tasks = Array.isArray(session.task_queue) ? session.task_queue : [];
  const filtered = options.taskId ? tasks.filter((task) => task.task_id === options.taskId) : tasks;
  if (options.taskId && filtered.length === 0) {
    throw new Error(`Task not found in council session: ${options.taskId}`);
  }

  const taskReadiness = filtered.map(summarizeTaskEvidence);
  return {
    tool: 'council-evidence-readiness',
    version: VERSION,
    session_id: session.session_id,
    read_only: true,
    tasks: taskReadiness,
    summary: {
      tasks: taskReadiness.length,
      technical_ready: taskReadiness.filter((task) => task.technical_ready).length,
      missing_evidence: taskReadiness.filter((task) => task.missing_gates.includes('pipeline_evidence')).length,
      human_ui_review_done: taskReadiness.filter((task) => task.human_ui_review).length,
    },
  };
}

function usage() {
  return [
    'Usage:',
    '  node tools/council-evidence-readiness.cjs --council-root <root> [--task-id BP-112]',
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
  const taskId = getArg(argv, '--task-id');
  if (!councilRoot) throw new Error('Missing required --council-root path.');
  if (argv.includes('--task-id') && !taskId) throw new Error('Missing value after --task-id.');

  const result = listEvidenceReadiness({ councilRoot, taskId });
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
  latestEvidence,
  listEvidenceReadiness,
  missingGates,
  summarizeTaskEvidence,
};
