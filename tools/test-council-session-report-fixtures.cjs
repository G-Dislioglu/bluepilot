#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createSession } = require('./maya-council-watcher.cjs');
const { getCouncilPaths, writeAtomicJson } = require('./council-agent-client.cjs');
const { buildSessionReport, writeReport } = require('./council-session-report.cjs');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-session-report-'));
}

function buildFixture(root) {
  createSession(root, {
    sessionId: 'cs-report-fixture',
    force: true,
    tasks: [
      { task_id: 'BP-A', title: 'Ready task', status: 'done' },
      { task_id: 'BP-B', title: 'Missing evidence task', status: 'in_progress' },
    ],
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
    human_ui_review: false,
    risk_flags_count: 0,
    summary: { files: 3 },
  }];
  writeAtomicJson(paths.sessionFile, session);
  writeAtomicJson(path.join(paths.agentsDir, 'agent-a.json'), {
    agent_id: 'agent-a',
    agent_name: 'Agent A',
    status: 'done',
    current_task_id: 'BP-A',
    status_revision: 2,
    task_attempt: 1,
    last_updated: '2026-05-29T00:00:00.000Z',
    blockers: [],
  });
}

function run() {
  const root = tempRoot();
  try {
    buildFixture(root);
    const report = buildSessionReport({ councilRoot: root });
    assert.strictEqual(report.tool, 'council-session-report');
    assert.strictEqual(report.read_only, true);
    assert.strictEqual(report.session.session_id, 'cs-report-fixture');
    assert.strictEqual(report.tasks.total, 2);
    assert.strictEqual(report.agents.total, 1);
    assert.strictEqual(report.evidence.technical_ready, 1);
    assert.strictEqual(report.evidence.missing_evidence, 1);
    assert.strictEqual(report.gates.all_tasks_terminal, false);
    assert.strictEqual(report.gates.all_tasks_have_evidence, false);
    assert.ok(report.next_actions.includes('complete_or_close_open_tasks'));
    assert.ok(report.next_actions.includes('attach_pipeline_evidence_to_missing_tasks'));

    const outPath = path.join(root, 'out', 'report.json');
    const written = writeReport(outPath, report);
    assert.strictEqual(written, path.resolve(outPath));
    assert.strictEqual(JSON.parse(fs.readFileSync(outPath, 'utf8')).tool, 'council-session-report');

    const cliOut = require('child_process').execFileSync(process.execPath, [
      'tools/council-session-report.cjs',
      '--council-root',
      root,
    ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
    assert.strictEqual(JSON.parse(cliOut).session.session_id, 'cs-report-fixture');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

run();
process.stdout.write('council session report fixtures: PASS\n');
