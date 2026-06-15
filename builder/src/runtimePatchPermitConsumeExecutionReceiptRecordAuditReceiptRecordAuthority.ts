import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight } from './runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight.js';

export type RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthorityInput {
  preflight: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight;
  auditReceiptRecordAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority {
  status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthorityStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
  permitConsumed: false;
  executionReceiptRecorded: boolean;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
  durablePersistenceAllowed: false;
  auditWriteAllowed: false;
  permitId?: string;
  receiptRecordRef?: string;
  auditRef?: string;
  auditReceiptRef?: string;
  auditReceiptAuthorityId?: string;
  auditReceiptRecordRef?: string;
  auditReceiptRecordAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorizedAuditReceiptRecord: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority';
    permitKind: 'runtime_patch_application';
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

export function authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord(
  input: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthorityInput,
): RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority {
  const auditReceiptRecordAuthorityId = normalize(input.auditReceiptRecordAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptRecorded || !input.preflight.consumeExecutionReceiptRecordAuditReceiptAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.audit_receipt_record_must_be_preflighted');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.patchApplyAllowed !== false
    || input.preflight.serverMutationExecuted !== false
    || input.preflight.routeMutationExecuted !== false
    || input.preflight.executionExecuted !== false
    || input.preflight.executionAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.auditWriteAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.runtime_action_gates_must_stay_closed');
  }
  if (!auditReceiptRecordAuthorityId) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.audit_receipt_record_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.expires_at_ref_required');
  }

  const status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.preflight.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    consumeExecutionReceiptRecordAudited: input.preflight.consumeExecutionReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditAuthorized: input.preflight.consumeExecutionReceiptRecordAuditAuthorized,
    permitConsumed: false,
    executionReceiptRecorded: input.preflight.executionReceiptRecorded,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(input.preflight.receiptRecordRef ? { receiptRecordRef: input.preflight.receiptRecordRef } : {}),
    ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
    ...(input.preflight.auditReceiptRef ? { auditReceiptRef: input.preflight.auditReceiptRef } : {}),
    ...(input.preflight.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.preflight.auditReceiptAuthorityId } : {}),
    ...(input.preflight.auditReceiptRecordRef ? { auditReceiptRecordRef: input.preflight.auditReceiptRecordRef } : {}),
    ...(auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, auditReceiptRecordAuthorityId, expiresAtRef]),
    authorizedAuditReceiptRecord: {
      kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority',
      permitKind: 'runtime_patch_application',
      ...(input.preflight.auditReceiptRef ? { receiptRef: input.preflight.auditReceiptRef } : {}),
      ...(input.preflight.auditReceiptAuthorityId ? { receiptAuthorityRef: input.preflight.auditReceiptAuthorityId } : {}),
      ...(input.preflight.auditReceiptRecordRef ? { recordRef: input.preflight.auditReceiptRecordRef } : {}),
      ...(auditReceiptRecordAuthorityId ? { recordAuthorityRef: auditReceiptRecordAuthorityId } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority_review']
        : ['resolve_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority_blockers'],
  };
}
