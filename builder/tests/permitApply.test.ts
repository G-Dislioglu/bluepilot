import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handlePermitApplyRequest, type PermitApplyPayload } from '../src/permitApply.js';
import { LOCAL_EMERGENCY_STOP_ENV } from '../src/localSafetyGuard.js';
import type { smartPush } from '../src/opusSmartPush.js';

type SmartPushCall = {
  files: unknown[];
  message: string;
  options: Record<string, unknown>;
};
type SmartPushImpl = typeof smartPush;

const validBody = {
  permitId: 'permit-apply-1',
  repo: 'G-Dislioglu/bluepilot-sandbox',
  branch: 'feature/permit-apply',
  path: '.bluepilot/permit-apply.md',
  content: 'permit-bound apply\n',
  baseSha: '',
  op: 'create',
};

async function withPermitApplyServer(
  smartPushImpl: SmartPushImpl,
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    void handlePermitApplyRequest(request, response, {
      smartPushImpl,
      now: new Date('2026-06-14T00:00:00.000Z'),
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

test('POST /probe/permit-apply applies one whole-file edit through smartPush writePermit', async () => {
  let captured: SmartPushCall | undefined;

  await withPermitApplyServer(
    (async (...args: Parameters<SmartPushImpl>) => {
      const [files, message, options] = args;
      captured = { files, message, options: options as Record<string, unknown> };
      return {
        pushed: true,
        filesCount: 1,
        modes: { '.bluepilot/permit-apply.md': 'create' },
        asyncDispatch: false,
        durationMs: 1,
        commitHash: 'permit-commit',
        landed: true,
      };
    }) as never,
    async (url) => {
      const response = await fetch(`${url}/probe/permit-apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      });
      const body = await response.json() as PermitApplyPayload;

      assert.equal(response.status, 200);
      assert.equal(body.status, 'applied');
      assert.equal(body.permitId, 'permit-apply-1');
      assert.equal(body.result.commitHash, 'permit-commit');
      assert.equal(body.safety.source, 'builder_safety_policy');
      assert.equal(body.safety.pushAllowed, true);
      assert.deepEqual(captured?.files, [{
        file: '.bluepilot/permit-apply.md',
        mode: 'create',
        content: 'permit-bound apply\n',
      }]);
      assert.equal(captured?.message, 'permit apply: .bluepilot/permit-apply.md');
      assert.equal(captured?.options.targetRepo, 'G-Dislioglu/bluepilot-sandbox');
      assert.deepEqual(captured?.options.writePermit, {
        permitId: 'permit-apply-1',
        op: 'create',
        branch: 'feature/permit-apply',
        baseSha: '',
      });
    },
  );
});

test('POST /probe/permit-apply blocks main and master before smartPush', async () => {
  for (const branch of ['main', 'master']) {
    let called = false;

    await withPermitApplyServer(
      (async () => {
        called = true;
        throw new Error('must not be called');
      }) as never,
      async (url) => {
        const response = await fetch(`${url}/probe/permit-apply`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...validBody, branch }),
        });
        const body = await response.json() as {
          error: string;
          reason: string;
          safety: PermitApplyPayload['safety'];
        };

        assert.equal(response.status, 403);
        assert.equal(body.error, 'builder_safety_policy_blocked');
        assert.match(body.reason, new RegExp(`Protected branch.*${branch}`));
        assert.equal(body.safety.pushAllowed, false);
        assert.equal(called, false);
      },
    );
  }
});

test('POST /probe/permit-apply obeys local emergency stop before smartPush', async () => {
  const previous = process.env[LOCAL_EMERGENCY_STOP_ENV];
  process.env[LOCAL_EMERGENCY_STOP_ENV] = 'true';
  let called = false;

  try {
    await withPermitApplyServer(
      (async () => {
        called = true;
        throw new Error('must not be called');
      }) as never,
      async (url) => {
        const response = await fetch(`${url}/probe/permit-apply`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(validBody),
        });
        const body = await response.json() as {
          error: string;
          reason: string;
          safety: PermitApplyPayload['safety'];
        };

        assert.equal(response.status, 403);
        assert.equal(body.error, 'builder_safety_policy_blocked');
        assert.match(body.reason, /local_emergency_stop/);
        assert.equal(body.safety.pushAllowed, false);
        assert.equal(called, false);
      },
    );
  } finally {
    if (previous === undefined) {
      delete process.env[LOCAL_EMERGENCY_STOP_ENV];
    } else {
      process.env[LOCAL_EMERGENCY_STOP_ENV] = previous;
    }
  }
});

test('POST /probe/permit-apply surfaces hash_mismatch without writing in the endpoint', async () => {
  let called = false;

  await withPermitApplyServer(
    (async () => {
      called = true;
      return {
        pushed: false,
        filesCount: 1,
        modes: { '.bluepilot/permit-apply.md': 'create' },
        asyncDispatch: false,
        durationMs: 1,
        landed: false,
        error: 'maya_builder_corridor_blocked:hash_mismatch',
      };
    }) as never,
    async (url) => {
      const response = await fetch(`${url}/probe/permit-apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, content: 'different bytes\n' }),
      });
      const body = await response.json() as PermitApplyPayload;

      assert.equal(response.status, 409);
      assert.equal(called, true);
      assert.equal(body.status, 'blocked');
      assert.match(body.result.error ?? '', /hash_mismatch/);
    },
  );
});

