#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const coveragePath = path.join(repoRoot, 'docs', 'SCOPE_RESOLVER_FIXTURE_COVERAGE_v0.md');
const coverage = fs.readFileSync(coveragePath, 'utf8');

const expectedCases = [
  ['BP-045.resolved', 'resolved'],
  ['BP-045.review-wildcard', 'requires_human_review'],
  ['BP-045.blocked-phase-review', 'blocked'],
  ['BP-045.blocked-unsafe-path', 'blocked'],
];

for (const [caseId, status] of expectedCases) {
  assert.ok(coverage.includes(`| \`${caseId}\``), `${caseId}: documented`);
  assert.ok(coverage.includes(`examples/scope-resolver/${caseId}.input.json`), `${caseId}: input path documented`);
  assert.ok(coverage.includes(`examples/scope-resolver/${caseId}.output.json`), `${caseId}: output path documented`);
  assert.ok(coverage.includes(`| \`${caseId}\``) && coverage.includes(`| \`${status}\` |`), `${caseId}: status documented`);

  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'scope-resolver', `${caseId}.input.json`)), `${caseId}: input exists`);
  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'scope-resolver', `${caseId}.output.json`)), `${caseId}: output exists`);
}

const requiredStatements = [
  '`writes_allowed_now` bleibt immer `false`',
  '`task_create_allowed` bleibt immer `false`',
  '`requires_human_gate` bleibt immer `true`',
  'Noch nicht mit eigener Fixture abgedeckt',
  'Dokumentierte Luecken existieren',
];

for (const statement of requiredStatements) {
  assert.ok(coverage.includes(statement), `coverage statement: ${statement}`);
}

process.stdout.write('scope resolver coverage map: PASS\n');
