#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  REQUIRED_MARKERS,
  buildBrowserArgs,
  checkDom,
  discoverBrowser,
  filePathToUrl,
  runBrowserSmoke,
} = require('./browser-automation-smoke.cjs');
const { renderPreviewHtml, createManifest } = require('./browser-preview.cjs');

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

assert(filePathToUrl('preview.html').startsWith('file:///'));
assert(buildBrowserArgs('file:///tmp/preview.html', 'profile-dir').includes('--dump-dom'));

const checks = checkDom(html, manifest);
assert.strictEqual(checks.every((check) => check.passed), true);
for (const marker of REQUIRED_MARKERS) {
  assert(checks.some((check) => check.name === `marker:${marker}` && check.passed));
}

const failedChecks = checkDom('<html><body>empty</body></html>');
assert(failedChecks.some((check) => check.name === 'marker:Review Gate' && !check.passed));

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-browser-automation-'));
const htmlPath = path.join(tmpDir, 'preview.html');
const manifestPath = path.join(tmpDir, 'preview.manifest.json');
fs.writeFileSync(htmlPath, html, 'utf8');
fs.writeFileSync(manifestPath, JSON.stringify(manifest), 'utf8');

const browserPath = discoverBrowser();
if (browserPath) {
  const result = runBrowserSmoke({ htmlPath, manifestPath, browserPath, timeoutMs: 15000 });
  assert.strictEqual(result.passed, true);
  assert.strictEqual(result.browser_automation, true);
  assert.strictEqual(result.screenshot_check, false);
  assert.strictEqual(result.human_ui_review, false);
} else {
  const result = runBrowserSmoke({ htmlPath, manifestPath, browserPath: path.join(tmpDir, 'missing-browser') });
  assert.strictEqual(result.passed, false);
  assert.strictEqual(result.reason, 'no_browser');
  assert.strictEqual(result.browser_automation, false);
}

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('browser automation smoke fixtures: PASS');
