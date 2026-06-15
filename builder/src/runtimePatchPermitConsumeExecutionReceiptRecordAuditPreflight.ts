import type { RuntimePatchPermitConsumeExecutionReceiptRecord } from './runtimePatchPermitConsumeExecutionReceiptRecord.js';

export type RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflightInput {
  record: RuntimePatchPermitConsumeExecutionReceiptRecord;
  auditRef?: string;
  auditorRef?: string;
  auditPolicyRef?: string;
}

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflight {
  status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflightStatus;
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
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  auditPlan: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_preflight';
    permitKind: 'runtime_patch_application';
    recordRef?: string;
    auditRef?: string;
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

export function preflightRuntimePatchPermitConsumeExecutionReceiptRecordAudit(
  input: RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflightInput,
): RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflight {
  const auditRef = normalize(input.auditRef);
  const auditorRef = normalize(input.auditorRef);
  const auditPolicyRef = normalize(input.auditPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.record.status === 'blocked') {
    blockers.push(...input.record.blockers.map((blocker) => `runtime_patch_permit_consume_execution_receipt_record_audit_preflight.record_blocked:${blocker}`));
  }
  if (input.record.status === 'review_required') {
    reviewItems.push(...input.record.reviewItems.map((item) => `runtime_patch_permit_consume_execution_receipt_record_audit_preflight.record_review_required:${item}`));
  }
  if (!input.record.consumeExecutionReceiptRecorded || !input.record.executionReceiptRecorded) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_preflight.record_not_complete');
  }
  if (
    input.record.permitConsumed !== false
    || input.record.patchApplyAllowed !== false
    || input.record.serverMutationExecuted !== false
    || input.record.routeMutationExecuted !== false
    || input.record.executionExecuted !== false
    || input.record.executionAllowed !== false
    || input.record.durablePersistenceAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit_preflight.runtime_action_gates_must_stay_closed');
  }
  if (!auditRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_preflight.audit_ref_required');
  }
  if (!auditorRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_preflight.auditor_ref_required');
  }
  if (!auditPolicyRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit_preflight.audit_policy_ref_required');
  }

  const status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecorded: input.record.consumeExecutionReceiptRecorded,
    consumeExecutionReceiptRecordAuthorized: input.record.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.record.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.record.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.record.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.record.permitConsumeAuthorized,
    permitIssued: input.record.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: input.record.executionReceiptRecorded,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.record.permitId ? { permitId: input.record.permitId } : {}),
    ...(input.record.receiptRecordRef ? { receiptRecordRef: input.record.receiptRecordRef } : {}),
    ...(input.record.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.record.receiptRecordAuthorityId } : {}),
    ...(auditRef ? { auditRef } : {}),
    ...(auditorRef ? { auditorRef } : {}),
    ...(auditPolicyRef ? { auditPolicyRef } : {}),
    routePath: input.record.routePath,
    envGateName: input.record.envGateName,
    proposedFiles: [...input.record.proposedFiles],
    evidenceRefs: unique([...input.record.evidenceRefs, auditRef, auditPolicyRef]),
    auditPlan: {
      kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_preflight',
      permitKind: 'runtime_patch_application',
      ...(input.record.receiptRecordRef ? { recordRef: input.record.receiptRecordRef } : {}),
      ...(auditRef ? { auditRef } : {}),
      ...(auditPolicyRef ? { policyRef: auditPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_receipt_record_audit_authority']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_execution_receipt_record_audit_preflight_review']
        : ['resolve_runtime_patch_permit_consume_execution_receipt_record_audit_preflight_blockers'],
  };
}
