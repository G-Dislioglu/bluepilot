#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { createSession } = require('./maya-council-watcher.cjs');
const { getCouncilPaths, loadSession } = require('./council-agent-client.cjs');
const { assignEvidence, readEvidenceEnvelope } = require('./council-evidence-assignment.cjs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-council-evidence-'));
const councilRoot = path.join(tmpDir, 'council-root');
const evidencePath = path.join(tmpDir, 'evidence.json');

createSession(councilRoot, {
  sessionId: 'cs-evidence-assignment',
  force: true,
  tasks: [
    { task_id: 'BP-112', title: 'Review pipeline', status: 'queued' },
    { task_id: 'BP-113', title: 'Evidence bridge', status: 'queued' },
  ],
});

const envelope = {
  tool: 'pipeline-evidence-bridge',
  version: '0.1.0',
  evidence_id: 'pe-test-001',
  task_id: 'BP-112',
  human_ui_review: false,
  pipeline_summary: {
    passed: true,
    summary: {
      files: 1,
      hunks: 1,
      additions: 2,
      deletions: 1,
      binary_files: 0,
    },
    risk_flags: [],
    browser_automation: true,
    screenshot_check: true,
    human_ui_review: false,
  },
};
fs.writeFileSync(evidencePath, JSON.stringify(envelope), 'utf8');

assert.strictEqual(readEvidenceEnvelope(evidencePath).envelope.evidence_id, 'pe-test-001');
assert.throws(() => readEvidenceEnvelope(path.join(tmpDir, 'missing.json')), /not found/);

const first = assignEvidence({ councilRoot, taskId: 'BP-112', evidencePath });
assert.strictEqual(first.assigned, true);
assert.strictEqual(first.deduplicated, false);
assert.strictEqual(first.status_preserved, 'queued');
assert.strictEqual(first.directives_created, 0);
assert.strictEqual(first.agent_spawned, false);
assert.strictEqual(first.human_ui_review, false);

const session = loadSession(councilRoot);
const task = session.task_queue.find((item) => item.task_id === 'BP-112');
assert.strictEqual(task.status, 'queued');
assert.strictEqual(task.evidence_refs.length, 1);
assert.strictEqual(task.evidence_refs[0].evidence_id, 'pe-test-001');

const second = assignEvidence({ councilRoot, taskId: 'BP-112', evidencePath });
assert.strictEqual(second.assigned, false);
assert.strictEqual(second.deduplicated, true);
assert.strictEqual(loadSession(councilRoot).task_queue.find((item) => item.task_id === 'BP-112').evidence_refs.length, 1);

assert.throws(() => assignEvidence({ councilRoot, taskId: 'BP-MISSING', evidencePath }), /Task not found/);

const events = fs.readFileSync(getCouncilPaths(councilRoot).eventsFile, 'utf8');
assert(events.includes('pipeline_evidence_assigned'));
assert(events.includes('pipeline_evidence_assignment_deduplicated'));

const cliOut = execFileSync(process.execPath, [
  path.resolve(__dirname, 'council-evidence-assignment.cjs'),
  '--council-root',
  councilRoot,
  '--task-id',
  'BP-113',
  '--evidence',
  evidencePath,
], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
assert.strictEqual(JSON.parse(cliOut).assigned, true);

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('council evidence assignment fixtures: PASS');
