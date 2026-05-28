#!/usr/bin/env node

'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const commands = [
  ['syntax: builder adapter core', ['--check', 'tools/builder-adapter-core.cjs']],
  ['syntax: builder adapter CLI', ['--check', 'tools/builder-adapter.cjs']],
  ['syntax: mock endpoint handler', ['--check', 'tools/mock-builder-adapter-endpoint.cjs']],
  ['syntax: mock HTTP server', ['--check', 'tools/mock-builder-adapter-http-server.cjs']],
  ['syntax: adapter fixture test', ['--check', 'tools/test-builder-adapter-fixtures.cjs']],
  ['syntax: endpoint fixture test', ['--check', 'tools/test-builder-adapter-endpoint-fixtures.cjs']],
  ['syntax: HTTP route test', ['--check', 'tools/test-builder-adapter-http-route.cjs']],
  ['syntax: live read probe', ['--check', 'tools/builder-live-read-probe.cjs']],
  ['syntax: live read probe test', ['--check', 'tools/test-builder-live-read-probe.cjs']],
  ['syntax: live read probe CLI errors test', ['--check', 'tools/test-builder-live-read-probe-cli-errors.cjs']],
  ['syntax: phase scanner', ['--check', 'tools/phase-scanner.cjs']],
  ['syntax: phase scanner fixture test', ['--check', 'tools/test-phase-scanner-fixtures.cjs']],
  ['syntax: phase scanner CLI errors test', ['--check', 'tools/test-phase-scanner-cli-errors.cjs']],
  ['syntax: phase scanner output invariants test', ['--check', 'tools/test-phase-scanner-output-invariants.cjs']],
  ['syntax: phase scanner coverage map test', ['--check', 'tools/test-phase-scanner-coverage-map.cjs']],
  ['syntax: scope resolver', ['--check', 'tools/scope-resolver.cjs']],
  ['syntax: scope resolver fixture test', ['--check', 'tools/test-scope-resolver-fixtures.cjs']],
  ['syntax: scope resolver output invariants test', ['--check', 'tools/test-scope-resolver-output-invariants.cjs']],
  ['syntax: scope resolver coverage map test', ['--check', 'tools/test-scope-resolver-coverage-map.cjs']],
  ['syntax: builder task candidate', ['--check', 'tools/builder-task-candidate.cjs']],
  ['syntax: builder task candidate fixture test', ['--check', 'tools/test-builder-task-candidate-fixtures.cjs']],
  ['syntax: builder task candidate output invariants test', ['--check', 'tools/test-builder-task-candidate-output-invariants.cjs']],
  ['syntax: builder task candidate coverage map test', ['--check', 'tools/test-builder-task-candidate-coverage-map.cjs']],
  ['syntax: human gate candidate', ['--check', 'tools/human-gate-candidate.cjs']],
  ['syntax: human gate candidate fixture test', ['--check', 'tools/test-human-gate-candidate-fixtures.cjs']],
  ['syntax: human gate candidate output invariants test', ['--check', 'tools/test-human-gate-candidate-output-invariants.cjs']],
  ['syntax: human gate candidate coverage map test', ['--check', 'tools/test-human-gate-candidate-coverage-map.cjs']],
  ['syntax: approval readiness candidate', ['--check', 'tools/approval-readiness-candidate.cjs']],
  ['syntax: approval readiness candidate fixture test', ['--check', 'tools/test-approval-readiness-candidate-fixtures.cjs']],
  ['syntax: approval readiness candidate output invariants test', ['--check', 'tools/test-approval-readiness-candidate-output-invariants.cjs']],
  ['syntax: approval readiness candidate coverage map test', ['--check', 'tools/test-approval-readiness-candidate-coverage-map.cjs']],
  ['syntax: auth persistence readiness candidate', ['--check', 'tools/auth-persistence-readiness-candidate.cjs']],
  ['syntax: auth persistence readiness candidate fixture test', ['--check', 'tools/test-auth-persistence-readiness-candidate-fixtures.cjs']],
  ['syntax: auth persistence readiness candidate output invariants test', ['--check', 'tools/test-auth-persistence-readiness-candidate-output-invariants.cjs']],
  ['syntax: auth persistence readiness candidate coverage map test', ['--check', 'tools/test-auth-persistence-readiness-candidate-coverage-map.cjs']],
  ['syntax: builder task create readiness candidate', ['--check', 'tools/builder-task-create-readiness-candidate.cjs']],
  ['syntax: builder task create readiness candidate fixture test', ['--check', 'tools/test-builder-task-create-readiness-candidate-fixtures.cjs']],
  ['syntax: builder task create readiness candidate output invariants test', ['--check', 'tools/test-builder-task-create-readiness-candidate-output-invariants.cjs']],
  ['syntax: builder task create readiness candidate coverage map test', ['--check', 'tools/test-builder-task-create-readiness-candidate-coverage-map.cjs']],
  ['syntax: live builder adapter readiness candidate', ['--check', 'tools/live-builder-adapter-readiness-candidate.cjs']],
  ['syntax: live builder adapter readiness candidate fixture test', ['--check', 'tools/test-live-builder-adapter-readiness-candidate-fixtures.cjs']],
  ['syntax: live builder adapter readiness candidate output invariants test', ['--check', 'tools/test-live-builder-adapter-readiness-candidate-output-invariants.cjs']],
  ['adapter fixtures', ['tools/test-builder-adapter-fixtures.cjs']],
  ['endpoint fixtures', ['tools/test-builder-adapter-endpoint-fixtures.cjs']],
  ['HTTP route fixtures', ['tools/test-builder-adapter-http-route.cjs']],
  ['live read probe fixtures', ['tools/test-builder-live-read-probe.cjs']],
  ['live read probe CLI errors', ['tools/test-builder-live-read-probe-cli-errors.cjs']],
  ['phase scanner fixtures', ['tools/test-phase-scanner-fixtures.cjs']],
  ['phase scanner CLI errors', ['tools/test-phase-scanner-cli-errors.cjs']],
  ['phase scanner output invariants', ['tools/test-phase-scanner-output-invariants.cjs']],
  ['phase scanner coverage map', ['tools/test-phase-scanner-coverage-map.cjs']],
  ['scope resolver fixtures', ['tools/test-scope-resolver-fixtures.cjs']],
  ['scope resolver output invariants', ['tools/test-scope-resolver-output-invariants.cjs']],
  ['scope resolver coverage map', ['tools/test-scope-resolver-coverage-map.cjs']],
  ['builder task candidate fixtures', ['tools/test-builder-task-candidate-fixtures.cjs']],
  ['builder task candidate output invariants', ['tools/test-builder-task-candidate-output-invariants.cjs']],
  ['builder task candidate coverage map', ['tools/test-builder-task-candidate-coverage-map.cjs']],
  ['human gate candidate fixtures', ['tools/test-human-gate-candidate-fixtures.cjs']],
  ['human gate candidate output invariants', ['tools/test-human-gate-candidate-output-invariants.cjs']],
  ['human gate candidate coverage map', ['tools/test-human-gate-candidate-coverage-map.cjs']],
  ['approval readiness candidate fixtures', ['tools/test-approval-readiness-candidate-fixtures.cjs']],
  ['approval readiness candidate output invariants', ['tools/test-approval-readiness-candidate-output-invariants.cjs']],
  ['approval readiness candidate coverage map', ['tools/test-approval-readiness-candidate-coverage-map.cjs']],
  ['auth persistence readiness candidate fixtures', ['tools/test-auth-persistence-readiness-candidate-fixtures.cjs']],
  ['auth persistence readiness candidate output invariants', ['tools/test-auth-persistence-readiness-candidate-output-invariants.cjs']],
  ['auth persistence readiness candidate coverage map', ['tools/test-auth-persistence-readiness-candidate-coverage-map.cjs']],
  ['builder task create readiness candidate fixtures', ['tools/test-builder-task-create-readiness-candidate-fixtures.cjs']],
  ['builder task create readiness candidate output invariants', ['tools/test-builder-task-create-readiness-candidate-output-invariants.cjs']],
  ['builder task create readiness candidate coverage map', ['tools/test-builder-task-create-readiness-candidate-coverage-map.cjs']],
  ['live builder adapter readiness candidate fixtures', ['tools/test-live-builder-adapter-readiness-candidate-fixtures.cjs']],
  ['live builder adapter readiness candidate output invariants', ['tools/test-live-builder-adapter-readiness-candidate-output-invariants.cjs']],
];

for (const [label, args] of commands) {
  process.stdout.write(`${label}: `);
  execFileSync(process.execPath, args, { cwd: repoRoot, stdio: 'ignore' });
  process.stdout.write('PASS\n');
}
