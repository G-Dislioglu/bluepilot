import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflight } from './memoryCacheAuditExportPermitConsumeExecutionReceiptPreflight.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptAuthorityInput {
  preflight: MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflight;
  receiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptAuthority {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptAuthorityStatus;
  consumeExecutionReceiptAuthorityAllowed: boolean;
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
  authorizedByRef?: string;
  expiresAtRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  authorizedReceipt: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_authority';
    permitKind: 'memory_cache_audit_export';
    permitRef?: string;
    executionAuthorityRef?: string;
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

export function authorizeMemoryCacheAuditExportPermitConsumeExecutionReceipt(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptAuthorityInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptAuthority {
  const receiptAuthorityId = normalize(input.receiptAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptPreflightAllowed) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_authority.execution_must_be_authorized');
  }
  if (!input.preflight.permitConsumeAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_authority.consume_must_be_authorized');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.executionReceiptRecorded !== false
    || input.preflight.fileWriteAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_authority.write_and_external_gates_must_stay_closed');
  }
  if (!receiptAuthorityId) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_authority.receipt_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_authority.expires_at_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptAuthorized: status === 'ready',
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
    ...(receiptAuthorityId ? { receiptAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    format: input.preflight.format,
    cacheRef: input.preflight.cacheRef,
    previewLines: [...input.preflight.previewLines],
    evidenceRefs: unique([...input.preflight.evidenceRefs, receiptAuthorityId, expiresAtRef]),
    authorizedReceipt: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_authority',
      permitKind: 'memory_cache_audit_export',
      ...(input.preflight.permitId ? { permitRef: input.preflight.permitId } : {}),
      ...(input.preflight.executionAuthorityId ? { executionAuthorityRef: input.preflight.executionAuthorityId } : {}),
      ...(input.preflight.receiptRef ? { receiptRef: input.preflight.receiptRef } : {}),
      ...(input.preflight.receiptPolicyRef ? { policyRef: input.preflight.receiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_record_preflight']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_authority_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_authority_blockers'],
  };
}
