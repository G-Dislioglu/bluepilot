import assert from 'node:assert/strict';

import type { BpkReleaseSequencingPlan } from '../src/bpkBranchMergeReleaseSequencing.js';
import {
  evaluateBpkPrReviewExecution,
  type BpkPrReviewRecord,
} from '../src/bpkPrReviewExecution.js';

const sequence: BpkReleaseSequencingPlan = {
  status: 'ready',
  releaseLabel: 'bpk-release',
  blockers: [],
  reviewItems: [],
  releaseNotes: [],
  nextActions: [],
  orderedBranches: [
    {
      order: 1,
      taskId: 'BPK-011',
      branch: 'bpk-011-branch-merge-release-sequencing',
      commit: 'a07a6f5',
      status: 'verified',
    },
    {
      order: 2,
      taskId: 'BPK-012',
      branch: 'bpk-012-pr-review-execution-contract',
      commit: 'abc1234',
      status: 'verified',
    },
  ],
};

const reviews: BpkPrReviewRecord[] = [
  {
    taskId: 'BPK-011',
    prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/11',
    headCommit: 'a07a6f5',
    reviewDecision: 'approved',
    checks: [{ name: 'verify', status: 'pass' }],
  },
  {
    taskId: 'BPK-012',
    prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/12',
    headCommit: 'abc1234',
    reviewDecision: 'approved',
    checks: [{ name: 'verify', status: 'pass' }],
  },
];

function testReadyReceipt(): void {
  const receipt = evaluateBpkPrReviewExecution({ sequence, reviews });

  assert.equal(receipt.status, 'ready');
  assert.equal(receipt.mergeExecutionAllowed, true);
  assert.deepEqual(receipt.blockers, []);
  assert.deepEqual(receipt.reviewItems, []);
  assert.deepEqual(receipt.orderedPullRequests.map((pr) => pr.taskId), ['BPK-011', 'BPK-012']);
}

function testMissingPrBlocks(): void {
  const receipt = evaluateBpkPrReviewExecution({ sequence, reviews: [reviews[0]] });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.mergeExecutionAllowed, false);
  assert.ok(receipt.blockers.includes('bpk_pr_review.missing_pr:BPK-012'));
}

function testCommitMismatchBlocks(): void {
  const receipt = evaluateBpkPrReviewExecution({
    sequence,
    reviews: [{ ...reviews[0], headCommit: 'wrong' }, reviews[1]],
  });

  assert.equal(receipt.status, 'blocked');
  assert.ok(receipt.blockers.includes('bpk_pr_review.head_commit_mismatch:BPK-011:wrong->a07a6f5'));
}

function testFailingCheckBlocks(): void {
  const receipt = evaluateBpkPrReviewExecution({
    sequence,
    reviews: [{ ...reviews[0], checks: [{ name: 'verify', status: 'fail' }] }, reviews[1]],
  });

  assert.equal(receipt.status, 'blocked');
  assert.ok(receipt.blockers.includes('bpk_pr_review.check_not_green:BPK-011:verify:fail'));
}

function testChangesRequestedBlocks(): void {
  const receipt = evaluateBpkPrReviewExecution({
    sequence,
    reviews: [{ ...reviews[0], reviewDecision: 'changes_requested' }, reviews[1]],
  });

  assert.equal(receipt.status, 'blocked');
  assert.ok(receipt.blockers.includes('bpk_pr_review.changes_requested:BPK-011'));
}

function testPendingReviewRequiresReview(): void {
  const receipt = evaluateBpkPrReviewExecution({
    sequence,
    reviews: [{ ...reviews[0], reviewDecision: 'pending' }, reviews[1]],
  });

  assert.equal(receipt.status, 'review_required');
  assert.equal(receipt.mergeExecutionAllowed, false);
  assert.ok(receipt.reviewItems.includes('bpk_pr_review.pending_review:BPK-011'));
}

function testDoesNotMutateInputs(): void {
  const before = JSON.stringify({ sequence, reviews });
  evaluateBpkPrReviewExecution({ sequence, reviews });
  assert.equal(JSON.stringify({ sequence, reviews }), before);
}

testReadyReceipt();
testMissingPrBlocks();
testCommitMismatchBlocks();
testFailingCheckBlocks();
testChangesRequestedBlocks();
testPendingReviewRequiresReview();
testDoesNotMutateInputs();

console.log('bpkPrReviewExecution tests passed');
