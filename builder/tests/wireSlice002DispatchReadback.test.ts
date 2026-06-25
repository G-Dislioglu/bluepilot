import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleDispatchDryRunReadbackRequest } from '../src/dispatchDryRunReadbackRoute.js';
import type { DispatchConditionCard } from '../src/cardConditionedDispatch.js';
import type { PreRegisteredClaim } from '../src/preRegisteredClaims.js';
import type { WorkerPacket } from '../src/workerPacketWlpAdapter.js';

const workerPacket: WorkerPacket = {
  taskId: 'WIRE-SLICE-002-FIXTURE',
  taskName: 'Dispatch Dry Run Readback Fixture',
  goal: 'Expose the dispatch dry-run chain as a read-only status result.',
  worker: 'wire-slice-002-fixture',
  summary: 'Fixture worker packet for the live readback route.',
  governanceArtifactPaths: [
    'contracts/WIRE-SLICE-002-FIXTURE.json',
    'review-packets/WIRE-SLICE-002-FIXTURE.md',
  ],
  envelope: {
    worker: 'wire-slice-002-fixture',
    summary: 'Create a read-only dispatch dry-run readback.',
    edits: [
      {
        path: 'builder/src/dispatchDryRunReadbackRoute.ts',
        mode: 'create',
        content: 'export const readback = true;\n',
      },
    ],
    claims: [
      {
        text: 'Exposes a read-only dispatch dry-run readback.',
        evidence_refs: [
          { type: 'edit_path', ref: 'builder/src/dispatchDryRunReadbackRoute.ts' },
        ],
      },
      {
        text: 'Keeps provider, write, route execution, database and orchestrator side effects closed.',
        evidence_refs: [
          { type: 'explicit_path', ref: 'review-packets/WIRE-SLICE-002-FIXTURE.md' },
        ],
      },
    ],
  },
  requiredCommands: [
    'cd builder && npx tsx --test tests/wireSlice002DispatchReadback.test.ts',
    'npm --prefix builder run typecheck',
  ],
  baselineRef: '5a2052d',
};

const cards: DispatchConditionCard[] = [
  {
    cardId: 'sol-dev-006',
    title: 'Builder WLP discipline',
    status: 'active',
    policy: 'allow',
    appliesToPaths: ['builder/src/dispatchDryRunReadbackRoute.ts'],
    evidenceRef: 'aicos://sol-dev-006',
  },
];

const claimRegistrations: PreRegisteredClaim[] = [
  {
    claimId: 'claim-readback',
    text: 'Exposes a read-only dispatch dry-run readback.',
    evidence: [{ type: 'edit_path', ref: 'builder/src/dispatchDryRunReadbackRoute.ts' }],
  },
  {
    claimId: 'claim-side-effects',
    text: 'Keeps provider, write, route execution, database and orchestrator side effects closed.',
    evidence: [{ type: 'other', ref: 'review-packets/WIRE-SLICE-002-FIXTURE.md' }],
  },
];

async function withDispatchReadbackRoute(
  enabled: boolean,
  run: (url: string) => Promise<void>,
): Promise<void> {
  const server = createServer((request, response) => {
    void (async () => {
      if (await handleDispatchDryRunReadbackRequest(request, response, { enabled })) {
        return;
      }
      response.statusCode = 404;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.end(`${JSON.stringify({ error: 'not_found' })}\n`);
    })();
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

function routeBody(): unknown {
  return {
    workerPacket,
    requestedCardIds: ['sol-dev-006'],
    cards,
    claimRegistrations,
    now: '2026-06-17T10:00:00.000Z',
    frontendSurface: 'dispatch_preflight',
    runtimeMode: 'dry_run_only',
    requiredRuntimeEvidence: ['test_result'],
  };
}

test('POST /probe/dispatch-dry-run-readback is not mounted when the flag is off', async () => {
  await withDispatchReadbackRoute(false, async (url) => {
    const response = await fetch(`${url}/probe/dispatch-dry-run-readback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(routeBody()),
    });
    const body = await response.json() as { error: string };

    assert.equal(response.status, 404);
    assert.equal(body.error, 'not_found');
  });
});

test('POST /probe/dispatch-dry-run-readback returns visible dry-run status when enabled', async () => {
  await withDispatchReadbackRoute(true, async (url) => {
    const response = await fetch(`${url}/probe/dispatch-dry-run-readback`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(routeBody()),
    });
    const body = await response.json() as {
      ok: boolean;
      code: string;
      result: {
        status: string;
        readiness: { stage: string };
        dispatchPlan: { decision: string };
        claimGate: { decision: string };
        invokedSteps: string[];
        sideEffects: {
          providerCall: boolean;
          fileWrite: boolean;
          routeMount: boolean;
          databaseCall: boolean;
          orchestratorCall: boolean;
        };
      };
    };

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.code, 'dispatch_dry_run_readback_ready');
    assert.equal(body.result.status, 'dry_run_ready');
    assert.equal(body.result.readiness.stage, 'dispatch_ready');
    assert.equal(body.result.dispatchPlan.decision, 'allow');
    assert.equal(body.result.claimGate.decision, 'allow');
    assert.deepEqual(body.result.invokedSteps, [
      'workerPacketWlpAdapter',
      'cardConditionedDispatch',
      'preRegisteredClaims',
      'dispatchFrontendReadiness',
      'runtimeDispatchIntegrationContract',
    ]);
    assert.deepEqual(body.result.sideEffects, {
      providerCall: false,
      fileWrite: false,
      routeMount: false,
      databaseCall: false,
      orchestratorCall: false,
    });
  });
});
