import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleProviderRuntimeActivationRequest } from '../src/providerRuntimeActivationRoute.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleProviderRuntimeActivationRequest(request, response, {
      now: new Date('2026-06-15T17:00:00.000Z'),
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

test('GET /probe/provider-runtime-activation-contract exposes closed activation boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/provider-runtime-activation-contract`);
    const body = await response.json() as {
      version: string;
      activationBoundary: { callsProviders: boolean; executesRuntime: boolean };
      sideEffects: { providerCalls: boolean; runtimeExecution: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-provider-runtime-activation-preflight-contract-v0.1');
    assert.equal(body.activationBoundary.callsProviders, false);
    assert.equal(body.activationBoundary.executesRuntime, false);
    assert.equal(body.sideEffects.providerCalls, false);
    assert.equal(body.sideEffects.runtimeExecution, false);
  });
});

test('POST /probe/provider-runtime-activation-preflight validates runtime evidence without execution', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/provider-runtime-activation-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        target: 'runtime_dry_run',
        instruction: 'Dry-run only',
        operatorApprovalRef: 'operator:runtime',
        providerIsolationRef: 'provider:isolated',
        maxRuntimeSeconds: 60,
        mayaGate: {
          mayaCoreConfigured: true,
          budget: { reachable: true, status: 'reachable' },
          corridor: { reachable: true, status: 'reachable' },
        },
      }),
    });
    const body = await response.json() as {
      status: string;
      runtimeActivationAllowed: boolean;
      sideEffects: { runtimeExecution: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ready_for_activation_review');
    assert.equal(body.runtimeActivationAllowed, false);
    assert.equal(body.sideEffects.runtimeExecution, false);
  });
});

test('provider runtime activation routes reject wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/provider-runtime-activation-contract`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/provider-runtime-activation-preflight`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
