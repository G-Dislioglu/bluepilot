#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const probeScript = path.join('tools', 'builder-live-read-probe.cjs');

function run(args) {
  return spawnSync(process.execPath, [probeScript, ...args], {
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

assertFailure('missing input', run([]), [
  /Missing required --input <file>/,
  /Usage:/,
  /BP-022 supports mock mode only/,
]);

assertFailure('unknown arg', run(['--wat']), [
  /Unknown argument: --wat/,
  /Usage:/,
]);

assertFailure('missing file', run(['--input', 'examples/builder-live-read-probe/does-not-exist.json']), [
  /no such file or directory|cannot find/i,
  /Usage:/,
]);

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-read-probe-'));
const invalidJsonPath = path.join(tempDir, 'invalid.json');
fs.writeFileSync(invalidJsonPath, '{"probe_id":', 'utf8');

try {
  assertFailure('invalid json', run(['--input', invalidJsonPath]), [
    /Unexpected end of JSON input|Unexpected token/i,
    /Usage:/,
  ]);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

process.stdout.write('builder live read probe CLI errors: PASS\n');
