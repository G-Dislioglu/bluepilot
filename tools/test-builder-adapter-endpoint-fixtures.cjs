#!/usr/bin/env node

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const fixtures = [
  ['BP-007 allow', 'examples/builder-adapter/BP-007.allow.input.json', 'examples/builder-adapter/BP-007.allow.output.json'],
  ['BP-007 reject', 'examples/builder-adapter/BP-007.reject.input.json', 'examples/builder-adapter/BP-007.reject.output.json'],
  ['BP-007 pending human review', 'examples/builder-adapter/BP-007.human-review.input.json', 'examples/builder-adapter/BP-007.human-review.output.json'],
  ['BP-008 scope violation', 'examples/builder-adapter/BP-008.scope-violation.input.json', 'examples/builder-adapter/BP-008.scope-violation.output.json'],
  ['BP-008 blocked operation', 'examples/builder-adapter/BP-008.blocked-operation.input.json', 'examples/builder-adapter/BP-008.blocked-operation.output.json'],
  ['BP-009 approved human review', 'examples/builder-adapter/BP-009.human-review-approved.input.json', 'examples/builder-adapter/BP-009.human-review-approved.output.json'],
];

function runEndpoint(inputPath) {
  return execFileSync(
    process.execPath,
    ['tools/mock-builder-adapter-endpoint.cjs', '--input', inputPath, '--pretty'],
    { cwd: repoRoot, encoding: 'utf-8' },
  ).replace(/\r\n/g, '\n').trimEnd();
}

function readFixture(outputPath) {
  return fs.readFileSync(path.join(repoRoot, outputPath), 'utf-8').replace(/\r\n/g, '\n').trimEnd();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

for (const [name, inputPath, outputPath] of fixtures) {
  const actual = runEndpoint(inputPath);
  const expected = readFixture(outputPath);

  if (actual !== expected) {
    fail(`${name}: endpoint response differs from adapter fixture.`);
  }

  const parsed = JSON.parse(actual);
  if (parsed.mock !== true) fail(`${name}: expected mock=true.`);
  if (parsed.decision_ready !== false) fail(`${name}: expected decision_ready=false.`);
  if (parsed.status === 'blocked' && (!Array.isArray(parsed.blocked_reasons) || parsed.blocked_reasons.length === 0)) {
    fail(`${name}: blocked response needs blocked_reasons.`);
  }

  console.log(`${name}: PASS`);
}
