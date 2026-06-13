import assert from 'node:assert/strict';

import {
  planBpkBranchMergeReleaseSequence,
  type BpkBranchCandidate,
} from '../src/bpkBranchMergeReleaseSequencing.js';

const candidates: BpkBranchCandidate[] = [
  {
    taskId: 'BPK-009',
    branch: 'bpk-009-cockpit-projection-adoption-contract',
    commit: 'fdcd5b5',
    status: 'verified',
    title: 'Cockpit Projection Adoption',
    summary: 'Adds a cockpit-consumable projection contract.',
    requiredPredecessors: ['BPK-008'],
    checks: [{ name: 'verify', status: 'pass' }],
  },
  {
    taskId: 'BPK-008',
    branch: 'bpk-008-runtime-dispatch-integration-contract',
    commit: 'e5613ff',
    status: 'verified',
    title: 'Runtime Dispatch Integration Contract',
    summary: 'Adds a runtime adoption classifier.',
    checks: [{ name: 'verify', status: 'pass' }],
  },
  {
    taskId: 'BPK-010',
    branch: 'bpk-010-live-aicos-card-binding-intake',
    commit: 'f07d00b',
    status: 'pushed',
    title: 'Live AICOS/Card Binding Intake',
    summary: 'Adds a card snapshot intake normalizer.',
    requiredPredecessors: ['BPK-009'],
    checks: [{ name: 'verify', status: 'pass' }],
  },
];

function testReadyOrderAndReleaseNotes(): void {
  const plan = planBpkBranchMergeReleaseSequence({
    releaseLabel: 'bpk-runtime-cockpit-intake',
    candidates,
  });

  assert.equal(plan.status, 'ready');
  assert.deepEqual(plan.orderedBranches.map((branch) => branch.taskId), ['BPK-008', 'BPK-009', 'BPK-010']);
  assert.equal(plan.blockers.length, 0);
  assert.equal(plan.reviewItems.length, 0);
  assert.equal(plan.releaseNotes.length, 3);
  assert.deepEqual(plan.nextActions, ['open_pull_requests_in_order', 'merge_after_green_review', 'cut_release_notes_from_plan']);
}

function testReviewState(): void {
  const plan = planBpkBranchMergeReleaseSequence({
    releaseLabel: 'review-release',
    candidates: [
      candidates[0],
      { ...candidates[1], status: 'review_required' },
    ],
  });

  assert.equal(plan.status, 'review_required');
  assert.ok(plan.reviewItems.includes('bpk_release.candidate_review_required:BPK-008'));
}

function testMissingPredecessorBlocks(): void {
  const plan = planBpkBranchMergeReleaseSequence({
    releaseLabel: 'missing-predecessor',
    candidates: [{ ...candidates[2], requiredPredecessors: ['BPK-099'] }],
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('bpk_release.missing_predecessor:BPK-010:BPK-099'));
}

function testFailingCheckBlocks(): void {
  const plan = planBpkBranchMergeReleaseSequence({
    releaseLabel: 'failing-check',
    candidates: [{ ...candidates[1], checks: [{ name: 'verify', status: 'fail' }] }],
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('bpk_release.check_not_green:BPK-008:verify:fail'));
}

function testDuplicateTaskBlocks(): void {
  const plan = planBpkBranchMergeReleaseSequence({
    releaseLabel: 'duplicate-task',
    candidates: [candidates[1], { ...candidates[1], branch: 'other' }],
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('bpk_release.duplicate_task:BPK-008'));
}

function testDoesNotMutateInputs(): void {
  const before = JSON.stringify(candidates);
  planBpkBranchMergeReleaseSequence({ releaseLabel: 'mutation-check', candidates });
  assert.equal(JSON.stringify(candidates), before);
}

testReadyOrderAndReleaseNotes();
testReviewState();
testMissingPredecessorBlocks();
testFailingCheckBlocks();
testDuplicateTaskBlocks();
testDoesNotMutateInputs();

console.log('bpkBranchMergeReleaseSequencing tests passed');
