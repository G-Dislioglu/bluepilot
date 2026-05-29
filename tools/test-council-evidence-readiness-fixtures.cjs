#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { createSession } = require('./maya-council-watcher.cjs');
const { getCouncilPaths, loadSession, writeAtomicJson } = require('./council-agent-client.cjs');
const {
  listEvidenceReadiness,
  missingGates,
  summarizeTaskEvidence,
} = require('./council-evidence-readiness.cjs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-evidence-readiness-'));
const councilRoot = path.join(tmpDir, 'council-root');

createSession(councilRoot, {
  sessionId: 'cs-evidence-readiness',
  force: true,
  tasks: [
    { task_id: 'READY', title: 'Ready task', status: 'queued' },
    { task_id: 'MISSING', title: 'Missing task', status: 'queued' },
    { task_id: 'INCOMPLETE', title: 'Incomplete task', status: 'queued' },
    { task_id: 'HUMAN', title: 'Human reviewed task', status: 'done' },
  ],
});

const paths = getCouncilPaths(councilRoot);
const session = loadSession(councilRoot);
function task(id) {
  return session.task_queue.find((item) => item.task_id === id);
}

task('READY').evidence_refs = [{
  evidence_id: 'ev-ready',
  evidence_path: path.join(tmpDir, 'ready.json'),
  assigned_at: '2026-05-29T00:00:00.000Z',
  pipeline_passed: true,
  browser_automation: true,
  screenshot_check: true,
  human_ui_review: false,
  risk_flags_count: 0,
  summary: { files: 1 },
}];
task('INCOMPLETE').evidence_refs = [{
  evidence_id: 'ev-incomplete',
  evidence_path: path.join(tmpDir, 'incomplete.json'),
  pipeline_passed: true,
  browser_automation: false,
  screenshot_check: false,
  human_ui_review: false,
}];
task('HUMAN').evidence_refs = [{
  evidence_id: 'ev-human',
  evidence_path: path.join(tmpDir, 'human.json'),
  pipeline_passed: true,
  browser_automation: true,
  screenshot_check: true,
  human_ui_review: true,
}];
writeAtomicJson(paths.sessionFile, session);

assert.deepStrictEqual(missingGates(null), ['pipeline_evidence']);
assert.deepStrictEqual(missingGates(task('READY').evidence_refs[0]), []);
assert.deepStrictEqual(missingGates(task('INCOMPLETE').evidence_refs[0]), ['browser_automation', 'screenshot_check']);

const ready = summarizeTaskEvidence(task('READY'));
assert.strictEqual(ready.technical_ready, true);
assert.strictEqual(ready.human_ui_review, false);

const result = listEvidenceReadiness({ councilRoot });
assert.strictEqual(result.tool, 'council-evidence-readiness');
assert.strictEqual(result.read_only, true);
assert.strictEqual(result.summary.tasks, 4);
assert.strictEqual(result.summary.technical_ready, 2);
assert.strictEqual(result.summary.missing_evidence, 1);
assert.strictEqual(result.summary.human_ui_review_done, 1);

const filtered = listEvidenceReadiness({ councilRoot, taskId: 'READY' });
assert.strictEqual(filtered.tasks.length, 1);
assert.strictEqual(filtered.tasks[0].task_id, 'READY');
assert.throws(() => listEvidenceReadiness({ councilRoot, taskId: 'NOPE' }), /Task not found/);

const cliOutput = execFileSync(process.execPath, [
  path.resolve(__dirname, 'council-evidence-readiness.cjs'),
  '--council-root',
  councilRoot,
  '--task-id',
  'HUMAN',
], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
assert.strictEqual(JSON.parse(cliOutput).tasks[0].human_ui_review, true);

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('council evidence readiness fixtures: PASS');
