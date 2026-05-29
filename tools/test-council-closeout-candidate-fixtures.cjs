#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createCloseoutCandidate, readReport, writeCandidate } = require('./council-closeout-candidate.cjs');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-closeout-candidate-'));
}

function report(overrides = {}) {
  return Object.assign({
    tool: 'council-session-report',
    session: { session_id: 'cs-closeout', status: 'complete' },
    tasks: { total: 1, by_status: { done: 1 }, items: [] },
    evidence: { tasks: 1, technical_ready: 1, missing_evidence: 0, human_ui_review_done: 0 },
    gates: {
      all_tasks_terminal: true,
      all_tasks_done_or_skipped: true,
      no_hard_stop: true,
      all_tasks_have_evidence: true,
      all_technical_evidence_ready: true,
      human_ui_review_complete: false,
    },
    next_actions: ['keep_human_ui_review_as_separate_gate'],
  }, overrides);
}

function run() {
  const root = tempRoot();
  try {
    const ready = createCloseoutCandidate(report());
    assert.strictEqual(ready.candidate_status, 'READY_FOR_HUMAN_REVIEW');
    assert.strictEqual(ready.can_auto_close, false);
    assert.deepStrictEqual(ready.blocking_reasons, []);
    assert.deepStrictEqual(ready.review_reasons, ['human_ui_review_not_complete']);

    const blocked = createCloseoutCandidate(report({
      gates: {
        all_tasks_terminal: false,
        all_tasks_done_or_skipped: false,
        no_hard_stop: true,
        all_tasks_have_evidence: false,
        all_technical_evidence_ready: false,
        human_ui_review_complete: false,
      },
    }));
    assert.strictEqual(blocked.candidate_status, 'BLOCKED');
    assert.ok(blocked.blocking_reasons.includes('tasks_not_all_done_or_skipped'));
    assert.ok(blocked.blocking_reasons.includes('missing_task_evidence'));

    const reportPath = path.join(root, 'report.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(report(), null, 2)}\n`, 'utf8');
    assert.strictEqual(readReport(reportPath).tool, 'council-session-report');
    const outPath = path.join(root, 'candidate.json');
    assert.strictEqual(writeCandidate(outPath, ready), path.resolve(outPath));
    assert.strictEqual(JSON.parse(fs.readFileSync(outPath, 'utf8')).tool, 'council-closeout-candidate');

    const cliOut = require('child_process').execFileSync(process.execPath, [
      'tools/council-closeout-candidate.cjs',
      '--report',
      reportPath,
    ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
    assert.strictEqual(JSON.parse(cliOut).candidate_status, 'READY_FOR_HUMAN_REVIEW');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

run();
process.stdout.write('council closeout candidate fixtures: PASS\n');
