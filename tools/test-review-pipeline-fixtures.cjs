#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { runReviewPipeline } = require('./review-pipeline.cjs');

const diffText = [
  'diff --git a/tools/example.cjs b/tools/example.cjs',
  'index 1111111..2222222 100644',
  '--- a/tools/example.cjs',
  '+++ b/tools/example.cjs',
  '@@ -1,2 +1,3 @@',
  ' const ok = true;',
  '-const oldValue = 1;',
  '+const newValue = 2;',
  '+const added = true;',
].join('\n');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-review-pipeline-'));
const outDir = path.join(tmpDir, 'out');
const summary = runReviewPipeline({ outDir, diffText, timeoutMs: 15000 });

assert.strictEqual(summary.tool, 'review-pipeline');
assert.strictEqual(summary.summary.files, 1);
assert.strictEqual(summary.summary.additions, 2);
assert.strictEqual(summary.summary.deletions, 1);
assert.strictEqual(summary.human_ui_review, false);
assert(summary.artifacts.preview.endsWith('preview.html'));
assert(fs.existsSync(path.join(outDir, 'diff-output.patch')));
assert(fs.existsSync(path.join(outDir, 'difflens-evidence.json')));
assert(fs.existsSync(path.join(outDir, 'preview.html')));
assert(fs.existsSync(path.join(outDir, 'preview.manifest.json')));
assert(fs.existsSync(path.join(outDir, 'dom-smoke.json')));
assert(fs.existsSync(path.join(outDir, 'browser-smoke.json')));
assert(fs.existsSync(path.join(outDir, 'screenshot-check.json')));
assert(fs.existsSync(path.join(outDir, 'pipeline-summary.json')));

const persisted = JSON.parse(fs.readFileSync(path.join(outDir, 'pipeline-summary.json'), 'utf8'));
assert.strictEqual(persisted.human_ui_review, false);
assert(persisted.steps.find((step) => step.name === 'dom_smoke'));

const diffPath = path.join(tmpDir, 'input.patch');
const secondOutDir = path.join(tmpDir, 'out-from-cli');
fs.writeFileSync(diffPath, diffText, 'utf8');
const cliOutput = execFileSync(process.execPath, [
  path.resolve(__dirname, 'review-pipeline.cjs'),
  '--diff',
  diffPath,
  '--out',
  secondOutDir,
], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });
const cliSummary = JSON.parse(cliOutput);
assert.strictEqual(cliSummary.tool, 'review-pipeline');
assert.strictEqual(cliSummary.human_ui_review, false);
assert(fs.existsSync(path.join(secondOutDir, 'preview.html')));

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('review pipeline fixtures: PASS');
