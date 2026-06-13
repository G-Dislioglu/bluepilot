import {
  buildBranchPrReceiptIntakeReport,
  type BranchPrReceiptIntakeReport,
} from './branchPrReceiptIntakeReport.js';
import type { BpkManualPrReviewReceipt } from './bpkPrReviewManualReceipts.js';
import type { BpkBranchCandidate } from './bpkBranchMergeReleaseSequencing.js';

export type PrReceiptArtifactImportStatus = 'ready' | 'review_required' | 'blocked';

export interface PrReceiptArtifactImportInput {
  artifact: unknown;
  requirePrReceipts?: boolean;
}

export interface PrReceiptArtifactImport {
  status: PrReceiptArtifactImportStatus;
  report?: BranchPrReceiptIntakeReport;
  artifactSummary: {
    releaseLabel?: string;
    candidateCount: number;
    receiptCount: number;
  };
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function parseJsonArtifact(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function candidateFrom(value: unknown): Partial<BpkBranchCandidate> {
  if (!isObject(value)) {
    return {};
  }
  return {
    taskId: normalize(value.taskId),
    branch: normalize(value.branch),
    commit: normalize(value.commit),
    status: normalize(value.status) as BpkBranchCandidate['status'],
    title: normalize(value.title),
    summary: normalize(value.summary),
    requiredPredecessors: arrayValue(value.requiredPredecessors).map(normalize).filter(Boolean),
    checks: arrayValue(value.checks).filter(isObject).map((check) => ({
      name: normalize(check.name),
      status: normalize(check.status) as BpkBranchCandidate['checks'][number]['status'],
    })),
  };
}

function receiptFrom(value: unknown): Partial<BpkManualPrReviewReceipt> {
  if (!isObject(value)) {
    return {};
  }
  return {
    taskId: normalize(value.taskId),
    prUrl: normalize(value.prUrl),
    headCommit: normalize(value.headCommit),
    reviewDecision: normalize(value.reviewDecision),
    checks: arrayValue(value.checks).filter(isObject).map((check) => ({
      name: normalize(check.name),
      status: normalize(check.status),
    })),
  };
}

export function importPrReceiptArtifact(
  input: PrReceiptArtifactImportInput,
): PrReceiptArtifactImport {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const artifact = typeof input.artifact === 'string'
    ? parseJsonArtifact(input.artifact)
    : input.artifact;

  if (!artifact) {
    return {
      status: 'blocked',
      artifactSummary: { candidateCount: 0, receiptCount: 0 },
      blockers: ['pr_receipt_artifact.invalid_json_or_empty_artifact'],
      reviewItems: [],
      nextActions: ['provide_valid_pr_receipt_artifact'],
    };
  }
  if (!isObject(artifact)) {
    return {
      status: 'blocked',
      artifactSummary: { candidateCount: 0, receiptCount: 0 },
      blockers: ['pr_receipt_artifact.object_required'],
      reviewItems: [],
      nextActions: ['provide_object_pr_receipt_artifact'],
    };
  }

  const releaseLabel = normalize(artifact.releaseLabel);
  const candidatesRaw = arrayValue(artifact.candidates);
  const receiptsRaw = arrayValue(artifact.receipts);
  if (!releaseLabel) {
    blockers.push('pr_receipt_artifact.release_label_required');
  }
  if (!Array.isArray(artifact.candidates)) {
    blockers.push('pr_receipt_artifact.candidates_array_required');
  }
  if (!Array.isArray(artifact.receipts)) {
    blockers.push('pr_receipt_artifact.receipts_array_required');
  }

  const candidatePartials = candidatesRaw.map(candidateFrom);
  const candidates = candidatePartials as BpkBranchCandidate[];
  const receipts = receiptsRaw.map(receiptFrom);
  const artifactSummary = {
    ...(releaseLabel ? { releaseLabel } : {}),
    candidateCount: candidatesRaw.length,
    receiptCount: receiptsRaw.length,
  };

  if (blockers.length > 0) {
    return {
      status: 'blocked',
      artifactSummary,
      blockers: unique(blockers),
      reviewItems,
      nextActions: ['resolve_pr_receipt_artifact_shape'],
    };
  }

  const report = buildBranchPrReceiptIntakeReport({
    releaseLabel,
    candidates,
    receipts,
    requirePrReceipts: input.requirePrReceipts,
  });
  blockers.push(...report.blockers.map((blocker) => `pr_receipt_artifact.report_blocked:${blocker}`));
  reviewItems.push(...report.reviewItems.map((item) => `pr_receipt_artifact.report_review_required:${item}`));

  const status: PrReceiptArtifactImportStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    report,
    artifactSummary,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['operator_may_use_receipt_report_for_pr_sequence']
      : status === 'review_required'
        ? ['review_pr_receipt_artifact_quarantine']
        : ['resolve_pr_receipt_artifact_blockers'],
  };
}
