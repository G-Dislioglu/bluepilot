import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt } from './runtimePatchPermitConsumeExecutionReceiptRecordAuditReceipt.js';

export type RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflightInput {
  auditReceipt: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt;
  auditReceiptRecordRef?: string;
  auditReceiptRecorderRef?: string;
  auditReceiptRecordPolicyRef?: string;
}

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight {
  status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflightStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: boolean;
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
  auditAuthorityId?: string;
  auditReceiptRef?: string;
  auditReceiptAuthorityId?: string;
  auditReceiptRecordRef?: string;
  auditReceiptRecorderRef?: string;
  auditReceiptRecordPolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  auditReceiptRecordPlan: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight';
    permitKind: 'runtime_patch_application';
    auditRef?: string;
    receiptRef?: string;
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

export function preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord(
  input: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflightInput,
): RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight {
  const auditReceiptRecordRef = normalize(input.auditReceiptRecordRef);
  const auditReceiptRecorderRef = normalize(input.auditReceiptRecorderRef);
  const auditReceiptRecordPolicyRef = normalize(input.auditReceiptRecordPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.auditReceipt.status === 'blocked') {
    blockers.push(...input.auditReceipt.blockers.map((blocker) => `runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_blocked:${blocker}`));
  }
  if (input.auditReceipt.status === 'review_required') {
    reviewItems.push(...input.auditReceipt.reviewItems.map((item) => `runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_review_required:${item}`));
  }
  if (!input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecorded || !input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded');
  }
  if (
    input.auditReceipt.permitConsumed !== false
    || input.auditReceipt.patchApplyAllowed !== false
    || input.auditReceipt.serverMutationExecuted !== false
    || input.auditReceipt.routeMutationExecuted !== false
    || input.auditReceipt.executionExecuted !== false
    || input.auditReceipt.executionAllowed !== false
    || input.auditReceipt.durablePersistenceAllowed !== false
    || input.auditReceipt.auditWriteAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.runtime_action_gates_must_stay_closed');
  }
  if (!auditReceiptRecordRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_record_ref_required');
  }
  if (!auditReceiptRecorderRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_recorder_ref_required');
  }
  if (!auditReceiptRecordPolicyRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_record_policy_ref_required');
  }

  const status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed,
    consumeExecutionReceiptRecordAudited: input.auditReceipt.consumeExecutionReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditAuthorized,
    permitConsumed: false,
    executionReceiptRecorded: input.auditReceipt.executionReceiptRecorded,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.auditReceipt.permitId ? { permitId: input.auditReceipt.permitId } : {}),
    ...(input.auditReceipt.receiptRecordRef ? { receiptRecordRef: input.auditReceipt.receiptRecordRef } : {}),
    ...(input.auditReceipt.auditRef ? { auditRef: input.auditReceipt.auditRef } : {}),
    ...(input.auditReceipt.auditAuthorityId ? { auditAuthorityId: input.auditReceipt.auditAuthorityId } : {}),
    ...(input.auditReceipt.auditReceiptRef ? { auditReceiptRef: input.auditReceipt.auditReceiptRef } : {}),
    ...(input.auditReceipt.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.auditReceipt.auditReceiptAuthorityId } : {}),
    ...(auditReceiptRecordRef ? { auditReceiptRecordRef } : {}),
    ...(auditReceiptRecorderRef ? { auditReceiptRecorderRef } : {}),
    ...(auditReceiptRecordPolicyRef ? { auditReceiptRecordPolicyRef } : {}),
    routePath: input.auditReceipt.routePath,
    envGateName: input.auditReceipt.envGateName,
    proposedFiles: [...input.auditReceipt.proposedFiles],
    evidenceRefs: unique([...input.auditReceipt.evidenceRefs, auditReceiptRecordRef, auditReceiptRecordPolicyRef]),
    auditReceiptRecordPlan: {
      kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight',
      permitKind: 'runtime_patch_application',
      ...(input.auditReceipt.auditRef ? { auditRef: input.auditReceipt.auditRef } : {}),
      ...(input.auditReceipt.auditReceiptRef ? { receiptRef: input.auditReceipt.auditReceiptRef } : {}),
      ...(input.auditReceipt.auditReceiptAuthorityId ? { receiptAuthorityRef: input.auditReceipt.auditReceiptAuthorityId } : {}),
      ...(auditReceiptRecordRef ? { recordRef: auditReceiptRecordRef } : {}),
      ...(auditReceiptRecordPolicyRef ? { policyRef: auditReceiptRecordPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight_review']
        : ['resolve_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight_blockers'],
  };
}
