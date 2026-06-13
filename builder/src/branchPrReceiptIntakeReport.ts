import {
  normalizeManualPrReviewReceipts,
  type BpkManualPrReviewReceipt,
  type BpkManualPrReceiptNormalizationResult,
} from './bpkPrReviewManualReceipts.js';
import {
  planBpkBranchPrConsolidation,
  type BpkBranchPrConsolidationPlan,
} from './bpkBranchPrConsolidation.js';
import type { BpkBranchCandidate } from './bpkBranchMergeReleaseSequencing.js';

export type BranchPrReceiptIntakeReportStatus = 'ready' | 'review_required' | 'blocked';

export interface BranchPrReceiptIntakeReportInput {
  releaseLabel: string;
  candidates: BpkBranchCandidate[];
  receipts: Array<Partial<BpkManualPrReviewReceipt>>;
  requirePrReceipts?: boolean;
}

export interface BranchPrReceiptIntakeReport {
  status: BranchPrReceiptIntakeReportStatus;
  releaseLabel: string;
  normalization: BpkManualPrReceiptNormalizationResult;
  consolidation: BpkBranchPrConsolidationPlan;
  mergeAllowed: boolean;
  receiptCoverage: {
    expectedTasks: number;
    acceptedReceipts: number;
    quarantinedReceipts: number;
    duplicateReceipts: number;
  };
  blockers: string[];
  reviewItems: string[];
  reportLines: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildBranchPrReceiptIntakeReport(
  input: BranchPrReceiptIntakeReportInput,
): BranchPrReceiptIntakeReport {
  const normalization = normalizeManualPrReviewReceipts(input.receipts);
  const consolidation = planBpkBranchPrConsolidation({
    releaseLabel: input.releaseLabel,
    candidates: input.candidates,
    reviews: normalization.acceptedReviews,
    requirePrReceipts: input.requirePrReceipts,
  });
  const blockers = [...consolidation.blockers];
  const reviewItems = [...consolidation.reviewItems];

  for (const quarantined of normalization.quarantined) {
    reviewItems.push(...quarantined.reasons.map((reason) => `pr_receipt_intake.quarantined:${reason}`));
  }

  if (input.requirePrReceipts && normalization.acceptedReviews.length < input.candidates.length) {
    blockers.push(`pr_receipt_intake.receipt_coverage_incomplete:${normalization.acceptedReviews.length}/${input.candidates.length}`);
  }

  const status: BranchPrReceiptIntakeReportStatus = unique(blockers).length > 0
    ? 'blocked'
    : unique(reviewItems).length > 0
      ? 'review_required'
      : 'ready';

  const receiptCoverage = {
    expectedTasks: input.candidates.length,
    acceptedReceipts: normalization.summary.acceptedCount,
    quarantinedReceipts: normalization.summary.quarantinedCount,
    duplicateReceipts: normalization.summary.duplicateCount,
  };

  return {
    status,
    releaseLabel: consolidation.releaseLabel,
    normalization,
    consolidation,
    mergeAllowed: status === 'ready' && consolidation.mergeAllowed,
    receiptCoverage,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    reportLines: [
      `release:${consolidation.releaseLabel}`,
      `status:${status}`,
      `expected_tasks:${receiptCoverage.expectedTasks}`,
      `accepted_receipts:${receiptCoverage.acceptedReceipts}`,
      `quarantined_receipts:${receiptCoverage.quarantinedReceipts}`,
      `merge_allowed:${status === 'ready' && consolidation.mergeAllowed}`,
    ],
    nextActions: status === 'ready'
      ? consolidation.mergeAllowed
        ? ['operator_may_merge_reviewed_prs_in_sequence', 'record_merge_result_receipts']
        : ['open_missing_prs_or_collect_receipts', 'rerun_receipt_intake_report']
      : status === 'review_required'
        ? ['review_quarantined_receipts', 'rerun_receipt_intake_report']
        : ['resolve_receipt_intake_blockers', 'rerun_receipt_intake_report'],
  };
}
