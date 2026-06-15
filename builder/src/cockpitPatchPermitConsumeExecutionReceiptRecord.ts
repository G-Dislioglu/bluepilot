import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuthority } from './cockpitPatchPermitConsumeExecutionReceiptRecordAuthority.js';

export type CockpitPatchPermitConsumeExecutionReceiptRecordStatus = 'recorded' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeExecutionReceiptRecordInput {
  authority: CockpitPatchPermitConsumeExecutionReceiptRecordAuthority;
  recordedAtRef?: string;
  receiptRecordEvidenceRef?: string;
}

export interface CockpitPatchPermitConsumeExecutionReceiptRecord {
  status: CockpitPatchPermitConsumeExecutionReceiptRecordStatus;
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
  executableActionAllowed: false;
  durablePersistenceAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  executionAuthorityId?: string;
  receiptAuthorityId?: string;
  receiptRecordAuthorityId?: string;
  receiptRecordRef?: string;
  receiptRecorderRef?: string;
  receiptRecordPolicyRef?: string;
  recordedAtRef?: string;
  receiptRecordEvidenceRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  recordedReceipt: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record';
    permitKind: 'cockpit_patch_application';
    permitRef?: string;
    executionAuthorityRef?: string;
    receiptAuthorityRef?: string;
    recordAuthorityRef?: string;
    recordRef?: string;
    policyRef?: string;
    recordedAtRef?: string;
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

export function recordCockpitPatchPermitConsumeExecutionReceipt(
  input: CockpitPatchPermitConsumeExecutionReceiptRecordInput,
): CockpitPatchPermitConsumeExecutionReceiptRecord {
  const recordedAtRef = normalize(input.recordedAtRef);
  const receiptRecordEvidenceRef = normalize(input.receiptRecordEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `cockpit_patch_permit_consume_execution_receipt_record.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `cockpit_patch_permit_consume_execution_receipt_record.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record.record_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record.receipt_must_be_authorized');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.executionReceiptRecorded !== false
    || input.authority.patchApplyAllowed !== false
    || input.authority.serverMutationExecuted !== false
    || input.authority.routeMutationExecuted !== false
    || input.authority.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record.action_gates_must_stay_closed');
  }
  if (!recordedAtRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record.recorded_at_ref_required');
  }
  if (!receiptRecordEvidenceRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record.receipt_record_evidence_ref_required');
  }

  const status: CockpitPatchPermitConsumeExecutionReceiptRecordStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'recorded';

  return {
    status,
    consumeExecutionReceiptRecorded: status === 'recorded',
    consumeExecutionReceiptRecordAuthorized: input.authority.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.authority.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.authority.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.authority.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.authority.permitConsumeAuthorized,
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: status === 'recorded',
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    durablePersistenceAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(input.authority.applicationAuthorityId ? { applicationAuthorityId: input.authority.applicationAuthorityId } : {}),
    ...(input.authority.executionAuthorityId ? { executionAuthorityId: input.authority.executionAuthorityId } : {}),
    ...(input.authority.receiptAuthorityId ? { receiptAuthorityId: input.authority.receiptAuthorityId } : {}),
    ...(input.authority.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.authority.receiptRecordAuthorityId } : {}),
    ...(input.authority.receiptRecordRef ? { receiptRecordRef: input.authority.receiptRecordRef } : {}),
    ...(input.authority.receiptRecorderRef ? { receiptRecorderRef: input.authority.receiptRecorderRef } : {}),
    ...(input.authority.receiptRecordPolicyRef ? { receiptRecordPolicyRef: input.authority.receiptRecordPolicyRef } : {}),
    ...(recordedAtRef ? { recordedAtRef } : {}),
    ...(receiptRecordEvidenceRef ? { receiptRecordEvidenceRef } : {}),
    routePath: input.authority.routePath,
    envGateName: input.authority.envGateName,
    proposedFiles: [...input.authority.proposedFiles],
    evidenceRefs: unique([...input.authority.evidenceRefs, recordedAtRef, receiptRecordEvidenceRef]),
    recordedReceipt: {
      kind: 'cockpit_patch_permit_consume_execution_receipt_record',
      permitKind: 'cockpit_patch_application',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.executionAuthorityId ? { executionAuthorityRef: input.authority.executionAuthorityId } : {}),
      ...(input.authority.receiptAuthorityId ? { receiptAuthorityRef: input.authority.receiptAuthorityId } : {}),
      ...(input.authority.receiptRecordAuthorityId ? { recordAuthorityRef: input.authority.receiptRecordAuthorityId } : {}),
      ...(input.authority.receiptRecordRef ? { recordRef: input.authority.receiptRecordRef } : {}),
      ...(input.authority.receiptRecordPolicyRef ? { policyRef: input.authority.receiptRecordPolicyRef } : {}),
      ...(recordedAtRef ? { recordedAtRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'recorded'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_execution_receipt_record_audit_preflight']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_execution_receipt_record_review']
        : ['resolve_cockpit_patch_permit_consume_execution_receipt_record_blockers'],
  };
}
