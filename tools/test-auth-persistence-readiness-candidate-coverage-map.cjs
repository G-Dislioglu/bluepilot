#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const coveragePath = path.join(repoRoot, 'docs', 'AUTH_PERSISTENCE_READINESS_CANDIDATE_FIXTURE_COVERAGE_v0.md');
const coverage = fs.readFileSync(coveragePath, 'utf8');

const expectedCases = [
  ['BP-063.prepared', 'readiness_boundary_prepared'],
  ['BP-063.review-risk-evidence', 'requires_human_review'],
  ['BP-063.blocked-approval-readiness-review', 'blocked'],
  ['BP-063.blocked-identity-provider', 'blocked'],
];

for (const [caseId, status] of expectedCases) {
  assert.ok(coverage.includes(`| \`${caseId}\``), `${caseId}: documented`);
  assert.ok(coverage.includes(`examples/auth-persistence-readiness-candidate/${caseId}.input.json`), `${caseId}: input path documented`);
  assert.ok(coverage.includes(`examples/auth-persistence-readiness-candidate/${caseId}.output.json`), `${caseId}: output path documented`);
  assert.ok(coverage.includes(`| \`${status}\` |`), `${caseId}: status documented`);

  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'auth-persistence-readiness-candidate', `${caseId}.input.json`)), `${caseId}: input exists`);
  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'auth-persistence-readiness-candidate', `${caseId}.output.json`)), `${caseId}: output exists`);
}

const requiredStatements = [
  '`approval_record_effect` bleibt immer `none`',
  '`identity_ready` bleibt immer `false`',
  '`persistence_ready` bleibt immer `false`',
  '`approval_record_allowed` bleibt immer `false`',
  '`builder_task_create_allowed` bleibt immer `false`',
  '`builder_execute_allowed` bleibt immer `false`',
  'Noch nicht mit eigener Fixture abgedeckt',
  'Dokumentierte Luecken existieren',
];

for (const statement of requiredStatements) {
  assert.ok(coverage.includes(statement), `coverage statement: ${statement}`);
}

process.stdout.write('auth persistence readiness candidate coverage map: PASS\n');
