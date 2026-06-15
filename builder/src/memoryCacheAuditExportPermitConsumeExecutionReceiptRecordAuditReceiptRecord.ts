import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority } from './memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordStatus = 'recorded' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordInput {
  authority: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority;
  recordedAtRef?: string;
  auditReceiptRecordEvidenceRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: boolean;
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
  auditRef?: string;
  auditReceiptRef?: string;
  auditReceiptAuthorityId?: string;
  auditReceiptRecordRef?: string;
  auditReceiptRecordAuthorityId?: string;
  recordedAtRef?: string;
  auditReceiptRecordEvidenceRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  recordedAuditReceiptRecord: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record';
    permitKind: 'memory_cache_audit_export';
    receiptRef?: string;
    receiptAuthorityRef?: string;
    recordRef?: string;
    recordAuthorityRef?: string;
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

export function recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord {
  const recordedAtRef = normalize(input.recordedAtRef);
  const auditReceiptRecordEvidenceRef = normalize(input.auditReceiptRecordEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record.record_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptRecorded || !input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record.audit_receipt_must_be_recorded');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.fileWriteAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.externalActionAllowed !== false
    || input.authority.auditWriteAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record.write_and_external_gates_must_stay_closed');
  }
  if (!recordedAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record.recorded_at_ref_required');
  }
  if (!auditReceiptRecordEvidenceRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record.audit_receipt_record_evidence_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'recorded';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: status === 'recorded',
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.authority.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    permitConsumed: false,
    executionReceiptRecorded: input.authority.executionReceiptRecorded,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    auditWriteAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.receiptRecordRef ? { receiptRecordRef: input.authority.receiptRecordRef } : {}),
    ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
    ...(input.authority.auditReceiptRef ? { auditReceiptRef: input.authority.auditReceiptRef } : {}),
    ...(input.authority.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.authority.auditReceiptAuthorityId } : {}),
    ...(input.authority.auditReceiptRecordRef ? { auditReceiptRecordRef: input.authority.auditReceiptRecordRef } : {}),
    ...(input.authority.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.authority.auditReceiptRecordAuthorityId } : {}),
    ...(recordedAtRef ? { recordedAtRef } : {}),
    ...(auditReceiptRecordEvidenceRef ? { auditReceiptRecordEvidenceRef } : {}),
    format: input.authority.format,
    cacheRef: input.authority.cacheRef,
    previewLines: [...input.authority.previewLines],
    evidenceRefs: unique([...input.authority.evidenceRefs, recordedAtRef, auditReceiptRecordEvidenceRef]),
    recordedAuditReceiptRecord: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record',
      permitKind: 'memory_cache_audit_export',
      ...(input.authority.auditReceiptRef ? { receiptRef: input.authority.auditReceiptRef } : {}),
      ...(input.authority.auditReceiptAuthorityId ? { receiptAuthorityRef: input.authority.auditReceiptAuthorityId } : {}),
      ...(input.authority.auditReceiptRecordRef ? { recordRef: input.authority.auditReceiptRecordRef } : {}),
      ...(input.authority.auditReceiptRecordAuthorityId ? { recordAuthorityRef: input.authority.auditReceiptRecordAuthorityId } : {}),
      ...(recordedAtRef ? { recordedAtRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'recorded'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_blockers'],
  };
}
