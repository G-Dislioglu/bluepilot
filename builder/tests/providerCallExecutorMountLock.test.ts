import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildProviderCallExecutorMountLockContract,
  buildProviderCallExecutorMountLockPreflight,
  PROVIDER_CALL_EXECUTOR_MOUNT_CONFIRM,
} from '../src/providerCallExecutorMountLock.js';

const reachable = { reachable: true, status: 'reachable', reason: 'ok' };
const recorded = { reachable: true, status: 'reachable', recorded: true, reason: 'recorded' };

function readyRequest() {
  return {
    confirm: PROVIDER_CALL_EXECUTOR_MOUNT_CONFIRM,
    operatorExecutionRef: 'operator:execution:provider-call',
    providerMountRef: 'provider:mount:review',
    providerIsolationRef: 'provider:isolation:locked',
    activationLock: {
      target: 'provider_call',
      activationIntentRef: 'activation:intent:provider',
      operatorDecisionRef: 'operator:decision:provider',
      liveEvidenceRef: 'live:evidence:provider',
      providerRuntime: {
        instruction: 'Provider call activation review only',
        requestedBy: 'operator:g-dislioglu',
        providerIsolationRef: 'provider:isolation:locked',
        mayaGate: {
          mayaCoreConfigured: true,
          budget: reachable,
          cost: recorded,
          corridor: reachable,
        },
      },
    },
  };
}

test('provider-call executor mount contract keeps provider execution closed', () => {
  const contract = buildProviderCallExecutorMountLockContract(new Date('2026-06-16T12:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-provider-call-executor-mount-lock-contract-v0.1');
  assert.equal(contract.protectedTarget, 'provider_call');
  assert.equal(contract.mountBoundary.providerCallsAllowed, false);
  assert.equal(contract.mountBoundary.runtimeExecutionAllowed, false);
  assert.equal(contract.sideEffects.providerCalls, false);
  assert.equal(contract.sideEffects.routeMutation, false);
});

test('provider-call executor mount can become lock-ready without provider calls', () => {
  const preflight = buildProviderCallExecutorMountLockPreflight(readyRequest(), new Date('2026-06-16T12:00:00.000Z'));

  assert.equal(preflight.status, 'executor_mount_lock_ready');
  assert.equal(preflight.executorMountReady, true);
  assert.equal(preflight.activationLockPreflight?.status, 'activation_lock_ready');
  assert.equal(preflight.providerCallsAllowed, false);
  assert.equal(preflight.runtimeExecutionAllowed, false);
  assert.equal(preflight.sideEffects.providerCalls, false);
});

test('provider-call executor mount blocks missing confirmation', () => {
  const request = readyRequest();
  request.confirm = 'wrong';
  const preflight = buildProviderCallExecutorMountLockPreflight(request, new Date('2026-06-16T12:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('provider_executor_mount.confirm_required'));
  assert.equal(preflight.executorMountReady, false);
});

test('provider-call executor mount blocks missing activation lock', () => {
  const preflight = buildProviderCallExecutorMountLockPreflight({
    confirm: PROVIDER_CALL_EXECUTOR_MOUNT_CONFIRM,
    operatorExecutionRef: 'operator:execution:provider-call',
    providerMountRef: 'provider:mount:review',
    providerIsolationRef: 'provider:isolation:locked',
  }, new Date('2026-06-16T12:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('provider_executor_mount.activation_lock_required'));
  assert.equal(preflight.providerCallsAllowed, false);
});
