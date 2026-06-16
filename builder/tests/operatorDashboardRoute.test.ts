import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleOperatorDashboardRequest } from '../src/operatorDashboardRoute.js';
import type { EightPointIntegrationReadiness } from '../src/eightPointIntegrationReadiness.js';

async function withRoute(enabled: boolean, run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleOperatorDashboardRequest(request, response, {
      enabled,
      now: new Date('2026-06-15T14:00:00.000Z'),
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

test('GET /probe/eight-point-integration-readiness is available read-only', async () => {
  await withRoute(false, async (url) => {
    const response = await fetch(`${url}/probe/eight-point-integration-readiness`);
    const body = await response.json() as EightPointIntegrationReadiness;

    assert.equal(response.status, 200);
    assert.equal(body.summary.totalPoints, 8);
    assert.equal(body.sideEffects.deploys, false);
  });
});

test('GET /cockpit/operator-read-only is disabled by default gate', async () => {
  await withRoute(false, async (url) => {
    const response = await fetch(`${url}/cockpit/operator-read-only`);
    const body = await response.json() as { error: string };

    assert.equal(response.status, 403);
    assert.equal(body.error, 'operator_read_only_route_disabled');
  });
});

test('GET /cockpit/operator-read-only renders dashboard when enabled', async () => {
  await withRoute(true, async (url) => {
    const response = await fetch(`${url}/cockpit/operator-read-only`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
    assert.ok(html.includes('Bluepilot Operator Dashboard Readonly'));
    assert.ok(html.includes('Repo Mutation Kill Switch'));
    assert.ok(html.includes('Maya/Kaya Authority Status'));
  });
});

test('operator dashboard route rejects non-GET methods', async () => {
  await withRoute(true, async (url) => {
    const response = await fetch(`${url}/cockpit/operator-read-only`, { method: 'POST' });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
  });
});
