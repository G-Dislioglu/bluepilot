#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'live-builder-adapter-readiness-candidate');
const statuses = new Set(['live_builder_adapter_readiness_prepared', 'requires_human_review', 'blocked']);

function inputFixtures() {
  return fs.readdirSync(fixtureDir)
    .filter((name) => name.endsWith('.input.json'))
    .sort();
}

function runCandidate(inputFile) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/live-builder-adapter-readiness-candidate.cjs',
    '--input',
    path.join('examples', 'live-builder-adapter-readiness-candidate', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });
  return JSON.parse(cliOutput);
}

function assertArray(value, label) {
  assert.ok(Array.isArray(value), `${label} must be an array`);
}

for (const inputFile of inputFixtures()) {
  const output = runCandidate(inputFile);
  const label = inputFile.replace(/\.input\.json$/, '');

  assert.ok(statuses.has(output.status), `${label}: MVP status`);
  assert.equal(output.network_effect, 'none', `${label}: network effect stays none`);
  assert.equal(output.task_create_effect, 'none', `${label}: task create effect stays none`);
  assert.equal(output.execute_effect, 'none', `${label}: execute effect stays none`);
  assert.equal(output.builder_task_create_allowed, false, `${label}: task create stays disabled`);
  assert.equal(output.builder_execute_allowed, false, `${label}: execute stays disabled`);
  assert.equal(output.live_builder_call_allowed, false, `${label}: live builder stays disabled`);

  assertArray(output.blocked_reasons, `${label}: blocked_reasons`);
  assertArray(output.readiness_notes, `${label}: readiness_notes`);

  if (output.status === 'live_builder_adapter_readiness_prepared') {
    assert.equal(output.blocked_reasons.length, 0, `${label}: prepared has no blocked reasons`);
    assert.ok(output.readiness_notes.some((note) => note.includes('Live Builder')), `${label}: prepared notes live builder boundary`);
  }

  if (output.status === 'requires_human_review') {
    assert.equal(output.blocked_reasons.length, 0, `${label}: review is not hard blocked`);
    assert.ok(output.readiness_notes.length > 0, `${label}: review has visible notes`);
  }

  if (output.status === 'blocked') {
    assert.ok(output.blocked_reasons.length > 0, `${label}: blocked has reasons`);
  }
}

process.stdout.write('live builder adapter readiness candidate output invariants: PASS\n');
