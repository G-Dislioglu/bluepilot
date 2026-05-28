#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { runProbe } = require('./builder-live-read-probe.cjs');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'builder-live-read-probe');

const cases = [
  ['mock completed', 'BP-022.mock.input.json', 'BP-022.mock.output.json'],
  ['blocked method', 'BP-022.blocked-method.input.json', 'BP-022.blocked-method.output.json'],
  ['blocked path', 'BP-022.blocked-path.input.json', 'BP-022.blocked-path.output.json'],
  ['blocked live mode', 'BP-024.blocked-live-mode.input.json', 'BP-024.blocked-live-mode.output.json'],
  ['blocked empty reads', 'BP-024.blocked-empty-reads.input.json', 'BP-024.blocked-empty-reads.output.json'],
];

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, fileName), 'utf8'));
}

for (const [label, inputFile, outputFile] of cases) {
  const actual = runProbe(readFixture(inputFile));
  const expected = readFixture(outputFile);

  assert.deepEqual(actual, expected, label);
  assert.equal(actual.writes_attempted, false, `${label}: writes_attempted`);
  assert.equal(actual.decision_ready, false, `${label}: decision_ready`);
  assert.equal(actual.requires_human_gate, true, `${label}: requires_human_gate`);
  assert.equal(actual.mock, true, `${label}: mock`);
}

for (const [label, inputFile, outputFile] of cases) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/builder-live-read-probe.cjs',
    '--input',
    path.join('examples', 'builder-live-read-probe', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });
  const actual = JSON.parse(cliOutput);
  const expected = readFixture(outputFile);

  assert.deepEqual(actual, expected, `${label}: cli output`);
}

const completed = runProbe(readFixture('BP-022.mock.input.json'));
assert.equal(completed.status, 'completed');
assert.equal(completed.blocked_reasons.length, 0);
assert.ok(completed.builder_refs.task_evidence_ref.startsWith('mock-builder://'));
assert.ok(completed.builder_refs.task_audit_ref.startsWith('mock-builder://'));

process.stdout.write('builder live read probe fixtures: PASS\n');
