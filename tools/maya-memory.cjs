#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const {
  MayaMemoryRemoteUnavailableError,
  listConfirmed,
  proposeEntry,
  readConfirmed,
} = require('./maya-memory-remote-client.cjs');

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

function markOfflineEntry(entry) {
  if (!entry) return null;
  return {
    ...entry,
    storage: entry.storage || 'local_json_fallback',
    offline: true,
    source: entry.source && entry.source.startsWith('local_offline') ? entry.source : `local_offline:${entry.source || 'local'}`,
  };
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

function setLocalMemory(rootDir, key, value, options = {}) {
  assertAllowedKey(key);
  const memory = readMemory(rootDir);
  memory.updated_at = nowIso();
  memory.entries[key] = {
    key,
    value,
    proposal_only: options.proposalOnly !== false,
    source: options.source || 'local_offline',
    storage: 'local_json_fallback',
    offline: true,
    updated_at: memory.updated_at,
  };
  writeAtomicJson(memoryPath(rootDir), memory);
  return memory.entries[key];
}

function getLocalMemory(rootDir, key) {
  assertAllowedKey(key);
  const memory = readMemory(rootDir);
  return markOfflineEntry(memory.entries[key] || null);
}

function listLocalMemory(rootDir) {
  const memory = readMemory(rootDir);
  return {
    schema_version: memory.schema_version,
    updated_at: memory.updated_at,
    storage: 'local_json_fallback',
    offline: true,
    entries: ALLOWED_KEYS.map((key) => markOfflineEntry(memory.entries[key])).filter(Boolean),
  };
}

async function setMemory(rootDir, key, value, options = {}) {
  assertAllowedKey(key);
  try {
    return await proposeEntry(key, value, { source: options.source || 'bluepilot' });
  } catch (err) {
    if (!(err instanceof MayaMemoryRemoteUnavailableError)) {
      throw err;
    }
    return setLocalMemory(rootDir, key, value, {
      proposalOnly: true,
      source: options.source || 'fallback',
    });
  }
}

async function getMemory(rootDir, key) {
  assertAllowedKey(key);
  try {
    return await readConfirmed(key);
  } catch (err) {
    if (!(err instanceof MayaMemoryRemoteUnavailableError)) {
      throw err;
    }
    return getLocalMemory(rootDir, key);
  }
}

async function listMemory(rootDir) {
  try {
    const entries = await listConfirmed();
    return {
      schema_version: 'bluepilot-maya-memory/shared-block2-client-v1',
      updated_at: entries.reduce((latest, entry) => !latest || (entry.updated_at || '') > latest ? entry.updated_at : latest, null),
      storage: 'shared_block2',
      offline: false,
      entries,
    };
  } catch (err) {
    if (!(err instanceof MayaMemoryRemoteUnavailableError)) {
      throw err;
    }
    return listLocalMemory(rootDir);
  }
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

async function runCli(argv) {
  const [command, key, rawValue, ...rest] = argv;
  const rootDir = path.resolve(getArg(rest, '--root') || process.cwd());

  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return 0;
  }

  if (command === 'list') {
    console.log(JSON.stringify(await listMemory(rootDir), null, 2));
    return 0;
  }

  if (command === 'get') {
    console.log(JSON.stringify(await getMemory(rootDir, key), null, 2));
    return 0;
  }

  if (command === 'set') {
    console.log(JSON.stringify(await setMemory(rootDir, key, parseValue(rawValue), { source: 'cli' }), null, 2));
    return 0;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  }).catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

module.exports = {
  ALLOWED_KEYS,
  getMemory,
  getLocalMemory,
  listMemory,
  listLocalMemory,
  memoryPath,
  readMemory,
  setMemory,
  setLocalMemory,
};
