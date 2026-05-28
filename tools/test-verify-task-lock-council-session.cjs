#!/usr/bin/env node

'use strict';

const assert = require('assert');
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const verifier = path.join(repoRoot, 'tools', 'verify-task-lock.cjs');

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-council-guard-'));
}

function makeCleanGitRepo() {
  const root = makeTempRoot();
  execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' });
  return root;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function makeContract(root, value) {
  const contractPath = path.join(root, 'contract.json');
  writeJson(contractPath, Object.assign({
    task_id: 'TMP-001',
    mode: 'standard',
    task_type: 'code_task',
    target_persona: null,
    allowed_files: ['tmp/**'],
    forbidden_files: ['.env*'],
    evidence_required: ['test_result'],
    reuse_target: ['next_task_pre_lock'],
    baseline_ref: 'HEAD',
  }, value));
  return contractPath;
}

function runPreflight(contractPath, councilRoot) {
  const cleanGitRoot = makeCleanGitRepo();
  return spawnSync(process.execPath, [
    verifier,
    'TMP-001',
    '--preflight',
    '--contract',
    contractPath,
  ], {
    cwd: cleanGitRoot,
    encoding: 'utf8',
    env: Object.assign({}, process.env, councilRoot ? { BLUEPILOT_COUNCIL_ROOT: councilRoot } : {}),
  });
}

const defaultRoot = makeTempRoot();
const defaultContract = makeContract(defaultRoot, {});
const defaultResult = runPreflight(defaultContract, null);
assert.strictEqual(defaultResult.status, 0, defaultResult.stdout + defaultResult.stderr);

const missingRoot = makeTempRoot();
const requiredContract = makeContract(missingRoot, { council_session_required: true });
const missingResult = runPreflight(requiredContract, missingRoot);
assert.strictEqual(missingResult.status, 2);
assert(missingResult.stdout.includes('COUNCIL SESSION REQUIRED'));

const pausedRoot = makeTempRoot();
const pausedContract = makeContract(pausedRoot, { council_session_required: true });
writeJson(path.join(pausedRoot, '.bluepilot', 'council', 'session.json'), {
  session_id: 'cs-paused',
  status: 'paused',
});
const pausedResult = runPreflight(pausedContract, pausedRoot);
assert.strictEqual(pausedResult.status, 2);
assert(pausedResult.stdout.includes('COUNCIL SESSION NOT ACTIVE'));

const activeRoot = makeTempRoot();
const activeContract = makeContract(activeRoot, { council_session_required: true });
writeJson(path.join(activeRoot, '.bluepilot', 'council', 'session.json'), {
  session_id: 'cs-active',
  status: 'active',
});
const activeResult = runPreflight(activeContract, activeRoot);
assert.strictEqual(activeResult.status, 0, activeResult.stdout + activeResult.stderr);
assert(activeResult.stdout.includes('Council Session active: cs-active'));

console.log('verify task lock council session fixtures: PASS');
