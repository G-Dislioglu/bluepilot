import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordStatus = 'recorded' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordInput {
  authority: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority;
  recordedAtRef?: string;
  receiptRecordEvidenceRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordStatus;
  consumeExecutionReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptAuthorized: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  approvedActionConsumeAuthorized: boolean;
  approvedActionAuthorized: boolean;
  actionConsumed: false;
  executionReceiptRecorded: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  durablePersistenceAllowed: false;
  actionId?: string;
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
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  recordedReceipt: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record';
    actionRef?: string;
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

export function recordReleaseGovernanceApprovedActionConsumeExecutionReceipt(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord {
  const recordedAtRef = normalize(input.recordedAtRef);
  const receiptRecordEvidenceRef = normalize(input.receiptRecordEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record.record_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record.receipt_must_be_authorized');
  }
  if (!input.authority.approvedActionConsumeAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record.consume_must_be_authorized');
  }
  if (
    input.authority.actionConsumed !== false
    || input.authority.executionReceiptRecorded !== false
    || input.authority.mergeAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record.merge_and_external_actions_must_stay_closed');
  }
  if (!recordedAtRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record.recorded_at_ref_required');
  }
  if (!receiptRecordEvidenceRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record.receipt_record_evidence_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordStatus = blockers.length > 0
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
    approvedActionConsumeAuthorized: input.authority.approvedActionConsumeAuthorized,
    approvedActionAuthorized: input.authority.approvedActionAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: status === 'recorded',
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    ...(input.authority.actionId ? { actionId: input.authority.actionId } : {}),
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
    ...(input.authority.releaseLabel ? { releaseLabel: input.authority.releaseLabel } : {}),
    evidenceRefs: unique([...input.authority.evidenceRefs, recordedAtRef, receiptRecordEvidenceRef]),
    runbookSteps: [...input.authority.runbookSteps],
    recordedReceipt: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record',
      ...(input.authority.actionId ? { actionRef: input.authority.actionId } : {}),
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
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_preflight']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_blockers'],
  };
}
