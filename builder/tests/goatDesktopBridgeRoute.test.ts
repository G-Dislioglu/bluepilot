import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleGoatDesktopBridgeRequest } from '../src/goatDesktopBridgeRoute.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleGoatDesktopBridgeRequest(request, response, {
      now: new Date('2026-06-15T15:00:00.000Z'),
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

test('GET /probe/goat-desktop-bridge-contract exposes contract-only boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/goat-desktop-bridge-contract`);
    const body = await response.json() as {
      version: string;
      activationBoundary: { mayExecute: boolean; callsGoatDesktop: boolean };
      sideEffects: { desktopActions: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-goat-desktop-bridge-contract-v0.1');
    assert.equal(body.activationBoundary.callsGoatDesktop, false);
    assert.equal(body.activationBoundary.mayExecute, false);
    assert.equal(body.sideEffects.desktopActions, false);
  });
});

test('POST /probe/goat-desktop-builder-cue-preflight validates cue shape without calling GOAT', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/goat-desktop-builder-cue-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        source: 'test_cue',
        action_type: 'hover',
        label: 'Ziel',
        bbox: [20, 20, 120, 50],
      }),
    });
    const body = await response.json() as {
      status: string;
      normalizedCue?: { source: string };
      contract: { activationBoundary: { callsGoatDesktop: boolean } };
      sideEffects: { desktopActions: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ready_for_local_goat_review');
    assert.equal(body.normalizedCue?.source, 'test_cue');
    assert.equal(body.contract.activationBoundary.callsGoatDesktop, false);
    assert.equal(body.sideEffects.desktopActions, false);
  });
});

test('goat desktop bridge routes reject wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/goat-desktop-bridge-contract`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/goat-desktop-builder-cue-preflight`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
