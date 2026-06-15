import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMergeReleaseReadinessContract,
  buildMergeReleaseReadinessPreflight,
} from '../src/mergeReleaseReadinessPreflight.js';

const greenChecks = [{ name: 'builder', status: 'pass' as const }];

const candidates = [
  {
    taskId: 'BPK-227',
    branch: 'bluepilot-provider-runtime-activation-preflight',
    commit: 'f5f524f',
    status: 'verified' as const,
    title: 'Provider Runtime Preflight',
    summary: 'Provider/runtime activation preflight is wired contract-only.',
    checks: greenChecks,
  },
  {
    taskId: 'BPK-228',
    branch: 'bluepilot-merge-release-readiness-preflight',
    commit: 'abc1234',
    status: 'verified' as const,
    title: 'Merge Release Readiness',
    summary: 'Merge/release readiness preflight is wired contract-only.',
    requiredPredecessors: ['BPK-227'],
    checks: greenChecks,
  },
];

test('merge release readiness contract keeps PR, merge, deploy, and GitHub effects closed', () => {
  const contract = buildMergeReleaseReadinessContract(new Date('2026-06-15T18:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-merge-release-readiness-preflight-contract-v0.1');
  assert.equal(contract.consolidationDependency, 'planBpkBranchPrConsolidation');
  assert.equal(contract.activationBoundary.createsPullRequests, false);
  assert.equal(contract.activationBoundary.mergesBranches, false);
  assert.equal(contract.activationBoundary.deploysRelease, false);
  assert.equal(contract.activationBoundary.callsGitHub, false);
  assert.equal(contract.sideEffects.pullRequestCreation, false);
  assert.equal(contract.sideEffects.merges, false);
  assert.equal(contract.sideEffects.deploys, false);
});

test('merge release readiness plans PR sequence without allowing app PR creation', () => {
  const preflight = buildMergeReleaseReadinessPreflight({
    releaseLabel: 'integration-stack',
    candidates,
  }, new Date('2026-06-15T18:00:00.000Z'));

  assert.equal(preflight.status, 'ready_for_pr_sequence_review');
  assert.equal(preflight.orderedPullRequestSequence.length, 2);
  assert.equal(preflight.orderedPullRequestSequence[0].taskId, 'BPK-227');
  assert.equal(preflight.operatorHints.mayOpenPullRequestsInOrder, true);
  assert.equal(preflight.operatorHints.mayMergeAfterReceiptsInOrder, false);
  assert.equal(preflight.applicationActions.pullRequestCreationAllowed, false);
  assert.equal(preflight.applicationActions.mergeExecutionAllowed, false);
  assert.equal(preflight.sideEffects.githubWrites, false);
});

test('merge release readiness can detect receipt-ready merge order without merging', () => {
  const preflight = buildMergeReleaseReadinessPreflight({
    releaseLabel: 'integration-stack',
    candidates,
    requirePrReceipts: true,
    reviews: [
      {
        taskId: 'BPK-227',
        prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/227',
        headCommit: 'f5f524f',
        reviewDecision: 'approved',
        checks: greenChecks,
      },
      {
        taskId: 'BPK-228',
        prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/228',
        headCommit: 'abc1234',
        reviewDecision: 'approved',
        checks: greenChecks,
      },
    ],
  }, new Date('2026-06-15T18:00:00.000Z'));

  assert.equal(preflight.status, 'ready_for_pr_sequence_review');
  assert.equal(preflight.operatorHints.mayMergeAfterReceiptsInOrder, true);
  assert.equal(preflight.applicationActions.mergeExecutionAllowed, false);
  assert.equal(preflight.applicationActions.deployExecutionAllowed, false);
  assert.equal(preflight.orderedPullRequestSequence[1].prUrl, 'https://github.com/G-Dislioglu/bluepilot/pull/228');
});

test('merge release readiness blocks missing PR receipts and red checks', () => {
  const preflight = buildMergeReleaseReadinessPreflight({
    releaseLabel: 'integration-stack',
    requirePrReceipts: true,
    candidates: [{
      ...candidates[0],
      checks: [{ name: 'builder', status: 'fail' }],
    }],
  }, new Date('2026-06-15T18:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('merge_release.consolidation_blocked:bpk_release.check_not_green:BPK-227:builder:fail'));
  assert.ok(preflight.blockers.includes('merge_release.consolidation_blocked:bpk_pr_review.missing_pr:BPK-227'));
  assert.equal(preflight.operatorHints.mayOpenPullRequestsInOrder, false);
  assert.equal(preflight.applicationActions.mergeExecutionAllowed, false);
});

test('merge release readiness blocks missing candidate list', () => {
  const preflight = buildMergeReleaseReadinessPreflight({}, new Date('2026-06-15T18:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('merge_release.candidates_required'));
});
