#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'phase-scanner');
const decisions = new Set(['allow_single_track', 'require_human_review', 'reject']);
const stoplights = new Set(['green', 'yellow', 'red']);
const checkStatuses = new Set(['pass', 'review', 'fail', 'unknown']);

function inputFixtures() {
  return fs.readdirSync(fixtureDir)
    .filter((name) => name.endsWith('.input.json'))
    .sort();
}

function runScanner(inputFile) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/phase-scanner.cjs',
    '--input',
    path.join('examples', 'phase-scanner', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });
  return JSON.parse(cliOutput);
}

function assertArray(value, label) {
  assert.ok(Array.isArray(value), `${label} must be an array`);
}

for (const inputFile of inputFixtures()) {
  const output = runScanner(inputFile);
  const label = inputFile.replace(/\.input\.json$/, '');

  assert.ok(decisions.has(output.decision), `${label}: MVP decision`);
  assert.ok(stoplights.has(output.stoplight), `${label}: stoplight`);
  assert.equal(typeof output.confidence, 'number', `${label}: confidence type`);
  assert.ok(output.confidence >= 0 && output.confidence <= 1, `${label}: confidence bounds`);
  assert.equal(Number(output.confidence.toFixed(2)), output.confidence, `${label}: confidence precision`);
  assert.equal(output.human_gate_required, true, `${label}: human gate required`);
  assert.equal(typeof output.council_required, 'boolean', `${label}: council flag`);

  assertArray(output.check_results, `${label}: check_results`);
  assertArray(output.risk_summary, `${label}: risk_summary`);
  assertArray(output.allowed_tracks, `${label}: allowed_tracks`);
  assertArray(output.blocked_reasons, `${label}: blocked_reasons`);
  assertArray(output.required_evidence, `${label}: required_evidence`);

  assert.ok(output.check_results.length > 0, `${label}: check_results not empty`);
  for (const check of output.check_results) {
    assert.equal(typeof check.name, 'string', `${label}: check name`);
    assert.ok(check.name.length > 0, `${label}: check name not empty`);
    assert.ok(checkStatuses.has(check.status), `${label}: check status ${check.name}`);
    assert.equal(typeof check.reason, 'string', `${label}: check reason ${check.name}`);
    assert.ok(check.reason.length > 0, `${label}: check reason not empty ${check.name}`);
  }

  if (output.decision === 'allow_single_track') {
    assert.equal(output.stoplight, 'green', `${label}: allow implies green`);
    assert.equal(output.allowed_tracks.length, 1, `${label}: allow has one track`);
    assert.equal(output.blocked_reasons.length, 0, `${label}: allow has no blocked reasons`);
    assert.equal(output.allowed_tracks[0].requires_human_gate, true, `${label}: allowed track human gate`);
  }

  if (output.decision === 'require_human_review') {
    assert.equal(output.allowed_tracks.length, 0, `${label}: review has no allowed tracks`);
    assert.notEqual(output.stoplight, 'green', `${label}: review is not green`);
  }

  if (output.decision === 'reject') {
    assert.equal(output.stoplight, 'red', `${label}: reject implies red`);
    assert.equal(output.allowed_tracks.length, 0, `${label}: reject has no allowed tracks`);
    assert.ok(output.blocked_reasons.length > 0, `${label}: reject has blocked reasons`);
    assert.ok(output.check_results.some((check) => check.status === 'fail'), `${label}: reject has failed check`);
  }

  if (output.known_risks_status === 'processed') {
    assert.ok(output.risk_summary.length > 0, `${label}: processed known risks have risk summary`);
    assert.ok(output.required_evidence.includes('risk_summary'), `${label}: processed known risks require risk_summary evidence`);
  } else {
    assert.equal(output.known_risks_status, 'not_provided', `${label}: known risks status`);
  }
}

process.stdout.write('phase scanner output invariants: PASS\n');
