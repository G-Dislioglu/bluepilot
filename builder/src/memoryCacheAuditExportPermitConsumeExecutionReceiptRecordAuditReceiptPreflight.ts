import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit } from './memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflightInput {
  audit: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit;
  auditReceiptRef?: string;
  auditReceiptRecorderRef?: string;
  auditReceiptPolicyRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflight {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflightStatus;
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptAuthorized: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  executionReceiptRecorded: boolean;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  auditWriteAllowed: false;
  permitId?: string;
  receiptRecordRef?: string;
  receiptRecordAuthorityId?: string;
  auditRef?: string;
  auditAuthorityId?: string;
  auditReceiptRef?: string;
  auditReceiptRecorderRef?: string;
  auditReceiptPolicyRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  auditReceiptPlan: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight';
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

export function preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflightInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflight {
  const auditReceiptRef = normalize(input.auditReceiptRef);
  const auditReceiptRecorderRef = normalize(input.auditReceiptRecorderRef);
  const auditReceiptPolicyRef = normalize(input.auditReceiptPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.audit.status === 'blocked') {
    blockers.push(...input.audit.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_blocked:${blocker}`));
  }
  if (input.audit.status === 'review_required') {
    reviewItems.push(...input.audit.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_review_required:${item}`));
  }
  if (!input.audit.consumeExecutionReceiptRecordAudited || !input.audit.consumeExecutionReceiptRecordAuditAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_not_complete');
  }
  if (
    input.audit.permitConsumed !== false
    || input.audit.fileWriteAllowed !== false
    || input.audit.durablePersistenceAllowed !== false
    || input.audit.externalActionAllowed !== false
    || input.audit.auditWriteAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight.write_and_external_gates_must_stay_closed');
  }
  if (!auditReceiptRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_ref_required');
  }
  if (!auditReceiptRecorderRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_recorder_ref_required');
  }
  if (!auditReceiptPolicyRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_policy_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAudited: input.audit.consumeExecutionReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditAuthorized: input.audit.consumeExecutionReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecorded: input.audit.consumeExecutionReceiptRecorded,
    consumeExecutionReceiptRecordAuthorized: input.audit.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.audit.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.audit.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.audit.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.audit.permitConsumeAuthorized,
    permitIssued: input.audit.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: input.audit.executionReceiptRecorded,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    auditWriteAllowed: false,
    ...(input.audit.permitId ? { permitId: input.audit.permitId } : {}),
    ...(input.audit.receiptRecordRef ? { receiptRecordRef: input.audit.receiptRecordRef } : {}),
    ...(input.audit.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.audit.receiptRecordAuthorityId } : {}),
    ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
    ...(input.audit.auditAuthorityId ? { auditAuthorityId: input.audit.auditAuthorityId } : {}),
    ...(auditReceiptRef ? { auditReceiptRef } : {}),
    ...(auditReceiptRecorderRef ? { auditReceiptRecorderRef } : {}),
    ...(auditReceiptPolicyRef ? { auditReceiptPolicyRef } : {}),
    format: input.audit.format,
    cacheRef: input.audit.cacheRef,
    previewLines: [...input.audit.previewLines],
    evidenceRefs: unique([...input.audit.evidenceRefs, auditReceiptRef, auditReceiptPolicyRef]),
    auditReceiptPlan: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight',
      permitKind: 'memory_cache_audit_export',
      ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
      ...(input.audit.auditAuthorityId ? { auditAuthorityRef: input.audit.auditAuthorityId } : {}),
      ...(auditReceiptRef ? { receiptRef: auditReceiptRef } : {}),
      ...(auditReceiptPolicyRef ? { policyRef: auditReceiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_authority']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight_blockers'],
  };
}
