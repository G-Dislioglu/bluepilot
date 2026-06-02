import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleSandboxPermitWriteRequest } from '../src/sandboxPermitWrite.js';

type HandlerOptions = NonNullable<Parameters<typeof handleSandboxPermitWriteRequest>[2]>;
type SmartPushImpl = NonNullable<HandlerOptions['smartPushImpl']>;
type SmartPushCall = Parameters<SmartPushImpl>;

function mockPushResult(overrides: Partial<Awaited<ReturnType<SmartPushImpl>>> = {}): Awaited<ReturnType<SmartPushImpl>> {
  return {
    pushed: false,
    filesCount: 1,
    modes: { '.bluepilot/phase-3c-permit-write.md': 'create' },
    asyncDispatch: false,
    durationMs: 1,
    landed: false,
    ...overrides,
  };
}

function encodeBase64Utf8(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

async function withProbeServer(
  options: HandlerOptions,
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    void handleSandboxPermitWriteRequest(request, response, options);
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

test('POST /probe/sandbox-permit-write returns 403 when endpoint env is off', async () => {
  let called = false;

  await withProbeServer({
    env: {},
    smartPushImpl: async () => {
      called = true;
      return mockPushResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-permit-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: 'permit-write-to-bluepilot-sandbox',
        permitId: 'permit-1',
        contentBase64: encodeBase64Utf8('hello\n'),
      }),
    });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 403);
    assert.equal(body.error, 'sandbox_permit_write_disabled');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-permit-write requires the exact confirmation phrase', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true' },
    smartPushImpl: async () => {
      called = true;
      return mockPushResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-permit-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: 'wrong',
        permitId: 'permit-1',
        contentBase64: encodeBase64Utf8('hello\n'),
      }),
    });
    const body = await response.json() as { error: string; required: string };

    assert.equal(response.status, 400);
    assert.equal(body.error, 'confirmation_required');
    assert.equal(body.required, 'permit-write-to-bluepilot-sandbox');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-permit-write rejects caller-controlled fields before smartPush', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true' },
    smartPushImpl: async () => {
      called = true;
      return mockPushResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-permit-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: 'permit-write-to-bluepilot-sandbox',
        permitId: 'permit-1',
        contentBase64: encodeBase64Utf8('hello\n'),
        targetRepo: 'G-Dislioglu/soulmatch',
      }),
    });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 400);
    assert.equal(body.error, 'unexpected_field:targetRepo');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-permit-write validates permit and base64 content', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true' },
    smartPushImpl: async () => {
      called = true;
      return mockPushResult();
    },
  }, async (url) => {
    const missingPermit = await fetch(`${url}/probe/sandbox-permit-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: 'permit-write-to-bluepilot-sandbox',
        contentBase64: encodeBase64Utf8('hello\n'),
      }),
    });
    const badBase64 = await fetch(`${url}/probe/sandbox-permit-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: 'permit-write-to-bluepilot-sandbox',
        permitId: 'permit-1',
        contentBase64: 'not base64',
      }),
    });

    assert.equal(missingPermit.status, 400);
    assert.equal((await missingPermit.json() as { error: string }).error, 'permit_id_required');
    assert.equal(badBase64.status, 400);
    assert.equal((await badBase64.json() as { error: string }).error, 'invalid_content_base64');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-permit-write calls smartPush with fixed sandbox target and writePermit', async () => {
  const calls: SmartPushCall[] = [];
  const content = 'BP-146 permit write\nMAYA_CORE_GATE_TOKEN=do-not-leak\n';

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true' },
    now: new Date('2026-06-02T12:00:00.000Z'),
    smartPushImpl: async (...args) => {
      calls.push(args);
      return mockPushResult({
        pushed: true,
        landed: true,
        commitHash: 'commit-sha',
      });
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-permit-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: 'permit-write-to-bluepilot-sandbox',
        permitId: 'permit-123',
        contentBase64: encodeBase64Utf8(content),
      }),
    });
    const raw = await response.text();
    const body = JSON.parse(raw) as {
      status: string;
      repository: string;
      branch: string;
      targetFile: string;
      permitId: string;
      contentLen: number;
      commitHash: string;
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'write_succeeded');
    assert.equal(body.repository, 'G-Dislioglu/bluepilot-sandbox');
    assert.equal(body.branch, 'main');
    assert.equal(body.targetFile, '.bluepilot/phase-3c-permit-write.md');
    assert.equal(body.permitId, 'permit-123');
    assert.equal(body.contentLen, Buffer.byteLength(content, 'utf8'));
    assert.equal(body.commitHash, 'commit-sha');
    assert.equal(raw.includes(content), false);
    assert.equal(raw.includes('do-not-leak'), false);
    assert.equal(raw.includes(encodeBase64Utf8(content)), false);
  });

  const [files, message, options] = calls[0];
  assert.deepEqual(files, [
    {
      file: '.bluepilot/phase-3c-permit-write.md',
      mode: 'create',
      content,
    },
  ]);
  assert.equal(message, 'BP-146 permit-gated sandbox write');
  assert.deepEqual(options, {
    targetRepo: 'G-Dislioglu/bluepilot-sandbox',
    writePermit: {
      permitId: 'permit-123',
      op: 'create',
      branch: 'main',
      baseSha: '',
    },
  });
});

test('GET /probe/sandbox-permit-write returns method_not_allowed', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_PERMIT_WRITE_ENABLED: 'true' },
    smartPushImpl: async () => {
      called = true;
      return mockPushResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-permit-write`);
    const body = await response.json() as { error: string };

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
    assert.equal(called, false);
  });
});
