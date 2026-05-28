#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const fixtureDir = path.join(repoRoot, 'examples', 'scope-resolver');
const statuses = new Set(['resolved', 'requires_human_review', 'blocked']);

function inputFixtures() {
  return fs.readdirSync(fixtureDir)
    .filter((name) => name.endsWith('.input.json'))
    .sort();
}

function runResolver(inputFile) {
  const cliOutput = execFileSync(process.execPath, [
    'tools/scope-resolver.cjs',
    '--input',
    path.join('examples', 'scope-resolver', inputFile),
  ], { cwd: repoRoot, encoding: 'utf8' });
  return JSON.parse(cliOutput);
}

function assertArray(value, label) {
  assert.ok(Array.isArray(value), `${label} must be an array`);
}

for (const inputFile of inputFixtures()) {
  const output = runResolver(inputFile);
  const label = inputFile.replace(/\.input\.json$/, '');

  assert.ok(statuses.has(output.status), `${label}: MVP status`);
  assert.equal(output.requires_human_gate, true, `${label}: human gate required`);
  assert.equal(output.writes_allowed_now, false, `${label}: writes stay disabled`);
  assert.equal(output.task_create_allowed, false, `${label}: task create stays disabled`);

  assertArray(output.allowed_read_paths, `${label}: allowed_read_paths`);
  assertArray(output.allowed_write_paths, `${label}: allowed_write_paths`);
  assertArray(output.blocked_paths, `${label}: blocked_paths`);
  assertArray(output.scope_notes, `${label}: scope_notes`);
  assertArray(output.required_evidence, `${label}: required_evidence`);
  assertArray(output.blocked_reasons, `${label}: blocked_reasons`);

  if (output.status === 'resolved') {
    assert.ok(output.allowed_read_paths.length > 0, `${label}: resolved has read scope`);
    assert.equal(output.blocked_paths.length, 0, `${label}: resolved has no blocked paths`);
    assert.equal(output.blocked_reasons.length, 0, `${label}: resolved has no blocked reasons`);
  }

  if (output.status === 'requires_human_review') {
    assert.ok(output.allowed_read_paths.length > 0, `${label}: review preserves read candidate scope`);
    assert.equal(output.allowed_write_paths.length, 0, `${label}: review has no write candidate scope`);
    assert.equal(output.blocked_reasons.length, 0, `${label}: review is not hard blocked`);
    assert.ok(output.scope_notes.length > 0, `${label}: review has visible notes`);
  }

  if (output.status === 'blocked') {
    assert.equal(output.allowed_read_paths.length, 0, `${label}: blocked has no read scope`);
    assert.equal(output.allowed_write_paths.length, 0, `${label}: blocked has no write scope`);
    assert.ok(output.blocked_reasons.length > 0, `${label}: blocked has reasons`);
  }
}

process.stdout.write('scope resolver output invariants: PASS\n');
