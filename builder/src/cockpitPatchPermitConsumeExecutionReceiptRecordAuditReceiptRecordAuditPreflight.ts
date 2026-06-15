import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from './cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord.js';

export type CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightInput {
  auditReceiptRecord: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord;
  auditRef?: string;
  auditorRef?: string;
  auditPolicyRef?: string;
}

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight {
  status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: boolean;
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
  auditorRef?: string;
  auditPolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  auditReceiptRecordAuditPlan: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight';
    permitKind: 'cockpit_patch_application';
    recordRef?: string;
    recordAuthorityRef?: string;
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

export function preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit(
  input: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightInput,
): CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight {
  const auditRef = normalize(input.auditRef);
  const auditorRef = normalize(input.auditorRef);
  const auditPolicyRef = normalize(input.auditPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.auditReceiptRecord.status === 'blocked') {
    blockers.push(...input.auditReceiptRecord.blockers.map((blocker) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.record_blocked:${blocker}`));
  }
  if (input.auditReceiptRecord.status === 'review_required') {
    reviewItems.push(...input.auditReceiptRecord.reviewItems.map((item) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.record_review_required:${item}`));
  }
  if (!input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecordRecorded || !input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_receipt_record_not_complete');
  }
  if (!input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecorded || !input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_receipt_not_complete');
  }
  if (
    input.auditReceiptRecord.permitConsumed !== false
    || input.auditReceiptRecord.patchApplyAllowed !== false
    || input.auditReceiptRecord.serverMutationExecuted !== false
    || input.auditReceiptRecord.routeMutationExecuted !== false
    || input.auditReceiptRecord.executableActionAllowed !== false
    || input.auditReceiptRecord.durablePersistenceAllowed !== false
    || input.auditReceiptRecord.auditWriteAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.action_gates_must_stay_closed');
  }
  if (!auditRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_ref_required');
  }
  if (!auditorRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.auditor_ref_required');
  }
  if (!auditPolicyRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_policy_ref_required');
  }

  const status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecordRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    permitConsumed: false,
    executionReceiptRecorded: input.auditReceiptRecord.executionReceiptRecorded,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.auditReceiptRecord.permitId ? { permitId: input.auditReceiptRecord.permitId } : {}),
    ...(input.auditReceiptRecord.receiptRecordRef ? { receiptRecordRef: input.auditReceiptRecord.receiptRecordRef } : {}),
    ...(input.auditReceiptRecord.auditRef ? { sourceAuditRef: input.auditReceiptRecord.auditRef } : {}),
    ...(input.auditReceiptRecord.auditReceiptRef ? { auditReceiptRef: input.auditReceiptRecord.auditReceiptRef } : {}),
    ...(input.auditReceiptRecord.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.auditReceiptRecord.auditReceiptAuthorityId } : {}),
    ...(input.auditReceiptRecord.auditReceiptRecordRef ? { auditReceiptRecordRef: input.auditReceiptRecord.auditReceiptRecordRef } : {}),
    ...(input.auditReceiptRecord.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.auditReceiptRecord.auditReceiptRecordAuthorityId } : {}),
    ...(auditRef ? { auditRef } : {}),
    ...(auditorRef ? { auditorRef } : {}),
    ...(auditPolicyRef ? { auditPolicyRef } : {}),
    routePath: input.auditReceiptRecord.routePath,
    envGateName: input.auditReceiptRecord.envGateName,
    proposedFiles: [...input.auditReceiptRecord.proposedFiles],
    evidenceRefs: unique([...input.auditReceiptRecord.evidenceRefs, auditRef, auditPolicyRef]),
    auditReceiptRecordAuditPlan: {
      kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight',
      permitKind: 'cockpit_patch_application',
      ...(input.auditReceiptRecord.auditReceiptRecordRef ? { recordRef: input.auditReceiptRecord.auditReceiptRecordRef } : {}),
      ...(input.auditReceiptRecord.auditReceiptRecordAuthorityId ? { recordAuthorityRef: input.auditReceiptRecord.auditReceiptRecordAuthorityId } : {}),
      ...(auditRef ? { auditRef } : {}),
      ...(auditPolicyRef ? { policyRef: auditPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight_review']
        : ['resolve_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight_blockers'],
  };
}
