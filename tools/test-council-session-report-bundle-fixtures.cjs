#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createSession } = require('./maya-council-watcher.cjs');
const { getCouncilPaths, writeAtomicJson } = require('./council-agent-client.cjs');
const { createReportBundle } = require('./council-session-report-bundle.cjs');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-session-report-bundle-'));
}

function buildFixture(root) {
  createSession(root, {
    sessionId: 'cs-bundle-fixture',
    force: true,
    tasks: [{ task_id: 'BP-A', title: 'Ready task', status: 'done' }],
  });
  const paths = getCouncilPaths(root);
  const session = JSON.parse(fs.readFileSync(paths.sessionFile, 'utf8'));
  session.task_queue[0].evidence_refs = [{
    evidence_id: 'ev-ready',
    evidence_path: 'evidence-ready.json',
    assigned_at: '2026-05-29T00:00:00.000Z',
    pipeline_passed: true,
    browser_automation: true,
    screenshot_check: true,
    human_ui_review: true,
    risk_flags_count: 0,
    summary: { files: 1 },
  }];
  writeAtomicJson(paths.sessionFile, session);
}

function run() {
  const root = tempRoot();
  try {
    buildFixture(root);
    const outDir = path.join(root, 'reports');
    const bundle = createReportBundle({ councilRoot: root, outDir });
    assert.strictEqual(bundle.tool, 'council-session-report-bundle');
    assert.strictEqual(bundle.read_only, true);
    assert.strictEqual(bundle.gates.all_technical_evidence_ready, true);
    assert.strictEqual(bundle.gates.human_ui_review_complete, true);
    assert.ok(fs.existsSync(bundle.artifacts.json_report));
    assert.ok(fs.existsSync(bundle.artifacts.markdown_report));
    assert.ok(fs.existsSync(bundle.artifacts.bundle_summary));
    assert.ok(fs.readFileSync(bundle.artifacts.markdown_report, 'utf8').includes('BP-A'));

    const cliOut = require('child_process').execFileSync(process.execPath, [
      'tools/council-session-report-bundle.cjs',
      '--council-root',
      root,
      '--out',
      path.join(root, 'reports-cli'),
    ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
    assert.strictEqual(JSON.parse(cliOut).tool, 'council-session-report-bundle');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

run();
process.stdout.write('council session report bundle fixtures: PASS\n');
