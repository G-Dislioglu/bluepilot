#!/usr/bin/env node

'use strict';

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const coveragePath = path.join(repoRoot, 'docs', 'LIVE_BUILDER_ADAPTER_READINESS_CANDIDATE_FIXTURE_COVERAGE_v0.md');
const coverage = fs.readFileSync(coveragePath, 'utf8');

const expectedCases = [
  ['BP-073.prepared', 'live_builder_adapter_readiness_prepared'],
  ['BP-073.review-readiness-notes', 'requires_human_review'],
  ['BP-073.blocked-task-create-readiness-review', 'blocked'],
  ['BP-073.blocked-live-target', 'blocked'],
  ['BP-078.missing-required', 'blocked'],
  ['BP-079.blocked-adapter-mode', 'blocked'],
  ['BP-079.blocked-task-create-effect', 'blocked'],
  ['BP-079.blocked-execute-effect', 'blocked'],
  ['BP-079.blocked-live-allowed', 'blocked'],
];

for (const [caseId, status] of expectedCases) {
  assert.ok(coverage.includes(`| \`${caseId}\``), `${caseId}: documented`);
  assert.ok(coverage.includes(`examples/live-builder-adapter-readiness-candidate/${caseId}.input.json`), `${caseId}: input path documented`);
  assert.ok(coverage.includes(`examples/live-builder-adapter-readiness-candidate/${caseId}.output.json`), `${caseId}: output path documented`);
  assert.ok(coverage.includes(`| \`${status}\` |`), `${caseId}: status documented`);

  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'live-builder-adapter-readiness-candidate', `${caseId}.input.json`)), `${caseId}: input exists`);
  assert.ok(fs.existsSync(path.join(repoRoot, 'examples', 'live-builder-adapter-readiness-candidate', `${caseId}.output.json`)), `${caseId}: output exists`);
}

const requiredStatements = [
  '`network_effect` bleibt immer `none`',
  '`task_create_effect` bleibt immer `none`',
  '`execute_effect` bleibt immer `none`',
  '`builder_task_create_allowed` bleibt immer `false`',
  '`builder_execute_allowed` bleibt immer `false`',
  '`live_builder_call_allowed` bleibt immer `false`',
  'CLI-Fehlerformat ist lokal getestet',
  'Noch nicht mit eigener Fixture abgedeckt',
  'Dokumentierte Luecken existieren',
];

for (const statement of requiredStatements) {
  assert.ok(coverage.includes(statement), `coverage statement: ${statement}`);
}

process.stdout.write('live builder adapter readiness candidate coverage map: PASS\n');
