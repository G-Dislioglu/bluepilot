#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const scannerScript = path.join('tools', 'phase-scanner.cjs');

function run(args) {
  return spawnSync(process.execPath, [scannerScript, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function assertFailure(label, result, expectedStderrParts) {
  assert.notEqual(result.status, 0, `${label}: exit status`);
  assert.equal(result.stdout, '', `${label}: stdout`);

  for (const expected of expectedStderrParts) {
    assert.match(result.stderr, expected, `${label}: stderr contains ${expected}`);
  }
}

assertFailure('missing input flag', run([]), [
  /Usage: node tools\/phase-scanner\.cjs --input <path> \[--pretty\]/,
]);

assertFailure('missing input path', run(['--input']), [
  /Usage: node tools\/phase-scanner\.cjs --input <path> \[--pretty\]/,
]);

assertFailure('missing file', run(['--input', 'examples/phase-scanner/does-not-exist.json']), [
  /Input konnte nicht gelesen werden:/,
  /no such file or directory|cannot find/i,
  /Usage: node tools\/phase-scanner\.cjs --input <path> \[--pretty\]/,
]);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-phase-scanner-'));
const invalidJsonPath = path.join(tempDir, 'invalid.json');
fs.writeFileSync(invalidJsonPath, '{"idea":', 'utf8');

try {
  assertFailure('invalid json', run(['--input', invalidJsonPath]), [
    /Input konnte nicht gelesen werden:/,
    /Unexpected end of JSON input|Unexpected token/i,
    /Usage: node tools\/phase-scanner\.cjs --input <path> \[--pretty\]/,
  ]);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

process.stdout.write('phase scanner CLI errors: PASS\n');
