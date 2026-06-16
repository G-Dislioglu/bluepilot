import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildRuntimeDryRunExecutorMountLockContract,
  buildRuntimeDryRunExecutorMountLockPreflight,
  RUNTIME_DRY_RUN_EXECUTOR_MOUNT_CONFIRM,
} from '../src/runtimeDryRunExecutorMountLock.js';

const reachable = { reachable: true, status: 'reachable', reason: 'ok' };

function readyRequest() {
  return {
    confirm: RUNTIME_DRY_RUN_EXECUTOR_MOUNT_CONFIRM,
    operatorExecutionRef: 'operator:execution:runtime-dry-run',
    routeGateRef: 'env:BLUEPILOT_RUNTIME_DRY_RUN_ROUTE_ENABLED',
    runtimeMountRef: 'runtime:dry-run:mount-review',
    activationLock: {
      target: 'runtime_dry_run',
      activationIntentRef: 'activation:intent:runtime',
      operatorDecisionRef: 'operator:decision:runtime',
      liveEvidenceRef: 'live:evidence:runtime',
      providerRuntime: {
        instruction: 'Dry-run activation review only',
        requestedBy: 'operator:g-dislioglu',
        operatorApprovalRef: 'operator:approval:runtime',
        providerIsolationRef: 'provider:isolation:runtime',
        mayaGateEvidenceRef: 'maya:gate:live',
        maxRuntimeSeconds: 60,
        mayaGate: {
          mayaCoreConfigured: true,
          budget: reachable,
          corridor: reachable,
        },
      },
    },
  };
}

test('runtime dry-run executor mount contract keeps execution closed', () => {
  const contract = buildRuntimeDryRunExecutorMountLockContract(new Date('2026-06-16T11:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-runtime-dry-run-executor-mount-lock-contract-v0.1');
  assert.equal(contract.protectedTarget, 'runtime_dry_run');
  assert.equal(contract.mountBoundary.runtimeExecutionAllowed, false);
  assert.equal(contract.mountBoundary.routeMutationAllowed, false);
  assert.equal(contract.sideEffects.runtimeExecution, false);
  assert.equal(contract.sideEffects.routeMutation, false);
});

test('runtime dry-run executor mount can become lock-ready without execution', () => {
  const preflight = buildRuntimeDryRunExecutorMountLockPreflight(readyRequest(), new Date('2026-06-16T11:00:00.000Z'));

  assert.equal(preflight.status, 'executor_mount_lock_ready');
  assert.equal(preflight.executorMountReady, true);
  assert.equal(preflight.activationLockPreflight?.status, 'activation_lock_ready');
  assert.equal(preflight.runtimeExecutionAllowed, false);
  assert.equal(preflight.routeMutationAllowed, false);
  assert.equal(preflight.sideEffects.runtimeExecution, false);
});

test('runtime dry-run executor mount blocks missing confirmation', () => {
  const request = readyRequest();
  request.confirm = 'wrong';
  const preflight = buildRuntimeDryRunExecutorMountLockPreflight(request, new Date('2026-06-16T11:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('runtime_executor_mount.confirm_required'));
  assert.equal(preflight.executorMountReady, false);
});

test('runtime dry-run executor mount blocks missing activation lock', () => {
  const preflight = buildRuntimeDryRunExecutorMountLockPreflight({
    confirm: RUNTIME_DRY_RUN_EXECUTOR_MOUNT_CONFIRM,
    operatorExecutionRef: 'operator:execution:runtime-dry-run',
    routeGateRef: 'env:BLUEPILOT_RUNTIME_DRY_RUN_ROUTE_ENABLED',
    runtimeMountRef: 'runtime:dry-run:mount-review',
  }, new Date('2026-06-16T11:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('runtime_executor_mount.activation_lock_required'));
  assert.equal(preflight.runtimeExecutionAllowed, false);
});
