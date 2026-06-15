import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from './runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt.js';

export type RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightInput {
  auditReceipt: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt;
  auditReceiptRecordAuditReceiptRecordRef?: string;
  auditReceiptRecordAuditReceiptRecorderRef?: string;
  auditReceiptRecordAuditReceiptRecordPolicyRef?: string;
}

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight {
  status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightStatus;
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
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
  durablePersistenceAllowed: false;
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
  auditReceiptRecordAuditReceiptRecorderRef?: string;
  auditReceiptRecordAuditReceiptRecordPolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  auditReceiptRecordAuditReceiptRecordPlan: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight';
    permitKind: 'runtime_patch_application';
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

export function preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord(
  input: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightInput,
): RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight {
  const auditReceiptRecordAuditReceiptRecordRef = normalize(input.auditReceiptRecordAuditReceiptRecordRef);
  const auditReceiptRecordAuditReceiptRecorderRef = normalize(input.auditReceiptRecordAuditReceiptRecorderRef);
  const auditReceiptRecordAuditReceiptRecordPolicyRef = normalize(input.auditReceiptRecordAuditReceiptRecordPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.auditReceipt.status === 'blocked') {
    blockers.push(...input.auditReceipt.blockers.map((blocker) => `runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_blocked:${blocker}`));
  }
  if (input.auditReceipt.status === 'review_required') {
    reviewItems.push(...input.auditReceipt.reviewItems.map((item) => `runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_review_required:${item}`));
  }
  if (!input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded || !input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded');
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
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.runtime_action_gates_must_stay_closed');
  }
  if (!auditReceiptRecordAuditReceiptRecordRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_record_audit_receipt_record_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptRecorderRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_record_audit_receipt_recorder_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptRecordPolicyRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_record_audit_receipt_record_policy_ref_required');
  }

  const status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordAudited: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptAuthorized,
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
    ...(input.auditReceipt.sourceAuditRef ? { sourceAuditRef: input.auditReceipt.sourceAuditRef } : {}),
    ...(input.auditReceipt.auditReceiptRef ? { auditReceiptRef: input.auditReceipt.auditReceiptRef } : {}),
    ...(input.auditReceipt.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.auditReceipt.auditReceiptAuthorityId } : {}),
    ...(input.auditReceipt.auditReceiptRecordRef ? { auditReceiptRecordRef: input.auditReceipt.auditReceiptRecordRef } : {}),
    ...(input.auditReceipt.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.auditReceipt.auditReceiptRecordAuthorityId } : {}),
    ...(input.auditReceipt.auditRef ? { auditRef: input.auditReceipt.auditRef } : {}),
    ...(input.auditReceipt.auditReceiptRecordAuditAuthorityId ? { auditReceiptRecordAuditAuthorityId: input.auditReceipt.auditReceiptRecordAuditAuthorityId } : {}),
    ...(input.auditReceipt.auditReceiptRecordAuditReceiptRef ? { auditReceiptRecordAuditReceiptRef: input.auditReceipt.auditReceiptRecordAuditReceiptRef } : {}),
    ...(input.auditReceipt.auditReceiptRecordAuditReceiptAuthorityId ? { auditReceiptRecordAuditReceiptAuthorityId: input.auditReceipt.auditReceiptRecordAuditReceiptAuthorityId } : {}),
    ...(auditReceiptRecordAuditReceiptRecordRef ? { auditReceiptRecordAuditReceiptRecordRef } : {}),
    ...(auditReceiptRecordAuditReceiptRecorderRef ? { auditReceiptRecordAuditReceiptRecorderRef } : {}),
    ...(auditReceiptRecordAuditReceiptRecordPolicyRef ? { auditReceiptRecordAuditReceiptRecordPolicyRef } : {}),
    routePath: input.auditReceipt.routePath,
    envGateName: input.auditReceipt.envGateName,
    proposedFiles: [...input.auditReceipt.proposedFiles],
    evidenceRefs: unique([...input.auditReceipt.evidenceRefs, auditReceiptRecordAuditReceiptRecordRef, auditReceiptRecordAuditReceiptRecordPolicyRef]),
    auditReceiptRecordAuditReceiptRecordPlan: {
      kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight',
      permitKind: 'runtime_patch_application',
      ...(input.auditReceipt.auditReceiptRecordAuditReceiptRef ? { receiptRef: input.auditReceipt.auditReceiptRecordAuditReceiptRef } : {}),
      ...(input.auditReceipt.auditReceiptRecordAuditReceiptAuthorityId ? { receiptAuthorityRef: input.auditReceipt.auditReceiptRecordAuditReceiptAuthorityId } : {}),
      ...(auditReceiptRecordAuditReceiptRecordRef ? { recordRef: auditReceiptRecordAuditReceiptRecordRef } : {}),
      ...(auditReceiptRecordAuditReceiptRecordPolicyRef ? { policyRef: auditReceiptRecordAuditReceiptRecordPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight_review']
        : ['resolve_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight_blockers'],
  };
}
