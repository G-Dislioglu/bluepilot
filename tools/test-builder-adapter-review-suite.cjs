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
  ['adapter fixtures', ['tools/test-builder-adapter-fixtures.cjs']],
  ['endpoint fixtures', ['tools/test-builder-adapter-endpoint-fixtures.cjs']],
  ['HTTP route fixtures', ['tools/test-builder-adapter-http-route.cjs']],
];

for (const [label, args] of commands) {
  process.stdout.write(`${label}: `);
  execFileSync(process.execPath, args, { cwd: repoRoot, stdio: 'ignore' });
  process.stdout.write('PASS\n');
}
