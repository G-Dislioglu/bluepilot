import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority } from './memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordStatus = 'recorded' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordInput {
  authority: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority;
  recordedAtRef?: string;
  receiptRecordEvidenceRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecord {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordStatus;
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
  permitId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  executionAuthorityId?: string;
  receiptAuthorityId?: string;
  receiptRecordAuthorityId?: string;
  receiptRecordRef?: string;
  receiptRecorderRef?: string;
  receiptRecordPolicyRef?: string;
  recordedAtRef?: string;
  receiptRecordEvidenceRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  recordedReceipt: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record';
    permitKind: 'memory_cache_audit_export';
    permitRef?: string;
    executionAuthorityRef?: string;
    receiptAuthorityRef?: string;
    recordAuthorityRef?: string;
    recordRef?: string;
    policyRef?: string;
    recordedAtRef?: string;
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

export function recordMemoryCacheAuditExportPermitConsumeExecutionReceipt(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptRecord {
  const recordedAtRef = normalize(input.recordedAtRef);
  const receiptRecordEvidenceRef = normalize(input.receiptRecordEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_record.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_record.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record.record_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record.receipt_must_be_authorized');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.executionReceiptRecorded !== false
    || input.authority.fileWriteAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record.write_and_external_gates_must_stay_closed');
  }
  if (!recordedAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record.recorded_at_ref_required');
  }
  if (!receiptRecordEvidenceRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record.receipt_record_evidence_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'recorded';

  return {
    status,
    consumeExecutionReceiptRecorded: status === 'recorded',
    consumeExecutionReceiptRecordAuthorized: input.authority.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.authority.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.authority.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.authority.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.authority.permitConsumeAuthorized,
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: status === 'recorded',
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(input.authority.applicationAuthorityId ? { applicationAuthorityId: input.authority.applicationAuthorityId } : {}),
    ...(input.authority.executionAuthorityId ? { executionAuthorityId: input.authority.executionAuthorityId } : {}),
    ...(input.authority.receiptAuthorityId ? { receiptAuthorityId: input.authority.receiptAuthorityId } : {}),
    ...(input.authority.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.authority.receiptRecordAuthorityId } : {}),
    ...(input.authority.receiptRecordRef ? { receiptRecordRef: input.authority.receiptRecordRef } : {}),
    ...(input.authority.receiptRecorderRef ? { receiptRecorderRef: input.authority.receiptRecorderRef } : {}),
    ...(input.authority.receiptRecordPolicyRef ? { receiptRecordPolicyRef: input.authority.receiptRecordPolicyRef } : {}),
    ...(recordedAtRef ? { recordedAtRef } : {}),
    ...(receiptRecordEvidenceRef ? { receiptRecordEvidenceRef } : {}),
    format: input.authority.format,
    cacheRef: input.authority.cacheRef,
    previewLines: [...input.authority.previewLines],
    evidenceRefs: unique([...input.authority.evidenceRefs, recordedAtRef, receiptRecordEvidenceRef]),
    recordedReceipt: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record',
      permitKind: 'memory_cache_audit_export',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.executionAuthorityId ? { executionAuthorityRef: input.authority.executionAuthorityId } : {}),
      ...(input.authority.receiptAuthorityId ? { receiptAuthorityRef: input.authority.receiptAuthorityId } : {}),
      ...(input.authority.receiptRecordAuthorityId ? { recordAuthorityRef: input.authority.receiptRecordAuthorityId } : {}),
      ...(input.authority.receiptRecordRef ? { recordRef: input.authority.receiptRecordRef } : {}),
      ...(input.authority.receiptRecordPolicyRef ? { policyRef: input.authority.receiptRecordPolicyRef } : {}),
      ...(recordedAtRef ? { recordedAtRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'recorded'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_record_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_record_blockers'],
  };
}
