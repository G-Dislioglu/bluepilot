import type { MemoryCacheAuditExportAuthorityReviewIntake } from './memoryCacheAuditExportAuthorityReviewIntake.js';

export type MemoryCacheAuditExportAuthorityReviewDecision = 'approve' | 'defer' | 'reject';
export type MemoryCacheAuditExportAuthorityReviewDecisionGateStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportAuthorityReviewDecisionGateInput {
  intake: MemoryCacheAuditExportAuthorityReviewIntake;
  decision: MemoryCacheAuditExportAuthorityReviewDecision;
  decisionRef?: string;
  authorityRef?: string;
  rationaleRef?: string;
}

export interface MemoryCacheAuditExportAuthorityReviewDecisionGate {
  status: MemoryCacheAuditExportAuthorityReviewDecisionGateStatus;
  authorityDecisionGateAllowed: boolean;
  decision: MemoryCacheAuditExportAuthorityReviewDecision;
  permitIssued: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  decisionRef?: string;
  authorityRef?: string;
  rationaleRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  authorityDecision: {
    kind: 'memory_cache_audit_export_authority_review_decision';
    requestKind: 'memory_cache_audit_export_permit_issuance_request';
    permitKind: 'memory_cache_audit_export';
    intakeRef?: string;
    reviewerRef?: string;
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

export function decideMemoryCacheAuditExportAuthorityReview(
  input: MemoryCacheAuditExportAuthorityReviewDecisionGateInput,
): MemoryCacheAuditExportAuthorityReviewDecisionGate {
  const decisionRef = normalize(input.decisionRef);
  const authorityRef = normalize(input.authorityRef);
  const rationaleRef = normalize(input.rationaleRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.intake.status === 'blocked') {
    blockers.push(...input.intake.blockers.map((blocker) => `memory_cache_audit_export_authority_review_decision.intake_blocked:${blocker}`));
  }
  if (input.intake.status === 'review_required') {
    reviewItems.push(...input.intake.reviewItems.map((item) => `memory_cache_audit_export_authority_review_decision.intake_review_required:${item}`));
  }
  if (!input.intake.authorityReviewIntakeAllowed) {
    blockers.push('memory_cache_audit_export_authority_review_decision.intake_not_allowed');
  }
  if (
    input.intake.permitIssued !== false
    || input.intake.fileWriteAllowed !== false
    || input.intake.durablePersistenceAllowed !== false
    || input.intake.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_authority_review_decision.write_and_external_gates_must_stay_closed');
  }
  if (!decisionRef) {
    reviewItems.push('memory_cache_audit_export_authority_review_decision.decision_ref_required');
  }
  if (!authorityRef) {
    reviewItems.push('memory_cache_audit_export_authority_review_decision.authority_ref_required');
  }
  if (!rationaleRef) {
    reviewItems.push('memory_cache_audit_export_authority_review_decision.rationale_ref_required');
  }
  if (input.decision !== 'approve') {
    blockers.push(`memory_cache_audit_export_authority_review_decision.authority_${input.decision}`);
  }

  const status: MemoryCacheAuditExportAuthorityReviewDecisionGateStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    authorityDecisionGateAllowed: status === 'ready',
    decision: input.decision,
    permitIssued: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(decisionRef ? { decisionRef } : {}),
    ...(authorityRef ? { authorityRef } : {}),
    ...(rationaleRef ? { rationaleRef } : {}),
    format: input.intake.format,
    cacheRef: input.intake.cacheRef,
    previewLines: [...input.intake.previewLines],
    evidenceRefs: unique([...input.intake.evidenceRefs, decisionRef, rationaleRef]),
    authorityDecision: {
      kind: 'memory_cache_audit_export_authority_review_decision',
      requestKind: 'memory_cache_audit_export_permit_issuance_request',
      permitKind: 'memory_cache_audit_export',
      ...(input.intake.authorityReviewRef ? { intakeRef: input.intake.authorityReviewRef } : {}),
      ...(input.intake.reviewerRef ? { reviewerRef: input.intake.reviewerRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_issue_preflight']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_authority_review_decision_review']
        : ['resolve_memory_cache_audit_export_authority_review_decision_blockers'],
  };
}
