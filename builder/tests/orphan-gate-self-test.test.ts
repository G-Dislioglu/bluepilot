// Selbst-Test für den Orphan-Gate-Wächter in bluepilot (mit test-only-Erweiterung).
// Läuft via `npm test` (node:test runner).
// Spec-Fälle:
//   a) sauberer Stand → 0 neue, exit 0
//   b) neue unverdrahtete src/-Datei → als neuer Orphan gemeldet
//   c) dieselbe Datei mit @orphan-by-design → akzeptiert
//   d) enforce → exit 1; warn → exit 0
//   e) neues test-only-Quellmodul → gemeldet
//   f) @test-only-by-design Tag → akzeptiert
//   g) in baseline.testOnly → akzeptiert
//   h) reine Testdatei als test-only → KEIN Verstoß

import assert from 'node:assert/strict';
import test from 'node:test';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..'); // builder/
const GATE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'orphan-gate.cjs');
const FIXTURE_SRC = path.join(REPO_ROOT, 'src', '__gate_fixture__.ts');
const FIXTURE_TEST = path.join(REPO_ROOT, 'tests', '__gate_fixture__.test.ts');
const BASELINE_PATH = path.join(REPO_ROOT, '.orphan-baseline.json');

function runGate(mode: string): { stdout: string; exitCode: number } {
  const args = mode ? `--mode ${mode}` : '';
  try {
    const stdout = execSync(`node "${GATE_SCRIPT}" ${args}`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    });
    return { stdout, exitCode: 0 };
  } catch (e: unknown) {
    const err = e as { stdout?: { toString(): string }; status?: number };
    return { stdout: err.stdout?.toString() || '', exitCode: err.status ?? 1 };
  }
}

let baselineBackup: string | null = null;

function backupBaseline() {
  if (fs.existsSync(BASELINE_PATH)) {
    baselineBackup = fs.readFileSync(BASELINE_PATH, 'utf8');
  }
}

function restoreBaseline() {
  if (fs.existsSync(FIXTURE_SRC)) fs.unlinkSync(FIXTURE_SRC);
  if (fs.existsSync(FIXTURE_TEST)) fs.unlinkSync(FIXTURE_TEST);
  if (baselineBackup !== null) {
    fs.writeFileSync(BASELINE_PATH, baselineBackup, 'utf8');
    baselineBackup = null;
  }
}

test('a) sauberer Stand → 0 neue, exit 0', () => {
  backupBaseline();
  try {
    const result = runGate('warn');
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('0 new orphans'));
    assert.ok(result.stdout.includes('0 new test-only'));
  } finally { restoreBaseline(); }
});

test('b) neue unverdrahtete src/-Datei → als neuer Orphan gemeldet', () => {
  backupBaseline();
  try {
    fs.writeFileSync(FIXTURE_SRC,
      '// Test fixture: orphan that nothing imports.\nexport function unused() { return 42; }\n',
      'utf8');
    const result = runGate('warn');
    assert.ok(result.stdout.includes('1 neue, an nichts'));
    assert.ok(result.stdout.includes('__gate_fixture__.ts'));
    assert.equal(result.exitCode, 0);
  } finally { restoreBaseline(); }
});

test('c) dieselbe Datei mit @orphan-by-design → akzeptiert', () => {
  backupBaseline();
  try {
    fs.writeFileSync(FIXTURE_SRC,
      '// @orphan-by-design: bluepilot gate self-test\nexport function unused() { return 42; }\n',
      'utf8');
    const result = runGate('warn');
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('0 new orphans'));
  } finally { restoreBaseline(); }
});

test('d) enforce-Modus → exit 1 bei neuem Orphan; warn → exit 0', () => {
  backupBaseline();
  try {
    fs.writeFileSync(FIXTURE_SRC,
      '// Orphan fixture.\nexport function unused() { return 42; }\n', 'utf8');
    const enforceResult = runGate('enforce');
    assert.ok(enforceResult.stdout.includes('1 neue'));
    assert.equal(enforceResult.exitCode, 1);

    const warnResult = runGate('warn');
    assert.equal(warnResult.exitCode, 0);
  } finally { restoreBaseline(); }
});

test('e) neues test-only-Quellmodul → als neuer test-only gemeldet', () => {
  backupBaseline();
  try {
    fs.writeFileSync(FIXTURE_SRC,
      '// Test-only fixture: only imported by a test.\nexport function unused() { return 42; }\n',
      'utf8');
    fs.writeFileSync(FIXTURE_TEST,
      `import assert from 'node:assert/strict';\nimport test from 'node:test';\nimport { unused } from '../src/__gate_fixture__.js';\ntest('x', () => { assert.equal(unused(), 42); });\n`,
      'utf8');
    const result = runGate('warn');
    assert.ok(result.stdout.includes('1 neue getestet-aber-unverdrahtete'));
    assert.ok(result.stdout.includes('__gate_fixture__.ts'));
    assert.equal(result.exitCode, 0);
  } finally { restoreBaseline(); }
});

test('f) @test-only-by-design Tag → akzeptiert', () => {
  backupBaseline();
  try {
    fs.writeFileSync(FIXTURE_SRC,
      '// @test-only-by-design: bluepilot gate self-test\nexport function unused() { return 42; }\n',
      'utf8');
    fs.writeFileSync(FIXTURE_TEST,
      `import assert from 'node:assert/strict';\nimport test from 'node:test';\nimport { unused } from '../src/__gate_fixture__.js';\ntest('x', () => { assert.equal(unused(), 42); });\n`,
      'utf8');
    const result = runGate('warn');
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('0 new test-only'));
  } finally { restoreBaseline(); }
});

test('g) in baseline.testOnly → akzeptiert', () => {
  backupBaseline();
  try {
    fs.writeFileSync(FIXTURE_SRC,
      '// Test-only fixture in baseline.\nexport function unused() { return 42; }\n', 'utf8');
    fs.writeFileSync(FIXTURE_TEST,
      `import assert from 'node:assert/strict';\nimport test from 'node:test';\nimport { unused } from '../src/__gate_fixture__.js';\ntest('x', () => { assert.equal(unused(), 42); });\n`,
      'utf8');
    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    baseline.testOnly.push('src/__gate_fixture__.ts');
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n', 'utf8');
    const result = runGate('warn');
    assert.equal(result.exitCode, 0);
    assert.ok(result.stdout.includes('0 new test-only'));
  } finally { restoreBaseline(); }
});

test('h) reine Testdatei als test-only → KEIN Verstoß', () => {
  backupBaseline();
  try {
    fs.writeFileSync(FIXTURE_TEST,
      `import assert from 'node:assert/strict';\nimport test from 'node:test';\ntest('standalone', () => { assert.equal(1, 1); });\n`,
      'utf8');
    const result = runGate('warn');
    assert.equal(result.exitCode, 0);
    assert.ok(!result.stdout.includes('__gate_fixture__.test.ts'));
  } finally { restoreBaseline(); }
});
