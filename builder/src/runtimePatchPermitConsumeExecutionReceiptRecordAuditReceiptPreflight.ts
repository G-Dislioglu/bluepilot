import type { RuntimePatchPermitConsumeExecutionReceiptRecordAudit } from './runtimePatchPermitConsumeExecutionReceiptRecordAudit.js';

export type RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflightInput {
  audit: RuntimePatchPermitConsumeExecutionReceiptRecordAudit;
  auditReceiptRef?: string;
  auditReceiptRecorderRef?: string;
  auditReceiptPolicyRef?: string;
}

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight {
  status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflightStatus;
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
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
  auditAuthorityId?: string;
  auditReceiptRef?: string;
  auditReceiptRecorderRef?: string;
  auditReceiptPolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  auditReceiptPlan: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight';
    permitKind: 'runtime_patch_application';
    auditRef?: string;
    auditAuthorityRef?: string;
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

export function preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt(
  input: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflightInput,
): RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight {
  const auditReceiptRef = normalize(input.auditReceiptRef);
  const auditReceiptRecorderRef = normalize(input.auditReceiptRecorderRef);
  const auditReceiptPolicyRef = normalize(input.auditReceiptPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.audit.status === 'blocked') {
    blockers.push(...input.audit.blockers.map((blocker) => `runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_blocked:${blocker}`));
  }
  if (input.audit.status === 'review_required') {
    reviewItems.push(...input.audit.reviewItems.map((item) => `runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_review_required:${item}`));
  }
  if (!input.audit.consumeExecutionReceiptRecordAudited || !input.audit.consumeExecutionReceiptRecordAuditAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_not_complete');
  }
  if (
    input.audit.permitConsumed !== false
    || input.audit.patchApplyAllowed !== false
    || input.audit.serverMutationExecuted !== false
    || input.audit.routeMutationExecuted !== false
    || input.audit.executionExecuted !== false
    || input.audit.executionAllowed !== false
    || input.audit.durablePersistenceAllowed !== false
    || input.audit.auditWriteAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.runtime_action_gates_must_stay_closed');
  }
  if (!auditReceiptRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_ref_required');
  }
  if (!auditReceiptRecorderRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_recorder_ref_required');
  }
  if (!auditReceiptPolicyRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_policy_ref_required');
  }

  const status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAudited: input.audit.consumeExecutionReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditAuthorized: input.audit.consumeExecutionReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecorded: input.audit.consumeExecutionReceiptRecorded,
    consumeExecutionReceiptRecordAuthorized: input.audit.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.audit.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.audit.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.audit.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.audit.permitConsumeAuthorized,
    permitIssued: input.audit.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: input.audit.executionReceiptRecorded,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.audit.permitId ? { permitId: input.audit.permitId } : {}),
    ...(input.audit.receiptRecordRef ? { receiptRecordRef: input.audit.receiptRecordRef } : {}),
    ...(input.audit.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.audit.receiptRecordAuthorityId } : {}),
    ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
    ...(input.audit.auditAuthorityId ? { auditAuthorityId: input.audit.auditAuthorityId } : {}),
    ...(auditReceiptRef ? { auditReceiptRef } : {}),
    ...(auditReceiptRecorderRef ? { auditReceiptRecorderRef } : {}),
    ...(auditReceiptPolicyRef ? { auditReceiptPolicyRef } : {}),
    routePath: input.audit.routePath,
    envGateName: input.audit.envGateName,
    proposedFiles: [...input.audit.proposedFiles],
    evidenceRefs: unique([...input.audit.evidenceRefs, auditReceiptRef, auditReceiptPolicyRef]),
    auditReceiptPlan: {
      kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight',
      permitKind: 'runtime_patch_application',
      ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
      ...(input.audit.auditAuthorityId ? { auditAuthorityRef: input.audit.auditAuthorityId } : {}),
      ...(auditReceiptRef ? { receiptRef: auditReceiptRef } : {}),
      ...(auditReceiptPolicyRef ? { policyRef: auditReceiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_authority']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight_review']
        : ['resolve_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight_blockers'],
  };
}
