#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'phase-scanner');

const cases = [
  ['bp004 human review', 'BP-004.input.json', 'BP-004.output.json'],
  ['bp027 allow', 'BP-027.allow.input.json', 'BP-027.allow.output.json'],
  ['bp027 reject no-go', 'BP-027.reject-no-go.input.json', 'BP-027.reject-no-go.output.json'],
  ['bp031 runtime risk', 'BP-031.runtime-risk.input.json', 'BP-031.runtime-risk.output.json'],
  ['bp033 reject missing evidence', 'BP-033.reject-missing-evidence.input.json', 'BP-033.reject-missing-evidence.output.json'],
  ['bp033 reject unsafe file scope', 'BP-033.reject-unsafe-file-scope.input.json', 'BP-033.reject-unsafe-file-scope.output.json'],
  ['bp034 review overlap tracks', 'BP-034.review-overlap-tracks.input.json', 'BP-034.review-overlap-tracks.output.json'],
  ['bp034 review dependent track', 'BP-034.review-dependent-track.input.json', 'BP-034.review-dependent-track.output.json'],
  ['bp037 reject missing required', 'BP-037.reject-missing-required.input.json', 'BP-037.reject-missing-required.output.json'],
  ['bp038 review wildcard scope', 'BP-038.review-wildcard-scope.input.json', 'BP-038.review-wildcard-scope.output.json'],
  ['bp038 review broad scope', 'BP-038.review-broad-scope.input.json', 'BP-038.review-broad-scope.output.json'],
  ['bp039 review adapter dependency', 'BP-039.review-adapter-dependency.input.json', 'BP-039.review-adapter-dependency.output.json'],
  ['bp040 review council trigger', 'BP-040.review-council-trigger.input.json', 'BP-040.review-council-trigger.output.json'],
  ['bp041 review data auth secret risk', 'BP-041.review-data-auth-secret-risk.input.json', 'BP-041.review-data-auth-secret-risk.output.json'],
];

function readFixture(fileName) {
  return JSON.parse(fs.readFileSync(path.join(fixtureDir, fileName), 'utf8'));
}

for (const [label, inputFile, outputFile] of cases) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/phase-scanner.cjs',
    '--input',
    path.join('examples', 'phase-scanner', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });

  const actual = JSON.parse(cliOutput);
  const expected = readFixture(outputFile);

  assert.deepEqual(actual, expected, label);
  assert.equal(actual.human_gate_required, true, `${label}: human gate`);
  assert.ok(['green', 'yellow', 'red'].includes(actual.stoplight), `${label}: stoplight`);
  assert.ok(['allow_single_track', 'require_human_review', 'reject'].includes(actual.decision), `${label}: decision`);
}

process.stdout.write('phase scanner fixtures: PASS\n');
