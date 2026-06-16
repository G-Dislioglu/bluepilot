import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleRuntimeDryRunExecutorMountLockRequest } from '../src/runtimeDryRunExecutorMountLockRoute.js';
import { RUNTIME_DRY_RUN_EXECUTOR_MOUNT_CONFIRM } from '../src/runtimeDryRunExecutorMountLock.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleRuntimeDryRunExecutorMountLockRequest(request, response, {
      now: new Date('2026-06-16T11:00:00.000Z'),
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

test('GET /probe/runtime-dry-run-executor-mount-lock-contract exposes closed boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/runtime-dry-run-executor-mount-lock-contract`);
    const body = await response.json() as {
      version: string;
      mountBoundary: { runtimeExecutionAllowed: boolean; routeMutationAllowed: boolean };
      sideEffects: { runtimeExecution: boolean; routeMutation: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-runtime-dry-run-executor-mount-lock-contract-v0.1');
    assert.equal(body.mountBoundary.runtimeExecutionAllowed, false);
    assert.equal(body.mountBoundary.routeMutationAllowed, false);
    assert.equal(body.sideEffects.runtimeExecution, false);
    assert.equal(body.sideEffects.routeMutation, false);
  });
});

test('POST /probe/runtime-dry-run-executor-mount-lock-preflight validates lock without execution', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/runtime-dry-run-executor-mount-lock-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
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
            operatorApprovalRef: 'operator:approval:runtime',
            providerIsolationRef: 'provider:isolation:runtime',
            mayaGateEvidenceRef: 'maya:gate:live',
            maxRuntimeSeconds: 60,
            mayaGate: {
              mayaCoreConfigured: true,
              budget: { reachable: true, status: 'reachable' },
              corridor: { reachable: true, status: 'reachable' },
            },
          },
        },
      }),
    });
    const body = await response.json() as {
      status: string;
      executorMountReady: boolean;
      runtimeExecutionAllowed: boolean;
      routeMutationAllowed: boolean;
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'executor_mount_lock_ready');
    assert.equal(body.executorMountReady, true);
    assert.equal(body.runtimeExecutionAllowed, false);
    assert.equal(body.routeMutationAllowed, false);
  });
});

test('runtime dry-run executor mount lock route rejects wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/runtime-dry-run-executor-mount-lock-contract`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/runtime-dry-run-executor-mount-lock-preflight`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
