import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthorityInput {
  preflight: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight;
  receiptRecordAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthorityStatus;
  consumeExecutionReceiptRecordAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuthorized: boolean;
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
  receiptRecordAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  receiptRecordRef?: string;
  receiptRecorderRef?: string;
  receiptRecordPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorizedReceiptRecord: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_authority';
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

export function authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthorityInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority {
  const receiptRecordAuthorityId = normalize(input.receiptRecordAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordPreflightAllowed) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_authority.receipt_must_be_authorized');
  }
  if (!input.preflight.consumeExecutionAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_authority.execution_must_be_authorized');
  }
  if (!input.preflight.approvedActionConsumeAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_authority.consume_must_be_authorized');
  }
  if (
    input.preflight.actionConsumed !== false
    || input.preflight.executionReceiptRecorded !== false
    || input.preflight.mergeAllowed !== false
    || input.preflight.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_authority.merge_and_external_actions_must_stay_closed');
  }
  if (!receiptRecordAuthorityId) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_authority.receipt_record_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_authority.expires_at_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthorityStatus = blockers.length > 0
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
    approvedActionConsumeAuthorized: input.preflight.approvedActionConsumeAuthorized,
    approvedActionAuthorized: input.preflight.approvedActionAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: false,
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(input.preflight.actionId ? { actionId: input.preflight.actionId } : {}),
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
    ...(input.preflight.releaseLabel ? { releaseLabel: input.preflight.releaseLabel } : {}),
    evidenceRefs: unique([...input.preflight.evidenceRefs, receiptRecordAuthorityId, expiresAtRef]),
    runbookSteps: [...input.preflight.runbookSteps],
    authorizedReceiptRecord: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_authority',
      ...(input.preflight.actionId ? { actionRef: input.preflight.actionId } : {}),
      ...(input.preflight.executionAuthorityId ? { executionAuthorityRef: input.preflight.executionAuthorityId } : {}),
      ...(input.preflight.receiptAuthorityId ? { receiptAuthorityRef: input.preflight.receiptAuthorityId } : {}),
      ...(input.preflight.receiptRecordRef ? { recordRef: input.preflight.receiptRecordRef } : {}),
      ...(input.preflight.receiptRecordPolicyRef ? { policyRef: input.preflight.receiptRecordPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_authority_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_authority_blockers'],
  };
}
