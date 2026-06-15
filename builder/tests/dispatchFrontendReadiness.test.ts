import assert from 'node:assert/strict';

import type { CardConditionedDispatchPlan } from '../src/cardConditionedDispatch.js';
import { projectDispatchFrontendReadiness } from '../src/dispatchFrontendReadiness.js';
import type { PreRegisteredClaimsGateResult } from '../src/preRegisteredClaims.js';
import type { WlpContractDraft } from '../src/workerPacketWlpAdapter.js';

const contract: WlpContractDraft = {
  task_id: 'BPK-903',
  task_name: 'Readiness Smoke',
  created: '2026-06-13',
  scope: 'bluepilot/readiness-smoke',
  mode: 'standard',
  task_type: 'code_task',
  risk_class: 'medium',
  impact_class: 'governance',
  target_persona: null,
  council_session_required: false,
  goal: 'Test dispatch/frontend readiness.',
  eligible_context: ['builder/src/example.ts'],
  excluded_context: ['.env*'],
  allowed_files: ['builder/src/example.ts', 'builder/tests/example.test.ts'],
  forbidden_files: ['.env*'],
  scope_out: ['No runtime dispatch.'],
  claims: ['Adds readiness projection.'],
  assumptions: ['Example assumption.'],
  dod: ['Example DoD.'],
  evidence_required: ['test_result'],
  required_commands: ['npm test'],
  stop_conditions: ['Runtime dispatch required.'],
  prior_task_findings: 'None.',
  reuse_target: ['session_log', 'review_packet', 'next_task_pre_lock'],
  worker_packet: {
    worker: 'deepseek',
    summary: 'Example.',
    edit_paths: ['builder/src/example.ts'],
    task_class: 'class_1',
  },
};

const dispatchPlan: CardConditionedDispatchPlan = {
  decision: 'allow',
  dispatchAllowed: true,
  reviewRequired: false,
  reasons: [],
  contractTaskId: 'BPK-903',
  allowedFiles: ['builder/src/example.ts', 'builder/tests/example.test.ts'],
  cards: [{
    cardId: 'sol-dev-006',
    title: 'Builder WLP discipline',
    status: 'active',
    policy: 'allow',
    evidenceRef: 'aicos://sol-dev-006',
  }],
};

const claimGate: PreRegisteredClaimsGateResult = {
  decision: 'allow',
  dispatchAllowed: true,
  reviewRequired: false,
  reasons: [],
  registeredClaims: [{
    claimId: 'claim-1',
    text: 'Adds readiness projection.',
    evidenceCount: 1,
  }],
};

function testReadyProjection(): void {
  const projection = projectDispatchFrontendReadiness({ contract, dispatchPlan, claimGate });

  assert.equal(projection.stage, 'dispatch_ready');
  assert.equal(projection.dispatchAllowed, true);
  assert.equal(projection.frontendProjectionAllowed, true);
  assert.equal(projection.reviewRequired, false);
  assert.deepEqual(projection.reasons, []);
  assert.equal(projection.surface, 'operator_cockpit');
  assert.deepEqual(projection.gates, {
    cardConditionedDispatch: 'allow',
    preRegisteredClaims: 'allow',
    contractEvidence: 'ready',
  });
  assert.deepEqual(projection.summary, {
    allowedFileCount: 2,
    cardCount: 1,
    claimCount: 1,
    evidenceRequirements: ['test_result'],
  });
  assert.equal(projection.frontendSections.at(-1)?.status, 'ready');
}

function testReviewProjectionDoesNotAllowDispatch(): void {
  const projection = projectDispatchFrontendReadiness({
    contract,
    dispatchPlan: {
      ...dispatchPlan,
      decision: 'review_required',
      dispatchAllowed: false,
      reviewRequired: true,
      reasons: ['card_condition.review_required:review-001'],
    },
    claimGate: {
      ...claimGate,
      decision: 'review_required',
      dispatchAllowed: false,
      reviewRequired: true,
      reasons: ['pre_registered_claim.dispatch_plan_review_required'],
    },
    surface: 'review_packet',
  });

  assert.equal(projection.stage, 'frontend_review');
  assert.equal(projection.dispatchAllowed, false);
  assert.equal(projection.frontendProjectionAllowed, true);
  assert.equal(projection.reviewRequired, true);
  assert.equal(projection.surface, 'review_packet');
  assert.ok(projection.reasons.includes('card_condition.review_required:review-001'));
  assert.equal(projection.frontendSections.at(-1)?.status, 'review');
}

function testBlockedProjection(): void {
  const projection = projectDispatchFrontendReadiness({
    contract,
    dispatchPlan: {
      ...dispatchPlan,
      decision: 'blocked',
      dispatchAllowed: false,
      reasons: ['card_condition.blocked_card:block-001'],
    },
    claimGate: {
      ...claimGate,
      decision: 'blocked',
      dispatchAllowed: false,
      reasons: ['pre_registered_claim.dispatch_plan_blocked'],
    },
  });

  assert.equal(projection.stage, 'blocked');
  assert.equal(projection.dispatchAllowed, false);
  assert.equal(projection.reviewRequired, false);
  assert.ok(projection.reasons.includes('card_condition.blocked_card:block-001'));
  assert.ok(projection.reasons.includes('pre_registered_claim.dispatch_plan_blocked'));
  assert.equal(projection.frontendSections.at(-1)?.status, 'blocked');
}

function testEvidenceMissingBlocksDispatchOnly(): void {
  const projection = projectDispatchFrontendReadiness({
    contract: { ...contract, evidence_required: [] },
    dispatchPlan,
    claimGate,
  });

  assert.equal(projection.stage, 'blocked');
  assert.equal(projection.dispatchAllowed, false);
  assert.equal(projection.frontendProjectionAllowed, true);
  assert.ok(projection.reasons.includes('dispatch_frontend.evidence_required_empty'));
  assert.equal(projection.gates.contractEvidence, 'blocked');
}

function testTaskMismatchBlocks(): void {
  const projection = projectDispatchFrontendReadiness({
    contract,
    dispatchPlan: { ...dispatchPlan, contractTaskId: 'BPK-OTHER' },
    claimGate,
  });

  assert.equal(projection.stage, 'blocked');
  assert.equal(projection.dispatchAllowed, false);
  assert.ok(projection.reasons.includes('dispatch_frontend.contract_task_mismatch:BPK-OTHER->BPK-903'));
  assert.equal(projection.gates.contractEvidence, 'blocked');
}

function testProjectionDoesNotMutateInputs(): void {
  const before = JSON.stringify({ contract, dispatchPlan, claimGate });
  projectDispatchFrontendReadiness({ contract, dispatchPlan, claimGate });
  assert.equal(JSON.stringify({ contract, dispatchPlan, claimGate }), before);
}

testReadyProjection();
testReviewProjectionDoesNotAllowDispatch();
testBlockedProjection();
testEvidenceMissingBlocksDispatchOnly();
testTaskMismatchBlocks();
testProjectionDoesNotMutateInputs();

console.log('dispatchFrontendReadiness tests passed');
