import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from './cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';

export type CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightInput {
  audit: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit;
  auditReceiptRecordAuditReceiptRef?: string;
  auditReceiptRecordAuditReceiptRecorderRef?: string;
  auditReceiptRecordAuditReceiptPolicyRef?: string;
}

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight {
  status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorized: boolean;
  permitConsumed: false;
  executionReceiptRecorded: boolean;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
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
  auditReceiptRecordAuditReceiptRecorderRef?: string;
  auditReceiptRecordAuditReceiptPolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  auditReceiptRecordAuditReceiptPlan: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight';
    permitKind: 'cockpit_patch_application';
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

export function preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt(
  input: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightInput,
): CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight {
  const auditReceiptRecordAuditReceiptRef = normalize(input.auditReceiptRecordAuditReceiptRef);
  const auditReceiptRecordAuditReceiptRecorderRef = normalize(input.auditReceiptRecordAuditReceiptRecorderRef);
  const auditReceiptRecordAuditReceiptPolicyRef = normalize(input.auditReceiptRecordAuditReceiptPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.audit.status === 'blocked') {
    blockers.push(...input.audit.blockers.map((blocker) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_blocked:${blocker}`));
  }
  if (input.audit.status === 'review_required') {
    reviewItems.push(...input.audit.reviewItems.map((item) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_review_required:${item}`));
  }
  if (!input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited || !input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_not_complete');
  }
  if (
    input.audit.permitConsumed !== false
    || input.audit.patchApplyAllowed !== false
    || input.audit.serverMutationExecuted !== false
    || input.audit.routeMutationExecuted !== false
    || input.audit.executableActionAllowed !== false
    || input.audit.durablePersistenceAllowed !== false
    || input.audit.auditWriteAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.action_gates_must_stay_closed');
  }
  if (!auditReceiptRecordAuditReceiptRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptRecorderRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_recorder_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptPolicyRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_policy_ref_required');
  }

  const status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAudited: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.audit.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.audit.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    permitConsumed: false,
    executionReceiptRecorded: input.audit.executionReceiptRecorded,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.audit.permitId ? { permitId: input.audit.permitId } : {}),
    ...(input.audit.receiptRecordRef ? { receiptRecordRef: input.audit.receiptRecordRef } : {}),
    ...(input.audit.sourceAuditRef ? { sourceAuditRef: input.audit.sourceAuditRef } : {}),
    ...(input.audit.auditReceiptRef ? { auditReceiptRef: input.audit.auditReceiptRef } : {}),
    ...(input.audit.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.audit.auditReceiptAuthorityId } : {}),
    ...(input.audit.auditReceiptRecordRef ? { auditReceiptRecordRef: input.audit.auditReceiptRecordRef } : {}),
    ...(input.audit.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.audit.auditReceiptRecordAuthorityId } : {}),
    ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
    ...(input.audit.auditReceiptRecordAuditAuthorityId ? { auditReceiptRecordAuditAuthorityId: input.audit.auditReceiptRecordAuditAuthorityId } : {}),
    ...(auditReceiptRecordAuditReceiptRef ? { auditReceiptRecordAuditReceiptRef } : {}),
    ...(auditReceiptRecordAuditReceiptRecorderRef ? { auditReceiptRecordAuditReceiptRecorderRef } : {}),
    ...(auditReceiptRecordAuditReceiptPolicyRef ? { auditReceiptRecordAuditReceiptPolicyRef } : {}),
    routePath: input.audit.routePath,
    envGateName: input.audit.envGateName,
    proposedFiles: [...input.audit.proposedFiles],
    evidenceRefs: unique([...input.audit.evidenceRefs, auditReceiptRecordAuditReceiptRef, auditReceiptRecordAuditReceiptPolicyRef]),
    auditReceiptRecordAuditReceiptPlan: {
      kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight',
      permitKind: 'cockpit_patch_application',
      ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
      ...(input.audit.auditReceiptRecordAuditAuthorityId ? { auditAuthorityRef: input.audit.auditReceiptRecordAuditAuthorityId } : {}),
      ...(auditReceiptRecordAuditReceiptRef ? { receiptRef: auditReceiptRecordAuditReceiptRef } : {}),
      ...(auditReceiptRecordAuditReceiptPolicyRef ? { policyRef: auditReceiptRecordAuditReceiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight_review']
        : ['resolve_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight_blockers'],
  };
}
