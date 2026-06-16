import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { WRITE_EXECUTOR_MOUNT_CONFIRM } from '../src/writeExecutorMountLock.js';
import { handleWriteExecutorMountLockRequest } from '../src/writeExecutorMountLockRoute.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleWriteExecutorMountLockRequest(request, response, {
      now: new Date('2026-06-16T13:00:00.000Z'),
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

test('GET /probe/write-executor-mount-lock-contract exposes closed boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/write-executor-mount-lock-contract`);
    const body = await response.json() as {
      version: string;
      mountBoundary: { writesAllowed: boolean; providerCallsAllowed: boolean };
      sideEffects: { githubWrites: boolean; fileWrites: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-write-executor-mount-lock-contract-v0.1');
    assert.equal(body.mountBoundary.writesAllowed, false);
    assert.equal(body.mountBoundary.providerCallsAllowed, false);
    assert.equal(body.sideEffects.githubWrites, false);
    assert.equal(body.sideEffects.fileWrites, false);
  });
});

test('POST /probe/write-executor-mount-lock-preflight validates lock without writes', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/write-executor-mount-lock-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
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
            corridor: { reachable: true, status: 'reachable' },
            operatorApprovalRef: 'operator:approval:write',
            permitRef: 'permit:one-shot:write',
          },
        },
      }),
    });
    const body = await response.json() as {
      status: string;
      executorMountReady: boolean;
      writesAllowed: boolean;
      providerCallsAllowed: boolean;
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'executor_mount_lock_ready');
    assert.equal(body.executorMountReady, true);
    assert.equal(body.writesAllowed, false);
    assert.equal(body.providerCallsAllowed, false);
  });
});

test('write executor mount lock route rejects wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/write-executor-mount-lock-contract`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/write-executor-mount-lock-preflight`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
