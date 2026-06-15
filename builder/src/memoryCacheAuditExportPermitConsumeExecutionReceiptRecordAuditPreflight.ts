import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecord } from './memoryCacheAuditExportPermitConsumeExecutionReceiptRecord.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflightInput {
  record: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecord;
  auditRef?: string;
  auditorRef?: string;
  auditPolicyRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflight {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflightStatus;
  consumeExecutionReceiptRecordAuditPreflightAllowed: boolean;
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
  auditorRef?: string;
  auditPolicyRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  auditPlan: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight';
    permitKind: 'memory_cache_audit_export';
    recordRef?: string;
    auditRef?: string;
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

export function preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflightInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflight {
  const auditRef = normalize(input.auditRef);
  const auditorRef = normalize(input.auditorRef);
  const auditPolicyRef = normalize(input.auditPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.record.status === 'blocked') {
    blockers.push(...input.record.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight.record_blocked:${blocker}`));
  }
  if (input.record.status === 'review_required') {
    reviewItems.push(...input.record.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight.record_review_required:${item}`));
  }
  if (!input.record.consumeExecutionReceiptRecorded || !input.record.executionReceiptRecorded) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight.record_not_complete');
  }
  if (
    input.record.permitConsumed !== false
    || input.record.fileWriteAllowed !== false
    || input.record.durablePersistenceAllowed !== false
    || input.record.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight.write_and_external_gates_must_stay_closed');
  }
  if (!auditRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight.audit_ref_required');
  }
  if (!auditorRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight.auditor_ref_required');
  }
  if (!auditPolicyRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight.audit_policy_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecorded: input.record.consumeExecutionReceiptRecorded,
    consumeExecutionReceiptRecordAuthorized: input.record.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.record.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.record.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.record.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.record.permitConsumeAuthorized,
    permitIssued: input.record.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: input.record.executionReceiptRecorded,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    auditWriteAllowed: false,
    ...(input.record.permitId ? { permitId: input.record.permitId } : {}),
    ...(input.record.receiptRecordRef ? { receiptRecordRef: input.record.receiptRecordRef } : {}),
    ...(input.record.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.record.receiptRecordAuthorityId } : {}),
    ...(auditRef ? { auditRef } : {}),
    ...(auditorRef ? { auditorRef } : {}),
    ...(auditPolicyRef ? { auditPolicyRef } : {}),
    format: input.record.format,
    cacheRef: input.record.cacheRef,
    previewLines: [...input.record.previewLines],
    evidenceRefs: unique([...input.record.evidenceRefs, auditRef, auditPolicyRef]),
    auditPlan: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight',
      permitKind: 'memory_cache_audit_export',
      ...(input.record.receiptRecordRef ? { recordRef: input.record.receiptRecordRef } : {}),
      ...(auditRef ? { auditRef } : {}),
      ...(auditPolicyRef ? { policyRef: auditPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_authority']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight_blockers'],
  };
}
