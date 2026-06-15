import assert from 'node:assert/strict';

import { planBpkBranchPrConsolidation } from '../src/bpkBranchPrConsolidation.js';
import type { BpkBranchCandidate } from '../src/bpkBranchMergeReleaseSequencing.js';
import type { BpkPrReviewRecord } from '../src/bpkPrReviewExecution.js';

const candidates: BpkBranchCandidate[] = [
  {
    taskId: 'BPK-021',
    branch: 'bpk-021-cockpit-route-mounting-read-only',
    commit: '5208e85',
    status: 'pushed',
    title: 'Cockpit route mounting',
    summary: 'Mount read-only cockpit route behind a default-off gate.',
    checks: [{ name: 'builder-test', status: 'pass' }],
  },
  {
    taskId: 'BPK-022',
    branch: 'bpk-022-live-aicos-network-connector',
    commit: '9bbad06',
    status: 'pushed',
    title: 'Live AICOS network connector',
    summary: 'Add isolated network connector without route or persistence.',
    requiredPredecessors: ['BPK-021'],
    checks: [{ name: 'builder-test', status: 'pass' }],
  },
];

const reviews: BpkPrReviewRecord[] = [
  {
    taskId: 'BPK-021',
    prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/21',
    headCommit: '5208e85',
    reviewDecision: 'approved',
    checks: [{ name: 'builder-test', status: 'pass' }],
  },
  {
    taskId: 'BPK-022',
    prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/22',
    headCommit: '9bbad06',
    reviewDecision: 'approved',
    checks: [{ name: 'builder-test', status: 'pass' }],
  },
];

function testReadyToOpenPrsWhenNoReceiptsRequired(): void {
  const plan = planBpkBranchPrConsolidation({
    releaseLabel: 'bpk-route-live-readiness',
    candidates,
  });

  assert.equal(plan.status, 'ready');
  assert.equal(plan.pullRequestCreationAllowed, true);
  assert.equal(plan.mergeAllowed, false);
  assert.equal(plan.branchSequence.orderedBranches[0].taskId, 'BPK-021');
}

function testReadyToMergeWhenReceiptsAreGreen(): void {
  const plan = planBpkBranchPrConsolidation({
    releaseLabel: 'bpk-route-live-readiness',
    candidates,
    reviews,
    requirePrReceipts: true,
  });

  assert.equal(plan.status, 'ready');
  assert.equal(plan.pullRequestCreationAllowed, false);
  assert.equal(plan.mergeAllowed, true);
  assert.equal(plan.prReceipt?.orderedPullRequests.length, 2);
}

function testMissingRequiredReceiptsBlock(): void {
  const plan = planBpkBranchPrConsolidation({
    releaseLabel: 'bpk-route-live-readiness',
    candidates,
    requirePrReceipts: true,
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('bpk_consolidation.pr_receipts_required'));
  assert.ok(plan.blockers.includes('bpk_pr_review.missing_pr:BPK-021'));
}

function testFailingBranchCheckBlocks(): void {
  const plan = planBpkBranchPrConsolidation({
    releaseLabel: 'bpk-route-live-readiness',
    candidates: [{
      ...candidates[0],
      checks: [{ name: 'builder-test', status: 'fail' }],
    }],
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('bpk_release.check_not_green:BPK-021:builder-test:fail'));
}

testReadyToOpenPrsWhenNoReceiptsRequired();
testReadyToMergeWhenReceiptsAreGreen();
testMissingRequiredReceiptsBlock();
testFailingBranchCheckBlocks();

console.log('bpkBranchPrConsolidation tests passed');
