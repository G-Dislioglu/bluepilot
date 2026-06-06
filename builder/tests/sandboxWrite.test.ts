import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleSandboxWriteRequest } from '../src/sandboxWrite.js';

type HandlerOptions = NonNullable<Parameters<typeof handleSandboxWriteRequest>[2]>;
type PutFileContentImpl = NonNullable<HandlerOptions['putFileContentImpl']>;
type PutCall = Parameters<PutFileContentImpl>;

function jsonResponse(status: number, body: unknown, statusText = ''): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'content-type': 'application/json' },
  });
}

function encodeBase64Utf8(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

async function withProbeServer(
  options: HandlerOptions,
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    void handleSandboxWriteRequest(request, response, options);
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

test('POST /probe/sandbox-write returns 403 when endpoint env is off', async () => {
  let called = false;

  await withProbeServer({
    env: {},
    putFileContentImpl: async () => {
      called = true;
      return { success: true, commitSha: 'commit-sha' };
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: encodeBase64Utf8('hello\n'),
      }),
    });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 403);
    assert.equal(body.error, 'sandbox_write_disabled');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-write rejects invalid paths before GitHub access', async () => {
  const invalidPaths = ['', '../outside.md', '/absolute.md', 'bad path.md'];

  for (const path of invalidPaths) {
    let called = false;

    await withProbeServer({
      env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true', GITHUB_TOKEN: 'token' },
      fetchImpl: (async () => {
        called = true;
        return jsonResponse(404, {});
      }) as unknown as HandlerOptions['fetchImpl'],
    }, async (url) => {
      const response = await fetch(`${url}/probe/sandbox-write`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          path,
          contentBase64: encodeBase64Utf8('hello\n'),
        }),
      });
      const body = await response.json() as { error: string };

      assert.equal(response.status, 400);
      assert.equal(body.error, 'invalid_path');
      assert.equal(called, false);
    });
  }
});

test('POST /probe/sandbox-write rejects empty content and unexpected caller fields', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true', GITHUB_TOKEN: 'token' },
    fetchImpl: (async () => {
      called = true;
      return jsonResponse(404, {});
    }) as unknown as HandlerOptions['fetchImpl'],
  }, async (url) => {
    const emptyContent = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: '',
      }),
    });
    const unexpected = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: encodeBase64Utf8('hello\n'),
        targetRepo: 'G-Dislioglu/soulmatch',
      }),
    });

    assert.equal(emptyContent.status, 400);
    assert.equal((await emptyContent.json() as { error: string }).error, 'content_base64_required');
    assert.equal(unexpected.status, 400);
    assert.equal((await unexpected.json() as { error: string }).error, 'unexpected_field:targetRepo');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-write reports github_token_missing before writing', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true' },
    putFileContentImpl: async () => {
      called = true;
      return { success: true, commitSha: 'commit-sha' };
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: encodeBase64Utf8('hello\n'),
      }),
    });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 500);
    assert.equal(body.error, 'github_token_missing');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-write creates missing files and updates existing files', async () => {
  const calls: PutCall[] = [];
  let getCount = 0;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true', GITHUB_TOKEN: 'token' },
    now: new Date('2026-06-06T12:00:00.000Z'),
    fetchImpl: (async () => {
      getCount += 1;
      return getCount === 1
        ? jsonResponse(404, {})
        : jsonResponse(200, { sha: 'existing-sha' });
    }) as unknown as HandlerOptions['fetchImpl'],
    putFileContentImpl: async (...args) => {
      calls.push(args);
      return { success: true, commitSha: `commit-${calls.length}` };
    },
  }, async (url) => {
    for (const content of ['first\n', 'second\n']) {
      const response = await fetch(`${url}/probe/sandbox-write`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          path: '.bluepilot/maya/task.md',
          contentBase64: encodeBase64Utf8(content),
        }),
      });
      const body = await response.json() as { status: string; pushed: boolean; landed: boolean; commit: string; path: string };

      assert.equal(response.status, 200);
      assert.equal(body.status, 'write_succeeded');
      assert.equal(body.pushed, true);
      assert.equal(body.landed, true);
      assert.equal(body.path, '.bluepilot/maya/task.md');
    }
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], 'G-Dislioglu');
  assert.equal(calls[0][1], 'bluepilot-sandbox');
  assert.equal(calls[0][2], '.bluepilot/maya/task.md');
  assert.equal(calls[0][4], 'Maya sandbox write: .bluepilot/maya/task.md');
  assert.equal(calls[0][5], 'token');
  assert.deepEqual(calls[0][7], { op: 'create', expectedBaseSha: '' });
  assert.deepEqual(calls[1][7], { op: 'update', expectedBaseSha: 'existing-sha' });
});

test('POST /probe/sandbox-write returns write_blocked when put does not land', async () => {
  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true', GITHUB_TOKEN: 'token' },
    fetchImpl: (async () => jsonResponse(404, {})) as unknown as HandlerOptions['fetchImpl'],
    putFileContentImpl: async () => ({ success: false, error: 'put_failed' }),
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: encodeBase64Utf8('hello\n'),
      }),
    });
    const body = await response.json() as { status: string; pushed: boolean; landed: boolean; reason: string };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'write_blocked');
    assert.equal(body.pushed, false);
    assert.equal(body.landed, false);
    assert.equal(body.reason, 'put_failed');
  });
});

test('GET /probe/sandbox-write returns method_not_allowed', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true', GITHUB_TOKEN: 'token' },
    putFileContentImpl: async () => {
      called = true;
      return { success: true, commitSha: 'commit-sha' };
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`);
    const body = await response.json() as { error: string };

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
    assert.equal(called, false);
  });
});
