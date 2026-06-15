import type { MemoryCacheAuditExportDecisionGate } from './memoryCacheAuditExportDecisionGate.js';

export type MemoryCacheAuditExportApprovedActionPermitPrepStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportApprovedActionPermitPrepInput {
  decisionGate: MemoryCacheAuditExportDecisionGate;
  permitPrepRef?: string;
  requesterRef?: string;
  scopeRef?: string;
}

export interface MemoryCacheAuditExportApprovedActionPermitPrep {
  status: MemoryCacheAuditExportApprovedActionPermitPrepStatus;
  permitPrepAllowed: boolean;
  permitIssued: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  permitPrepRef?: string;
  requesterRef?: string;
  scopeRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  permitRequest: {
    kind: 'memory_cache_audit_export';
    decisionRef?: string;
    approvalRef?: string;
  };
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

export function prepareMemoryCacheAuditExportApprovedActionPermit(
  input: MemoryCacheAuditExportApprovedActionPermitPrepInput,
): MemoryCacheAuditExportApprovedActionPermitPrep {
  const permitPrepRef = normalize(input.permitPrepRef);
  const requesterRef = normalize(input.requesterRef);
  const scopeRef = normalize(input.scopeRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.decisionGate.status === 'blocked') {
    blockers.push(...input.decisionGate.blockers.map((blocker) => `memory_cache_audit_export_permit_prep.decision_blocked:${blocker}`));
  }
  if (input.decisionGate.status === 'review_required') {
    reviewItems.push(...input.decisionGate.reviewItems.map((item) => `memory_cache_audit_export_permit_prep.decision_review_required:${item}`));
  }
  if (!input.decisionGate.decisionGateAllowed) {
    blockers.push('memory_cache_audit_export_permit_prep.decision_gate_not_allowed');
  }
  if (input.decisionGate.decision !== 'approve') {
    blockers.push('memory_cache_audit_export_permit_prep.decision_must_be_approve');
  }
  if (input.decisionGate.fileWriteAllowed !== false) {
    blockers.push('memory_cache_audit_export_permit_prep.file_write_must_stay_closed');
  }
  if (input.decisionGate.durablePersistenceAllowed !== false || input.decisionGate.externalActionAllowed !== false) {
    blockers.push('memory_cache_audit_export_permit_prep.persistence_and_external_actions_must_stay_closed');
  }
  if (!permitPrepRef) {
    reviewItems.push('memory_cache_audit_export_permit_prep.permit_prep_ref_required');
  }
  if (!requesterRef) {
    reviewItems.push('memory_cache_audit_export_permit_prep.requester_ref_required');
  }
  if (!scopeRef) {
    reviewItems.push('memory_cache_audit_export_permit_prep.scope_ref_required');
  }

  const status: MemoryCacheAuditExportApprovedActionPermitPrepStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitPrepAllowed: status === 'ready',
    permitIssued: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(permitPrepRef ? { permitPrepRef } : {}),
    ...(requesterRef ? { requesterRef } : {}),
    ...(scopeRef ? { scopeRef } : {}),
    format: input.decisionGate.format,
    cacheRef: input.decisionGate.cacheRef,
    previewLines: [...input.decisionGate.previewLines],
    evidenceRefs: [...input.decisionGate.evidenceRefs],
    permitRequest: {
      kind: 'memory_cache_audit_export',
      ...(input.decisionGate.decisionRef ? { decisionRef: input.decisionGate.decisionRef } : {}),
      ...(input.decisionGate.approvalRef ? { approvalRef: input.decisionGate.approvalRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_issuance']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_prep_review']
        : ['resolve_memory_cache_audit_export_permit_prep_blockers'],
  };
}
