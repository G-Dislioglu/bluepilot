import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleReadonlyIntegrationRequest } from '../src/readonlyIntegrationRoutes.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleReadonlyIntegrationRequest(request, response, {
      now: new Date('2026-06-15T13:00:00.000Z'),
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

test('readonly integration routes expose all bundle surfaces', async () => {
  await withRoute(async (url) => {
    const endpoints = [
      ['/probe/bpk-execution-ledger', 'bluepilot-bpk-execution-ledger-readonly-v0.1'],
      ['/probe/patrol-visual-coverage', 'bluepilot-patrol-visual-coverage-contract-v0.1'],
      ['/probe/repo-mutation-kill-switch', 'bluepilot-repo-mutation-kill-switch-readonly-v0.1'],
      ['/probe/aicos-permission-map', 'bluepilot-aicos-permission-map-readonly-v0.1'],
    ] as const;

    for (const [path, version] of endpoints) {
      const response = await fetch(`${url}${path}`);
      const body = await response.json() as { version: string; sideEffects: { fileWrites: boolean; providerCalls: boolean } };

      assert.equal(response.status, 200);
      assert.equal(body.version, version);
      assert.equal(body.sideEffects.fileWrites, false);
      assert.equal(body.sideEffects.providerCalls, false);
    }
  });
});

test('readonly integration routes reject non-GET methods', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/bpk-execution-ledger`, { method: 'POST' });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
  });
});
