#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'builder-task-create-readiness-candidate');

const cases = [
  ['bp068 prepared', 'BP-068.prepared.input.json', 'BP-068.prepared.output.json'],
  ['bp068 review readiness notes', 'BP-068.review-readiness-notes.input.json', 'BP-068.review-readiness-notes.output.json'],
  ['bp068 blocked auth persistence review', 'BP-068.blocked-auth-persistence-review.input.json', 'BP-068.blocked-auth-persistence-review.output.json'],
  ['bp068 blocked create request', 'BP-068.blocked-create-request.input.json', 'BP-068.blocked-create-request.output.json'],
];

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, fileName), 'utf8'));
}

for (const [label, inputFile, outputFile] of cases) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/builder-task-create-readiness-candidate.cjs',
    '--input',
    path.join('examples', 'builder-task-create-readiness-candidate', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });

  const actual = JSON.parse(cliOutput);
  const expected = readFixture(outputFile);

  assert.deepEqual(actual, expected, label);
  assert.equal(actual.builder_task_create_allowed, false, `${label}: task create remains disabled`);
  assert.equal(actual.builder_execute_allowed, false, `${label}: execute remains disabled`);
  assert.equal(actual.live_builder_call_allowed, false, `${label}: live builder remains disabled`);
}

process.stdout.write('builder task create readiness candidate fixtures: PASS\n');
