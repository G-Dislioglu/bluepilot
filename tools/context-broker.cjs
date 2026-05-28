#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_CONTEXT = Object.freeze([
  'AGENTS.md',
  '.specify/.app-goal.md',
  '.specify/.feature-goals.md',
  'docs/WORKCELL_LOCK_PROTOCOL.md',
  'docs/BP_C1_KERNEL_READY_CHECKPOINT_v0.md',
  'docs/BLUEPILOT_BUILD_CANVAS_DECISION_v0.md',
]);

const BLOCKED_PATTERNS = Object.freeze([
  '.env',
  '.env.',
  '.git/',
  'node_modules/',
]);

function normalizeRepoPath(value) {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function isBlockedPath(repoPath) {
  const normalized = normalizeRepoPath(repoPath);
  if (!normalized || path.isAbsolute(repoPath)) return true;
  if (normalized.includes('../') || normalized === '..') return true;
  return BLOCKED_PATTERNS.some((pattern) => normalized === pattern.slice(0, -1) || normalized.startsWith(pattern));
}

function resolveRepoPath(repoRoot, repoPath) {
  if (isBlockedPath(repoPath)) {
    return { ok: false, reason: 'blocked_path' };
  }

  const absolute = path.resolve(repoRoot, repoPath);
  const root = path.resolve(repoRoot);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    return { ok: false, reason: 'outside_repo' };
  }
  return { ok: true, absolute, repoPath: normalizeRepoPath(repoPath) };
}

function readTextFile(repoRoot, repoPath) {
  const resolved = resolveRepoPath(repoRoot, repoPath);
  if (!resolved.ok) {
    return { path: normalizeRepoPath(repoPath), status: 'blocked', reason: resolved.reason };
  }

  if (!fs.existsSync(resolved.absolute)) {
    return { path: resolved.repoPath, status: 'missing', content: null };
  }

  const stat = fs.statSync(resolved.absolute);
  if (!stat.isFile()) {
    return { path: resolved.repoPath, status: 'blocked', reason: 'not_file' };
  }

  return {
    path: resolved.repoPath,
    status: 'loaded',
    bytes: stat.size,
    content: fs.readFileSync(resolved.absolute, 'utf8'),
  };
}

function loadContract(repoRoot, taskId) {
  const contractPath = `contracts/${taskId}.json`;
  const file = readTextFile(repoRoot, contractPath);
  if (file.status !== 'loaded') return { contract: null, file };
  return { contract: JSON.parse(file.content), file };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sessionStart(repoRoot, taskId, options = {}) {
  const { contract, file: contractFile } = loadContract(repoRoot, taskId);
  const contractEligible = contract && Array.isArray(contract.eligible_context) ? contract.eligible_context : [];
  const includes = Array.isArray(options.include) ? options.include : [];
  const paths = unique([...DEFAULT_CONTEXT, ...contractEligible, ...includes, `contracts/${taskId}.json`]);
  const files = paths.map((repoPath) => readTextFile(repoRoot, repoPath));

  return {
    task_id: taskId,
    broker_version: 'v0',
    repo_root: path.resolve(repoRoot),
    contract: contract ? {
      task_id: contract.task_id,
      task_name: contract.task_name,
      task_type: contract.task_type,
      mode: contract.mode,
      goal: contract.goal,
      eligible_context_count: contractEligible.length,
    } : null,
    contract_file: {
      path: contractFile.path,
      status: contractFile.status,
      reason: contractFile.reason || null,
    },
    files,
    summary: {
      loaded: files.filter((file) => file.status === 'loaded').map((file) => file.path),
      missing: files.filter((file) => file.status === 'missing').map((file) => file.path),
      blocked: files.filter((file) => file.status === 'blocked').map((file) => ({ path: file.path, reason: file.reason })),
    },
  };
}

function printUsage() {
  console.log('Usage: node tools/context-broker.cjs session-start <TASK_ID> [--include <path>]');
}

function collectIncludes(args) {
  const includes = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--include' && args[index + 1]) {
      includes.push(args[index + 1]);
      index += 1;
    }
  }
  return includes;
}

function runCli(argv) {
  const [command, taskId, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return 0;
  }
  if (command !== 'session-start') throw new Error(`Unknown command: ${command}`);
  if (!taskId) throw new Error('TASK_ID is required.');
  console.log(JSON.stringify(sessionStart(path.resolve(__dirname, '..'), taskId, { include: collectIncludes(rest) }), null, 2));
  return 0;
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
  DEFAULT_CONTEXT,
  isBlockedPath,
  readTextFile,
  resolveRepoPath,
  sessionStart,
};
