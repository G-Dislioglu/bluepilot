import type { MemoryCacheAuditExportPreviewEvidence } from './memoryCacheAuditExportPreviewEvidence.js';

export type MemoryCacheAuditExportDecisionGateStatus = 'ready' | 'review_required' | 'blocked';
export type MemoryCacheAuditExportDecision = 'approve' | 'defer' | 'reject';

export interface MemoryCacheAuditExportDecisionGateInput {
  evidence: MemoryCacheAuditExportPreviewEvidence;
  decision?: MemoryCacheAuditExportDecision;
  decisionRef?: string;
  operatorRef?: string;
  approvalRef?: string;
}

export interface MemoryCacheAuditExportDecisionGate {
  status: MemoryCacheAuditExportDecisionGateStatus;
  decisionGateAllowed: boolean;
  decision?: MemoryCacheAuditExportDecision;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  decisionRef?: string;
  operatorRef?: string;
  approvalRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
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

export function evaluateMemoryCacheAuditExportDecisionGate(
  input: MemoryCacheAuditExportDecisionGateInput,
): MemoryCacheAuditExportDecisionGate {
  const decisionRef = normalize(input.decisionRef);
  const operatorRef = normalize(input.operatorRef);
  const approvalRef = normalize(input.approvalRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.evidence.status === 'blocked') {
    blockers.push(...input.evidence.blockers.map((blocker) => `memory_cache_audit_export_decision.evidence_blocked:${blocker}`));
  }
  if (input.evidence.status === 'review_required') {
    reviewItems.push(...input.evidence.reviewItems.map((item) => `memory_cache_audit_export_decision.evidence_review_required:${item}`));
  }
  if (!input.evidence.evidencePackAllowed) {
    blockers.push('memory_cache_audit_export_decision.evidence_not_allowed');
  }
  if (input.evidence.fileWriteAllowed !== false) {
    blockers.push('memory_cache_audit_export_decision.file_write_must_stay_closed');
  }
  if (input.evidence.durablePersistenceAllowed !== false || input.evidence.externalActionAllowed !== false) {
    blockers.push('memory_cache_audit_export_decision.persistence_and_external_actions_must_stay_closed');
  }
  if (input.decision === 'reject') {
    blockers.push('memory_cache_audit_export_decision.operator_rejected');
  }
  if (!input.decision) {
    reviewItems.push('memory_cache_audit_export_decision.decision_required');
  }
  if (input.decision === 'defer') {
    reviewItems.push('memory_cache_audit_export_decision.operator_deferred');
  }
  if (!decisionRef) {
    reviewItems.push('memory_cache_audit_export_decision.decision_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('memory_cache_audit_export_decision.operator_ref_required');
  }
  if (input.decision === 'approve' && !approvalRef) {
    reviewItems.push('memory_cache_audit_export_decision.approval_ref_required');
  }

  const status: MemoryCacheAuditExportDecisionGateStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    decisionGateAllowed: status === 'ready',
    ...(input.decision ? { decision: input.decision } : {}),
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(decisionRef ? { decisionRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(approvalRef ? { approvalRef } : {}),
    format: input.evidence.format,
    cacheRef: input.evidence.cacheRef,
    previewLines: [...input.evidence.previewLines],
    evidenceRefs: [...input.evidence.evidenceRefs],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_operator_approved_action']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_decision_review']
        : ['resolve_memory_cache_audit_export_decision_blockers'],
  };
}
