import type { MemoryCacheAuditExportAuthorityReviewDecisionGate } from './memoryCacheAuditExportAuthorityReviewDecisionGate.js';

export type MemoryCacheAuditExportPermitIssuePreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitIssuePreflightInput {
  decisionGate: MemoryCacheAuditExportAuthorityReviewDecisionGate;
  preflightRef?: string;
  issuerRef?: string;
  issuePolicyRef?: string;
}

export interface MemoryCacheAuditExportPermitIssuePreflight {
  status: MemoryCacheAuditExportPermitIssuePreflightStatus;
  permitIssuePreflightAllowed: boolean;
  permitIssued: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  preflightRef?: string;
  issuerRef?: string;
  issuePolicyRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  permitIssue: {
    kind: 'memory_cache_audit_export_permit_issue_preflight';
    permitKind: 'memory_cache_audit_export';
    decisionRef?: string;
    authorityRef?: string;
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

export function preflightMemoryCacheAuditExportPermitIssue(
  input: MemoryCacheAuditExportPermitIssuePreflightInput,
): MemoryCacheAuditExportPermitIssuePreflight {
  const preflightRef = normalize(input.preflightRef);
  const issuerRef = normalize(input.issuerRef);
  const issuePolicyRef = normalize(input.issuePolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.decisionGate.status === 'blocked') {
    blockers.push(...input.decisionGate.blockers.map((blocker) => `memory_cache_audit_export_permit_issue_preflight.decision_blocked:${blocker}`));
  }
  if (input.decisionGate.status === 'review_required') {
    reviewItems.push(...input.decisionGate.reviewItems.map((item) => `memory_cache_audit_export_permit_issue_preflight.decision_review_required:${item}`));
  }
  if (!input.decisionGate.authorityDecisionGateAllowed) {
    blockers.push('memory_cache_audit_export_permit_issue_preflight.decision_gate_not_allowed');
  }
  if (input.decisionGate.decision !== 'approve') {
    blockers.push('memory_cache_audit_export_permit_issue_preflight.decision_must_be_approve');
  }
  if (
    input.decisionGate.permitIssued !== false
    || input.decisionGate.fileWriteAllowed !== false
    || input.decisionGate.durablePersistenceAllowed !== false
    || input.decisionGate.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_issue_preflight.write_and_external_gates_must_stay_closed');
  }
  if (!preflightRef) {
    reviewItems.push('memory_cache_audit_export_permit_issue_preflight.preflight_ref_required');
  }
  if (!issuerRef) {
    reviewItems.push('memory_cache_audit_export_permit_issue_preflight.issuer_ref_required');
  }
  if (!issuePolicyRef) {
    reviewItems.push('memory_cache_audit_export_permit_issue_preflight.issue_policy_ref_required');
  }

  const status: MemoryCacheAuditExportPermitIssuePreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitIssuePreflightAllowed: status === 'ready',
    permitIssued: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(preflightRef ? { preflightRef } : {}),
    ...(issuerRef ? { issuerRef } : {}),
    ...(issuePolicyRef ? { issuePolicyRef } : {}),
    format: input.decisionGate.format,
    cacheRef: input.decisionGate.cacheRef,
    previewLines: [...input.decisionGate.previewLines],
    evidenceRefs: unique([...input.decisionGate.evidenceRefs, preflightRef, issuePolicyRef]),
    permitIssue: {
      kind: 'memory_cache_audit_export_permit_issue_preflight',
      permitKind: 'memory_cache_audit_export',
      ...(input.decisionGate.decisionRef ? { decisionRef: input.decisionGate.decisionRef } : {}),
      ...(input.decisionGate.authorityRef ? { authorityRef: input.decisionGate.authorityRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_issue_authority']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_issue_preflight_review']
        : ['resolve_memory_cache_audit_export_permit_issue_preflight_blockers'],
  };
}
