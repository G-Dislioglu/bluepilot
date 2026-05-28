#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { blockedOutput, runAdapter } = require('./builder-adapter-core.cjs');

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/mock-builder-adapter-endpoint.cjs --input <path> [--pretty]');
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf-8').replace(/^\uFEFF/, ''));
  } catch (err) {
    usage(`Input konnte nicht gelesen werden: ${err.message}`);
  }
}

function validateEndpointResponse(response) {
  const errors = [];
  if (response.mock !== true) errors.push('mock must be true');
  if (response.decision_ready !== false) errors.push('decision_ready must remain false');
  if (response.status === 'completed' && typeof response.builder_task_id !== 'string') {
    errors.push('completed response needs mock builder_task_id');
  }
  if (response.status === 'blocked') {
    if (response.builder_task_id !== null) errors.push('blocked response must not have builder_task_id');
    if (!Array.isArray(response.blocked_reasons) || response.blocked_reasons.length === 0) {
      errors.push('blocked response needs blocked_reasons');
    }
  }
  if (!['completed', 'blocked'].includes(response.status)) {
    errors.push(`unsupported status: ${response.status}`);
  }
  return errors;
}

function handleMockRun(input) {
  const response = runAdapter(input);
  const errors = validateEndpointResponse(response);
  return errors.length > 0 ? blockedOutput(input, response.adapter_run_id || 'mock-builder-adapter-invalid', errors) : response;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--input');
  const pretty = args.includes('--pretty');

  if (inputIndex === -1 || !args[inputIndex + 1] || args[inputIndex + 1].startsWith('--')) {
    usage();
  }

  const output = handleMockRun(readJson(args[inputIndex + 1]));
  process.stdout.write(JSON.stringify(output, null, pretty ? 2 : 0));
  process.stdout.write('\n');
}

module.exports = {
  handleMockRun,
};
