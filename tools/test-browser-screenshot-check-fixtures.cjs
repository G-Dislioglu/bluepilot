#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  PNG_SIGNATURE,
  buildScreenshotArgs,
  runScreenshotCheck,
  validatePng,
} = require('./browser-screenshot-check.cjs');
const { discoverBrowser } = require('./browser-automation-smoke.cjs');
const { renderPreviewHtml } = require('./browser-preview.cjs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-screenshot-check-'));
const pngPath = path.join(tmpDir, 'valid.png');
const smallPngPath = path.join(tmpDir, 'small.png');
const htmlPath = path.join(tmpDir, 'preview.html');
const screenshotPath = path.join(tmpDir, 'preview.png');

fs.writeFileSync(pngPath, Buffer.concat([PNG_SIGNATURE, Buffer.alloc(2048, 1)]));
fs.writeFileSync(smallPngPath, PNG_SIGNATURE);

assert.strictEqual(validatePng(pngPath).passed, true);
assert.strictEqual(validatePng(smallPngPath).passed, false);
assert.strictEqual(validatePng(path.join(tmpDir, 'missing.png')).passed, false);

const args = buildScreenshotArgs('file:///tmp/preview.html', screenshotPath, 'profile-dir');
assert(args.includes('--headless=new'));
assert(args.includes('--window-size=1280,900'));
assert(args.includes(`--screenshot=${screenshotPath}`));

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

fs.writeFileSync(htmlPath, renderPreviewHtml(evidence), 'utf8');

const browserPath = discoverBrowser();
if (browserPath) {
  const result = runScreenshotCheck({ htmlPath, outPath: screenshotPath, browserPath, timeoutMs: 15000 });
  assert.strictEqual(result.passed, true);
  assert.strictEqual(result.browser_automation, true);
  assert.strictEqual(result.screenshot_check, true);
  assert.strictEqual(result.human_ui_review, false);
  assert(result.screenshot_bytes > 1024);
  assert(fs.existsSync(screenshotPath));
} else {
  const result = runScreenshotCheck({ htmlPath, outPath: screenshotPath, browserPath: path.join(tmpDir, 'missing-browser') });
  assert.strictEqual(result.passed, false);
  assert.strictEqual(result.reason, 'no_browser');
  assert.strictEqual(result.screenshot_check, false);
}

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('browser screenshot check fixtures: PASS');
