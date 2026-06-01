import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkSandboxWriteAccess,
  handleSandboxWriteProbeRequest,
  type SandboxWriteProbePayload,
} from '../src/sandboxWriteProbe.js';
import { getBuilderTargetProfile } from '../src/builderTargetProfiles.js';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function withProbeServer(
  fetchImpl: typeof fetch,
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    void handleSandboxWriteProbeRequest(request, response, {
      fetchImpl,
      token: 'test-secret-token',
      now: new Date('2026-06-01T00:00:00.000Z'),
      nonce: 'unit',
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

test('bluepilot-sandbox target profile is explicit-scope and write-disabled for now', () => {
  const profile = getBuilderTargetProfile('bluepilot-sandbox');

  assert.ok(profile);
  assert.equal(profile.repo, 'G-Dislioglu/bluepilot-sandbox');
  assert.equal(profile.branch, 'main');
  assert.equal(profile.scopePolicy, 'explicit_scope_only');
  assert.equal(profile.writePolicy, 'dry_run_only');
  assert.equal(profile.pushAllowed, false);
  assert.equal(getBuilderTargetProfile(null)?.id, 'soulmatch');
});

test('sandbox write check creates and deletes only in bluepilot-sandbox', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = (async (url, init) => {
    calls.push({ url: String(url), init });

    if (init?.method === 'PUT') {
      return jsonResponse(201, {
        content: { sha: 'created-blob-sha' },
        commit: { sha: 'create-commit-sha' },
      });
    }

    if (init?.method === 'DELETE') {
      return jsonResponse(200, {
        commit: { sha: 'delete-commit-sha' },
      });
    }

    return jsonResponse(405, { message: 'unexpected method' });
  }) as typeof fetch;

  const result = await checkSandboxWriteAccess({
    fetchImpl,
    token: 'test-secret-token',
    now: new Date('2026-06-01T00:00:00.000Z'),
    nonce: 'unit',
  });

  assert.equal(result.status, 'writable');
  assert.equal(result.repository, 'G-Dislioglu/bluepilot-sandbox');
  assert.equal(result.createCommit, 'create-commit-sha');
  assert.equal(result.deleteCommit, 'delete-commit-sha');
  assert.equal(calls.length, 2);
  assert.ok(calls.every((call) => call.url.startsWith('https://api.github.com/repos/G-Dislioglu/bluepilot-sandbox/contents/.bluepilot/')));
  assert.deepEqual(calls.map((call) => call.init?.method), ['PUT', 'DELETE']);
  assert.equal(JSON.stringify(result).includes('test-secret-token'), false);
});

test('sandbox write check reports not_configured without a token and does not call GitHub', async () => {
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    return jsonResponse(500, {});
  }) as typeof fetch;

  const result = await checkSandboxWriteAccess({
    fetchImpl,
    token: '',
    now: new Date('2026-06-01T00:00:00.000Z'),
  });

  assert.equal(result.status, 'not_configured');
  assert.equal(called, false);
});

test('POST /probe/sandbox-write-check requires explicit confirmation before writing', async () => {
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    return jsonResponse(500, {});
  }) as typeof fetch;

  await withProbeServer(fetchImpl, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write-check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'wrong' }),
    });
    const body = await response.json() as { error: string; required: string };

    assert.equal(response.status, 400);
    assert.equal(body.error, 'confirmation_required');
    assert.equal(body.required, 'write-to-bluepilot-sandbox');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-write-check returns writable without serializing the token', async () => {
  const fetchImpl = (async (_url, init) => {
    if (init?.method === 'PUT') {
      return jsonResponse(201, {
        content: { sha: 'created-blob-sha' },
        commit: { sha: 'create-commit-sha' },
      });
    }
    return jsonResponse(200, {
      commit: { sha: 'delete-commit-sha' },
    });
  }) as typeof fetch;

  await withProbeServer(fetchImpl, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write-check`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'write-to-bluepilot-sandbox' }),
    });
    const body = await response.json() as SandboxWriteProbePayload;

    assert.equal(response.status, 200);
    assert.equal(body.status, 'writable');
    assert.equal(body.repository, 'G-Dislioglu/bluepilot-sandbox');
    assert.equal(JSON.stringify(body).includes('test-secret-token'), false);
  });
});

test('GET /probe/sandbox-write-check returns method_not_allowed', async () => {
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    return jsonResponse(500, {});
  }) as typeof fetch;

  await withProbeServer(fetchImpl, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write-check`);
    const body = await response.json() as { error: string };

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
    assert.equal(called, false);
  });
});
