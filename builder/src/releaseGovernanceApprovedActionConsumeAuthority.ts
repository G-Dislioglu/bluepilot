import type { ReleaseGovernanceApprovedActionConsumePreflight } from './releaseGovernanceApprovedActionConsumePreflight.js';

export type ReleaseGovernanceApprovedActionConsumeAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeAuthorityInput {
  preflight: ReleaseGovernanceApprovedActionConsumePreflight;
  consumeAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeAuthority {
  status: ReleaseGovernanceApprovedActionConsumeAuthorityStatus;
  approvedActionConsumeAuthorityAllowed: boolean;
  approvedActionConsumeAuthorized: boolean;
  approvedActionAuthorized: boolean;
  actionConsumed: false;
  mergeAllowed: false;
  externalActionAllowed: false;
  actionId?: string;
  consumeAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorizedConsume: {
    kind: 'release_governance_approved_action_consume_authority';
    actionRef?: string;
    preflightRef?: string;
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

export function authorizeReleaseGovernanceApprovedActionConsume(
  input: ReleaseGovernanceApprovedActionConsumeAuthorityInput,
): ReleaseGovernanceApprovedActionConsumeAuthority {
  const consumeAuthorityId = normalize(input.consumeAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `release_governance_approved_action_consume_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `release_governance_approved_action_consume_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.approvedActionConsumePreflightAllowed) {
    blockers.push('release_governance_approved_action_consume_authority.preflight_not_allowed');
  }
  if (!input.preflight.approvedActionAuthorized) {
    blockers.push('release_governance_approved_action_consume_authority.action_must_be_authorized');
  }
  if (
    input.preflight.actionConsumed !== false
    || input.preflight.mergeAllowed !== false
    || input.preflight.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_authority.merge_and_external_actions_must_stay_closed');
  }
  if (!consumeAuthorityId) {
    reviewItems.push('release_governance_approved_action_consume_authority.consume_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('release_governance_approved_action_consume_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('release_governance_approved_action_consume_authority.expires_at_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    approvedActionConsumeAuthorityAllowed: status === 'ready',
    approvedActionConsumeAuthorized: status === 'ready',
    approvedActionAuthorized: input.preflight.approvedActionAuthorized,
    actionConsumed: false,
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(input.preflight.actionId ? { actionId: input.preflight.actionId } : {}),
    ...(consumeAuthorityId ? { consumeAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    ...(input.preflight.releaseLabel ? { releaseLabel: input.preflight.releaseLabel } : {}),
    evidenceRefs: unique([...input.preflight.evidenceRefs, consumeAuthorityId, expiresAtRef]),
    runbookSteps: [...input.preflight.runbookSteps],
    authorizedConsume: {
      kind: 'release_governance_approved_action_consume_authority',
      ...(input.preflight.actionId ? { actionRef: input.preflight.actionId } : {}),
      ...(input.preflight.consumeRef ? { preflightRef: input.preflight.consumeRef } : {}),
      ...(input.preflight.consumePolicyRef ? { policyRef: input.preflight.consumePolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_application_preflight']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_authority_review']
        : ['resolve_release_governance_approved_action_consume_authority_blockers'],
  };
}
