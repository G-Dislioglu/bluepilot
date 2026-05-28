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
    expectedStatus: 'blocked',
    expectedBuilderTask: null,
    expectedReason: 'Scope gate violation: src/escape.js',
  },
  {
    name: 'BP-008 blocked operation',
    input: 'examples/builder-adapter/BP-008.blocked-operation.input.json',
    output: 'examples/builder-adapter/BP-008.blocked-operation.output.json',
    expectedStatus: 'blocked',
    expectedBuilderTask: null,
    expectedReason: 'Blocked operation requested: auto_deploy',
  },
  {
    name: 'BP-009 approved human review',
    input: 'examples/builder-adapter/BP-009.human-review-approved.input.json',
    output: 'examples/builder-adapter/BP-009.human-review-approved.output.json',
    expectedStatus: 'completed',
    expectedBuilderTask: 'mock-builder-task-BP-009-HUMAN-REVIEW-APPROVED',
    expectedReason: null,
    expectedDecisionReady: false,
    expectedRequiresHumanGate: true,
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
  const expectedStatus = fixture.expectedStatus || 'blocked';
  if (parsed.status !== expectedStatus) {
    fail(`${fixture.name}: expected status ${expectedStatus}, got ${parsed.status}.`);
  }
  const expectedBuilderTask = fixture.expectedBuilderTask === undefined ? null : fixture.expectedBuilderTask;
  if (parsed.builder_task_id !== expectedBuilderTask) {
    fail(`${fixture.name}: expected builder_task_id ${expectedBuilderTask}.`);
  }
  if (fixture.expectedReason && (!Array.isArray(parsed.blocked_reasons) || !parsed.blocked_reasons.includes(fixture.expectedReason))) {
    fail(`${fixture.name}: expected blocked reason "${fixture.expectedReason}".`);
  }
  if (fixture.expectedDecisionReady !== undefined && parsed.decision_ready !== fixture.expectedDecisionReady) {
    fail(`${fixture.name}: expected decision_ready ${fixture.expectedDecisionReady}.`);
  }
  if (fixture.expectedRequiresHumanGate !== undefined && parsed.requires_human_gate !== fixture.expectedRequiresHumanGate) {
    fail(`${fixture.name}: expected requires_human_gate ${fixture.expectedRequiresHumanGate}.`);
  }

  console.log(`${fixture.name}: PASS`);
}
