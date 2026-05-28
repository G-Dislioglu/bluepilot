#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'approval-readiness-candidate');

const cases = [
  ['bp058 prepared', 'BP-058.prepared.input.json', 'BP-058.prepared.output.json'],
  ['bp058 review risk evidence', 'BP-058.review-risk-evidence.input.json', 'BP-058.review-risk-evidence.output.json'],
  ['bp058 blocked human gate review', 'BP-058.blocked-human-gate-review.input.json', 'BP-058.blocked-human-gate-review.output.json'],
  ['bp058 blocked approval request', 'BP-058.blocked-approval-request.input.json', 'BP-058.blocked-approval-request.output.json'],
];

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, fileName), 'utf8'));
}

for (const [label, inputFile, outputFile] of cases) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/approval-readiness-candidate.cjs',
    '--input',
    path.join('examples', 'approval-readiness-candidate', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });

  const actual = JSON.parse(cliOutput);
  const expected = readFixture(outputFile);

  assert.deepEqual(actual, expected, label);
  assert.equal(actual.approval_effect, 'none', `${label}: approval remains inert`);
  assert.equal(actual.human_approval_recorded, false, `${label}: approval is not recorded`);
  assert.equal(actual.approval_record_allowed, false, `${label}: approval record remains disabled`);
  assert.equal(actual.builder_task_create_allowed, false, `${label}: task create remains disabled`);
  assert.equal(actual.builder_execute_allowed, false, `${label}: execute remains disabled`);
  assert.ok(['readiness_candidate_prepared', 'requires_human_review', 'blocked'].includes(actual.status), `${label}: status`);
}

process.stdout.write('approval readiness candidate fixtures: PASS\n');
