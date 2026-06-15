import assert from 'node:assert/strict';

import {
  normalizeManualPrReviewReceipts,
  type BpkManualPrReviewReceipt,
} from '../src/bpkPrReviewManualReceipts.js';

const receipt: BpkManualPrReviewReceipt = {
  taskId: 'BPK-012',
  prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/12',
  headCommit: 'f1b6de5',
  reviewDecision: 'approved',
  checks: [{ name: 'verify', status: 'pass' }],
};

function testAcceptsValidReceipt(): void {
  const result = normalizeManualPrReviewReceipts([receipt]);

  assert.deepEqual(result.summary, { acceptedCount: 1, quarantinedCount: 0, duplicateCount: 0 });
  assert.deepEqual(result.acceptedReviews, [{
    taskId: 'BPK-012',
    prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/12',
    headCommit: 'f1b6de5',
    reviewDecision: 'approved',
    checks: [{ name: 'verify', status: 'pass' }],
  }]);
}

function testInvalidPrUrlQuarantines(): void {
  const result = normalizeManualPrReviewReceipts([{ ...receipt, prUrl: 'not-a-pr' }]);

  assert.equal(result.acceptedReviews.length, 0);
  assert.ok(result.quarantined[0].reasons.includes('bpk_manual_pr.invalid_pr_url:BPK-012'));
}

function testInvalidDecisionQuarantines(): void {
  const result = normalizeManualPrReviewReceipts([{ ...receipt, reviewDecision: 'merged' }]);

  assert.equal(result.acceptedReviews.length, 0);
  assert.ok(result.quarantined[0].reasons.includes('bpk_manual_pr.invalid_review_decision:merged'));
}

function testInvalidCheckQuarantines(): void {
  const result = normalizeManualPrReviewReceipts([{ ...receipt, checks: [{ name: 'verify', status: 'unknown' }] }]);

  assert.equal(result.acceptedReviews.length, 0);
  assert.ok(result.quarantined[0].reasons.includes('bpk_manual_pr.invalid_check_status:BPK-012:unknown'));
}

function testDuplicateTaskQuarantinesSecondReceipt(): void {
  const result = normalizeManualPrReviewReceipts([receipt, { ...receipt, headCommit: 'other' }]);

  assert.equal(result.acceptedReviews.length, 1);
  assert.equal(result.summary.duplicateCount, 1);
  assert.ok(result.quarantined[0].reasons.includes('bpk_manual_pr.duplicate_task:BPK-012'));
}

function testDoesNotMutateInputs(): void {
  const input = [receipt];
  const before = JSON.stringify(input);
  normalizeManualPrReviewReceipts(input);
  assert.equal(JSON.stringify(input), before);
}

testAcceptsValidReceipt();
testInvalidPrUrlQuarantines();
testInvalidDecisionQuarantines();
testInvalidCheckQuarantines();
testDuplicateTaskQuarantinesSecondReceipt();
testDoesNotMutateInputs();

console.log('bpkPrReviewManualReceipts tests passed');
