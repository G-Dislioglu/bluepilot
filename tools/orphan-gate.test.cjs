#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
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

function runGit(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function setupFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-orphan-gate-'));
  fs.mkdirSync(path.join(root, 'tools'), { recursive: true });
  fs.copyFileSync(path.join(REPO_ROOT, 'tools', 'verify-task-lock.cjs'), path.join(root, 'tools', 'verify-task-lock.cjs'));
  fs.copyFileSync(path.join(REPO_ROOT, 'tools', 'orphan-scan.cjs'), path.join(root, 'tools', 'orphan-scan.cjs'));
  writeFile(root, 'builder/src/server.ts', "export function boot() {\n  return 'ok';\n}\n\nboot();\n");
  writeFile(root, 'docs/readme.md', '# fixture\n');
  runGit(root, ['init', '-q']);
  runGit(root, ['config', 'user.email', 'orphan-gate@example.test']);
  runGit(root, ['config', 'user.name', 'Orphan Gate Test']);
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-q', '-m', 'baseline']);
  const baseline = runGit(root, ['rev-parse', '--short', 'HEAD']);
  return { root, baseline };
}

function writeContract(root, baseline, orphanGate) {
  const contract = {
    task_id: 'TEST',
    mode: 'standard',
    task_type: 'code_task',
    risk_class: 'test',
    allowed_files: [
      'builder/src/**',
      'contracts/**',
      'docs/**',
      'tools/**',
    ],
    forbidden_files: [
      'forbidden/**',
    ],
    evidence_required: [
      'test_result',
    ],
    reuse_target: [
      'session_log',
    ],
    baseline_ref: baseline,
  };

  if (orphanGate !== undefined) {
    contract.orphan_gate = orphanGate;
  }

  writeFile(root, 'contracts/TEST.json', `${JSON.stringify(contract, null, 2)}\n`);
}

function verify(root) {
  return spawnSync(process.execPath, ['tools/verify-task-lock.cjs', 'TEST', '--verify'], {
    cwd: root,
    encoding: 'utf8',
  });
}

function withFixture(fn) {
  const fixture = setupFixture();
  try {
    return fn(fixture);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
}

test('enforce fails a non-connected new builder module', () => withFixture(({ root, baseline }) => {
  writeContract(root, baseline, 'enforce');
  writeFile(root, 'builder/src/lonely.ts', 'export const lonely = true;\n');

  const result = verify(root);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /ORPHAN_GATE -> REWORK/);
  assert.match(result.stdout, /builder\/src\/lonely\.ts/);
}));

test('missing orphan_gate keeps legacy verifier behavior off', () => withFixture(({ root, baseline }) => {
  writeContract(root, baseline, undefined);
  writeFile(root, 'builder/src/noGate.ts', 'export const noGate = true;\n');

  const result = verify(root);

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /ORPHAN_GATE: off/);
}));

test('invalid orphan_gate value fails contract validation clearly', () => withFixture(({ root, baseline }) => {
  writeContract(root, baseline, 'loud');
  writeFile(root, 'builder/src/invalidGate.ts', 'export const invalidGate = true;\n');

  const result = verify(root);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /orphan_gate muss einer von off, warn oder enforce sein/);
}));

test('enforce passes a new module connected by a used value import from server', () => withFixture(({ root, baseline }) => {
  writeContract(root, baseline, 'enforce');
  writeFile(root, 'builder/src/connected.ts', 'export const connectedValue = "connected";\n');
  writeFile(root, 'builder/src/server.ts', "import { connectedValue } from './connected.js';\n\nexport function boot() {\n  return connectedValue;\n}\n\nboot();\n");

  const result = verify(root);

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /PASS live: builder\/src\/connected\.ts/);
}));

test('enforce fails a module referenced only by a type import', () => withFixture(({ root, baseline }) => {
  writeContract(root, baseline, 'enforce');
  writeFile(root, 'builder/src/typeOnly.ts', 'export interface TypeOnlyThing {\n  label: string;\n}\n');
  writeFile(root, 'builder/src/server.ts', "import type { TypeOnlyThing } from './typeOnly.js';\n\nexport function boot(value?: TypeOnlyThing) {\n  return value?.label ?? 'ok';\n}\n\nboot();\n");

  const result = verify(root);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /FAIL orphan: builder\/src\/typeOnly\.ts/);
  assert.match(result.stdout, /typeImporters: builder\/src\/server\.ts/);
}));

test('enforce fails a module referenced only by an unused value import', () => withFixture(({ root, baseline }) => {
  writeContract(root, baseline, 'enforce');
  writeFile(root, 'builder/src/unused.ts', 'export const unusedValue = "unused";\n');
  writeFile(root, 'builder/src/server.ts', "import { unusedValue } from './unused.js';\n\nexport function boot() {\n  return 'ok';\n}\n\nboot();\n");

  const result = verify(root);

  assert.equal(result.status, 1);
  assert.match(result.stdout, /FAIL orphan: builder\/src\/unused\.ts/);
  assert.match(result.stdout, /unusedValueImporters: builder\/src\/server\.ts/);
}));

test('enforce accepts an explicit orphan-by-design top-of-file tag', () => withFixture(({ root, baseline }) => {
  writeContract(root, baseline, 'enforce');
  writeFile(root, 'builder/src/staged.ts', '// @orphan-by-design: waiting for WIRE-SLICE-999 dry-run consumer\n\nexport const staged = true;\n');

  const result = verify(root);

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /PASS orphan-by-design: builder\/src\/staged\.ts/);
}));

test('warn reports a non-connected module but exits zero', () => withFixture(({ root, baseline }) => {
  writeContract(root, baseline, 'warn');
  writeFile(root, 'builder/src/warnOnly.ts', 'export const warnOnly = true;\n');

  const result = verify(root);

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /ORPHAN_GATE WARNUNG/);
  assert.match(result.stdout, /FAIL orphan: builder\/src\/warnOnly\.ts/);
}));

test('enforce does not evaluate legacy builder modules outside the changed set', () => withFixture(({ root }) => {
  writeFile(root, 'builder/src/legacyDead.ts', 'export const legacyDead = true;\n');
  runGit(root, ['add', '.']);
  runGit(root, ['commit', '-q', '-m', 'legacy dead baseline']);
  const baseline = runGit(root, ['rev-parse', '--short', 'HEAD']);
  writeContract(root, baseline, 'enforce');
  writeFile(root, 'docs/change.md', '# outside builder src\n');

  const result = verify(root);

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /Keine geaenderten builder\/src Module/);
  assert.doesNotMatch(result.stdout, /legacyDead\.ts/);
}));
