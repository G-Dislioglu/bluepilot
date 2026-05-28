#!/usr/bin/env node

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class HardStopError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'HardStopError';
    this.details = details;
    this.exitCode = 2;
  }
}

function runGit(repoRoot, args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    throw new HardStopError('HARD STOP - git command failed', {
      command: ['git', ...args].join(' '),
      stderr: err.stderr ? err.stderr.toString() : err.message,
    });
  }
}

function ensureGitRepo(repoRoot) {
  runGit(repoRoot, ['rev-parse', '--show-toplevel']);
}

function sanitizeAgentId(agentId) {
  if (!/^[A-Za-z0-9._-]+$/.test(agentId || '')) {
    throw new HardStopError('HARD STOP - invalid agent id', { agentId });
  }
  return agentId;
}

function ensureChildPath(parentDir, childName) {
  const parent = path.resolve(parentDir);
  const child = path.resolve(parent, childName);
  if (child !== parent && !child.startsWith(`${parent}${path.sep}`)) {
    throw new HardStopError('HARD STOP - worktree path escapes parent', { parent, child });
  }
  return child;
}

function parseWorktreeList(output) {
  if (!output) return [];
  const worktrees = [];
  let current = null;

  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith('worktree ')) {
      current = { path: line.slice('worktree '.length), branch: null, head: null };
      worktrees.push(current);
    } else if (current && line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length);
    } else if (current && line.startsWith('branch ')) {
      current.branch = line.slice('branch '.length).replace(/^refs\/heads\//, '');
    }
  }

  return worktrees;
}

function listWorktrees(repoRoot) {
  ensureGitRepo(repoRoot);
  return parseWorktreeList(runGit(repoRoot, ['worktree', 'list', '--porcelain']));
}

function addWorktree(repoRoot, options) {
  ensureGitRepo(repoRoot);
  const agentId = sanitizeAgentId(options.agentId);
  const parentDir = options.parentDir || path.join(repoRoot, '.bluepilot', 'worktrees');
  const worktreePath = ensureChildPath(parentDir, agentId);
  const branch = options.branch || `bluepilot/${agentId}`;
  const baseRef = options.baseRef || 'HEAD';

  fs.mkdirSync(parentDir, { recursive: true });

  try {
    runGit(repoRoot, ['worktree', 'add', '-B', branch, worktreePath, baseRef]);
  } catch (err) {
    if (fs.existsSync(worktreePath)) {
      try {
        runGit(repoRoot, ['worktree', 'remove', '--force', worktreePath]);
      } catch (_cleanupErr) {
        fs.rmSync(worktreePath, { recursive: true, force: true });
      }
    }
    throw err;
  }

  return { agent_id: agentId, branch, path: worktreePath };
}

function removeWorktree(repoRoot, worktreePath) {
  ensureGitRepo(repoRoot);
  const absolute = path.resolve(worktreePath);
  if (!fs.existsSync(absolute)) return { path: absolute, removed: false, reason: 'missing' };
  runGit(repoRoot, ['worktree', 'remove', '--force', absolute]);
  return { path: absolute, removed: true };
}

async function withWorktree(repoRoot, options, fn) {
  const created = addWorktree(repoRoot, options);
  try {
    const result = await fn(created);
    return { worktree: created, result };
  } finally {
    removeWorktree(repoRoot, created.path);
  }
}

function getArg(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] || null;
}

function printUsage() {
  console.log('Usage: node tools/parallel-executor.cjs <list|add|remove> --repo <path>');
}

async function runCli(argv) {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h') {
    printUsage();
    return 0;
  }

  const repoRoot = path.resolve(getArg(rest, '--repo') || process.cwd());
  if (command === 'list') {
    console.log(JSON.stringify({ worktrees: listWorktrees(repoRoot) }, null, 2));
    return 0;
  }
  if (command === 'add') {
    console.log(JSON.stringify(addWorktree(repoRoot, {
      agentId: getArg(rest, '--agent'),
      parentDir: getArg(rest, '--parent') || undefined,
      branch: getArg(rest, '--branch') || undefined,
      baseRef: getArg(rest, '--base') || undefined,
    }), null, 2));
    return 0;
  }
  if (command === 'remove') {
    console.log(JSON.stringify(removeWorktree(repoRoot, getArg(rest, '--path')), null, 2));
    return 0;
  }
  throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  }).catch((err) => {
    if (err instanceof HardStopError) {
      console.error(JSON.stringify({ outcome: 'HARD_STOP', message: err.message, details: err.details }, null, 2));
      process.exitCode = err.exitCode;
    } else {
      console.error(err.message);
      process.exitCode = 1;
    }
  });
}

module.exports = {
  HardStopError,
  addWorktree,
  listWorktrees,
  parseWorktreeList,
  removeWorktree,
  sanitizeAgentId,
  withWorktree,
};
