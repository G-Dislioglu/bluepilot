import type { CockpitPatchPermitConsumeExecutionReceiptAuthority } from './cockpitPatchPermitConsumeExecutionReceiptAuthority.js';

export type CockpitPatchPermitConsumeExecutionReceiptRecordPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeExecutionReceiptRecordPreflightInput {
  authority: CockpitPatchPermitConsumeExecutionReceiptAuthority;
  receiptRecordRef?: string;
  receiptRecorderRef?: string;
  receiptRecordPolicyRef?: string;
}

export interface CockpitPatchPermitConsumeExecutionReceiptRecordPreflight {
  status: CockpitPatchPermitConsumeExecutionReceiptRecordPreflightStatus;
  consumeExecutionReceiptRecordPreflightAllowed: boolean;
  consumeExecutionReceiptAuthorized: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  executionReceiptRecorded: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  executionAuthorityId?: string;
  receiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  receiptRecordRef?: string;
  receiptRecorderRef?: string;
  receiptRecordPolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  receiptRecordPlan: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_preflight';
    permitKind: 'cockpit_patch_application';
    permitRef?: string;
    executionAuthorityRef?: string;
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

export function preflightCockpitPatchPermitConsumeExecutionReceiptRecord(
  input: CockpitPatchPermitConsumeExecutionReceiptRecordPreflightInput,
): CockpitPatchPermitConsumeExecutionReceiptRecordPreflight {
  const receiptRecordRef = normalize(input.receiptRecordRef);
  const receiptRecorderRef = normalize(input.receiptRecorderRef);
  const receiptRecordPolicyRef = normalize(input.receiptRecordPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `cockpit_patch_permit_consume_execution_receipt_record_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `cockpit_patch_permit_consume_execution_receipt_record_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptAuthorityAllowed || !input.authority.consumeExecutionReceiptAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_preflight.receipt_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_preflight.execution_must_be_authorized');
  }
  if (!input.authority.permitConsumeAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_preflight.consume_must_be_authorized');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.executionReceiptRecorded !== false
    || input.authority.patchApplyAllowed !== false
    || input.authority.serverMutationExecuted !== false
    || input.authority.routeMutationExecuted !== false
    || input.authority.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_preflight.action_gates_must_stay_closed');
  }
  if (!receiptRecordRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_preflight.receipt_record_ref_required');
  }
  if (!receiptRecorderRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_preflight.receipt_recorder_ref_required');
  }
  if (!receiptRecordPolicyRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_preflight.receipt_record_policy_ref_required');
  }

  const status: CockpitPatchPermitConsumeExecutionReceiptRecordPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordPreflightAllowed: status === 'ready',
    consumeExecutionReceiptAuthorized: input.authority.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.authority.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.authority.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.authority.permitConsumeAuthorized,
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(input.authority.applicationAuthorityId ? { applicationAuthorityId: input.authority.applicationAuthorityId } : {}),
    ...(input.authority.executionAuthorityId ? { executionAuthorityId: input.authority.executionAuthorityId } : {}),
    ...(input.authority.receiptAuthorityId ? { receiptAuthorityId: input.authority.receiptAuthorityId } : {}),
    ...(input.authority.authorizedByRef ? { authorizedByRef: input.authority.authorizedByRef } : {}),
    ...(input.authority.expiresAtRef ? { expiresAtRef: input.authority.expiresAtRef } : {}),
    ...(receiptRecordRef ? { receiptRecordRef } : {}),
    ...(receiptRecorderRef ? { receiptRecorderRef } : {}),
    ...(receiptRecordPolicyRef ? { receiptRecordPolicyRef } : {}),
    routePath: input.authority.routePath,
    envGateName: input.authority.envGateName,
    proposedFiles: [...input.authority.proposedFiles],
    evidenceRefs: unique([...input.authority.evidenceRefs, receiptRecordRef, receiptRecordPolicyRef]),
    receiptRecordPlan: {
      kind: 'cockpit_patch_permit_consume_execution_receipt_record_preflight',
      permitKind: 'cockpit_patch_application',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.executionAuthorityId ? { executionAuthorityRef: input.authority.executionAuthorityId } : {}),
      ...(input.authority.receiptAuthorityId ? { receiptAuthorityRef: input.authority.receiptAuthorityId } : {}),
      ...(receiptRecordRef ? { recordRef: receiptRecordRef } : {}),
      ...(receiptRecordPolicyRef ? { policyRef: receiptRecordPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_execution_receipt_record_authority']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_execution_receipt_record_preflight_review']
        : ['resolve_cockpit_patch_permit_consume_execution_receipt_record_preflight_blockers'],
  };
}
