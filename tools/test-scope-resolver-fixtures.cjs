#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'scope-resolver');

const cases = [
  ['bp045 resolved', 'BP-045.resolved.input.json', 'BP-045.resolved.output.json'],
  ['bp045 review wildcard', 'BP-045.review-wildcard.input.json', 'BP-045.review-wildcard.output.json'],
  ['bp045 blocked phase review', 'BP-045.blocked-phase-review.input.json', 'BP-045.blocked-phase-review.output.json'],
  ['bp045 blocked unsafe path', 'BP-045.blocked-unsafe-path.input.json', 'BP-045.blocked-unsafe-path.output.json'],
];

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, fileName), 'utf8'));
}

for (const [label, inputFile, outputFile] of cases) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/scope-resolver.cjs',
    '--input',
    path.join('examples', 'scope-resolver', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });

  const actual = JSON.parse(cliOutput);
  const expected = readFixture(outputFile);

  assert.deepEqual(actual, expected, label);
  assert.equal(actual.writes_allowed_now, false, `${label}: writes remain disabled`);
  assert.equal(actual.task_create_allowed, false, `${label}: task create remains disabled`);
  assert.equal(actual.requires_human_gate, true, `${label}: human gate`);
  assert.ok(['resolved', 'requires_human_review', 'blocked'].includes(actual.status), `${label}: status`);
}

process.stdout.write('scope resolver fixtures: PASS\n');
