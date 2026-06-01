import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import type { BuilderTargetProfile } from '../src/builderTargetProfiles.js';
import { getBuilderTargetProfile } from '../src/builderTargetProfiles.js';
import type { OpusTaskInput, OpusTaskResult } from '../src/opusTaskOrchestrator.js';
import {
  buildSandboxRealWriteInput,
  handleSandboxRealWriteRequest,
  summarizeSandboxRealWriteResult,
} from '../src/sandboxRealWrite.js';

type OrchestratorCall = OpusTaskInput;

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

test('POST /probe/sandbox-real-write returns 403 when endpoint env is off', async () => {
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
    const body = await response.json() as { error: string };

    assert.equal(response.status, 403);
    assert.equal(body.error, 'sandbox_real_write_disabled');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-real-write requires the exact confirmation phrase', async () => {
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
      body: JSON.stringify({ confirm: 'wrong' }),
    });
    const body = await response.json() as { error: string; required: string };

    assert.equal(response.status, 400);
    assert.equal(body.error, 'confirmation_required');
    assert.equal(body.required, 'real-write-to-bluepilot-sandbox');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-real-write rejects caller-controlled fields before orchestration', async () => {
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

    assert.equal(response.status, 400);
    assert.equal(body.error, 'unexpected_field:targetProfileId');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-real-write aborts if the profile no longer points at the sandbox', async () => {
  let called = false;
  const sandbox = getBuilderTargetProfile('bluepilot-sandbox');
  assert.ok(sandbox);
  const wrongProfile: BuilderTargetProfile = {
    ...sandbox,
    repo: 'G-Dislioglu/soulmatch',
  };

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_REAL_WRITE_ENABLED: 'true' },
    profileResolver: () => wrongProfile,
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
    const body = await response.json() as { error: string; detail: string };

    assert.equal(response.status, 500);
    assert.equal(body.error, 'sandbox_repo_guard_failed');
    assert.equal(body.detail, 'sandbox_repo_mismatch');
    assert.equal(called, false);
  });
});

test('POST /probe/sandbox-real-write calls orchestrator with the fixed sandbox input', async () => {
  const calls: OrchestratorCall[] = [];

  await withProbeServer({
    env: { BLUEPILOT_SANDBOX_REAL_WRITE_ENABLED: 'true' },
    now: new Date('2026-06-01T00:00:00.000Z'),
    orchestrator: async (input) => {
      calls.push(input);
      return mockResult({
        status: 'success',
        summary: 'sandbox write succeeded',
        pushAllowed: true,
        requiredExternalApproval: false,
        landed: true,
        verifiedCommit: 'commit-sha',
        pushBlockedReason: undefined,
      });
    },
  }, async (url) => {
    const response = await fetch(`${url}/probe/sandbox-real-write`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ confirm: 'real-write-to-bluepilot-sandbox' }),
    });
    const body = await response.json() as { status: string; repository: string; verifiedCommit: string };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'success');
    assert.equal(body.repository, 'G-Dislioglu/bluepilot-sandbox');
    assert.equal(body.verifiedCommit, 'commit-sha');
  });

  const call = calls[0];
  assert.ok(call);
  assert.equal(call.targetProfileId, 'bluepilot-sandbox');
  assert.equal(call.dryRun, false);
  assert.deepEqual(call.scope, ['.bluepilot/phase-b-real-write.md']);
  assert.equal(call.targetFile, '.bluepilot/phase-b-real-write.md');
  assert.equal(call.skipInlinePostPushChecks, true);
  assert.equal(call.skipDeploy, undefined);
  assert.equal(call.instruction.includes('Do not edit any other file.'), true);
});

test('GET /probe/sandbox-real-write returns method_not_allowed', async () => {
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

    assert.equal(response.status, 405);
    assert.equal(body.error, 'method_not_allowed');
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
