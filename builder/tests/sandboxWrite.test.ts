import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleSandboxWriteRequest } from '../src/sandboxWrite.js';

type HandlerOptions = NonNullable<Parameters<typeof handleSandboxWriteRequest>[2]>;
type SmartPushImpl = NonNullable<HandlerOptions['smartPushImpl']>;
type SmartPushCall = Parameters<SmartPushImpl>;
type SmartPushResult = Awaited<ReturnType<SmartPushImpl>>;

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

function smartPushResult(overrides: Partial<SmartPushResult> = {}): SmartPushResult {
  return {
    pushed: true,
    filesCount: 1,
    modes: {},
    asyncDispatch: false,
    durationMs: 1,
    landed: true,
    commitHash: 'commit-sha',
    ...overrides,
  };
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
    smartPushImpl: async () => {
      called = true;
      return smartPushResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: encodeBase64Utf8('hello\n'),
        permitId: 'permit-1',
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
      smartPushImpl: async () => {
        called = true;
        return smartPushResult();
      },
    }, async (url) => {
      const response = await fetch(`${url}/probe/sandbox-write`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          path,
          contentBase64: encodeBase64Utf8('hello\n'),
          permitId: 'permit-1',
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
    smartPushImpl: async () => {
      called = true;
      return smartPushResult();
    },
  }, async (url) => {
    const emptyContent = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: '',
        permitId: 'permit-1',
      }),
    });
    const unexpected = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: encodeBase64Utf8('hello\n'),
        permitId: 'permit-1',
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

test('POST /probe/sandbox-write requires a valid permitId before GitHub access', async () => {
  const invalidPermitIds = [undefined, '', 'bad permit'];

  for (const permitId of invalidPermitIds) {
    let called = false;

    await withProbeServer({
      env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true', GITHUB_TOKEN: 'token' },
      fetchImpl: (async () => {
        called = true;
        return jsonResponse(404, {});
      }) as unknown as HandlerOptions['fetchImpl'],
      smartPushImpl: async () => {
        called = true;
        return smartPushResult();
      },
    }, async (url) => {
      const body: Record<string, unknown> = {
        path: '.bluepilot/maya/task.md',
        contentBase64: encodeBase64Utf8('hello\n'),
      };
      if (permitId !== undefined) {
        body.permitId = permitId;
      }

      const response = await fetch(`${url}/probe/sandbox-write`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json() as { error: string };

      assert.equal(response.status, 400);
      assert.equal(payload.error, 'permit_id_required');
      assert.equal(called, false);
    });
  }
});

test('POST /probe/sandbox-write reports github_token_missing before writing', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true' },
    smartPushImpl: async () => {
      called = true;
      return smartPushResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: encodeBase64Utf8('hello\n'),
        permitId: 'permit-1',
      }),
    });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 500);
    assert.equal(body.error, 'github_token_missing');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-write routes create and update through smartPush writePermit', async () => {
  const calls: SmartPushCall[] = [];
  let getCount = 0;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true', GITHUB_TOKEN: 'token' },
    now: new Date('2026-06-06T12:00:00.000Z'),
    fetchImpl: (async () => {
      getCount += 1;
      return getCount === 1
        ? jsonResponse(404, {})
        : jsonResponse(200, { sha: 'existing-sha', content: encodeBase64Utf8('old\n'), encoding: 'base64' });
    }) as unknown as HandlerOptions['fetchImpl'],
    smartPushImpl: async (...args) => {
      calls.push(args);
      return smartPushResult({ commitHash: `commit-${calls.length}` });
    },
  }, async (url) => {
    for (const [index, content] of ['first\n', 'second\n'].entries()) {
      const response = await fetch(`${url}/probe/sandbox-write`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          path: '.bluepilot/maya/task.md',
          contentBase64: encodeBase64Utf8(content),
          permitId: `permit-${index + 1}`,
        }),
      });
      const body = await response.json() as {
        status: string;
        pushed: boolean;
        landed: boolean;
        commit: string;
        path: string;
        op: string;
        permitId: string;
        permitOp: string;
        previous: { existed: boolean; sha?: string; contentBase64?: string };
      };

      assert.equal(response.status, 200);
      assert.equal(body.status, 'write_succeeded');
      assert.equal(body.pushed, true);
      assert.equal(body.landed, true);
      assert.equal(body.path, '.bluepilot/maya/task.md');
      assert.equal(body.op, 'write');
      assert.equal(body.commit, `commit-${index + 1}`);

      if (content === 'first\n') {
        assert.equal(body.permitId, 'permit-1');
        assert.equal(body.permitOp, 'create');
        assert.deepEqual(body.previous, { existed: false });
      } else {
        assert.equal(body.permitId, 'permit-2');
        assert.equal(body.permitOp, 'update');
        assert.deepEqual(body.previous, {
          existed: true,
          sha: 'existing-sha',
          contentBase64: encodeBase64Utf8('old\n'),
        });
      }
    }
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0][0], [{
    file: '.bluepilot/maya/task.md',
    mode: 'create',
    content: 'first\n',
  }]);
  assert.equal(calls[0][1], 'Maya sandbox write: .bluepilot/maya/task.md');
  assert.deepEqual(calls[0][2], {
    targetRepo: 'G-Dislioglu/bluepilot-sandbox',
    writePermit: {
      permitId: 'permit-1',
      op: 'create',
      branch: 'main',
      baseSha: '',
    },
  });
  assert.deepEqual(calls[1][0], [{
    file: '.bluepilot/maya/task.md',
    mode: 'overwrite',
    content: 'second\n',
  }]);
  assert.deepEqual(calls[1][2], {
    targetRepo: 'G-Dislioglu/bluepilot-sandbox',
    writePermit: {
      permitId: 'permit-2',
      op: 'update',
      branch: 'main',
      baseSha: 'existing-sha',
    },
  });
});

test('POST /probe/sandbox-write returns write_blocked when smartPush does not land', async () => {
  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true', GITHUB_TOKEN: 'token' },
    fetchImpl: (async () => jsonResponse(404, {})) as unknown as HandlerOptions['fetchImpl'],
    smartPushImpl: async () => smartPushResult({
      pushed: false,
      landed: false,
      commitHash: undefined,
      error: 'maya_builder_corridor_blocked:hash_mismatch',
    }),
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: encodeBase64Utf8('hello\n'),
        permitId: 'permit-1',
      }),
    });
    const body = await response.json() as { status: string; pushed: boolean; landed: boolean; reason: string };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'write_blocked');
    assert.equal(body.pushed, false);
    assert.equal(body.landed, false);
    assert.equal(body.reason, 'maya_builder_corridor_blocked:hash_mismatch');
  });
});

test('POST /probe/sandbox-write blocks delete until a dedicated permit type exists', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true', GITHUB_TOKEN: 'token' },
    fetchImpl: (async () => {
      called = true;
      return jsonResponse(200, {});
    }) as unknown as HandlerOptions['fetchImpl'],
    smartPushImpl: async () => {
      called = true;
      return smartPushResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        op: 'delete',
      }),
    });
    const body = await response.json() as { error: string; reason: string };

    assert.equal(response.status, 403);
    assert.equal(body.error, 'sandbox_delete_requires_dedicated_permit');
    assert.equal(body.reason, 'delete_undo_permit_not_contractualized');
    assert.equal(called, false);
  });
});

test('GET /probe/sandbox-write returns method_not_allowed', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true', GITHUB_TOKEN: 'token' },
    smartPushImpl: async () => {
      called = true;
      return smartPushResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`);
    const body = await response.json() as { error: string };

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
    assert.equal(called, false);
  });
});
