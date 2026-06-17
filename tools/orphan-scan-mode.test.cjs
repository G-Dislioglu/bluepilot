#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const REPO_ROOT = path.resolve(__dirname, '..');

function writeFile(root, relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
}

function runNode(root, args) {
  return spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
  });
}

function setupFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-orphan-scan-mode-'));
  fs.mkdirSync(path.join(root, 'tools'), { recursive: true });
  fs.copyFileSync(path.join(REPO_ROOT, 'tools', 'orphan-scan.cjs'), path.join(root, 'tools', 'orphan-scan.cjs'));
  writeFile(root, 'builder/src/server.ts', "import { connected } from './connected.js';\n\nexport function boot() {\n  return connected;\n}\n");
  writeFile(root, 'builder/src/connected.ts', "export const connected = 'ok';\n");
  writeFile(root, 'builder/src/staged.ts', "export const staged = 'waiting';\n");
  return root;
}

function withFixture(fn) {
  const root = setupFixture();
  try {
    return fn(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('--write regenerates the report and --check validates it without mutation', () => withFixture((root) => {
  const writeResult = runNode(root, ['tools/orphan-scan.cjs', '--write']);
  assert.equal(writeResult.status, 0, `${writeResult.stdout}\n${writeResult.stderr}`);
  assert.match(writeResult.stdout, /orphan-scan: wrote docs\/ORPHAN-CENSUS-v0\.1\.md/);

  const reportPath = path.join(root, 'docs', 'ORPHAN-CENSUS-v0.1.md');
  const before = fs.readFileSync(reportPath, 'utf8');
  const checkResult = runNode(root, ['tools/orphan-scan.cjs', '--check']);
  const after = fs.readFileSync(reportPath, 'utf8');

  assert.equal(checkResult.status, 0, `${checkResult.stdout}\n${checkResult.stderr}`);
  assert.match(checkResult.stdout, /orphan-scan: report current docs\/ORPHAN-CENSUS-v0\.1\.md/);
  assert.equal(after, before);
}));

test('default no-arg mode is read-only check', () => withFixture((root) => {
  const writeResult = runNode(root, ['tools/orphan-scan.cjs', '--write']);
  assert.equal(writeResult.status, 0, `${writeResult.stdout}\n${writeResult.stderr}`);
  const reportPath = path.join(root, 'docs', 'ORPHAN-CENSUS-v0.1.md');
  const before = fs.readFileSync(reportPath, 'utf8');

  const defaultResult = runNode(root, ['tools/orphan-scan.cjs']);
  const after = fs.readFileSync(reportPath, 'utf8');

  assert.equal(defaultResult.status, 0, `${defaultResult.stdout}\n${defaultResult.stderr}`);
  assert.match(defaultResult.stdout, /orphan-scan: report current docs\/ORPHAN-CENSUS-v0\.1\.md/);
  assert.equal(after, before);
}));

test('--check exits non-zero on stale report and does not rewrite it', () => withFixture((root) => {
  const writeResult = runNode(root, ['tools/orphan-scan.cjs', '--write']);
  assert.equal(writeResult.status, 0, `${writeResult.stdout}\n${writeResult.stderr}`);
  const reportPath = path.join(root, 'docs', 'ORPHAN-CENSUS-v0.1.md');
  const before = fs.readFileSync(reportPath, 'utf8');

  writeFile(root, 'builder/src/newStaged.ts', "export const newStaged = 'new';\n");
  const staleResult = runNode(root, ['tools/orphan-scan.cjs', '--check']);
  const after = fs.readFileSync(reportPath, 'utf8');

  assert.equal(staleResult.status, 1);
  assert.match(staleResult.stderr, /orphan-scan: report stale: docs\/ORPHAN-CENSUS-v0\.1\.md/);
  assert.match(staleResult.stderr, /orphan-scan: run node tools\/orphan-scan\.cjs --write/);
  assert.equal(after, before);
}));

test('unknown mode fails with usage', () => withFixture((root) => {
  const result = runNode(root, ['tools/orphan-scan.cjs', '--wat']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage: node tools\/orphan-scan\.cjs \[--check\|--write\]/);
}));
