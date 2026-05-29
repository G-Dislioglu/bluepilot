#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { createSession } = require('./maya-council-watcher.cjs');
const {
  createEvidenceEnvelope,
  readPipelineSummary,
  writeEnvelope,
} = require('./pipeline-evidence-bridge.cjs');

const repoRoot = path.resolve(__dirname, '..');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-pipeline-evidence-'));
const summaryPath = path.join(tmpDir, 'pipeline-summary.json');
const outPath = path.join(tmpDir, 'evidence.json');
const councilRoot = path.join(tmpDir, 'council-root');

const summary = {
  tool: 'review-pipeline',
  version: '0.1.0',
  passed: true,
  out_dir: tmpDir,
  artifacts: {
    preview: path.join(tmpDir, 'preview.html'),
    summary: summaryPath,
  },
  steps: [
    { name: 'difflens', passed: true, reason: null },
    { name: 'dom_smoke', passed: true, reason: null },
  ],
  summary: {
    files: 1,
    hunks: 1,
    additions: 2,
    deletions: 1,
    binary_files: 0,
  },
  risk_flags: [],
  human_gate_required: false,
  visual_review_required: true,
  browser_automation: true,
  screenshot_check: true,
  human_ui_review: false,
};

fs.writeFileSync(summaryPath, JSON.stringify(summary), 'utf8');

assert.strictEqual(readPipelineSummary(summaryPath).summary.tool, 'review-pipeline');
assert.throws(() => readPipelineSummary(path.join(tmpDir, 'missing.json')), /not found/);

const envelope = createEvidenceEnvelope({
  summaryPath,
  taskId: 'BP-112',
  repoRoot,
});
assert.strictEqual(envelope.tool, 'pipeline-evidence-bridge');
assert.strictEqual(envelope.pipeline_summary.passed, true);
assert.strictEqual(envelope.pipeline_summary.human_ui_review, false);
assert.strictEqual(envelope.context_binding.task_id, 'BP-112');
assert(envelope.context_binding.loaded.includes('contracts/BP-112.json'));
assert.strictEqual(envelope.council_binding.status, 'not_requested');

createSession(councilRoot, {
  sessionId: 'cs-test-evidence',
  force: true,
  tasks: [{ task_id: 'BP-112', title: 'Review pipeline' }],
});

const attached = createEvidenceEnvelope({
  summaryPath,
  taskId: 'BP-112',
  repoRoot,
  councilRoot,
});
assert.strictEqual(attached.council_binding.status, 'attached');
const events = fs.readFileSync(path.join(councilRoot, '.bluepilot', 'council', 'events.jsonl'), 'utf8');
assert(events.includes('pipeline_evidence_attached'));

writeEnvelope(outPath, attached);
assert(fs.existsSync(outPath));
assert.strictEqual(JSON.parse(fs.readFileSync(outPath, 'utf8')).human_ui_review, false);

const cliOut = path.join(tmpDir, 'cli-evidence.json');
execFileSync(process.execPath, [
  path.resolve(__dirname, 'pipeline-evidence-bridge.cjs'),
  '--summary',
  summaryPath,
  '--task-id',
  'BP-112',
  '--out',
  cliOut,
  '--repo',
  repoRoot,
], { cwd: repoRoot, stdio: 'pipe' });
assert(fs.existsSync(cliOut));

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('pipeline evidence bridge fixtures: PASS');
