import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordPreflight } from './memoryCacheAuditExportPermitConsumeExecutionReceiptRecordPreflight.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthorityInput {
  preflight: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordPreflight;
  receiptRecordAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthorityStatus;
  consumeExecutionReceiptRecordAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptAuthorized: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  executionReceiptRecorded: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  executionAuthorityId?: string;
  receiptAuthorityId?: string;
  receiptRecordAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  receiptRecordRef?: string;
  receiptRecorderRef?: string;
  receiptRecordPolicyRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  authorizedReceiptRecord: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_authority';
    permitKind: 'memory_cache_audit_export';
    permitRef?: string;
    executionAuthorityRef?: string;
    receiptAuthorityRef?: string;
    recordRef?: string;
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

export function authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecord(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthorityInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority {
  const receiptRecordAuthorityId = normalize(input.receiptRecordAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_record_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_record_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordPreflightAllowed) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_authority.receipt_must_be_authorized');
  }
  if (!input.preflight.consumeExecutionAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_authority.execution_must_be_authorized');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.executionReceiptRecorded !== false
    || input.preflight.fileWriteAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_authority.write_and_external_gates_must_stay_closed');
  }
  if (!receiptRecordAuthorityId) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_authority.receipt_record_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_authority.expires_at_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuthorized: status === 'ready',
    consumeExecutionReceiptAuthorized: input.preflight.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.preflight.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.preflight.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.preflight.permitConsumeAuthorized,
    permitIssued: input.preflight.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(input.preflight.consumeAuthorityId ? { consumeAuthorityId: input.preflight.consumeAuthorityId } : {}),
    ...(input.preflight.applicationAuthorityId ? { applicationAuthorityId: input.preflight.applicationAuthorityId } : {}),
    ...(input.preflight.executionAuthorityId ? { executionAuthorityId: input.preflight.executionAuthorityId } : {}),
    ...(input.preflight.receiptAuthorityId ? { receiptAuthorityId: input.preflight.receiptAuthorityId } : {}),
    ...(receiptRecordAuthorityId ? { receiptRecordAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    ...(input.preflight.receiptRecordRef ? { receiptRecordRef: input.preflight.receiptRecordRef } : {}),
    ...(input.preflight.receiptRecorderRef ? { receiptRecorderRef: input.preflight.receiptRecorderRef } : {}),
    ...(input.preflight.receiptRecordPolicyRef ? { receiptRecordPolicyRef: input.preflight.receiptRecordPolicyRef } : {}),
    format: input.preflight.format,
    cacheRef: input.preflight.cacheRef,
    previewLines: [...input.preflight.previewLines],
    evidenceRefs: unique([...input.preflight.evidenceRefs, receiptRecordAuthorityId, expiresAtRef]),
    authorizedReceiptRecord: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_authority',
      permitKind: 'memory_cache_audit_export',
      ...(input.preflight.permitId ? { permitRef: input.preflight.permitId } : {}),
      ...(input.preflight.executionAuthorityId ? { executionAuthorityRef: input.preflight.executionAuthorityId } : {}),
      ...(input.preflight.receiptAuthorityId ? { receiptAuthorityRef: input.preflight.receiptAuthorityId } : {}),
      ...(input.preflight.receiptRecordRef ? { recordRef: input.preflight.receiptRecordRef } : {}),
      ...(input.preflight.receiptRecordPolicyRef ? { policyRef: input.preflight.receiptRecordPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_record_authority_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_record_authority_blockers'],
  };
}
