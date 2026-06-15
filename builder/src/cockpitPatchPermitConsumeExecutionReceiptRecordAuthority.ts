import type { CockpitPatchPermitConsumeExecutionReceiptRecordPreflight } from './cockpitPatchPermitConsumeExecutionReceiptRecordPreflight.js';

export type CockpitPatchPermitConsumeExecutionReceiptRecordAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuthorityInput {
  preflight: CockpitPatchPermitConsumeExecutionReceiptRecordPreflight;
  receiptRecordAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuthority {
  status: CockpitPatchPermitConsumeExecutionReceiptRecordAuthorityStatus;
  consumeExecutionReceiptRecordAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuthorized: boolean;
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
  receiptRecordAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  receiptRecordRef?: string;
  receiptRecorderRef?: string;
  receiptRecordPolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorizedReceiptRecord: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_authority';
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

export function authorizeCockpitPatchPermitConsumeExecutionReceiptRecord(
  input: CockpitPatchPermitConsumeExecutionReceiptRecordAuthorityInput,
): CockpitPatchPermitConsumeExecutionReceiptRecordAuthority {
  const receiptRecordAuthorityId = normalize(input.receiptRecordAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `cockpit_patch_permit_consume_execution_receipt_record_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `cockpit_patch_permit_consume_execution_receipt_record_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordPreflightAllowed) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_authority.receipt_must_be_authorized');
  }
  if (!input.preflight.consumeExecutionAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_authority.execution_must_be_authorized');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.executionReceiptRecorded !== false
    || input.preflight.patchApplyAllowed !== false
    || input.preflight.serverMutationExecuted !== false
    || input.preflight.routeMutationExecuted !== false
    || input.preflight.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_authority.action_gates_must_stay_closed');
  }
  if (!receiptRecordAuthorityId) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_authority.receipt_record_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_authority.expires_at_ref_required');
  }

  const status: CockpitPatchPermitConsumeExecutionReceiptRecordAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuthorized: status === 'ready',
    consumeExecutionReceiptAuthorized: input.preflight.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.preflight.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.preflight.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.preflight.permitConsumeAuthorized,
    permitIssued: input.preflight.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(input.preflight.consumeAuthorityId ? { consumeAuthorityId: input.preflight.consumeAuthorityId } : {}),
    ...(input.preflight.applicationAuthorityId ? { applicationAuthorityId: input.preflight.applicationAuthorityId } : {}),
    ...(input.preflight.executionAuthorityId ? { executionAuthorityId: input.preflight.executionAuthorityId } : {}),
    ...(input.preflight.receiptAuthorityId ? { receiptAuthorityId: input.preflight.receiptAuthorityId } : {}),
    ...(receiptRecordAuthorityId ? { receiptRecordAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    ...(input.preflight.receiptRecordRef ? { receiptRecordRef: input.preflight.receiptRecordRef } : {}),
    ...(input.preflight.receiptRecorderRef ? { receiptRecorderRef: input.preflight.receiptRecorderRef } : {}),
    ...(input.preflight.receiptRecordPolicyRef ? { receiptRecordPolicyRef: input.preflight.receiptRecordPolicyRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, receiptRecordAuthorityId, expiresAtRef]),
    authorizedReceiptRecord: {
      kind: 'cockpit_patch_permit_consume_execution_receipt_record_authority',
      permitKind: 'cockpit_patch_application',
      ...(input.preflight.permitId ? { permitRef: input.preflight.permitId } : {}),
      ...(input.preflight.executionAuthorityId ? { executionAuthorityRef: input.preflight.executionAuthorityId } : {}),
      ...(input.preflight.receiptAuthorityId ? { receiptAuthorityRef: input.preflight.receiptAuthorityId } : {}),
      ...(input.preflight.receiptRecordRef ? { recordRef: input.preflight.receiptRecordRef } : {}),
      ...(input.preflight.receiptRecordPolicyRef ? { policyRef: input.preflight.receiptRecordPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_execution_receipt_record']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_execution_receipt_record_authority_review']
        : ['resolve_cockpit_patch_permit_consume_execution_receipt_record_authority_blockers'],
  };
}
