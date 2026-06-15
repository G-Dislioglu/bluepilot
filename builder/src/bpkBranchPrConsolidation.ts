import {
  planBpkBranchMergeReleaseSequence,
  type BpkBranchCandidate,
  type BpkReleaseSequencingPlan,
} from './bpkBranchMergeReleaseSequencing.js';
import {
  evaluateBpkPrReviewExecution,
  type BpkPrReviewExecutionReceipt,
  type BpkPrReviewRecord,
} from './bpkPrReviewExecution.js';

export type BpkBranchPrConsolidationStatus = 'ready' | 'review_required' | 'blocked';

export interface BpkBranchPrConsolidationInput {
  releaseLabel: string;
  candidates: BpkBranchCandidate[];
  reviews?: BpkPrReviewRecord[];
  requirePrReceipts?: boolean;
}

export interface BpkBranchPrConsolidationPlan {
  status: BpkBranchPrConsolidationStatus;
  releaseLabel: string;
  branchSequence: BpkReleaseSequencingPlan;
  prReceipt?: BpkPrReviewExecutionReceipt;
  pullRequestCreationAllowed: boolean;
  mergeAllowed: boolean;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function planBpkBranchPrConsolidation(
  input: BpkBranchPrConsolidationInput,
): BpkBranchPrConsolidationPlan {
  const branchSequence = planBpkBranchMergeReleaseSequence({
    releaseLabel: input.releaseLabel,
    candidates: input.candidates,
  });
  const blockers = [...branchSequence.blockers];
  const reviewItems = [...branchSequence.reviewItems];
  const requirePrReceipts = input.requirePrReceipts === true;
  const reviews = input.reviews ?? [];
  const prReceipt = reviews.length > 0 || requirePrReceipts
    ? evaluateBpkPrReviewExecution({ sequence: branchSequence, reviews })
    : undefined;

  if (requirePrReceipts && reviews.length === 0) {
    blockers.push('bpk_consolidation.pr_receipts_required');
  }

  if (prReceipt) {
    blockers.push(...prReceipt.blockers);
    reviewItems.push(...prReceipt.reviewItems);
  }

  const status: BpkBranchPrConsolidationStatus = unique(blockers).length > 0
    ? 'blocked'
    : unique(reviewItems).length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    releaseLabel: branchSequence.releaseLabel,
    branchSequence,
    ...(prReceipt ? { prReceipt } : {}),
    pullRequestCreationAllowed: status === 'ready' && !requirePrReceipts,
    mergeAllowed: status === 'ready' && Boolean(prReceipt?.mergeExecutionAllowed),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? prReceipt?.mergeExecutionAllowed
        ? ['merge_prs_in_sequence', 'record_merge_receipts', 'rerun_release_verification']
        : ['open_prs_in_sequence', 'collect_review_receipts', 'rerun_consolidation']
      : status === 'review_required'
        ? ['resolve_review_items', 'rerun_consolidation_plan']
        : ['resolve_consolidation_blockers', 'rerun_consolidation_plan'],
  };
}
