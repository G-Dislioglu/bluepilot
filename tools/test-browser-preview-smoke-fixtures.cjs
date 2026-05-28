#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { renderPreviewHtml, createManifest } = require('./browser-preview.cjs');
const { smokePreviewHtml } = require('./browser-preview-smoke.cjs');

const evidence = {
  tool: 'difflens',
  version: '0.1.0',
  summary: {
    files: 1,
    hunks: 1,
    additions: 2,
    deletions: 1,
    binary_files: 0,
  },
  files: [
    {
      file_path: 'tools/example.cjs',
      hunks: 1,
      additions: 2,
      deletions: 1,
      binary: false,
      flags: ['runtime_path'],
    },
  ],
  risk_flags: [
    {
      code: 'runtime_path',
      file_path: 'tools/example.cjs',
      reason: 'Runtime path changes affect behavior.',
    },
  ],
  human_gate_required: true,
  visual_review_required: true,
};

const html = renderPreviewHtml(evidence);
const manifest = createManifest(evidence, { htmlPath: 'preview.html', source: 'fixture' });
const result = smokePreviewHtml(html, manifest);

assert.strictEqual(result.tool, 'browser-preview-smoke');
assert.strictEqual(result.passed, true);
assert.strictEqual(result.browser_automation, false);
assert.strictEqual(result.screenshot_check, false);
assert.strictEqual(result.human_ui_review, false);
assert(result.checks.find((check) => check.name === 'changed_files' && check.passed));
assert(result.checks.find((check) => check.name === 'manifest_tool' && check.passed));

const failed = smokePreviewHtml('<html><body>Missing expected sections</body></html>');
assert.strictEqual(failed.passed, false);
assert(failed.checks.some((check) => check.name === 'review_gate' && !check.passed));

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-preview-smoke-'));
const htmlPath = path.join(tmpDir, 'preview.html');
const manifestPath = path.join(tmpDir, 'preview.manifest.json');
fs.writeFileSync(htmlPath, html, 'utf8');
fs.writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');

const cliOutput = execFileSync(process.execPath, [
  path.resolve(__dirname, 'browser-preview-smoke.cjs'),
  '--html',
  htmlPath,
  '--manifest',
  manifestPath,
], { cwd: path.resolve(__dirname, '..'), encoding: 'utf8' });

const cliResult = JSON.parse(cliOutput);
assert.strictEqual(cliResult.passed, true);
assert.strictEqual(cliResult.screenshot_check, false);

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('browser preview smoke fixtures: PASS');
