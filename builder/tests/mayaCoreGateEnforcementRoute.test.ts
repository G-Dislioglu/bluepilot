import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleMayaCoreGateEnforcementRequest } from '../src/mayaCoreGateEnforcementRoute.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleMayaCoreGateEnforcementRequest(request, response, {
      now: new Date('2026-06-15T16:00:00.000Z'),
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

test('GET /probe/maya-core-gate-enforcement exposes contract-only gate boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/maya-core-gate-enforcement`);
    const body = await response.json() as {
      version: string;
      activationBoundary: { callsMayaCore: boolean; callsProviders: boolean };
      sideEffects: { providerCalls: boolean; runtimeExecution: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-maya-core-gate-enforcement-contract-v0.1');
    assert.equal(body.activationBoundary.callsMayaCore, false);
    assert.equal(body.activationBoundary.callsProviders, false);
    assert.equal(body.sideEffects.providerCalls, false);
    assert.equal(body.sideEffects.runtimeExecution, false);
  });
});

test('POST /probe/maya-core-gate-enforcement-preflight validates gate evidence without execution', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/maya-core-gate-enforcement-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        target: 'write_action',
        mayaCoreConfigured: true,
        corridor: { reachable: true, status: 'reachable' },
        operatorApprovalRef: 'operator:write',
        permitRef: 'permit:one-shot',
      }),
    });
    const body = await response.json() as {
      status: string;
      target: string;
      sideEffects: { fileWrites: boolean; githubWrites: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ready_for_activation_review');
    assert.equal(body.target, 'write_action');
    assert.equal(body.sideEffects.fileWrites, false);
    assert.equal(body.sideEffects.githubWrites, false);
  });
});

test('maya core gate enforcement routes reject wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/maya-core-gate-enforcement`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/maya-core-gate-enforcement-preflight`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
