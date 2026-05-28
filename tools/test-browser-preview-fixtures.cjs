#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  escapeHtml,
  parseJsonInput,
  renderPreviewHtml,
  createManifest,
} = require('./browser-preview.cjs');

const evidence = {
  tool: 'difflens',
  version: '0.1.0',
  summary: {
    files: 2,
    hunks: 2,
    additions: 3,
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
    {
      file_path: 'docs/<script>alert(1)</script>.md',
      hunks: 1,
      additions: 1,
      deletions: 0,
      binary: false,
      flags: [],
    },
  ],
  risk_flags: [
    {
      code: 'runtime_path',
      file_path: 'tools/example.cjs',
      reason: 'Runtime path changes affect behavior.',
    },
    {
      code: 'custom',
      file_path: 'docs/<script>alert(1)</script>.md',
      reason: 'Needs <manual> review.',
    },
  ],
  human_gate_required: true,
  visual_review_required: true,
};

assert.strictEqual(escapeHtml('<tag attr="x">Tom & Jerry</tag>'), '&lt;tag attr=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/tag&gt;');
assert.strictEqual(parseJsonInput(`\uFEFF${JSON.stringify(evidence)}`).tool, 'difflens');

const html = renderPreviewHtml(evidence);
assert(html.includes('Bluepilot DiffLens Preview'));
assert(html.includes('<strong>2</strong>'));
assert(html.includes('tools/example.cjs'));
assert(html.includes('runtime_path'));
assert(html.includes('Human gate required: <strong>yes</strong>'));
assert(!html.includes('<script>alert(1)</script>'));
assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
assert(html.includes('Needs &lt;manual&gt; review.'));

const manifest = createManifest(evidence, { htmlPath: 'preview.html', source: 'fixture' });
assert.strictEqual(manifest.tool, 'browser-preview');
assert.strictEqual(manifest.html_path, 'preview.html');
assert.strictEqual(manifest.summary.files, 2);
assert.strictEqual(manifest.human_gate_required, true);

assert.throws(() => renderPreviewHtml({ tool: 'other' }), /not DiffLens/);

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-browser-preview-'));
const inputPath = path.join(tmpDir, 'difflens.json');
const outPath = path.join(tmpDir, 'preview.html');
const manifestPath = path.join(tmpDir, 'preview.manifest.json');
fs.writeFileSync(inputPath, JSON.stringify(evidence), 'utf8');

execFileSync(process.execPath, [
  path.resolve(__dirname, 'browser-preview.cjs'),
  '--input',
  inputPath,
  '--out',
  outPath,
  '--manifest',
  manifestPath,
], { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });

assert(fs.existsSync(outPath));
assert(fs.readFileSync(outPath, 'utf8').includes('Changed Files'));
const writtenManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert.strictEqual(writtenManifest.tool, 'browser-preview');
assert.strictEqual(writtenManifest.html_path, outPath);

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('browser preview fixtures: PASS');
