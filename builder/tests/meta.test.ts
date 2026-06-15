import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { createBluepilotMetaPayload, handleMetaRequest, type BluepilotMetaPayload } from '../src/meta.js';

test('bluepilot meta payload exposes BPK completion and read-only surfaces', () => {
  const meta = createBluepilotMetaPayload(new Date('2026-06-15T12:00:00.000Z'), {
    GIT_COMMIT: 'abc123',
    GIT_BRANCH: 'feature/meta',
  });

  assert.equal(meta.service, 'bluepilot-builder');
  assert.equal(meta.bpkPath.completed, 226);
  assert.equal(meta.bpkPath.total, 226);
  assert.equal(meta.bpkPath.knownPathComplete, true);
  assert.equal(meta.git.commit, 'abc123');
  assert.equal(meta.git.branch, 'feature/meta');
  assert.equal(meta.surfaces.capabilityAudit, '/probe/repo-capability-audit');
  assert.equal(meta.sideEffects.metaReadWritesFiles, false);
  assert.equal(meta.sideEffects.metaCallsProviders, false);
  assert.equal(meta.sideEffects.metaExecutesRuntime, false);
});

test('GET /api/meta returns meta payload without touching external systems', async () => {
  const server = createServer((request, response) => {
    void handleMetaRequest(request, response, {
      now: new Date('2026-06-15T12:00:00.000Z'),
      env: {
        RENDER_GIT_COMMIT: 'render-sha',
        RENDER_GIT_BRANCH: 'render-branch',
      },
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/meta`);
    const body = await response.json() as BluepilotMetaPayload;

    assert.equal(response.status, 200);
    assert.equal(body.git.commit, 'render-sha');
    assert.equal(body.git.branch, 'render-branch');
    assert.equal(body.surfaces.health, '/health');
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
});

test('meta route rejects non-GET methods', async () => {
  const server = createServer((request, response) => {
    void handleMetaRequest(request, response);
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://127.0.0.1:${address.port}/api/meta`, { method: 'POST' });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
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
});
