#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readJson, renderHandoff, writeHandoff } = require('./operator-handoff.cjs');

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-operator-handoff-'));
}

function sampleReport() {
  return {
    tool: 'council-session-report',
    evidence: { technical_ready: 1, missing_evidence: 0 },
    tasks: {
      items: [{
        task_id: 'BP-A',
        status: 'done',
        evidence_count: 1,
        technical_ready: true,
        human_ui_review: false,
      }],
    },
  };
}

function sampleCandidate() {
  return {
    tool: 'council-closeout-candidate',
    session_id: 'cs-handoff',
    candidate_status: 'READY_FOR_HUMAN_REVIEW',
    can_auto_close: false,
    task_summary: { total: 1 },
    blocking_reasons: [],
    review_reasons: ['human_ui_review_not_complete'],
    next_actions: ['perform_human_closeout_review'],
  };
}

function run() {
  const root = tempRoot();
  try {
    const reportPath = path.join(root, 'report.json');
    const candidatePath = path.join(root, 'candidate.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(sampleReport(), null, 2)}\n`, 'utf8');
    fs.writeFileSync(candidatePath, `${JSON.stringify(sampleCandidate(), null, 2)}\n`, 'utf8');
    assert.strictEqual(readJson(reportPath, 'council-session-report').tool, 'council-session-report');
    const markdown = renderHandoff(sampleReport(), sampleCandidate());
    assert.ok(markdown.includes('# Bluepilot Operator Handoff'));
    assert.ok(markdown.includes('Closeout candidate: READY_FOR_HUMAN_REVIEW'));
    assert.ok(markdown.includes('| BP-A | done | 1 | yes | no |'));
    assert.ok(markdown.includes('Human decision is required before closeout.'));
    const outPath = path.join(root, 'handoff.md');
    assert.strictEqual(writeHandoff(outPath, markdown), path.resolve(outPath));

    const cliOut = require('child_process').execFileSync(process.execPath, [
      'tools/operator-handoff.cjs',
      '--report',
      reportPath,
      '--candidate',
      candidatePath,
    ], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
    assert.ok(cliOut.includes('Bluepilot Operator Handoff'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

run();
process.stdout.write('operator handoff fixtures: PASS\n');
