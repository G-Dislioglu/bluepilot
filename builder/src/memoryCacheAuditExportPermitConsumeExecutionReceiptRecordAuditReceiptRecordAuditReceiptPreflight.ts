import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from './memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightInput {
  audit: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit;
  auditReceiptRecordAuditReceiptRef?: string;
  auditReceiptRecordAuditReceiptRecorderRef?: string;
  auditReceiptRecordAuditReceiptPolicyRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorized: boolean;
  permitConsumed: false;
  executionReceiptRecorded: boolean;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  auditWriteAllowed: false;
  permitId?: string;
  receiptRecordRef?: string;
  sourceAuditRef?: string;
  auditReceiptRef?: string;
  auditReceiptAuthorityId?: string;
  auditReceiptRecordRef?: string;
  auditReceiptRecordAuthorityId?: string;
  auditRef?: string;
  auditReceiptRecordAuditAuthorityId?: string;
  auditReceiptRecordAuditReceiptRef?: string;
  auditReceiptRecordAuditReceiptRecorderRef?: string;
  auditReceiptRecordAuditReceiptPolicyRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  auditReceiptRecordAuditReceiptPlan: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight';
    permitKind: 'memory_cache_audit_export';
    auditRef?: string;
    auditAuthorityRef?: string;
    receiptRef?: string;
    policyRef?: string;
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

export function preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight {
  const auditReceiptRecordAuditReceiptRef = normalize(input.auditReceiptRecordAuditReceiptRef);
  const auditReceiptRecordAuditReceiptRecorderRef = normalize(input.auditReceiptRecordAuditReceiptRecorderRef);
  const auditReceiptRecordAuditReceiptPolicyRef = normalize(input.auditReceiptRecordAuditReceiptPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.audit.status === 'blocked') {
    blockers.push(...input.audit.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_blocked:${blocker}`));
  }
  if (input.audit.status === 'review_required') {
    reviewItems.push(...input.audit.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_review_required:${item}`));
  }
  if (!input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited || !input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_not_complete');
  }
  if (
    input.audit.permitConsumed !== false
    || input.audit.fileWriteAllowed !== false
    || input.audit.durablePersistenceAllowed !== false
    || input.audit.externalActionAllowed !== false
    || input.audit.auditWriteAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.write_and_external_gates_must_stay_closed');
  }
  if (!auditReceiptRecordAuditReceiptRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptRecorderRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_recorder_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptPolicyRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_policy_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAudited: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.audit.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.audit.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    permitConsumed: false,
    executionReceiptRecorded: input.audit.executionReceiptRecorded,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    auditWriteAllowed: false,
    ...(input.audit.permitId ? { permitId: input.audit.permitId } : {}),
    ...(input.audit.receiptRecordRef ? { receiptRecordRef: input.audit.receiptRecordRef } : {}),
    ...(input.audit.sourceAuditRef ? { sourceAuditRef: input.audit.sourceAuditRef } : {}),
    ...(input.audit.auditReceiptRef ? { auditReceiptRef: input.audit.auditReceiptRef } : {}),
    ...(input.audit.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.audit.auditReceiptAuthorityId } : {}),
    ...(input.audit.auditReceiptRecordRef ? { auditReceiptRecordRef: input.audit.auditReceiptRecordRef } : {}),
    ...(input.audit.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.audit.auditReceiptRecordAuthorityId } : {}),
    ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
    ...(input.audit.auditReceiptRecordAuditAuthorityId ? { auditReceiptRecordAuditAuthorityId: input.audit.auditReceiptRecordAuditAuthorityId } : {}),
    ...(auditReceiptRecordAuditReceiptRef ? { auditReceiptRecordAuditReceiptRef } : {}),
    ...(auditReceiptRecordAuditReceiptRecorderRef ? { auditReceiptRecordAuditReceiptRecorderRef } : {}),
    ...(auditReceiptRecordAuditReceiptPolicyRef ? { auditReceiptRecordAuditReceiptPolicyRef } : {}),
    format: input.audit.format,
    cacheRef: input.audit.cacheRef,
    previewLines: [...input.audit.previewLines],
    evidenceRefs: unique([...input.audit.evidenceRefs, auditReceiptRecordAuditReceiptRef, auditReceiptRecordAuditReceiptPolicyRef]),
    auditReceiptRecordAuditReceiptPlan: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight',
      permitKind: 'memory_cache_audit_export',
      ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
      ...(input.audit.auditReceiptRecordAuditAuthorityId ? { auditAuthorityRef: input.audit.auditReceiptRecordAuditAuthorityId } : {}),
      ...(auditReceiptRecordAuditReceiptRef ? { receiptRef: auditReceiptRecordAuditReceiptRef } : {}),
      ...(auditReceiptRecordAuditReceiptPolicyRef ? { policyRef: auditReceiptRecordAuditReceiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight_blockers'],
  };
}
