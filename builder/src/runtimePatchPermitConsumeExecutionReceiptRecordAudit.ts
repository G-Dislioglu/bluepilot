import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthority } from './runtimePatchPermitConsumeExecutionReceiptRecordAuditAuthority.js';

export type RuntimePatchPermitConsumeExecutionReceiptRecordAuditStatus = 'audited' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAuditInput {
  authority: RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthority;
  auditedAtRef?: string;
  auditEvidenceRef?: string;
}

export interface RuntimePatchPermitConsumeExecutionReceiptRecordAudit {
  status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditStatus;
  consumeExecutionReceiptRecordAudited: boolean;
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
  auditedAtRef?: string;
  auditEvidenceRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  recordedAudit: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit';
    permitKind: 'runtime_patch_application';
    recordRef?: string;
    auditRef?: string;
    policyRef?: string;
    auditAuthorityRef?: string;
    auditedAtRef?: string;
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

export function recordRuntimePatchPermitConsumeExecutionReceiptRecordAudit(
  input: RuntimePatchPermitConsumeExecutionReceiptRecordAuditInput,
): RuntimePatchPermitConsumeExecutionReceiptRecordAudit {
  const auditedAtRef = normalize(input.auditedAtRef);
  const auditEvidenceRef = normalize(input.auditEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `runtime_patch_permit_consume_execution_receipt_record_audit.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `runtime_patch_permit_consume_execution_receipt_record_audit.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuditAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit.audit_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptRecorded || !input.authority.executionReceiptRecorded) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit.record_must_be_recorded');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.patchApplyAllowed !== false
    || input.authority.serverMutationExecuted !== false
    || input.authority.routeMutationExecuted !== false
    || input.authority.executionExecuted !== false
    || input.authority.executionAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.auditWriteAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_record_audit.runtime_action_gates_must_stay_closed');
  }
  if (!auditedAtRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit.audited_at_ref_required');
  }
  if (!auditEvidenceRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_record_audit.audit_evidence_ref_required');
  }

  const status: RuntimePatchPermitConsumeExecutionReceiptRecordAuditStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'audited';

  return {
    status,
    consumeExecutionReceiptRecordAudited: status === 'audited',
    consumeExecutionReceiptRecordAuditAuthorized: input.authority.consumeExecutionReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecordAuditPreflightAllowed: input.authority.consumeExecutionReceiptRecordAuditPreflightAllowed,
    consumeExecutionReceiptRecorded: input.authority.consumeExecutionReceiptRecorded,
    consumeExecutionReceiptRecordAuthorized: input.authority.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.authority.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.authority.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.authority.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.authority.permitConsumeAuthorized,
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: input.authority.executionReceiptRecorded,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.receiptRecordRef ? { receiptRecordRef: input.authority.receiptRecordRef } : {}),
    ...(input.authority.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.authority.receiptRecordAuthorityId } : {}),
    ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
    ...(input.authority.auditorRef ? { auditorRef: input.authority.auditorRef } : {}),
    ...(input.authority.auditPolicyRef ? { auditPolicyRef: input.authority.auditPolicyRef } : {}),
    ...(input.authority.auditAuthorityId ? { auditAuthorityId: input.authority.auditAuthorityId } : {}),
    ...(auditedAtRef ? { auditedAtRef } : {}),
    ...(auditEvidenceRef ? { auditEvidenceRef } : {}),
    routePath: input.authority.routePath,
    envGateName: input.authority.envGateName,
    proposedFiles: [...input.authority.proposedFiles],
    evidenceRefs: unique([...input.authority.evidenceRefs, auditedAtRef, auditEvidenceRef]),
    recordedAudit: {
      kind: 'runtime_patch_permit_consume_execution_receipt_record_audit',
      permitKind: 'runtime_patch_application',
      ...(input.authority.receiptRecordRef ? { recordRef: input.authority.receiptRecordRef } : {}),
      ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
      ...(input.authority.auditPolicyRef ? { policyRef: input.authority.auditPolicyRef } : {}),
      ...(input.authority.auditAuthorityId ? { auditAuthorityRef: input.authority.auditAuthorityId } : {}),
      ...(auditedAtRef ? { auditedAtRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'audited'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_execution_receipt_record_audit_review']
        : ['resolve_runtime_patch_permit_consume_execution_receipt_record_audit_blockers'],
  };
}
