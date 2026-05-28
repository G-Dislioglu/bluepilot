#!/usr/bin/env node

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const cases = [
  {
    name: 'BP-008 scope violation',
    input: 'examples/builder-adapter/BP-008.scope-violation.input.json',
    output: 'examples/builder-adapter/BP-008.scope-violation.output.json',
    expectedReason: 'Scope gate violation: src/escape.js',
  },
  {
    name: 'BP-008 blocked operation',
    input: 'examples/builder-adapter/BP-008.blocked-operation.input.json',
    output: 'examples/builder-adapter/BP-008.blocked-operation.output.json',
    expectedReason: 'Blocked operation requested: auto_deploy',
  },
];

function runAdapter(inputPath) {
  const output = execFileSync(
    process.execPath,
    ['tools/builder-adapter.cjs', '--input', inputPath, '--pretty'],
    { cwd: repoRoot, encoding: 'utf-8' },
  );
  return output.replace(/\r\n/g, '\n').trimEnd();
}

function readExpected(outputPath) {
  return fs.readFileSync(path.join(repoRoot, outputPath), 'utf-8').replace(/\r\n/g, '\n').trimEnd();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

for (const fixture of cases) {
  const actualText = runAdapter(fixture.input);
  const expectedText = readExpected(fixture.output);

  if (actualText !== expectedText) {
    fail(`${fixture.name}: generated output differs from committed fixture.`);
  }

  const parsed = JSON.parse(actualText);
  if (parsed.status !== 'blocked') {
    fail(`${fixture.name}: expected status blocked, got ${parsed.status}.`);
  }
  if (parsed.builder_task_id !== null) {
    fail(`${fixture.name}: expected builder_task_id null.`);
  }
  if (!Array.isArray(parsed.blocked_reasons) || !parsed.blocked_reasons.includes(fixture.expectedReason)) {
    fail(`${fixture.name}: expected blocked reason "${fixture.expectedReason}".`);
  }

  console.log(`${fixture.name}: PASS`);
}
