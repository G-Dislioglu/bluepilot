#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { runAdapter } = require('./builder-adapter-core.cjs');

function usage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/builder-adapter.cjs --input <path> [--pretty]');
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf-8').replace(/^\uFEFF/, ''));
  } catch (err) {
    usage(`Input konnte nicht gelesen werden: ${err.message}`);
  }
}

const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const pretty = args.includes('--pretty');

if (inputIndex === -1 || !args[inputIndex + 1] || args[inputIndex + 1].startsWith('--')) {
  usage();
}

const output = runAdapter(readJson(args[inputIndex + 1]));
process.stdout.write(JSON.stringify(output, null, pretty ? 2 : 0));
process.stdout.write('\n');
