#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const coveragePath = path.join(repoRoot, 'docs', 'BUILDER_TASK_CREATE_READINESS_CANDIDATE_FIXTURE_COVERAGE_v0.md');
const coverage = fs.readFileSync(coveragePath, 'utf8');

const expectedCases = [
  ['BP-068.prepared', 'task_create_readiness_prepared'],
  ['BP-068.review-readiness-notes', 'requires_human_review'],
  ['BP-068.blocked-auth-persistence-review', 'blocked'],
  ['BP-068.blocked-create-request', 'blocked'],
];

for (const [caseId, status] of expectedCases) {
  assert.ok(coverage.includes(`| \`${caseId}\``), `${caseId}: documented`);
  assert.ok(coverage.includes(`examples/builder-task-create-readiness-candidate/${caseId}.input.json`), `${caseId}: input path documented`);
  assert.ok(coverage.includes(`examples/builder-task-create-readiness-candidate/${caseId}.output.json`), `${caseId}: output path documented`);
  assert.ok(coverage.includes(`| \`${status}\` |`), `${caseId}: status documented`);

  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'builder-task-create-readiness-candidate', `${caseId}.input.json`)), `${caseId}: input exists`);
  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'builder-task-create-readiness-candidate', `${caseId}.output.json`)), `${caseId}: output exists`);
}

const requiredStatements = [
  '`task_create_effect` bleibt immer `none`',
  '`execute_effect` bleibt immer `none`',
  '`builder_task_create_allowed` bleibt immer `false`',
  '`builder_execute_allowed` bleibt immer `false`',
  '`live_builder_call_allowed` bleibt immer `false`',
  'Noch nicht mit eigener Fixture abgedeckt',
  'Dokumentierte Luecken existieren',
];

for (const statement of requiredStatements) {
  assert.ok(coverage.includes(statement), `coverage statement: ${statement}`);
}

process.stdout.write('builder task create readiness candidate coverage map: PASS\n');
