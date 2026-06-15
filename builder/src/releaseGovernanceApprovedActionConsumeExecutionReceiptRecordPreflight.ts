import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthority } from './releaseGovernanceApprovedActionConsumeExecutionReceiptAuthority.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflightInput {
  authority: ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthority;
  receiptRecordRef?: string;
  receiptRecorderRef?: string;
  receiptRecordPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflightStatus;
  consumeExecutionReceiptRecordPreflightAllowed: boolean;
  consumeExecutionReceiptAuthorized: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  approvedActionConsumeAuthorized: boolean;
  approvedActionAuthorized: boolean;
  actionConsumed: false;
  executionReceiptRecorded: false;
  mergeAllowed: false;
  externalActionAllowed: false;
  actionId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  executionAuthorityId?: string;
  receiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  receiptRecordRef?: string;
  receiptRecorderRef?: string;
  receiptRecordPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  receiptRecordPlan: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_preflight';
    actionRef?: string;
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

export function preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflightInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight {
  const receiptRecordRef = normalize(input.receiptRecordRef);
  const receiptRecorderRef = normalize(input.receiptRecorderRef);
  const receiptRecordPolicyRef = normalize(input.receiptRecordPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptAuthorityAllowed || !input.authority.consumeExecutionReceiptAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_preflight.receipt_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_preflight.execution_must_be_authorized');
  }
  if (!input.authority.approvedActionConsumeAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_preflight.consume_must_be_authorized');
  }
  if (!input.authority.approvedActionAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_preflight.action_must_be_authorized');
  }
  if (
    input.authority.actionConsumed !== false
    || input.authority.executionReceiptRecorded !== false
    || input.authority.mergeAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!receiptRecordRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_preflight.receipt_record_ref_required');
  }
  if (!receiptRecorderRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_preflight.receipt_recorder_ref_required');
  }
  if (!receiptRecordPolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_preflight.receipt_record_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflightStatus = blockers.length > 0
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
    approvedActionConsumeAuthorized: input.authority.approvedActionConsumeAuthorized,
    approvedActionAuthorized: input.authority.approvedActionAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: false,
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(input.authority.actionId ? { actionId: input.authority.actionId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(input.authority.applicationAuthorityId ? { applicationAuthorityId: input.authority.applicationAuthorityId } : {}),
    ...(input.authority.executionAuthorityId ? { executionAuthorityId: input.authority.executionAuthorityId } : {}),
    ...(input.authority.receiptAuthorityId ? { receiptAuthorityId: input.authority.receiptAuthorityId } : {}),
    ...(input.authority.authorizedByRef ? { authorizedByRef: input.authority.authorizedByRef } : {}),
    ...(input.authority.expiresAtRef ? { expiresAtRef: input.authority.expiresAtRef } : {}),
    ...(receiptRecordRef ? { receiptRecordRef } : {}),
    ...(receiptRecorderRef ? { receiptRecorderRef } : {}),
    ...(receiptRecordPolicyRef ? { receiptRecordPolicyRef } : {}),
    ...(input.authority.releaseLabel ? { releaseLabel: input.authority.releaseLabel } : {}),
    evidenceRefs: unique([...input.authority.evidenceRefs, receiptRecordRef, receiptRecordPolicyRef]),
    runbookSteps: [...input.authority.runbookSteps],
    receiptRecordPlan: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_preflight',
      ...(input.authority.actionId ? { actionRef: input.authority.actionId } : {}),
      ...(input.authority.executionAuthorityId ? { executionAuthorityRef: input.authority.executionAuthorityId } : {}),
      ...(input.authority.receiptAuthorityId ? { receiptAuthorityRef: input.authority.receiptAuthorityId } : {}),
      ...(receiptRecordRef ? { recordRef: receiptRecordRef } : {}),
      ...(receiptRecordPolicyRef ? { policyRef: receiptRecordPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_preflight_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_preflight_blockers'],
  };
}
