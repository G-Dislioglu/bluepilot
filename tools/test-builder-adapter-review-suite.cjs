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
  ['adapter fixtures', ['tools/test-builder-adapter-fixtures.cjs']],
  ['endpoint fixtures', ['tools/test-builder-adapter-endpoint-fixtures.cjs']],
  ['HTTP route fixtures', ['tools/test-builder-adapter-http-route.cjs']],
  ['live read probe fixtures', ['tools/test-builder-live-read-probe.cjs']],
  ['live read probe CLI errors', ['tools/test-builder-live-read-probe-cli-errors.cjs']],
  ['phase scanner fixtures', ['tools/test-phase-scanner-fixtures.cjs']],
  ['phase scanner CLI errors', ['tools/test-phase-scanner-cli-errors.cjs']],
];

for (const [label, args] of commands) {
  process.stdout.write(`${label}: `);
  execFileSync(process.execPath, args, { cwd: repoRoot, stdio: 'ignore' });
  process.stdout.write('PASS\n');
}
