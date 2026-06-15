import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflight } from './releaseGovernanceApprovedActionConsumeExecutionReceiptPreflight.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthorityInput {
  preflight: ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflight;
  receiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthority {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthorityStatus;
  consumeExecutionReceiptAuthorityAllowed: boolean;
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
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorizedReceipt: {
    kind: 'release_governance_approved_action_consume_execution_receipt_authority';
    actionRef?: string;
    executionAuthorityRef?: string;
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

export function authorizeReleaseGovernanceApprovedActionConsumeExecutionReceipt(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthorityInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthority {
  const receiptAuthorityId = normalize(input.receiptAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptPreflightAllowed) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_authority.execution_must_be_authorized');
  }
  if (!input.preflight.approvedActionConsumeAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_authority.consume_must_be_authorized');
  }
  if (
    input.preflight.actionConsumed !== false
    || input.preflight.executionReceiptRecorded !== false
    || input.preflight.mergeAllowed !== false
    || input.preflight.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_authority.merge_and_external_actions_must_stay_closed');
  }
  if (!receiptAuthorityId) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_authority.receipt_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_authority.expires_at_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptAuthorized: status === 'ready',
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
    ...(receiptAuthorityId ? { receiptAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    ...(input.preflight.releaseLabel ? { releaseLabel: input.preflight.releaseLabel } : {}),
    evidenceRefs: unique([...input.preflight.evidenceRefs, receiptAuthorityId, expiresAtRef]),
    runbookSteps: [...input.preflight.runbookSteps],
    authorizedReceipt: {
      kind: 'release_governance_approved_action_consume_execution_receipt_authority',
      ...(input.preflight.actionId ? { actionRef: input.preflight.actionId } : {}),
      ...(input.preflight.executionAuthorityId ? { executionAuthorityRef: input.preflight.executionAuthorityId } : {}),
      ...(input.preflight.receiptRef ? { receiptRef: input.preflight.receiptRef } : {}),
      ...(input.preflight.receiptPolicyRef ? { policyRef: input.preflight.receiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_preflight']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_authority_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_authority_blockers'],
  };
}
