import assert from 'node:assert/strict';

import type { CardConditionedDispatchPlan } from '../src/cardConditionedDispatch.js';
import { evaluatePreRegisteredClaims, type PreRegisteredClaim } from '../src/preRegisteredClaims.js';
import type { WlpContractDraft } from '../src/workerPacketWlpAdapter.js';

const contract: WlpContractDraft = {
  task_id: 'BPK-902',
  task_name: 'Claim Smoke',
  created: '2026-06-13',
  scope: 'bluepilot/claim-smoke',
  mode: 'standard',
  task_type: 'code_task',
  risk_class: 'medium',
  impact_class: 'governance',
  target_persona: null,
  council_session_required: false,
  goal: 'Test pre-registered claims.',
  eligible_context: ['builder/src/example.ts'],
  excluded_context: ['.env*'],
  allowed_files: ['builder/src/example.ts'],
  forbidden_files: ['.env*'],
  scope_out: ['No runtime dispatch.'],
  claims: ['Adds the example helper.', 'Keeps dispatch side-effect-free.'],
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

const allowPlan: CardConditionedDispatchPlan = {
  decision: 'allow',
  dispatchAllowed: true,
  reviewRequired: false,
  reasons: [],
  contractTaskId: 'BPK-902',
  allowedFiles: ['builder/src/example.ts'],
  cards: [],
};

const registrations: PreRegisteredClaim[] = [
  {
    claimId: 'claim-1',
    text: 'Adds the example helper.',
    evidence: [{ type: 'edit_path', ref: 'builder/src/example.ts' }],
  },
  {
    claimId: 'claim-2',
    text: 'Keeps dispatch side-effect-free.',
    evidence: [{ type: 'review_packet', ref: 'review-packets/BPK-902.md' }],
  },
];

function testAllowsFullyRegisteredClaims(): void {
  const result = evaluatePreRegisteredClaims({
    contract,
    dispatchPlan: allowPlan,
    registrations,
  });

  assert.equal(result.decision, 'allow');
  assert.equal(result.dispatchAllowed, true);
  assert.equal(result.reviewRequired, false);
  assert.deepEqual(result.reasons, []);
  assert.deepEqual(result.registeredClaims, [
    { claimId: 'claim-1', text: 'Adds the example helper.', evidenceCount: 1 },
    { claimId: 'claim-2', text: 'Keeps dispatch side-effect-free.', evidenceCount: 1 },
  ]);
}

function testMissingClaimBlocks(): void {
  const result = evaluatePreRegisteredClaims({
    contract,
    dispatchPlan: allowPlan,
    registrations: [registrations[0]],
  });

  assert.equal(result.decision, 'blocked');
  assert.equal(result.dispatchAllowed, false);
  assert.ok(result.reasons.includes('pre_registered_claim.missing_registration:Keeps dispatch side-effect-free.'));
}

function testEvidenceMissingBlocks(): void {
  const result = evaluatePreRegisteredClaims({
    contract,
    dispatchPlan: allowPlan,
    registrations: [
      registrations[0],
      { claimId: 'claim-2', text: 'Keeps dispatch side-effect-free.', evidence: [] },
    ],
  });

  assert.equal(result.decision, 'blocked');
  assert.ok(result.reasons.includes('pre_registered_claim.evidence_required:claim-2'));
}

function testUnexpectedClaimBlocks(): void {
  const result = evaluatePreRegisteredClaims({
    contract,
    dispatchPlan: allowPlan,
    registrations: [
      ...registrations,
      { claimId: 'claim-3', text: 'Invented extra claim.', evidence: [{ type: 'other', ref: 'note' }] },
    ],
  });

  assert.equal(result.decision, 'blocked');
  assert.ok(result.reasons.includes('pre_registered_claim.unexpected_registration:Invented extra claim.'));
}

function testDuplicateClaimIdBlocks(): void {
  const result = evaluatePreRegisteredClaims({
    contract,
    dispatchPlan: allowPlan,
    registrations: [
      registrations[0],
      { ...registrations[1], claimId: 'claim-1' },
    ],
  });

  assert.equal(result.decision, 'blocked');
  assert.ok(result.reasons.includes('pre_registered_claim.duplicate_claim_id:claim-1'));
}

function testReviewPlanCannotBecomeAllow(): void {
  const result = evaluatePreRegisteredClaims({
    contract,
    dispatchPlan: { ...allowPlan, decision: 'review_required', dispatchAllowed: false, reviewRequired: true },
    registrations,
  });

  assert.equal(result.decision, 'review_required');
  assert.equal(result.dispatchAllowed, false);
  assert.equal(result.reviewRequired, true);
  assert.ok(result.reasons.includes('pre_registered_claim.dispatch_plan_review_required'));
}

function testBlockedPlanStaysBlocked(): void {
  const result = evaluatePreRegisteredClaims({
    contract,
    dispatchPlan: { ...allowPlan, decision: 'blocked', dispatchAllowed: false, reasons: ['card_condition.blocked_card:x'] },
    registrations,
  });

  assert.equal(result.decision, 'blocked');
  assert.equal(result.dispatchAllowed, false);
  assert.ok(result.reasons.includes('pre_registered_claim.dispatch_plan_blocked'));
}

testAllowsFullyRegisteredClaims();
testMissingClaimBlocks();
testEvidenceMissingBlocks();
testUnexpectedClaimBlocks();
testDuplicateClaimIdBlocks();
testReviewPlanCannotBecomeAllow();
testBlockedPlanStaysBlocked();

console.log('preRegisteredClaims tests passed');
