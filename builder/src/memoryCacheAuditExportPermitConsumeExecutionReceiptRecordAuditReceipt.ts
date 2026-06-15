import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptAuthority } from './memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptAuthority.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptStatus = 'recorded' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptInput {
  authority: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptAuthority;
  recordedAtRef?: string;
  auditReceiptEvidenceRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptStatus;
  consumeExecutionReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
  permitConsumed: false;
  executionReceiptRecorded: boolean;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  auditWriteAllowed: false;
  permitId?: string;
  receiptRecordRef?: string;
  auditRef?: string;
  auditAuthorityId?: string;
  auditReceiptRef?: string;
  auditReceiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  recordedAtRef?: string;
  auditReceiptEvidenceRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  recordedAuditReceipt: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt';
    permitKind: 'memory_cache_audit_export';
    auditRef?: string;
    auditAuthorityRef?: string;
    receiptRef?: string;
    receiptAuthorityRef?: string;
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

export function recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt {
  const recordedAtRef = normalize(input.recordedAtRef);
  const auditReceiptEvidenceRef = normalize(input.auditReceiptEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt.audit_receipt_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptRecordAudited || !input.authority.consumeExecutionReceiptRecordAuditAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt.audit_must_be_authorized');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.fileWriteAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.externalActionAllowed !== false
    || input.authority.auditWriteAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt.write_and_external_gates_must_stay_closed');
  }
  if (!recordedAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt.recorded_at_ref_required');
  }
  if (!auditReceiptEvidenceRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt.audit_receipt_evidence_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'recorded';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecorded: status === 'recorded',
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: input.authority.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed,
    consumeExecutionReceiptRecordAudited: input.authority.consumeExecutionReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditAuthorized: input.authority.consumeExecutionReceiptRecordAuditAuthorized,
    permitConsumed: false,
    executionReceiptRecorded: input.authority.executionReceiptRecorded,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    auditWriteAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.receiptRecordRef ? { receiptRecordRef: input.authority.receiptRecordRef } : {}),
    ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
    ...(input.authority.auditAuthorityId ? { auditAuthorityId: input.authority.auditAuthorityId } : {}),
    ...(input.authority.auditReceiptRef ? { auditReceiptRef: input.authority.auditReceiptRef } : {}),
    ...(input.authority.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.authority.auditReceiptAuthorityId } : {}),
    ...(input.authority.authorizedByRef ? { authorizedByRef: input.authority.authorizedByRef } : {}),
    ...(input.authority.expiresAtRef ? { expiresAtRef: input.authority.expiresAtRef } : {}),
    ...(recordedAtRef ? { recordedAtRef } : {}),
    ...(auditReceiptEvidenceRef ? { auditReceiptEvidenceRef } : {}),
    format: input.authority.format,
    cacheRef: input.authority.cacheRef,
    previewLines: [...input.authority.previewLines],
    evidenceRefs: unique([...input.authority.evidenceRefs, recordedAtRef, auditReceiptEvidenceRef]),
    recordedAuditReceipt: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt',
      permitKind: 'memory_cache_audit_export',
      ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
      ...(input.authority.auditAuthorityId ? { auditAuthorityRef: input.authority.auditAuthorityId } : {}),
      ...(input.authority.auditReceiptRef ? { receiptRef: input.authority.auditReceiptRef } : {}),
      ...(input.authority.auditReceiptAuthorityId ? { receiptAuthorityRef: input.authority.auditReceiptAuthorityId } : {}),
      ...(recordedAtRef ? { recordedAtRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'recorded'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_preflight']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_blockers'],
  };
}
