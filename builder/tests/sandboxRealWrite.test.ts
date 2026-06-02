import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { getBuilderTargetProfile } from '../src/builderTargetProfiles.js';
import type { OpusTaskResult } from '../src/opusTaskOrchestrator.js';
import {
  buildSandboxRealWriteInput,
  handleSandboxRealWriteRequest,
  summarizeSandboxRealWriteResult,
} from '../src/sandboxRealWrite.js';

function mockResult(overrides: Partial<OpusTaskResult> = {}): OpusTaskResult {
  return {
    status: 'partial',
    runId: 'run-test',
    phases: [
      { phase: 'scope', status: 'ok', durationMs: 1 },
      { phase: 'push', status: 'error', durationMs: 1 },
    ],
    totalDurationMs: 2,
    summary: 'Push requires proof or operator approval: kill_switch_closed',
    pushAllowed: false,
    requiredExternalApproval: true,
    pushBlockedReason: 'kill_switch_closed',
    ...overrides,
  };
}

async function withProbeServer(
  options: Parameters<typeof handleSandboxRealWriteRequest>[2],
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    void handleSandboxRealWriteRequest(request, response, options);
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

test('bluepilot-sandbox target profile is the only real-write sandbox target', () => {
  const sandbox = getBuilderTargetProfile('bluepilot-sandbox');
  const soulmatch = getBuilderTargetProfile('soulmatch');
  const fallback = getBuilderTargetProfile(null);

  assert.ok(sandbox);
  assert.equal(sandbox.repo, 'G-Dislioglu/bluepilot-sandbox');
  assert.equal(sandbox.branch, 'main');
  assert.equal(sandbox.scopePolicy, 'explicit_scope_only');
  assert.equal(sandbox.writePolicy, 'sandbox_real_write');
  assert.equal(sandbox.pushAllowed, true);

  assert.ok(soulmatch);
  assert.equal(soulmatch.repo, 'G-Dislioglu/soulmatch');
  assert.equal(soulmatch.writePolicy, 'soulmatch_guarded_push');
  assert.equal(soulmatch.pushAllowed, true);
  assert.equal(fallback?.id, 'soulmatch');
});

test('sandbox real-write input is fixed to sandbox, one file, real mode, and push enabled', () => {
  const input = buildSandboxRealWriteInput(new Date('2026-06-01T00:00:00.000Z'));

  assert.equal(input.targetProfileId, 'bluepilot-sandbox');
  assert.equal(input.dryRun, false);
  assert.deepEqual(input.scope, ['.bluepilot/phase-b-real-write.md']);
  assert.equal(input.targetFile, '.bluepilot/phase-b-real-write.md');
  assert.equal(input.skipInlinePostPushChecks, true);
  assert.equal(input.skipDeploy, undefined);
  assert.equal(input.instruction.includes('.bluepilot/phase-b-real-write.md'), true);
  assert.equal(input.instruction.includes('2026-06-01T00:00:00.000Z'), true);
});

test('POST /probe/sandbox-real-write is retired even when the old endpoint env is off', async () => {
  let called = false;

  await withProbeServer({
    env: {},
    orchestrator: async () => {
      called = true;
      return mockResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-real-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'real-write-to-bluepilot-sandbox' }),
    });
    const body = await response.json() as { error: string; replacement: string };

    assert.equal(response.status, 410);
    assert.equal(body.error, 'sandbox_real_write_retired');
    assert.equal(body.replacement, '/probe/sandbox-permit-write');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-real-write is retired even when the old endpoint env is on', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_REAL_WRITE_ENABLED: 'true' },
    orchestrator: async () => {
      called = true;
      return mockResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-real-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'real-write-to-bluepilot-sandbox' }),
    });
    const body = await response.json() as { error: string; replacement: string };

    assert.equal(response.status, 410);
    assert.equal(body.error, 'sandbox_real_write_retired');
    assert.equal(body.replacement, '/probe/sandbox-permit-write');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-real-write ignores caller-controlled fields because the path is retired', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_REAL_WRITE_ENABLED: 'true' },
    orchestrator: async () => {
      called = true;
      return mockResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-real-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: 'real-write-to-bluepilot-sandbox',
        targetProfileId: 'soulmatch',
      }),
    });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 410);
    assert.equal(body.error, 'sandbox_real_write_retired');
    assert.equal(called, false);
  });
});

test('GET /probe/sandbox-real-write is also retired', async () => {
  let called = false;

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_REAL_WRITE_ENABLED: 'true' },
    orchestrator: async () => {
      called = true;
      return mockResult();
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-real-write`);
    const body = await response.json() as { error: string };

    assert.equal(response.status, 410);
    assert.equal(body.error, 'sandbox_real_write_retired');
    assert.equal(called, false);
  });
});

test('sandbox real-write summary does not serialize token-like input', () => {
  const payload = summarizeSandboxRealWriteResult(mockResult({
    summary: 'blocked by corridor',
  }), new Date('2026-06-01T00:00:00.000Z'));

  assert.equal(JSON.stringify(payload).includes('test-secret-token'), false);
  assert.equal(payload.targetProfileId, 'bluepilot-sandbox');
  assert.equal(payload.targetFile, '.bluepilot/phase-b-real-write.md');
}
);
