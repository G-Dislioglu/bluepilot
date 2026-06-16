import assert from 'node:assert/strict';
import test from 'node:test';

import { runDispatchDryRunSlice } from '../src/dispatchDryRunSlice.js';
import type { DispatchConditionCard } from '../src/cardConditionedDispatch.js';
import type { PreRegisteredClaim } from '../src/preRegisteredClaims.js';
import type { WorkerPacket } from '../src/workerPacketWlpAdapter.js';

const workerPacket: WorkerPacket = {
  taskId: 'WIRE-SLICE-DRYRUN',
  taskName: 'Dispatch Dry Run Slice',
  goal: 'Prove dispatch readiness can be composed without side effects.',
  worker: 'wire-slice-fixture',
  summary: 'Fixture worker packet for the first wiring slice.',
  governanceArtifactPaths: [
    'contracts/WIRE-SLICE-DRYRUN.json',
    'review-packets/WIRE-SLICE-DRYRUN.md',
  ],
  envelope: {
    worker: 'wire-slice-fixture',
    summary: 'Create a dispatch dry-run candidate.',
    edits: [
      {
        path: 'builder/src/dispatchDryRunCandidate.ts',
        mode: 'create',
        content: 'export const dispatchDryRunCandidate = true;\n',
      },
    ],
    claims: [
      {
        text: 'Creates a dispatch dry-run candidate.',
        evidence_refs: [
          { type: 'edit_path', ref: 'builder/src/dispatchDryRunCandidate.ts' },
        ],
      },
      {
        text: 'Keeps dispatch side-effect-free.',
        evidence_refs: [
          { type: 'other', ref: 'review-packets/WIRE-SLICE-DRYRUN.md' },
        ],
      },
    ],
  },
  requiredCommands: [
    'cd builder && npx tsx --test tests/wireSlice001DispatchDryRun.test.ts',
    'npm --prefix builder run typecheck',
  ],
  baselineRef: 'e328ef0',
};

const cards: DispatchConditionCard[] = [
  {
    cardId: 'sol-dev-006',
    title: 'Builder WLP discipline',
    status: 'active',
    policy: 'allow',
    appliesToPaths: ['builder/src/dispatchDryRunCandidate.ts'],
    evidenceRef: 'aicos://sol-dev-006',
  },
];

const claimRegistrations: PreRegisteredClaim[] = [
  {
    claimId: 'claim-1',
    text: 'Creates a dispatch dry-run candidate.',
    evidence: [{ type: 'edit_path', ref: 'builder/src/dispatchDryRunCandidate.ts' }],
  },
  {
    claimId: 'claim-2',
    text: 'Keeps dispatch side-effect-free.',
    evidence: [{ type: 'review_packet', ref: 'review-packets/WIRE-SLICE-DRYRUN.md' }],
  },
];

test('WIRE-SLICE-001 composes worker packet to runtime dry-run readiness', () => {
  const result = runDispatchDryRunSlice({
    workerPacket,
    requestedCardIds: ['sol-dev-006'],
    cards,
    claimRegistrations,
    now: new Date('2026-06-16T12:00:00.000Z'),
    frontendSurface: 'dispatch_preflight',
    runtimeMode: 'dry_run_only',
    requiredRuntimeEvidence: ['test_result'],
  });

  assert.deepEqual(result.invokedSteps, [
    'workerPacketWlpAdapter',
    'cardConditionedDispatch',
    'preRegisteredClaims',
    'dispatchFrontendReadiness',
    'runtimeDispatchIntegrationContract',
  ]);
  assert.equal(result.status, 'dry_run_ready');
  assert.equal(result.contract?.task_id, 'WIRE-SLICE-DRYRUN');
  assert.equal(result.contract?.created, '2026-06-16');
  assert.deepEqual(result.adapterWarnings, []);
  assert.deepEqual(result.adapterErrors, []);
  assert.equal(result.dispatchPlan?.decision, 'allow');
  assert.equal(result.dispatchPlan?.dispatchAllowed, true);
  assert.equal(result.claimGate?.decision, 'allow');
  assert.equal(result.claimGate?.dispatchAllowed, true);
  assert.equal(result.readiness?.stage, 'dispatch_ready');
  assert.equal(result.readiness?.dispatchAllowed, true);
  assert.equal(result.readiness?.surface, 'dispatch_preflight');
  assert.equal(result.runtimeIntegration?.status, 'runtime_candidate');
  assert.equal(result.runtimeIntegration?.dryRunAllowed, true);
  assert.equal(result.runtimeIntegration?.runtimeDispatchAllowed, false);
  assert.deepEqual(result.runtimeIntegration?.boundary, {
    executableRouteAllowed: false,
    providerCallAllowed: false,
    databaseWriteAllowed: false,
    githubWriteAllowed: false,
  });
  assert.deepEqual(result.sideEffects, {
    providerCall: false,
    fileWrite: false,
    routeMount: false,
    databaseCall: false,
    orchestratorCall: false,
  });
});

test('WIRE-SLICE-001 blocks before dispatch when worker packet is invalid', () => {
  const result = runDispatchDryRunSlice({
    workerPacket: { ...workerPacket, goal: '' },
    requestedCardIds: ['sol-dev-006'],
    cards,
    claimRegistrations,
    now: new Date('2026-06-16T12:00:00.000Z'),
  });

  assert.equal(result.status, 'blocked');
  assert.deepEqual(result.invokedSteps, ['workerPacketWlpAdapter']);
  assert.ok(result.adapterErrors.includes('worker_packet.goal_required'));
  assert.equal(result.dispatchPlan, undefined);
  assert.deepEqual(result.sideEffects, {
    providerCall: false,
    fileWrite: false,
    routeMount: false,
    databaseCall: false,
    orchestratorCall: false,
  });
});
