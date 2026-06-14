import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleSandboxWriteRequest } from '../src/sandboxWrite.js';

async function withProbeServer(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleSandboxWriteRequest(request, response);
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

test('POST /probe/sandbox-write is retired with 410 even when old env inputs are present', async () => {
  await withProbeServer(async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        path: '.bluepilot/maya/task.md',
        contentBase64: Buffer.from('hello\n', 'utf8').toString('base64'),
        op: 'write',
      }),
    });
    const body = await response.json() as { error: string; detail: string; futurePath: string };

    assert.equal(response.status, 410);
    assert.equal(body.error, 'sandbox_write_retired');
    assert.equal(body.futurePath, 'smartPush_writePermit');
    assert.match(body.detail, /Permitless sandbox writes are retired/);
  });
});

test('GET /probe/sandbox-write is also retired with 410', async () => {
  await withProbeServer(async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`);
    const body = await response.json() as { error: string };

    assert.equal(response.status, 410);
    assert.equal(body.error, 'sandbox_write_retired');
  });
});

test('retired sandbox write does not parse or echo malformed body content', async () => {
  await withProbeServer(async (url) => {
    const response = await fetch(`${url}/probe/sandbox-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{not-json:token-secret-content}',
    });
    const text = await response.text();

    assert.equal(response.status, 410);
    assert.match(text, /sandbox_write_retired/);
    assert.doesNotMatch(text, /token-secret-content/);
    assert.doesNotMatch(text, /invalid_json|invalid_path|github_token_missing/);
  });
});
