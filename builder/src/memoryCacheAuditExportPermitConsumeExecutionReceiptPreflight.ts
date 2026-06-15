import type { MemoryCacheAuditExportPermitConsumeExecutionAuthority } from './memoryCacheAuditExportPermitConsumeExecutionAuthority.js';

export type MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflightInput {
  authority: MemoryCacheAuditExportPermitConsumeExecutionAuthority;
  receiptRef?: string;
  recorderRef?: string;
  receiptPolicyRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflight {
  status: MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflightStatus;
  consumeExecutionReceiptPreflightAllowed: boolean;
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
  receiptRef?: string;
  recorderRef?: string;
  receiptPolicyRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  consumeExecutionReceipt: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_preflight';
    permitKind: 'memory_cache_audit_export';
    permitRef?: string;
    executionAuthorityRef?: string;
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

export function preflightMemoryCacheAuditExportPermitConsumeExecutionReceipt(
  input: MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflightInput,
): MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflight {
  const receiptRef = normalize(input.receiptRef);
  const recorderRef = normalize(input.recorderRef);
  const receiptPolicyRef = normalize(input.receiptPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_receipt_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_receipt_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionAuthorityAllowed || !input.authority.consumeExecutionAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_preflight.execution_authority_not_allowed');
  }
  if (!input.authority.consumeApplicationAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_preflight.application_must_be_authorized');
  }
  if (!input.authority.permitConsumeAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_preflight.consume_must_be_authorized');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.fileWriteAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_receipt_preflight.write_and_external_gates_must_stay_closed');
  }
  if (!receiptRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_preflight.receipt_ref_required');
  }
  if (!recorderRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_preflight.recorder_ref_required');
  }
  if (!receiptPolicyRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_receipt_preflight.receipt_policy_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptPreflightAllowed: status === 'ready',
    consumeExecutionAuthorized: input.authority.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.authority.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.authority.permitConsumeAuthorized,
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(input.authority.applicationAuthorityId ? { applicationAuthorityId: input.authority.applicationAuthorityId } : {}),
    ...(input.authority.executionAuthorityId ? { executionAuthorityId: input.authority.executionAuthorityId } : {}),
    ...(receiptRef ? { receiptRef } : {}),
    ...(recorderRef ? { recorderRef } : {}),
    ...(receiptPolicyRef ? { receiptPolicyRef } : {}),
    format: input.authority.format,
    cacheRef: input.authority.cacheRef,
    previewLines: [...input.authority.previewLines],
    evidenceRefs: unique([...input.authority.evidenceRefs, receiptRef, receiptPolicyRef]),
    consumeExecutionReceipt: {
      kind: 'memory_cache_audit_export_permit_consume_execution_receipt_preflight',
      permitKind: 'memory_cache_audit_export',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.executionAuthorityId ? { executionAuthorityRef: input.authority.executionAuthorityId } : {}),
      ...(receiptPolicyRef ? { policyRef: receiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_authority']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_receipt_preflight_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_receipt_preflight_blockers'],
  };
}
