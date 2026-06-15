import type { BpkPrReviewDecision, BpkPrReviewRecord, BpkPrCheckStatus } from './bpkPrReviewExecution.js';

export interface BpkManualPrReviewReceipt {
  taskId: string;
  prUrl: string;
  headCommit: string;
  reviewDecision: string;
  checks: Array<{
    name: string;
    status: string;
  }>;
}

export interface BpkManualPrReceiptQuarantine {
  index: number;
  taskId?: string;
  reasons: string[];
  receipt: Partial<BpkManualPrReviewReceipt>;
}

export interface BpkManualPrReceiptNormalizationResult {
  acceptedReviews: BpkPrReviewRecord[];
  quarantined: BpkManualPrReceiptQuarantine[];
  summary: {
    acceptedCount: number;
    quarantinedCount: number;
    duplicateCount: number;
  };
}

const TASK_ID_RE = /^BPK-\d{3}$/;
const REVIEW_DECISIONS = new Set<BpkPrReviewDecision>(['approved', 'changes_requested', 'pending']);
const CHECK_STATUSES = new Set<BpkPrCheckStatus>(['pass', 'fail', 'pending', 'missing']);

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function isPrUrl(value: string): boolean {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+$/.test(value);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function validateReceipt(receipt: Partial<BpkManualPrReviewReceipt>): {
  review?: BpkPrReviewRecord;
  reasons: string[];
} {
  const reasons: string[] = [];
  const taskId = normalize(receipt.taskId);
  const prUrl = normalize(receipt.prUrl);
  const headCommit = normalize(receipt.headCommit);
  const reviewDecision = normalize(receipt.reviewDecision);

  if (!TASK_ID_RE.test(taskId)) {
    reasons.push(`bpk_manual_pr.invalid_task_id:${receipt.taskId ?? '(missing)'}`);
  }
  if (!isPrUrl(prUrl)) {
    reasons.push(`bpk_manual_pr.invalid_pr_url:${taskId || '(missing)'}`);
  }
  if (!headCommit) {
    reasons.push(`bpk_manual_pr.head_commit_required:${taskId || '(missing)'}`);
  }
  if (!REVIEW_DECISIONS.has(reviewDecision as BpkPrReviewDecision)) {
    reasons.push(`bpk_manual_pr.invalid_review_decision:${reviewDecision || '(missing)'}`);
  }
  if (!Array.isArray(receipt.checks) || receipt.checks.length === 0) {
    reasons.push(`bpk_manual_pr.checks_required:${taskId || '(missing)'}`);
  }

  const checks = (receipt.checks ?? []).map((check) => ({
    name: normalize(check.name),
    status: normalize(check.status),
  }));

  for (const check of checks) {
    if (!check.name) {
      reasons.push(`bpk_manual_pr.check_name_required:${taskId || '(missing)'}`);
    }
    if (!CHECK_STATUSES.has(check.status as BpkPrCheckStatus)) {
      reasons.push(`bpk_manual_pr.invalid_check_status:${taskId || '(missing)'}:${check.status || '(missing)'}`);
    }
  }

  if (reasons.length > 0) {
    return { reasons: unique(reasons) };
  }

  return {
    reasons: [],
    review: {
      taskId,
      prUrl,
      headCommit,
      reviewDecision: reviewDecision as BpkPrReviewDecision,
      checks: checks.map((check) => ({
        name: check.name,
        status: check.status as BpkPrCheckStatus,
      })),
    },
  };
}

export function normalizeManualPrReviewReceipts(
  receipts: Array<Partial<BpkManualPrReviewReceipt>>,
): BpkManualPrReceiptNormalizationResult {
  const acceptedReviews: BpkPrReviewRecord[] = [];
  const quarantined: BpkManualPrReceiptQuarantine[] = [];
  const seenTaskIds = new Set<string>();
  let duplicateCount = 0;

  receipts.forEach((receipt, index) => {
    const result = validateReceipt(receipt);
    const taskId = normalize(receipt.taskId);

    if (result.review && seenTaskIds.has(result.review.taskId)) {
      duplicateCount += 1;
      quarantined.push({
        index,
        taskId: result.review.taskId,
        reasons: [`bpk_manual_pr.duplicate_task:${result.review.taskId}`],
        receipt: { ...receipt },
      });
      return;
    }

    if (!result.review) {
      quarantined.push({
        index,
        ...(taskId ? { taskId } : {}),
        reasons: result.reasons,
        receipt: { ...receipt },
      });
      return;
    }

    seenTaskIds.add(result.review.taskId);
    acceptedReviews.push(result.review);
  });

  return {
    acceptedReviews,
    quarantined,
    summary: {
      acceptedCount: acceptedReviews.length,
      quarantinedCount: quarantined.length,
      duplicateCount,
    },
  };
}
