import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight } from './memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityInput {
  preflight: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight;
  auditReceiptRecordAuditReceiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: boolean;
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
  auditReceiptRecordAuditReceiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  authorizedAuditReceiptRecordAuditReceipt: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority';
    permitKind: 'memory_cache_audit_export';
    auditRef?: string;
    auditAuthorityRef?: string;
    receiptRef?: string;
    receiptAuthorityRef?: string;
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

export function authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority {
  const auditReceiptRecordAuditReceiptAuthorityId = normalize(input.auditReceiptRecordAuditReceiptAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAudited || !input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.audit_must_be_authorized');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.fileWriteAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.externalActionAllowed !== false
    || input.preflight.auditWriteAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.write_and_external_gates_must_stay_closed');
  }
  if (!auditReceiptRecordAuditReceiptAuthorityId) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.audit_receipt_record_audit_receipt_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.expires_at_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordAudited: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.preflight.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    permitConsumed: false,
    executionReceiptRecorded: input.preflight.executionReceiptRecorded,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    auditWriteAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(input.preflight.receiptRecordRef ? { receiptRecordRef: input.preflight.receiptRecordRef } : {}),
    ...(input.preflight.sourceAuditRef ? { sourceAuditRef: input.preflight.sourceAuditRef } : {}),
    ...(input.preflight.auditReceiptRef ? { auditReceiptRef: input.preflight.auditReceiptRef } : {}),
    ...(input.preflight.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.preflight.auditReceiptAuthorityId } : {}),
    ...(input.preflight.auditReceiptRecordRef ? { auditReceiptRecordRef: input.preflight.auditReceiptRecordRef } : {}),
    ...(input.preflight.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.preflight.auditReceiptRecordAuthorityId } : {}),
    ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
    ...(input.preflight.auditReceiptRecordAuditAuthorityId ? { auditReceiptRecordAuditAuthorityId: input.preflight.auditReceiptRecordAuditAuthorityId } : {}),
    ...(input.preflight.auditReceiptRecordAuditReceiptRef ? { auditReceiptRecordAuditReceiptRef: input.preflight.auditReceiptRecordAuditReceiptRef } : {}),
    ...(auditReceiptRecordAuditReceiptAuthorityId ? { auditReceiptRecordAuditReceiptAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    format: input.preflight.format,
    cacheRef: input.preflight.cacheRef,
    previewLines: [...input.preflight.previewLines],
    evidenceRefs: unique([...input.preflight.evidenceRefs, auditReceiptRecordAuditReceiptAuthorityId, expiresAtRef]),
    authorizedAuditReceiptRecordAuditReceipt: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority',
      permitKind: 'memory_cache_audit_export',
      ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
      ...(input.preflight.auditReceiptRecordAuditAuthorityId ? { auditAuthorityRef: input.preflight.auditReceiptRecordAuditAuthorityId } : {}),
      ...(input.preflight.auditReceiptRecordAuditReceiptRef ? { receiptRef: input.preflight.auditReceiptRecordAuditReceiptRef } : {}),
      ...(auditReceiptRecordAuditReceiptAuthorityId ? { receiptAuthorityRef: auditReceiptRecordAuditReceiptAuthorityId } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority_blockers'],
  };
}
