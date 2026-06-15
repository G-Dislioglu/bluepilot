import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleRuntimeDryRunRouteRequest } from '../src/runtimeDryRunRoute.js';
import { RUNTIME_DRY_RUN_CONFIRM } from '../src/runtimeDryRunRouteContract.js';

async function withRuntimeDryRunRoute(
  enabled: boolean,
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    void handleRuntimeDryRunRouteRequest(request, response, { enabled });
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

test('POST /probe/runtime-dry-run is disabled by default gate', async () => {
  await withRuntimeDryRunRoute(false, async (url) => {
    const response = await fetch(`${url}/probe/runtime-dry-run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: RUNTIME_DRY_RUN_CONFIRM,
        instruction: 'dry run only',
      }),
    });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 403);
    assert.equal(body.error, 'runtime_dry_run_route_disabled');
  });
});

test('GET /probe/runtime-dry-run returns method_not_allowed when enabled', async () => {
  await withRuntimeDryRunRoute(true, async (url) => {
    const response = await fetch(`${url}/probe/runtime-dry-run`);
    const body = await response.json() as { error: string };

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
  });
});

test('POST /probe/runtime-dry-run requires confirm phrase', async () => {
  await withRuntimeDryRunRoute(true, async (url) => {
    const response = await fetch(`${url}/probe/runtime-dry-run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ instruction: 'dry run only' }),
    });
    const body = await response.json() as { ok: boolean; reasons: string[] };

    assert.equal(response.status, 400);
    assert.equal(body.ok, false);
    assert.ok(body.reasons.includes('runtime_dry_run_route.confirm_required'));
  });
});

test('POST /probe/runtime-dry-run returns contract plan without execution side effects', async () => {
  await withRuntimeDryRunRoute(true, async (url) => {
    const response = await fetch(`${url}/probe/runtime-dry-run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: RUNTIME_DRY_RUN_CONFIRM,
        instruction: 'inspect scope only',
        requestedBy: 'operator',
      }),
    });
    const body = await response.json() as {
      ok: boolean;
      code: string;
      plan: {
        dryRunInvocationAllowed: boolean;
        runtimeDispatchAllowed: boolean;
        invocation: {
          dryRun: boolean;
          skipDeploy: boolean;
          allowProviderCalls: boolean;
          allowDatabaseWrites: boolean;
          allowGitHubWrites: boolean;
          allowRuntimeRoute: boolean;
        };
      };
    };

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.code, 'runtime_dry_run_route_ready');
    assert.equal(body.plan.dryRunInvocationAllowed, true);
    assert.equal(body.plan.runtimeDispatchAllowed, false);
    assert.deepEqual(body.plan.invocation, {
      dryRun: true,
      skipDeploy: true,
      allowProviderCalls: false,
      allowDatabaseWrites: false,
      allowGitHubWrites: false,
      allowRuntimeRoute: false,
    });
  });
});

