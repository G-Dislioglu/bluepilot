import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { PROVIDER_CALL_EXECUTOR_MOUNT_CONFIRM } from '../src/providerCallExecutorMountLock.js';
import { handleProviderCallExecutorMountLockRequest } from '../src/providerCallExecutorMountLockRoute.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleProviderCallExecutorMountLockRequest(request, response, {
      now: new Date('2026-06-16T12:00:00.000Z'),
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

test('GET /probe/provider-call-executor-mount-lock-contract exposes closed boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/provider-call-executor-mount-lock-contract`);
    const body = await response.json() as {
      version: string;
      mountBoundary: { providerCallsAllowed: boolean; runtimeExecutionAllowed: boolean };
      sideEffects: { providerCalls: boolean; routeMutation: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-provider-call-executor-mount-lock-contract-v0.1');
    assert.equal(body.mountBoundary.providerCallsAllowed, false);
    assert.equal(body.mountBoundary.runtimeExecutionAllowed, false);
    assert.equal(body.sideEffects.providerCalls, false);
    assert.equal(body.sideEffects.routeMutation, false);
  });
});

test('POST /probe/provider-call-executor-mount-lock-preflight validates lock without provider calls', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/provider-call-executor-mount-lock-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
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
            requestedBy: 'operator:g-dislioglu',
            providerIsolationRef: 'provider:isolation:locked',
            mayaGate: {
            mayaCoreConfigured: true,
            budget: { reachable: true, status: 'reachable' },
            cost: { reachable: true, status: 'reachable', recorded: true },
            corridor: { reachable: true, status: 'reachable' },
          },
          },
        },
      }),
    });
    const body = await response.json() as {
      status: string;
      executorMountReady: boolean;
      providerCallsAllowed: boolean;
      runtimeExecutionAllowed: boolean;
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'executor_mount_lock_ready');
    assert.equal(body.executorMountReady, true);
    assert.equal(body.providerCallsAllowed, false);
    assert.equal(body.runtimeExecutionAllowed, false);
  });
});

test('provider-call executor mount lock route rejects wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/provider-call-executor-mount-lock-contract`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/provider-call-executor-mount-lock-preflight`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
