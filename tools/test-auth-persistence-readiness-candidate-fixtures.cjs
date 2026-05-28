#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'auth-persistence-readiness-candidate');

const cases = [
  ['bp063 prepared', 'BP-063.prepared.input.json', 'BP-063.prepared.output.json'],
  ['bp063 review risk evidence', 'BP-063.review-risk-evidence.input.json', 'BP-063.review-risk-evidence.output.json'],
  ['bp063 blocked approval readiness review', 'BP-063.blocked-approval-readiness-review.input.json', 'BP-063.blocked-approval-readiness-review.output.json'],
  ['bp063 blocked identity provider', 'BP-063.blocked-identity-provider.input.json', 'BP-063.blocked-identity-provider.output.json'],
];

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, fileName), 'utf8'));
}

for (const [label, inputFile, outputFile] of cases) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/auth-persistence-readiness-candidate.cjs',
    '--input',
    path.join('examples', 'auth-persistence-readiness-candidate', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });

  const actual = JSON.parse(cliOutput);
  const expected = readFixture(outputFile);

  assert.deepEqual(actual, expected, label);
  assert.equal(actual.identity_ready, false, `${label}: identity remains disabled`);
  assert.equal(actual.persistence_ready, false, `${label}: persistence remains disabled`);
  assert.equal(actual.approval_record_allowed, false, `${label}: approval record remains disabled`);
  assert.equal(actual.builder_task_create_allowed, false, `${label}: task create remains disabled`);
  assert.equal(actual.builder_execute_allowed, false, `${label}: execute remains disabled`);
}

process.stdout.write('auth persistence readiness candidate fixtures: PASS\n');
