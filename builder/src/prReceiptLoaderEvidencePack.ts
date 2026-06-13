import type { PrReceiptFileLoaderImplementationResult } from './prReceiptFileLoaderImplementation.js';
import type { PrReceiptLoaderOperatorRunbook } from './prReceiptLoaderOperatorRunbook.js';

export type PrReceiptLoaderEvidencePackStatus = 'ready' | 'review_required' | 'blocked';

export interface PrReceiptLoaderEvidencePackInput {
  loaderResult: PrReceiptFileLoaderImplementationResult;
  runbook: PrReceiptLoaderOperatorRunbook;
  evidenceRefs?: string[];
  releaseLabel?: string;
  packRef?: string;
}

export interface PrReceiptLoaderEvidencePack {
  status: PrReceiptLoaderEvidencePackStatus;
  evidencePackAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  packRef?: string;
  releaseLabel?: string;
  loadedPath?: string;
  bytesRead: number;
  summary: {
    candidateCount: number;
    receiptCount: number;
    evidenceRefCount: number;
  };
  evidenceRefs: string[];
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildPrReceiptLoaderEvidencePack(
  input: PrReceiptLoaderEvidencePackInput,
): PrReceiptLoaderEvidencePack {
  const packRef = normalize(input.packRef);
  const releaseLabel = normalize(input.releaseLabel || input.loaderResult.artifact?.artifactSummary.releaseLabel);
  const evidenceRefs = unique([
    ...(input.evidenceRefs ?? []),
    ...input.runbook.evidenceRefs,
  ].map(normalize).filter(Boolean));
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.loaderResult.status === 'blocked') {
    blockers.push(...input.loaderResult.blockers.map((blocker) => `pr_receipt_loader_evidence_pack.loader_blocked:${blocker}`));
  }
  if (input.loaderResult.status === 'review_required') {
    reviewItems.push(...input.loaderResult.reviewItems.map((item) => `pr_receipt_loader_evidence_pack.loader_review_required:${item}`));
  }
  if (input.runbook.status === 'blocked') {
    blockers.push(...input.runbook.blockers.map((blocker) => `pr_receipt_loader_evidence_pack.runbook_blocked:${blocker}`));
  }
  if (input.runbook.status === 'review_required') {
    reviewItems.push(...input.runbook.reviewItems.map((item) => `pr_receipt_loader_evidence_pack.runbook_review_required:${item}`));
  }
  if (input.loaderResult.status !== 'ready' || !input.loaderResult.artifact) {
    blockers.push('pr_receipt_loader_evidence_pack.ready_loader_artifact_required');
  }
  if (!input.runbook.runbookAllowed) {
    blockers.push('pr_receipt_loader_evidence_pack.runbook_not_allowed');
  }
  if (!packRef) {
    reviewItems.push('pr_receipt_loader_evidence_pack.pack_ref_required');
  }
  if (!releaseLabel) {
    reviewItems.push('pr_receipt_loader_evidence_pack.release_label_required');
  }
  if (evidenceRefs.length === 0) {
    reviewItems.push('pr_receipt_loader_evidence_pack.evidence_ref_required');
  }

  const status: PrReceiptLoaderEvidencePackStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    evidencePackAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(packRef ? { packRef } : {}),
    ...(releaseLabel ? { releaseLabel } : {}),
    ...(input.loaderResult.path ? { loadedPath: input.loaderResult.path } : {}),
    bytesRead: input.loaderResult.bytesRead,
    summary: {
      candidateCount: input.loaderResult.artifact?.artifactSummary.candidateCount ?? 0,
      receiptCount: input.loaderResult.artifact?.artifactSummary.receiptCount ?? 0,
      evidenceRefCount: evidenceRefs.length,
    },
    evidenceRefs,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['attach_evidence_pack_to_release_governance_review']
      : status === 'review_required'
        ? ['complete_pr_receipt_loader_evidence_pack_review']
        : ['resolve_pr_receipt_loader_evidence_pack_blockers'],
  };
}
