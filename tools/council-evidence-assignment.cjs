#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const {
  appendEvent,
  getCouncilPaths,
  loadSession,
  writeAtomicJson,
} = require('./council-agent-client.cjs');

const VERSION = '0.1.0';

function nowIso() {
  return new Date().toISOString();
}

function readEvidenceEnvelope(evidencePath) {
  const resolved = path.resolve(evidencePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Evidence envelope not found: ${evidencePath}`);
  }
  const envelope = JSON.parse(fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, ''));
  if (!envelope || envelope.tool !== 'pipeline-evidence-bridge') {
    throw new Error('Input is not pipeline-evidence-bridge envelope.');
  }
  if (!envelope.evidence_id) {
    throw new Error('Evidence envelope is missing evidence_id.');
  }
  return { envelope, resolved };
}

function findTask(session, taskId) {
  return (session.task_queue || []).find((task) => task.task_id === taskId) || null;
}

function buildEvidenceRef(envelope, evidencePath) {
  const pipeline = envelope.pipeline_summary || {};
  return {
    evidence_id: envelope.evidence_id,
    evidence_path: path.resolve(evidencePath),
    assigned_at: nowIso(),
    pipeline_passed: Boolean(pipeline.passed),
    human_ui_review: Boolean(envelope.human_ui_review),
    summary: pipeline.summary || null,
    risk_flags_count: Array.isArray(pipeline.risk_flags) ? pipeline.risk_flags.length : 0,
    browser_automation: Boolean(pipeline.browser_automation),
    screenshot_check: Boolean(pipeline.screenshot_check),
  };
}

function assignEvidence(options) {
  const councilRoot = path.resolve(options.councilRoot || process.cwd());
  const taskId = options.taskId;
  if (!taskId) throw new Error('taskId is required.');

  const { envelope, resolved } = readEvidenceEnvelope(options.evidencePath);
  const paths = getCouncilPaths(councilRoot);
  const session = loadSession(councilRoot);
  const task = findTask(session, taskId);
  if (!task) {
    throw new Error(`Task not found in council session: ${taskId}`);
  }

  if (!Array.isArray(task.evidence_refs)) task.evidence_refs = [];
  const existing = task.evidence_refs.find((ref) => ref.evidence_id === envelope.evidence_id);
  if (existing) {
    appendEvent(councilRoot, 'council-evidence-assignment', 'pipeline_evidence_assignment_deduplicated', {
      task_id: taskId,
      evidence_id: envelope.evidence_id,
    });
    return {
      tool: 'council-evidence-assignment',
      version: VERSION,
      assigned: false,
      deduplicated: true,
      session_id: session.session_id,
      task_id: taskId,
      evidence_ref: existing,
      status_preserved: task.status,
      directives_created: 0,
      agent_spawned: false,
      human_ui_review: false,
    };
  }

  const ref = buildEvidenceRef(envelope, resolved);
  const previousStatus = task.status;
  const previousDirectives = Array.isArray(session.directives) ? session.directives.length : 0;
  task.evidence_refs.push(ref);
  writeAtomicJson(paths.sessionFile, session);
  appendEvent(councilRoot, 'council-evidence-assignment', 'pipeline_evidence_assigned', {
    task_id: taskId,
    evidence_id: envelope.evidence_id,
    pipeline_passed: ref.pipeline_passed,
  });

  return {
    tool: 'council-evidence-assignment',
    version: VERSION,
    assigned: true,
    deduplicated: false,
    session_id: session.session_id,
    task_id: taskId,
    evidence_ref: ref,
    status_preserved: previousStatus,
    directives_created: Math.max(0, (Array.isArray(session.directives) ? session.directives.length : 0) - previousDirectives),
    agent_spawned: false,
    human_ui_review: false,
  };
}

function usage() {
  return [
    'Usage:',
    '  node tools/council-evidence-assignment.cjs --council-root <root> --task-id BP-112 --evidence evidence.json',
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
  const evidencePath = getArg(argv, '--evidence');
  if (!councilRoot) throw new Error('Missing required --council-root path.');
  if (!taskId) throw new Error('Missing required --task-id.');
  if (!evidencePath) throw new Error('Missing required --evidence path.');

  const result = assignEvidence({ councilRoot, taskId, evidencePath });
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
  assignEvidence,
  buildEvidenceRef,
  readEvidenceEnvelope,
};
