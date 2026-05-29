#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createSession } = require('./maya-council-watcher.cjs');
const { getCouncilPaths, writeAtomicJson } = require('./council-agent-client.cjs');
const { createCloseoutBundle } = require('./council-closeout-bundle.cjs');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-closeout-bundle-'));
}

function buildSession(root) {
  createSession(root, {
    sessionId: 'cs-closeout-bundle',
    force: true,
    tasks: [{ task_id: 'BP-A', title: 'Ready task', status: 'done' }],
  });
  const paths = getCouncilPaths(root);
  const session = JSON.parse(fs.readFileSync(paths.sessionFile, 'utf8'));
  session.status = 'complete';
  session.closed_at = '2026-05-29T00:00:00.000Z';
  session.task_queue[0].evidence_refs = [{
    evidence_id: 'ev-ready',
    evidence_path: 'evidence-ready.json',
    assigned_at: '2026-05-29T00:00:00.000Z',
    pipeline_passed: true,
    browser_automation: true,
    screenshot_check: true,
    human_ui_review: false,
    risk_flags_count: 0,
    summary: { files: 1 },
  }];
  writeAtomicJson(paths.sessionFile, session);
}

function run() {
  const root = tempRoot();
  try {
    buildSession(root);
    const outDir = path.join(root, 'closeout');
    const bundle = createCloseoutBundle({ councilRoot: root, outDir });
    assert.strictEqual(bundle.tool, 'council-closeout-bundle');
    assert.strictEqual(bundle.read_only, true);
    assert.strictEqual(bundle.candidate_status, 'READY_FOR_HUMAN_REVIEW');
    assert.strictEqual(bundle.can_auto_close, false);
    assert.ok(fs.existsSync(bundle.artifacts.json_report));
    assert.ok(fs.existsSync(bundle.artifacts.closeout_candidate));
    assert.ok(fs.existsSync(bundle.artifacts.operator_handoff));
    assert.ok(fs.readFileSync(bundle.artifacts.operator_handoff, 'utf8').includes('Human decision is required before closeout.'));

    const cliOut = require('child_process').execFileSync(process.execPath, [
      'tools/council-closeout-bundle.cjs',
      '--council-root',
      root,
      '--out',
      path.join(root, 'closeout-cli'),
    ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
    assert.strictEqual(JSON.parse(cliOut).tool, 'council-closeout-bundle');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

run();
process.stdout.write('council closeout bundle fixtures: PASS\n');
