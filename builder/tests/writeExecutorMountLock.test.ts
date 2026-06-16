import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildWriteExecutorMountLockContract,
  buildWriteExecutorMountLockPreflight,
  WRITE_EXECUTOR_MOUNT_CONFIRM,
} from '../src/writeExecutorMountLock.js';

const reachable = { reachable: true, status: 'reachable', reason: 'ok' };

function readyRequest() {
  return {
    confirm: WRITE_EXECUTOR_MOUNT_CONFIRM,
    operatorExecutionRef: 'operator:execution:write-action',
    writeMountRef: 'write:mount:review',
    permitRef: 'permit:one-shot:write',
    targetRepoRef: 'repo:G-Dislioglu/bluepilot-sandbox',
    targetPathRef: 'path:.bluepilot/write-lock.md',
    contentHashRef: 'sha256:example-content-hash',
    activationLock: {
      target: 'write_action',
      activationIntentRef: 'activation:intent:write',
      operatorDecisionRef: 'operator:decision:write',
      liveEvidenceRef: 'live:evidence:write',
      targetRepoRef: 'repo:G-Dislioglu/bluepilot-sandbox',
      targetPathRef: 'path:.bluepilot/write-lock.md',
      contentHashRef: 'sha256:example-content-hash',
      mayaGate: {
        mayaCoreConfigured: true,
        corridor: reachable,
        operatorApprovalRef: 'operator:approval:write',
        permitRef: 'permit:one-shot:write',
      },
    },
  };
}

test('write executor mount contract keeps writes closed', () => {
  const contract = buildWriteExecutorMountLockContract(new Date('2026-06-16T13:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-write-executor-mount-lock-contract-v0.1');
  assert.equal(contract.protectedTarget, 'write_action');
  assert.equal(contract.mountBoundary.writesAllowed, false);
  assert.equal(contract.mountBoundary.providerCallsAllowed, false);
  assert.equal(contract.sideEffects.githubWrites, false);
  assert.equal(contract.sideEffects.fileWrites, false);
});

test('write executor mount can become lock-ready without writes', () => {
  const preflight = buildWriteExecutorMountLockPreflight(readyRequest(), new Date('2026-06-16T13:00:00.000Z'));

  assert.equal(preflight.status, 'executor_mount_lock_ready');
  assert.equal(preflight.executorMountReady, true);
  assert.equal(preflight.activationLockPreflight?.status, 'activation_lock_ready');
  assert.equal(preflight.writesAllowed, false);
  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.sideEffects.githubWrites, false);
});

test('write executor mount blocks missing confirmation', () => {
  const request = readyRequest();
  request.confirm = 'wrong';
  const preflight = buildWriteExecutorMountLockPreflight(request, new Date('2026-06-16T13:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('write_executor_mount.confirm_required'));
  assert.equal(preflight.executorMountReady, false);
});

test('write executor mount blocks missing content hash binding', () => {
  const request = readyRequest();
  request.contentHashRef = '';
  const preflight = buildWriteExecutorMountLockPreflight(request, new Date('2026-06-16T13:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('write_executor_mount.content_hash_ref_required'));
  assert.equal(preflight.writesAllowed, false);
});
