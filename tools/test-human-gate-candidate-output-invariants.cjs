#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'human-gate-candidate');
const statuses = new Set(['review_candidate_prepared', 'requires_human_review', 'blocked']);

function inputFixtures() {
  return fs.readdirSync(fixtureDir)
    .filter((name) => name.endsWith('.input.json'))
    .sort();
}

function runCandidate(inputFile) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/human-gate-candidate.cjs',
    '--input',
    path.join('examples', 'human-gate-candidate', inputFile),
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
  assert.equal(output.approval_effect, 'none', `${label}: approval effect stays none`);
  assert.equal(output.human_approval_recorded, false, `${label}: approval is not recorded`);
  assert.equal(output.builder_task_create_allowed, false, `${label}: task create stays disabled`);
  assert.equal(output.builder_execute_allowed, false, `${label}: execute stays disabled`);

  assertArray(output.read_scope, `${label}: read_scope`);
  assertArray(output.write_scope_candidate, `${label}: write_scope_candidate`);
  assertArray(output.required_evidence, `${label}: required_evidence`);
  assertArray(output.blocked_reasons, `${label}: blocked_reasons`);
  assertArray(output.review_questions, `${label}: review_questions`);
  assertArray(output.review_notes, `${label}: review_notes`);

  if (output.status === 'review_candidate_prepared') {
    assert.ok(output.read_scope.length > 0, `${label}: prepared has read scope`);
    assert.ok(output.write_scope_candidate.length > 0, `${label}: prepared has write scope candidate`);
    assert.equal(output.blocked_reasons.length, 0, `${label}: prepared has no blocked reasons`);
    assert.ok(output.review_questions.length > 0, `${label}: prepared has review questions`);
  }

  if (output.status === 'requires_human_review') {
    assert.ok(output.read_scope.length > 0, `${label}: review preserves read scope`);
    assert.equal(output.write_scope_candidate.length, 0, `${label}: review has no write candidate scope`);
    assert.equal(output.blocked_reasons.length, 0, `${label}: review is not hard blocked`);
    assert.ok(output.review_notes.length > 0, `${label}: review has visible notes`);
  }

  if (output.status === 'blocked') {
    assert.equal(output.read_scope.length, 0, `${label}: blocked has no read scope`);
    assert.equal(output.write_scope_candidate.length, 0, `${label}: blocked has no write scope`);
    assert.ok(output.blocked_reasons.length > 0, `${label}: blocked has reasons`);
    assert.equal(output.review_questions.length, 0, `${label}: blocked has no review questions`);
  }
}

process.stdout.write('human gate candidate output invariants: PASS\n');
