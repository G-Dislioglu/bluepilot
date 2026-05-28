#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'human-gate-candidate');

const cases = [
  ['bp053 prepared', 'BP-053.prepared.input.json', 'BP-053.prepared.output.json'],
  ['bp053 review risk evidence', 'BP-053.review-risk-evidence.input.json', 'BP-053.review-risk-evidence.output.json'],
  ['bp053 blocked candidate review', 'BP-053.blocked-candidate-review.input.json', 'BP-053.blocked-candidate-review.output.json'],
  ['bp053 blocked approval effect', 'BP-053.blocked-approval-effect.input.json', 'BP-053.blocked-approval-effect.output.json'],
];

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, fileName), 'utf8'));
}

for (const [label, inputFile, outputFile] of cases) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/human-gate-candidate.cjs',
    '--input',
    path.join('examples', 'human-gate-candidate', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });

  const actual = JSON.parse(cliOutput);
  const expected = readFixture(outputFile);

  assert.deepEqual(actual, expected, label);
  assert.equal(actual.approval_effect, 'none', `${label}: approval remains inert`);
  assert.equal(actual.human_approval_recorded, false, `${label}: approval is not recorded`);
  assert.equal(actual.builder_task_create_allowed, false, `${label}: task create remains disabled`);
  assert.equal(actual.builder_execute_allowed, false, `${label}: execute remains disabled`);
  assert.ok(['review_candidate_prepared', 'requires_human_review', 'blocked'].includes(actual.status), `${label}: status`);
}

process.stdout.write('human gate candidate fixtures: PASS\n');
