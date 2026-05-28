#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'live-builder-adapter-readiness-candidate');

const cases = [
  ['bp073 prepared', 'BP-073.prepared.input.json', 'BP-073.prepared.output.json'],
  ['bp073 review readiness notes', 'BP-073.review-readiness-notes.input.json', 'BP-073.review-readiness-notes.output.json'],
  ['bp073 blocked task create readiness review', 'BP-073.blocked-task-create-readiness-review.input.json', 'BP-073.blocked-task-create-readiness-review.output.json'],
  ['bp073 blocked live target', 'BP-073.blocked-live-target.input.json', 'BP-073.blocked-live-target.output.json'],
  ['bp078 missing required', 'BP-078.missing-required.input.json', 'BP-078.missing-required.output.json'],
  ['bp079 blocked adapter mode', 'BP-079.blocked-adapter-mode.input.json', 'BP-079.blocked-adapter-mode.output.json'],
  ['bp079 blocked task create effect', 'BP-079.blocked-task-create-effect.input.json', 'BP-079.blocked-task-create-effect.output.json'],
  ['bp079 blocked execute effect', 'BP-079.blocked-execute-effect.input.json', 'BP-079.blocked-execute-effect.output.json'],
  ['bp079 blocked live allowed', 'BP-079.blocked-live-allowed.input.json', 'BP-079.blocked-live-allowed.output.json'],
  ['bp081 blocked task create allowed', 'BP-081.blocked-task-create-allowed.input.json', 'BP-081.blocked-task-create-allowed.output.json'],
  ['bp081 blocked execute allowed', 'BP-081.blocked-execute-allowed.input.json', 'BP-081.blocked-execute-allowed.output.json'],
  ['bp081 blocked missing target repo', 'BP-081.blocked-missing-target-repo.input.json', 'BP-081.blocked-missing-target-repo.output.json'],
];

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, fileName), 'utf8'));
}

for (const [label, inputFile, outputFile] of cases) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/live-builder-adapter-readiness-candidate.cjs',
    '--input',
    path.join('examples', 'live-builder-adapter-readiness-candidate', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });

  const actual = JSON.parse(cliOutput);
  const expected = readFixture(outputFile);

  assert.deepEqual(actual, expected, label);
  assert.equal(actual.builder_task_create_allowed, false, `${label}: task create remains disabled`);
  assert.equal(actual.builder_execute_allowed, false, `${label}: execute remains disabled`);
  assert.equal(actual.live_builder_call_allowed, false, `${label}: live builder remains disabled`);
}

process.stdout.write('live builder adapter readiness candidate fixtures: PASS\n');
