#!/usr/bin/env node

'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  HardStopError,
  addWorktree,
  listWorktrees,
  parseWorktreeList,
  removeWorktree,
  sanitizeAgentId,
  withWorktree,
} = require('./parallel-executor.cjs');

function makeRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-worktree-repo-'));
  execFileSync('git', ['init'], { cwd: repoRoot, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'bluepilot@example.test'], { cwd: repoRoot, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Bluepilot Test'], { cwd: repoRoot, stdio: 'ignore' });
  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# test\n', 'utf8');
  execFileSync('git', ['add', 'README.md'], { cwd: repoRoot, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: repoRoot, stdio: 'ignore' });
  return repoRoot;
}

assert.strictEqual(sanitizeAgentId('agent-1'), 'agent-1');
assert.throws(() => sanitizeAgentId('../bad'), /invalid agent id/);

const parsed = parseWorktreeList('worktree C:/repo\nHEAD abc\nbranch refs/heads/main\n\nworktree C:/wt\nHEAD def\nbranch refs/heads/test\n');
assert.strictEqual(parsed.length, 2);
assert.strictEqual(parsed[1].branch, 'test');

const repoRoot = makeRepo();
const parentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-worktrees-'));
const created = addWorktree(repoRoot, { agentId: 'agent-1', parentDir, branch: 'bp-test-agent-1' });
assert(fs.existsSync(created.path));
assert(listWorktrees(repoRoot).some((item) => path.resolve(item.path) === path.resolve(created.path)));
assert.strictEqual(removeWorktree(repoRoot, created.path).removed, true);
assert(!fs.existsSync(created.path));

const repoRootForCleanup = makeRepo();
const parentForCleanup = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-worktrees-cleanup-'));
let failedPath = null;
withWorktree(repoRootForCleanup, { agentId: 'agent-cleanup', parentDir: parentForCleanup }, async (worktree) => {
  failedPath = worktree.path;
  throw new Error('forced failure');
}).then(() => {
  throw new Error('withWorktree should have failed');
}).catch((err) => {
  assert.strictEqual(err.message, 'forced failure');
  assert(!fs.existsSync(failedPath));

  const badRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-not-git-'));
  assert.throws(() => listWorktrees(badRepo), HardStopError);
  console.log('parallel executor fixtures: PASS');
});
