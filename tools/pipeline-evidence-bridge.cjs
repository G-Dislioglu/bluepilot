#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { appendEvent, loadSession, readJson } = require('./council-agent-client.cjs');
const { sessionStart } = require('./context-broker.cjs');

const VERSION = '0.1.0';

function nowIso() {
  return new Date().toISOString();
}

function readPipelineSummary(summaryPath) {
  const resolved = path.resolve(summaryPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Pipeline summary not found: ${summaryPath}`);
  }
  const summary = JSON.parse(fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, ''));
  if (!summary || summary.tool !== 'review-pipeline') {
    throw new Error('Input is not review-pipeline summary.');
  }
  return { summary, resolved };
}

function bindContext(repoRoot, taskId, includes = []) {
  const context = sessionStart(repoRoot, taskId, { include: includes });
  return {
    task_id: taskId,
    broker_version: context.broker_version,
    contract: context.contract,
    loaded: context.summary.loaded,
    missing: context.summary.missing,
    blocked: context.summary.blocked,
  };
}

function bindCouncil(councilRoot, envelope) {
  if (!councilRoot) {
    return { status: 'not_requested', session_id: null, event_type: null };
  }

  try {
    const session = loadSession(councilRoot);
    appendEvent(councilRoot, 'pipeline-evidence-bridge', 'pipeline_evidence_attached', {
      task_id: envelope.task_id,
      pipeline_passed: envelope.pipeline_summary.passed,
      summary_path: envelope.summary_path,
      evidence_id: envelope.evidence_id,
    });
    return {
      status: 'attached',
      session_id: session.session_id,
      event_type: 'pipeline_evidence_attached',
    };
  } catch (err) {
    return {
      status: 'not_attached',
      session_id: null,
      event_type: null,
      reason: err.message,
    };
  }
}

function createEvidenceEnvelope(options) {
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const taskId = options.taskId;
  if (!taskId) throw new Error('taskId is required.');

  const { summary, resolved } = readPipelineSummary(options.summaryPath);
  const contextBinding = bindContext(repoRoot, taskId, options.include || []);
  const envelope = {
    tool: 'pipeline-evidence-bridge',
    version: VERSION,
    evidence_id: `pe-${taskId}-${Date.now()}`,
    created_at: nowIso(),
    task_id: taskId,
    summary_path: resolved,
    pipeline_summary: {
      passed: Boolean(summary.passed),
      out_dir: summary.out_dir,
      artifacts: summary.artifacts,
      steps: summary.steps,
      summary: summary.summary,
      risk_flags: summary.risk_flags || [],
      human_gate_required: Boolean(summary.human_gate_required),
      visual_review_required: Boolean(summary.visual_review_required),
      browser_automation: Boolean(summary.browser_automation),
      screenshot_check: Boolean(summary.screenshot_check),
      human_ui_review: false,
    },
    context_binding: contextBinding,
    council_binding: { status: 'pending' },
    claims: {
      agent_spawned: false,
      watcher_started: false,
      ui_built: false,
      deploy_started: false,
      human_ui_review: false,
    },
    human_ui_review: false,
  };
  envelope.council_binding = bindCouncil(options.councilRoot, envelope);
  return envelope;
}

function writeEnvelope(outPath, envelope) {
  const resolved = path.resolve(outPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
  return resolved;
}

function usage() {
  return [
    'Usage:',
    '  node tools/pipeline-evidence-bridge.cjs --summary pipeline-summary.json --task-id BP-112 --out evidence.json [--council-root <root>] [--repo <repo>]',
  ].join('\n');
}

function getArg(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] || null;
}

function collectIncludes(argv) {
  const includes = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--include' && argv[index + 1]) {
      includes.push(argv[index + 1]);
      index += 1;
    }
  }
  return includes;
}

function runCli(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  const summaryPath = getArg(argv, '--summary');
  const taskId = getArg(argv, '--task-id');
  const outPath = getArg(argv, '--out');
  const repoRoot = getArg(argv, '--repo') || process.cwd();
  const councilRoot = getArg(argv, '--council-root');
  if (!summaryPath) throw new Error('Missing required --summary path.');
  if (!taskId) throw new Error('Missing required --task-id.');
  if (!outPath) throw new Error('Missing required --out path.');

  const envelope = createEvidenceEnvelope({
    summaryPath,
    taskId,
    repoRoot,
    councilRoot,
    include: collectIncludes(argv),
  });
  const written = writeEnvelope(outPath, envelope);
  process.stdout.write(`${JSON.stringify({ written, envelope }, null, 2)}\n`);
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
  bindContext,
  bindCouncil,
  createEvidenceEnvelope,
  readPipelineSummary,
  writeEnvelope,
};
