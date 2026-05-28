#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ALLOWED_KEYS = Object.freeze(['preferred_models', 'project_name', 'working_dir', 'user_preferences']);

function memoryPath(rootDir = process.cwd()) {
  return path.resolve(rootDir, '.bluepilot', 'maya-memory.json');
}

function defaultMemory() {
  return {
    schema_version: 'bluepilot-maya-memory/v0',
    updated_at: null,
    entries: {},
  };
}

function nowIso() {
  return new Date().toISOString();
}

function assertAllowedKey(key) {
  if (!ALLOWED_KEYS.includes(key)) {
    throw new Error(`Unsupported memory key: ${key}`);
  }
}

function readMemory(rootDir = process.cwd()) {
  const filePath = memoryPath(rootDir);
  if (!fs.existsSync(filePath)) return defaultMemory();
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeAtomicJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, filePath);
}

function setMemory(rootDir, key, value, options = {}) {
  assertAllowedKey(key);
  const memory = readMemory(rootDir);
  memory.updated_at = nowIso();
  memory.entries[key] = {
    key,
    value,
    proposal_only: options.proposalOnly !== false,
    source: options.source || 'local',
    updated_at: memory.updated_at,
  };
  writeAtomicJson(memoryPath(rootDir), memory);
  return memory.entries[key];
}

function getMemory(rootDir, key) {
  assertAllowedKey(key);
  const memory = readMemory(rootDir);
  return memory.entries[key] || null;
}

function listMemory(rootDir) {
  const memory = readMemory(rootDir);
  return {
    schema_version: memory.schema_version,
    updated_at: memory.updated_at,
    entries: ALLOWED_KEYS.map((key) => memory.entries[key]).filter(Boolean),
  };
}

function parseValue(value) {
  if (value === undefined) return null;
  try {
    return JSON.parse(value);
  } catch (_err) {
    return value;
  }
}

function getArg(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] || null;
}

function printUsage() {
  console.log('Usage: node tools/maya-memory.cjs <get|set|list> [key] [value] [--root <path>]');
}

function runCli(argv) {
  const [command, key, rawValue, ...rest] = argv;
  const rootDir = path.resolve(getArg(rest, '--root') || process.cwd());

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return 0;
  }

  if (command === 'list') {
    console.log(JSON.stringify(listMemory(rootDir), null, 2));
    return 0;
  }

  if (command === 'get') {
    console.log(JSON.stringify(getMemory(rootDir, key), null, 2));
    return 0;
  }

  if (command === 'set') {
    console.log(JSON.stringify(setMemory(rootDir, key, parseValue(rawValue), { source: 'cli' }), null, 2));
    return 0;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

module.exports = {
  ALLOWED_KEYS,
  getMemory,
  listMemory,
  memoryPath,
  readMemory,
  setMemory,
};
