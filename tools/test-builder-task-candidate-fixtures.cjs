#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'builder-task-candidate');

const cases = [
  ['bp049 prepared', 'BP-049.prepared.input.json', 'BP-049.prepared.output.json'],
  ['bp049 review risk evidence', 'BP-049.review-risk-evidence.input.json', 'BP-049.review-risk-evidence.output.json'],
  ['bp049 blocked scope review', 'BP-049.blocked-scope-review.input.json', 'BP-049.blocked-scope-review.output.json'],
  ['bp049 blocked create intent', 'BP-049.blocked-create-intent.input.json', 'BP-049.blocked-create-intent.output.json'],
];

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, fileName), 'utf8'));
}

for (const [label, inputFile, outputFile] of cases) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/builder-task-candidate.cjs',
    '--input',
    path.join('examples', 'builder-task-candidate', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });

  const actual = JSON.parse(cliOutput);
  const expected = readFixture(outputFile);

  assert.deepEqual(actual, expected, label);
  assert.equal(actual.builder_task_create_allowed, false, `${label}: task create remains disabled`);
  assert.equal(actual.builder_execute_allowed, false, `${label}: execute remains disabled`);
  assert.equal(actual.human_gate_required, true, `${label}: human gate`);
  assert.ok(['candidate_prepared', 'requires_human_review', 'blocked'].includes(actual.status), `${label}: status`);
}

process.stdout.write('builder task candidate fixtures: PASS\n');
