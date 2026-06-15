import type { ReleaseGovernanceApprovedActionConsumeExecutionAuthority } from './releaseGovernanceApprovedActionConsumeExecutionAuthority.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflightInput {
  authority: ReleaseGovernanceApprovedActionConsumeExecutionAuthority;
  receiptRef?: string;
  recorderRef?: string;
  receiptPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflight {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflightStatus;
  consumeExecutionReceiptPreflightAllowed: boolean;
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
  receiptRef?: string;
  recorderRef?: string;
  receiptPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  consumeExecutionReceipt: {
    kind: 'release_governance_approved_action_consume_execution_receipt_preflight';
    actionRef?: string;
    executionAuthorityRef?: string;
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

export function preflightReleaseGovernanceApprovedActionConsumeExecutionReceipt(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflightInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflight {
  const receiptRef = normalize(input.receiptRef);
  const recorderRef = normalize(input.recorderRef);
  const receiptPolicyRef = normalize(input.receiptPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionAuthorityAllowed || !input.authority.consumeExecutionAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_preflight.execution_authority_not_allowed');
  }
  if (!input.authority.consumeApplicationAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_preflight.application_must_be_authorized');
  }
  if (!input.authority.approvedActionConsumeAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_preflight.consume_must_be_authorized');
  }
  if (!input.authority.approvedActionAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_preflight.action_must_be_authorized');
  }
  if (
    input.authority.actionConsumed !== false
    || input.authority.mergeAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!receiptRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_preflight.receipt_ref_required');
  }
  if (!recorderRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_preflight.recorder_ref_required');
  }
  if (!receiptPolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_preflight.receipt_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptPreflightAllowed: status === 'ready',
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
    ...(receiptRef ? { receiptRef } : {}),
    ...(recorderRef ? { recorderRef } : {}),
    ...(receiptPolicyRef ? { receiptPolicyRef } : {}),
    ...(input.authority.releaseLabel ? { releaseLabel: input.authority.releaseLabel } : {}),
    evidenceRefs: unique([...input.authority.evidenceRefs, receiptRef, receiptPolicyRef]),
    runbookSteps: [...input.authority.runbookSteps],
    consumeExecutionReceipt: {
      kind: 'release_governance_approved_action_consume_execution_receipt_preflight',
      ...(input.authority.actionId ? { actionRef: input.authority.actionId } : {}),
      ...(input.authority.executionAuthorityId ? { executionAuthorityRef: input.authority.executionAuthorityId } : {}),
      ...(receiptPolicyRef ? { policyRef: receiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_preflight_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_preflight_blockers'],
  };
}
