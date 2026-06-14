import type { MemoryCacheAuditExportPermitIssuanceRequestPacket } from './memoryCacheAuditExportPermitIssuanceRequestPacket.js';

export type MemoryCacheAuditExportAuthorityReviewIntakeStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportAuthorityReviewIntakeInput {
  requestPacket: MemoryCacheAuditExportPermitIssuanceRequestPacket;
  authorityReviewRef?: string;
  reviewerRef?: string;
  intakeEvidenceRef?: string;
}

export interface MemoryCacheAuditExportAuthorityReviewIntake {
  status: MemoryCacheAuditExportAuthorityReviewIntakeStatus;
  authorityReviewIntakeAllowed: boolean;
  permitIssued: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  authorityReviewRef?: string;
  reviewerRef?: string;
  intakeEvidenceRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  authorityReview: {
    kind: 'memory_cache_audit_export_authority_review_intake';
    requestKind: 'memory_cache_audit_export_permit_issuance_request';
    permitKind: 'memory_cache_audit_export';
    requestRef?: string;
    requesterRef?: string;
  };
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function intakeMemoryCacheAuditExportAuthorityReview(
  input: MemoryCacheAuditExportAuthorityReviewIntakeInput,
): MemoryCacheAuditExportAuthorityReviewIntake {
  const authorityReviewRef = normalize(input.authorityReviewRef);
  const reviewerRef = normalize(input.reviewerRef);
  const intakeEvidenceRef = normalize(input.intakeEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.requestPacket.status === 'blocked') {
    blockers.push(...input.requestPacket.blockers.map((blocker) => `memory_cache_audit_export_authority_review_intake.request_blocked:${blocker}`));
  }
  if (input.requestPacket.status === 'review_required') {
    reviewItems.push(...input.requestPacket.reviewItems.map((item) => `memory_cache_audit_export_authority_review_intake.request_review_required:${item}`));
  }
  if (!input.requestPacket.requestPacketAllowed) {
    blockers.push('memory_cache_audit_export_authority_review_intake.request_packet_not_allowed');
  }
  if (
    input.requestPacket.permitIssued !== false
    || input.requestPacket.fileWriteAllowed !== false
    || input.requestPacket.durablePersistenceAllowed !== false
    || input.requestPacket.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_authority_review_intake.write_and_external_gates_must_stay_closed');
  }
  if (!authorityReviewRef) {
    reviewItems.push('memory_cache_audit_export_authority_review_intake.authority_review_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('memory_cache_audit_export_authority_review_intake.reviewer_ref_required');
  }
  if (!intakeEvidenceRef) {
    reviewItems.push('memory_cache_audit_export_authority_review_intake.intake_evidence_ref_required');
  }

  const status: MemoryCacheAuditExportAuthorityReviewIntakeStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    authorityReviewIntakeAllowed: status === 'ready',
    permitIssued: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(authorityReviewRef ? { authorityReviewRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    ...(intakeEvidenceRef ? { intakeEvidenceRef } : {}),
    format: input.requestPacket.format,
    cacheRef: input.requestPacket.cacheRef,
    previewLines: [...input.requestPacket.previewLines],
    evidenceRefs: unique([...input.requestPacket.evidenceRefs, authorityReviewRef, intakeEvidenceRef]),
    authorityReview: {
      kind: 'memory_cache_audit_export_authority_review_intake',
      requestKind: 'memory_cache_audit_export_permit_issuance_request',
      permitKind: 'memory_cache_audit_export',
      ...(input.requestPacket.requestRef ? { requestRef: input.requestPacket.requestRef } : {}),
      ...(input.requestPacket.requesterRef ? { requesterRef: input.requestPacket.requesterRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_authority_review_decision']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_authority_review_intake_review']
        : ['resolve_memory_cache_audit_export_authority_review_intake_blockers'],
  };
}
