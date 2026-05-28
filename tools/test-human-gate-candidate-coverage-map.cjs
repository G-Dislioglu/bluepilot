#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const coveragePath = path.join(repoRoot, 'docs', 'HUMAN_GATE_CANDIDATE_FIXTURE_COVERAGE_v0.md');
const coverage = fs.readFileSync(coveragePath, 'utf8');

const expectedCases = [
  ['BP-053.prepared', 'review_candidate_prepared'],
  ['BP-053.review-risk-evidence', 'requires_human_review'],
  ['BP-053.blocked-candidate-review', 'blocked'],
  ['BP-053.blocked-approval-effect', 'blocked'],
];

for (const [caseId, status] of expectedCases) {
  assert.ok(coverage.includes(`| \`${caseId}\``), `${caseId}: documented`);
  assert.ok(coverage.includes(`examples/human-gate-candidate/${caseId}.input.json`), `${caseId}: input path documented`);
  assert.ok(coverage.includes(`examples/human-gate-candidate/${caseId}.output.json`), `${caseId}: output path documented`);
  assert.ok(coverage.includes(`| \`${status}\` |`), `${caseId}: status documented`);

  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'human-gate-candidate', `${caseId}.input.json`)), `${caseId}: input exists`);
  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'human-gate-candidate', `${caseId}.output.json`)), `${caseId}: output exists`);
}

const requiredStatements = [
  '`approval_effect` bleibt immer `none`',
  '`human_approval_recorded` bleibt immer `false`',
  '`builder_task_create_allowed` bleibt immer `false`',
  '`builder_execute_allowed` bleibt immer `false`',
  'Noch nicht mit eigener Fixture abgedeckt',
  'Dokumentierte Luecken existieren',
];

for (const statement of requiredStatements) {
  assert.ok(coverage.includes(statement), `coverage statement: ${statement}`);
}

process.stdout.write('human gate candidate coverage map: PASS\n');