test('POST /probe/permit-apply rejects missing permit material before smartPush', async () => {
  let called = false;

  await withPermitApplyServer(
    (async () => {
      called = true;
      throw new Error('must not be called');
    }) as never,
    async (url) => {
      const response = await fetch(`${url}/probe/permit-apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, permitId: '' }),
      });
      const body = await response.json() as { error: string };

      assert.equal(response.status, 400);
      assert.equal(body.error, 'write_permit_required');
      assert.equal(called, false);
    },
  );
});

test('POST /probe/permit-apply fails closed when maya gate is unavailable', async () => {
  await withPermitApplyServer(
    (async () => ({
      pushed: false,
      filesCount: 1,
      modes: { '.bluepilot/permit-apply.md': 'create' },
      asyncDispatch: false,
      durationMs: 1,
      landed: false,
      error: 'maya_builder_corridor_blocked:gate_unavailable',
    })) as never,
    async (url) => {
      const response = await fetch(`${url}/probe/permit-apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(validBody),
      });
      const body = await response.json() as PermitApplyPayload;

      assert.equal(response.status, 409);
      assert.equal(body.status, 'blocked');
      assert.match(body.result.error ?? '', /gate_unavailable/);
    },
  );
});

test('POST /probe/permit-apply rejects default target and unsafe paths before smartPush', async () => {
  let called = false;

  await withPermitApplyServer(
    (async () => {
      called = true;
      throw new Error('must not be called');
    }) as never,
    async (url) => {
      const defaultTarget = await fetch(`${url}/probe/permit-apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, repo: 'G-Dislioglu/soulmatch' }),
      });
      const unsafePath = await fetch(`${url}/probe/permit-apply`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...validBody, path: '../escape.md' }),
      });

      assert.equal(defaultTarget.status, 400);
      assert.equal((await defaultTarget.json() as { error: string }).error, 'default_target_repo_forbidden');
      assert.equal(unsafePath.status, 400);
      assert.equal((await unsafePath.json() as { error: string }).error, 'invalid_target_path');
      assert.equal(called, false);
    },
  );
});

test('GET /probe/permit-apply returns method_not_allowed', async () => {
  let called = false;

  await withPermitApplyServer(
    (async () => {
      called = true;
      throw new Error('must not be called');
    }) as never,
    async (url) => {
      const response = await fetch(`${url}/probe/permit-apply`);
      const body = await response.json() as { error: string };

      assert.equal(response.status, 405);
      assert.equal(body.error, 'method_not_allowed');
      assert.equal(called, false);
    },
  );
});
