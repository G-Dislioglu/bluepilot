import type { ReleaseGovernanceApprovedActionConsumeExecutionPreflight } from './releaseGovernanceApprovedActionConsumeExecutionPreflight.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionAuthorityInput {
  preflight: ReleaseGovernanceApprovedActionConsumeExecutionPreflight;
  executionAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionAuthority {
  status: ReleaseGovernanceApprovedActionConsumeExecutionAuthorityStatus;
  consumeExecutionAuthorityAllowed: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  approvedActionConsumeAuthorized: boolean;
  approvedActionAuthorized: boolean;
  actionConsumed: false;
  mergeAllowed: false;
  externalActionAllowed: false;
  actionId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  executionAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorizedExecution: {
    kind: 'release_governance_approved_action_consume_execution_authority';
    actionRef?: string;
    applicationAuthorityRef?: string;
    executionPreflightRef?: string;
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

export function authorizeReleaseGovernanceApprovedActionConsumeExecution(
  input: ReleaseGovernanceApprovedActionConsumeExecutionAuthorityInput,
): ReleaseGovernanceApprovedActionConsumeExecutionAuthority {
  const executionAuthorityId = normalize(input.executionAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `release_governance_approved_action_consume_execution_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `release_governance_approved_action_consume_execution_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionPreflightAllowed) {
    blockers.push('release_governance_approved_action_consume_execution_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeApplicationAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_authority.application_must_be_authorized');
  }
  if (!input.preflight.approvedActionConsumeAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_authority.consume_must_be_authorized');
  }
  if (!input.preflight.approvedActionAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_authority.action_must_be_authorized');
  }
  if (
    input.preflight.actionConsumed !== false
    || input.preflight.mergeAllowed !== false
    || input.preflight.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_authority.merge_and_external_actions_must_stay_closed');
  }
  if (!executionAuthorityId) {
    reviewItems.push('release_governance_approved_action_consume_execution_authority.execution_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_authority.expires_at_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionAuthorityAllowed: status === 'ready',
    consumeExecutionAuthorized: status === 'ready',
    consumeApplicationAuthorized: input.preflight.consumeApplicationAuthorized,
    approvedActionConsumeAuthorized: input.preflight.approvedActionConsumeAuthorized,
    approvedActionAuthorized: input.preflight.approvedActionAuthorized,
    actionConsumed: false,
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(input.preflight.actionId ? { actionId: input.preflight.actionId } : {}),
    ...(input.preflight.consumeAuthorityId ? { consumeAuthorityId: input.preflight.consumeAuthorityId } : {}),
    ...(input.preflight.applicationAuthorityId ? { applicationAuthorityId: input.preflight.applicationAuthorityId } : {}),
    ...(executionAuthorityId ? { executionAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    ...(input.preflight.releaseLabel ? { releaseLabel: input.preflight.releaseLabel } : {}),
    evidenceRefs: unique([...input.preflight.evidenceRefs, executionAuthorityId, expiresAtRef]),
    runbookSteps: [...input.preflight.runbookSteps],
    authorizedExecution: {
      kind: 'release_governance_approved_action_consume_execution_authority',
      ...(input.preflight.actionId ? { actionRef: input.preflight.actionId } : {}),
      ...(input.preflight.applicationAuthorityId ? { applicationAuthorityRef: input.preflight.applicationAuthorityId } : {}),
      ...(input.preflight.executionPreflightRef ? { executionPreflightRef: input.preflight.executionPreflightRef } : {}),
      ...(input.preflight.executionPolicyRef ? { policyRef: input.preflight.executionPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_preflight']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_authority_review']
        : ['resolve_release_governance_approved_action_consume_execution_authority_blockers'],
  };
}
