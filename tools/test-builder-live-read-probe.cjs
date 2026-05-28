#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const { runProbe } = require('./builder-live-read-probe.cjs');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'builder-live-read-probe');

const cases = [
  ['mock completed', 'BP-022.mock.input.json', 'BP-022.mock.output.json'],
  ['blocked method', 'BP-022.blocked-method.input.json', 'BP-022.blocked-method.output.json'],
  ['blocked path', 'BP-022.blocked-path.input.json', 'BP-022.blocked-path.output.json'],
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

const completed = runProbe(readFixture('BP-022.mock.input.json'));
assert.equal(completed.status, 'completed');
assert.equal(completed.blocked_reasons.length, 0);
assert.ok(completed.builder_refs.task_evidence_ref.startsWith('mock-builder://'));
assert.ok(completed.builder_refs.task_audit_ref.startsWith('mock-builder://'));

process.stdout.write('builder live read probe fixtures: PASS\n');
