import type { BpkReleaseSequencingPlan } from './bpkBranchMergeReleaseSequencing.js';

export type BpkPrReviewDecision = 'approved' | 'changes_requested' | 'pending';
export type BpkPrCheckStatus = 'pass' | 'fail' | 'pending' | 'missing';
export type BpkPrReviewExecutionStatus = 'ready' | 'review_required' | 'blocked';

export interface BpkPrReviewRecord {
  taskId: string;
  prUrl: string;
  headCommit: string;
  reviewDecision: BpkPrReviewDecision;
  checks: Array<{
    name: string;
    status: BpkPrCheckStatus;
  }>;
}

export interface BpkPrReviewExecutionInput {
  sequence: BpkReleaseSequencingPlan;
  reviews: BpkPrReviewRecord[];
}

export interface BpkPrReviewExecutionReceipt {
  status: BpkPrReviewExecutionStatus;
  releaseLabel: string;
  mergeExecutionAllowed: boolean;
  blockers: string[];
  reviewItems: string[];
  orderedPullRequests: Array<{
    order: number;
    taskId: string;
    branch: string;
    prUrl: string;
    headCommit: string;
    reviewDecision: BpkPrReviewDecision;
  }>;
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string): string {
  return value.trim();
}

function isPrUrl(value: string): boolean {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(value.trim());
}

export function evaluateBpkPrReviewExecution(
  input: BpkPrReviewExecutionInput,
): BpkPrReviewExecutionReceipt {
  const blockers: string[] = [...input.sequence.blockers];
  const reviewItems: string[] = [...input.sequence.reviewItems];
  const reviewsByTask = new Map(input.reviews.map((review) => [normalize(review.taskId), review]));
  const orderedPullRequests: BpkPrReviewExecutionReceipt['orderedPullRequests'] = [];

  for (const branch of input.sequence.orderedBranches) {
    const review = reviewsByTask.get(branch.taskId);
    if (!review) {
      blockers.push(`bpk_pr_review.missing_pr:${branch.taskId}`);
      continue;
    }

    if (!isPrUrl(review.prUrl)) {
      blockers.push(`bpk_pr_review.invalid_pr_url:${branch.taskId}`);
    }
    if (normalize(review.headCommit) !== branch.commit) {
      blockers.push(`bpk_pr_review.head_commit_mismatch:${branch.taskId}:${normalize(review.headCommit)}->${branch.commit}`);
    }

    for (const check of review.checks) {
      if (check.status !== 'pass') {
        blockers.push(`bpk_pr_review.check_not_green:${branch.taskId}:${check.name}:${check.status}`);
      }
    }

    if (review.reviewDecision === 'changes_requested') {
      blockers.push(`bpk_pr_review.changes_requested:${branch.taskId}`);
    }
    if (review.reviewDecision === 'pending') {
      reviewItems.push(`bpk_pr_review.pending_review:${branch.taskId}`);
    }

    orderedPullRequests.push({
      order: branch.order,
      taskId: branch.taskId,
      branch: branch.branch,
      prUrl: normalize(review.prUrl),
      headCommit: normalize(review.headCommit),
      reviewDecision: review.reviewDecision,
    });
  }

  const status: BpkPrReviewExecutionStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    releaseLabel: input.sequence.releaseLabel,
    mergeExecutionAllowed: status === 'ready',
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    orderedPullRequests,
    nextActions: status === 'ready'
      ? ['operator_may_merge_prs_in_order', 'record_merge_receipts', 'rerun_full_builder_suite_after_merge']
      : status === 'review_required'
        ? ['complete_pending_reviews', 'rerun_pr_review_execution']
        : ['resolve_pr_blockers', 'rerun_pr_review_execution'],
  };
}
