import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflight } from './runtimePatchPermitConsumeExecutionReceiptRecordAuditPreflight.js';

export type RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthorityInput {
  preflight: RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflight;
  auditAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthority {
  status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthorityStatus;
  consumeExecutionReceiptRecordAuditAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditPreflightAllowed: boolean;
  consumeExecutionReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptAuthorized: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
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
  receiptRecordAuthorityId?: string;
  auditRef?: string;
  auditorRef?: string;
  auditPolicyRef?: string;
  auditAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorizedAudit: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_authority';
    permitKind: 'runtime_patch_application';
    recordRef?: string;
    auditRef?: string;
    policyRef?: string;
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

export function authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAudit(
  input: RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthorityInput,
): RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthority {
  const auditAuthorityId = normalize(input.auditAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `runtime_patch_permit_consume_execution_receipt_record_audit_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `runtime_patch_permit_consume_execution_receipt_record_audit_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditPreflightAllowed) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptRecorded || !input.preflight.executionReceiptRecorded) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_authority.record_must_be_recorded');
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
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_authority.runtime_action_gates_must_stay_closed');
  }
  if (!auditAuthorityId) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_authority.audit_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_authority.expires_at_ref_required');
  }

  const status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditAuthorized: status === 'ready',
    consumeExecutionReceiptRecordAuditPreflightAllowed: input.preflight.consumeExecutionReceiptRecordAuditPreflightAllowed,
    consumeExecutionReceiptRecorded: input.preflight.consumeExecutionReceiptRecorded,
    consumeExecutionReceiptRecordAuthorized: input.preflight.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.preflight.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.preflight.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.preflight.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.preflight.permitConsumeAuthorized,
    permitIssued: input.preflight.permitIssued,
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
    ...(input.preflight.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.preflight.receiptRecordAuthorityId } : {}),
    ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
    ...(input.preflight.auditorRef ? { auditorRef: input.preflight.auditorRef } : {}),
    ...(input.preflight.auditPolicyRef ? { auditPolicyRef: input.preflight.auditPolicyRef } : {}),
    ...(auditAuthorityId ? { auditAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, auditAuthorityId, expiresAtRef]),
    authorizedAudit: {
      kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_authority',
      permitKind: 'runtime_patch_application',
      ...(input.preflight.receiptRecordRef ? { recordRef: input.preflight.receiptRecordRef } : {}),
      ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
      ...(input.preflight.auditPolicyRef ? { policyRef: input.preflight.auditPolicyRef } : {}),
      ...(auditAuthorityId ? { auditAuthorityRef: auditAuthorityId } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_receipt_record_audit']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_execution_receipt_record_audit_authority_review']
        : ['resolve_runtime_patch_permit_consume_execution_receipt_record_audit_authority_blockers'],
  };
}
