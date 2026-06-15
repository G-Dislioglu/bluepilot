import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleCockpitReadOnlyRouteRequest } from '../src/cockpitReadOnlyRoute.js';
import type { CockpitProjectionAdoptionContract } from '../src/cockpitProjectionAdoptionContract.js';

const model: CockpitProjectionAdoptionContract = {
  status: 'ready',
  cockpitModelAllowed: true,
  executableActionAllowed: false,
  audience: 'operator',
  contractTaskId: 'BPK-903',
  reasons: [],
  headline: 'Ready for operator inspection',
  panels: [
    { id: 'dispatch', title: 'Dispatch decision', status: 'ready', lines: ['dispatch_allowed:true'] },
  ],
  actions: [
    { id: 'open_runtime_dispatch', enabled: false, reason: 'contract_only' },
  ],
};

async function withCockpitRoute(enabled: boolean, run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleCockpitReadOnlyRouteRequest(request, response, { enabled });
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

test('GET /cockpit/read-only is disabled by default gate', async () => {
  await withCockpitRoute(false, async (url) => {
    const response = await fetch(`${url}/cockpit/read-only`);
    const body = await response.json() as { error: string };

    assert.equal(response.status, 403);
    assert.equal(body.error, 'cockpit_read_only_route_disabled');
  });
});

test('GET /cockpit/read-only renders sample cockpit HTML when enabled', async () => {
  await withCockpitRoute(true, async (url) => {
    const response = await fetch(`${url}/cockpit/read-only`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
    assert.ok(html.includes('Operator review required'));
    assert.ok(html.includes('Actions disabled'));
  });
});

test('POST /cockpit/read-only renders supplied cockpit model', async () => {
  await withCockpitRoute(true, async (url) => {
    const response = await fetch(`${url}/cockpit/read-only`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(model),
    });
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.ok(html.includes('Ready for operator inspection'));
    assert.ok(html.includes('disabled title="contract_only"'));
  });
});

test('POST /cockpit/read-only rejects invalid model', async () => {
  await withCockpitRoute(true, async (url) => {
    const response = await fetch(`${url}/cockpit/read-only`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ headline: 'missing shape' }),
    });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 400);
    assert.equal(body.error, 'cockpit_model_invalid');
  });
});

test('PUT /cockpit/read-only returns method_not_allowed', async () => {
  await withCockpitRoute(true, async (url) => {
    const response = await fetch(`${url}/cockpit/read-only`, { method: 'PUT' });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
  });
});

