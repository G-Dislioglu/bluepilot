import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight } from './memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityInput {
  preflight: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight;
  auditReceiptRecordAuditAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: boolean;
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
  authorizedByRef?: string;
  expiresAtRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  authorizedAuditReceiptRecordAudit: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority';
    permitKind: 'memory_cache_audit_export';
    recordRef?: string;
    auditRef?: string;
    auditAuthorityRef?: string;
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

export function authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority {
  const auditReceiptRecordAuditAuthorityId = normalize(input.auditReceiptRecordAuditAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordRecorded || !input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.audit_receipt_record_must_be_ready');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.fileWriteAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.externalActionAllowed !== false
    || input.preflight.auditWriteAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.write_and_external_gates_must_stay_closed');
  }
  if (!auditReceiptRecordAuditAuthorityId) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.audit_receipt_record_audit_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.expires_at_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed,
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
    ...(auditReceiptRecordAuditAuthorityId ? { auditReceiptRecordAuditAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    format: input.preflight.format,
    cacheRef: input.preflight.cacheRef,
    previewLines: [...input.preflight.previewLines],
    evidenceRefs: unique([...input.preflight.evidenceRefs, auditReceiptRecordAuditAuthorityId, expiresAtRef]),
    authorizedAuditReceiptRecordAudit: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority',
      permitKind: 'memory_cache_audit_export',
      ...(input.preflight.auditReceiptRecordRef ? { recordRef: input.preflight.auditReceiptRecordRef } : {}),
      ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
      ...(auditReceiptRecordAuditAuthorityId ? { auditAuthorityRef: auditReceiptRecordAuditAuthorityId } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority_blockers'],
  };
}
