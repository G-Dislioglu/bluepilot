import assert from 'node:assert/strict';

import { planCardConditionedDispatch, type DispatchConditionCard } from '../src/cardConditionedDispatch.js';
import type { WlpContractDraft } from '../src/workerPacketWlpAdapter.js';

const contract: WlpContractDraft = {
  task_id: 'BPK-901',
  task_name: 'Card Dispatch Smoke',
  created: '2026-06-13',
  scope: 'bluepilot/card-dispatch-smoke',
  mode: 'standard',
  task_type: 'code_task',
  risk_class: 'medium',
  impact_class: 'governance',
  target_persona: null,
  council_session_required: false,
  goal: 'Test card-conditioned dispatch.',
  eligible_context: ['builder/src/example.ts'],
  excluded_context: ['.env*'],
  allowed_files: ['builder/src/example.ts', 'builder/tests/example.test.ts'],
  forbidden_files: ['.env*'],
  scope_out: ['No runtime dispatch.'],
  claims: ['Example claim.'],
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

const cards: DispatchConditionCard[] = [
  {
    cardId: 'sol-dev-006',
    title: 'Builder WLP discipline',
    status: 'active',
    policy: 'allow',
    appliesToPaths: ['builder/src/example.ts'],
    evidenceRef: 'aicos://sol-dev-006',
  },
  {
    cardId: 'review-001',
    title: 'Needs operator review',
    status: 'active',
    policy: 'review_required',
    appliesToPaths: ['builder/src/example.ts'],
  },
  {
    cardId: 'blocked-001',
    title: 'Blocked card',
    status: 'blocked',
    policy: 'block',
  },
  {
    cardId: 'old-001',
    title: 'Old card',
    status: 'deprecated',
    policy: 'allow',
  },
  {
    cardId: 'path-001',
    title: 'Other path only',
    status: 'active',
    policy: 'allow',
    appliesToPaths: ['builder/src/other.ts'],
  },
];

function testAllowPlan(): void {
  const plan = planCardConditionedDispatch({
    contract,
    requestedCardIds: ['sol-dev-006'],
    cards,
  });

  assert.equal(plan.decision, 'allow');
  assert.equal(plan.dispatchAllowed, true);
  assert.equal(plan.reviewRequired, false);
  assert.deepEqual(plan.reasons, []);
  assert.equal(plan.contractTaskId, 'BPK-901');
  assert.deepEqual(plan.allowedFiles, ['builder/src/example.ts', 'builder/tests/example.test.ts']);
  assert.deepEqual(plan.cards, [{
    cardId: 'sol-dev-006',
    title: 'Builder WLP discipline',
    status: 'active',
    policy: 'allow',
    evidenceRef: 'aicos://sol-dev-006',
  }]);
}

function testMissingCardBlocks(): void {
  const plan = planCardConditionedDispatch({
    contract,
    requestedCardIds: ['missing-001'],
    cards,
  });

  assert.equal(plan.decision, 'blocked');
  assert.equal(plan.dispatchAllowed, false);
  assert.ok(plan.reasons.includes('card_condition.missing_card:missing-001'));
}

function testBlockedCardBlocks(): void {
  const plan = planCardConditionedDispatch({
    contract,
    requestedCardIds: ['blocked-001'],
    cards,
  });

  assert.equal(plan.decision, 'blocked');
  assert.ok(plan.reasons.includes('card_condition.blocked_card:blocked-001'));
  assert.ok(plan.reasons.includes('card_condition.policy_block:blocked-001'));
}

function testDeprecatedCardBlocks(): void {
  const plan = planCardConditionedDispatch({
    contract,
    requestedCardIds: ['old-001'],
    cards,
  });

  assert.equal(plan.decision, 'blocked');
  assert.ok(plan.reasons.includes('card_condition.deprecated_card:old-001'));
}

function testReviewRequiredDowngrades(): void {
  const plan = planCardConditionedDispatch({
    contract,
    requestedCardIds: ['review-001'],
    cards,
  });

  assert.equal(plan.decision, 'review_required');
  assert.equal(plan.dispatchAllowed, false);
  assert.equal(plan.reviewRequired, true);
  assert.ok(plan.reasons.includes('card_condition.review_required:review-001'));
}

function testPathMismatchBlocks(): void {
  const plan = planCardConditionedDispatch({
    contract,
    requestedCardIds: ['path-001'],
    cards,
  });

  assert.equal(plan.decision, 'blocked');
  assert.ok(plan.reasons.includes('card_condition.path_mismatch:path-001'));
}

function testRequestedCardValidation(): void {
  const plan = planCardConditionedDispatch({
    contract,
    requestedCardIds: ['bad card'],
    cards,
  });

  assert.equal(plan.decision, 'blocked');
  assert.ok(plan.reasons.includes('card_condition.invalid_card_id:bad card'));
}

testAllowPlan();
testMissingCardBlocks();
testBlockedCardBlocks();
testDeprecatedCardBlocks();
testReviewRequiredDowngrades();
testPathMismatchBlocks();
testRequestedCardValidation();

console.log('cardConditionedDispatch tests passed');
