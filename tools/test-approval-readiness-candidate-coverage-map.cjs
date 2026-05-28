#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const coveragePath = path.join(repoRoot, 'docs', 'APPROVAL_READINESS_CANDIDATE_FIXTURE_COVERAGE_v0.md');
const coverage = fs.readFileSync(coveragePath, 'utf8');

const expectedCases = [
  ['BP-058.prepared', 'readiness_candidate_prepared'],
  ['BP-058.review-risk-evidence', 'requires_human_review'],
  ['BP-058.blocked-human-gate-review', 'blocked'],
  ['BP-058.blocked-approval-request', 'blocked'],
];

for (const [caseId, status] of expectedCases) {
  assert.ok(coverage.includes(`| \`${caseId}\``), `${caseId}: documented`);
  assert.ok(coverage.includes(`examples/approval-readiness-candidate/${caseId}.input.json`), `${caseId}: input path documented`);
  assert.ok(coverage.includes(`examples/approval-readiness-candidate/${caseId}.output.json`), `${caseId}: output path documented`);
  assert.ok(coverage.includes(`| \`${status}\` |`), `${caseId}: status documented`);

  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'approval-readiness-candidate', `${caseId}.input.json`)), `${caseId}: input exists`);
  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'approval-readiness-candidate', `${caseId}.output.json`)), `${caseId}: output exists`);
}

const requiredStatements = [
  '`approval_effect` bleibt immer `none`',
  '`human_approval_recorded` bleibt immer `false`',
  '`approval_record_allowed` bleibt immer `false`',
  '`builder_task_create_allowed` bleibt immer `false`',
  '`builder_execute_allowed` bleibt immer `false`',
  'Noch nicht mit eigener Fixture abgedeckt',
  'Dokumentierte Luecken existieren',
];

for (const statement of requiredStatements) {
  assert.ok(coverage.includes(statement), `coverage statement: ${statement}`);
}

process.stdout.write('approval readiness candidate coverage map: PASS\n');
