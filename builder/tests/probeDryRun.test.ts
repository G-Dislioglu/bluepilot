import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleProbeDryRunRequest, type DryRunProbePayload } from '../src/probeDryRun.js';
import type { OpusTaskInput, OpusTaskResult } from '../src/opusTaskOrchestrator.js';

function dryRunResult(overrides: Partial<OpusTaskResult> = {}): OpusTaskResult {
  return {
    status: 'dry_run',
    runId: 'run-test-1234',
    phases: [
      { phase: 'target-profile', status: 'ok', durationMs: 0 },
      {
        phase: 'scope',
        status: 'ok',
        durationMs: 1,
        detail: {
          files: ['README.md', 'builder/src/server.ts'],
        },
      },
      { phase: 'workflow-simulation', status: 'ok', durationMs: 1 },
    ],
    totalDurationMs: 10,
    summary: 'Dry run: 2 file(s) ready.',
    decision: 'approve',
    pushAllowed: false,
    requiredExternalApproval: true,
    pushBlockedReason: 'dryRun=true keeps autonomous push disabled.',
    ...overrides,
  };
}

async function withProbeServer(
  orchestrator: (input: OpusTaskInput) => Promise<OpusTaskResult>,
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    void handleProbeDryRunRequest(request, response, {
      orchestrator,
      now: new Date('2026-06-01T00:00:00.000Z'),
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

test('POST /probe/dry-run returns summarized dry-run result', async () => {
  await withProbeServer(
    async () => dryRunResult(),
    async (url) => {
      const response = await fetch(`${url}/probe/dry-run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ instruction: 'add a one-line README comment' }),
      });
      const body = (await response.json()) as DryRunProbePayload;

      assert.equal(response.status, 200);
      assert.equal(body.service, 'bluepilot-builder');
      assert.equal(body.status, 'dry_run');
      assert.equal(body.runId, 'run-test-1234');
      assert.deepEqual(body.scopeFiles, ['README.md', 'builder/src/server.ts']);
      assert.equal(body.safety.source, 'builder_safety_policy');
      assert.equal(body.safety.pushAllowed, false);
      assert.equal(body.safety.requiredExternalApproval, true);
      assert.equal(body.safety.reason, 'dryRun=true keeps autonomous push disabled.');
      assert.deepEqual(body.phases.map((phase) => phase.phase), ['target-profile', 'scope', 'workflow-simulation']);
    },
  );
});

test('POST /probe/dry-run rejects missing instruction before calling orchestrator', async () => {
  let called = false;

  await withProbeServer(
    async () => {
      called = true;
      return dryRunResult();
    },
    async (url) => {
      const response = await fetch(`${url}/probe/dry-run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body = await response.json() as { error: string };

      assert.equal(response.status, 400);
      assert.equal(body.error, 'instruction_required');
      assert.equal(called, false);
    },
  );
});

test('POST /probe/dry-run forces dryRun and skipDeploy server-side', async () => {
  let capturedInput: OpusTaskInput | null = null;

  await withProbeServer(
    async (input) => {
      capturedInput = input;
      return dryRunResult();
    },
    async (url) => {
      const response = await fetch(`${url}/probe/dry-run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          instruction: 'attempt a dry run',
          dryRun: false,
          skipDeploy: false,
          approvedByOperator: true,
        }),
      });

      assert.equal(response.status, 200);
      assert.ok(capturedInput);
      assert.equal(capturedInput.instruction, 'attempt a dry run');
      assert.equal(capturedInput.dryRun, true);
      assert.equal(capturedInput.skipDeploy, true);
      assert.equal('approvedByOperator' in capturedInput, false);
    },
  );
});

test('GET /probe/dry-run returns method_not_allowed', async () => {
  let called = false;

  await withProbeServer(
    async () => {
      called = true;
      return dryRunResult();
    },
    async (url) => {
      const response = await fetch(`${url}/probe/dry-run`);
      const body = await response.json() as { error: string };

      assert.equal(response.status, 405);
      assert.equal(body.error, 'method_not_allowed');
      assert.equal(called, false);
    },
  );
});
