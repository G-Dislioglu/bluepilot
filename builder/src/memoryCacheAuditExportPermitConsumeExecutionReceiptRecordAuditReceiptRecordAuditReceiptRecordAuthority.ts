import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight } from './memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorityInput {
  preflight: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight;
  auditReceiptRecordAuditReceiptRecordAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthority {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorityStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: boolean;
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
  auditReceiptRecordAuditReceiptRecordRef?: string;
  auditReceiptRecordAuditReceiptRecordAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  authorizedAuditReceiptRecordAuditReceiptRecord: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority';
    permitKind: 'memory_cache_audit_export';
    receiptRef?: string;
    receiptAuthorityRef?: string;
    recordRef?: string;
    recordAuthorityRef?: string;
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

export function authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorityInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthority {
  const auditReceiptRecordAuditReceiptRecordAuthorityId = normalize(input.auditReceiptRecordAuditReceiptRecordAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded || !input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.audit_receipt_must_be_recorded');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.fileWriteAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.externalActionAllowed !== false
    || input.preflight.auditWriteAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.write_and_external_gates_must_stay_closed');
  }
  if (!auditReceiptRecordAuditReceiptRecordAuthorityId) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.audit_receipt_record_audit_receipt_record_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.expires_at_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorized: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed,
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
    ...(input.preflight.auditReceiptRecordAuditReceiptAuthorityId ? { auditReceiptRecordAuditReceiptAuthorityId: input.preflight.auditReceiptRecordAuditReceiptAuthorityId } : {}),
    ...(input.preflight.auditReceiptRecordAuditReceiptRecordRef ? { auditReceiptRecordAuditReceiptRecordRef: input.preflight.auditReceiptRecordAuditReceiptRecordRef } : {}),
    ...(auditReceiptRecordAuditReceiptRecordAuthorityId ? { auditReceiptRecordAuditReceiptRecordAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    format: input.preflight.format,
    cacheRef: input.preflight.cacheRef,
    previewLines: [...input.preflight.previewLines],
    evidenceRefs: unique([...input.preflight.evidenceRefs, auditReceiptRecordAuditReceiptRecordAuthorityId, expiresAtRef]),
    authorizedAuditReceiptRecordAuditReceiptRecord: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority',
      permitKind: 'memory_cache_audit_export',
      ...(input.preflight.auditReceiptRecordAuditReceiptRef ? { receiptRef: input.preflight.auditReceiptRecordAuditReceiptRef } : {}),
      ...(input.preflight.auditReceiptRecordAuditReceiptAuthorityId ? { receiptAuthorityRef: input.preflight.auditReceiptRecordAuditReceiptAuthorityId } : {}),
      ...(input.preflight.auditReceiptRecordAuditReceiptRecordRef ? { recordRef: input.preflight.auditReceiptRecordAuditReceiptRecordRef } : {}),
      ...(auditReceiptRecordAuditReceiptRecordAuthorityId ? { recordAuthorityRef: auditReceiptRecordAuditReceiptRecordAuthorityId } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority_blockers'],
  };
}
