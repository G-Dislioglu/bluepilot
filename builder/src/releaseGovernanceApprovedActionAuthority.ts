import type { ReleaseGovernanceApprovedActionPreflight } from './releaseGovernanceApprovedActionPreflight.js';

export type ReleaseGovernanceApprovedActionAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionAuthorityInput {
  preflight: ReleaseGovernanceApprovedActionPreflight;
  actionId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface ReleaseGovernanceApprovedActionAuthority {
  status: ReleaseGovernanceApprovedActionAuthorityStatus;
  approvedActionAuthorityAllowed: boolean;
  approvedActionAuthorized: boolean;
  actionConsumed: false;
  mergeAllowed: false;
  externalActionAllowed: false;
  actionId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorizedAction: {
    kind: 'release_governance_approved_action_authority';
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

export function authorizeReleaseGovernanceApprovedAction(
  input: ReleaseGovernanceApprovedActionAuthorityInput,
): ReleaseGovernanceApprovedActionAuthority {
  const actionId = normalize(input.actionId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `release_governance_approved_action_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `release_governance_approved_action_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.approvedActionPreflightAllowed) {
    blockers.push('release_governance_approved_action_authority.preflight_not_allowed');
  }
  if (input.preflight.mergeAllowed !== false || input.preflight.externalActionAllowed !== false) {
    blockers.push('release_governance_approved_action_authority.merge_and_external_actions_must_stay_closed');
  }
  if (!actionId) {
    reviewItems.push('release_governance_approved_action_authority.action_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('release_governance_approved_action_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('release_governance_approved_action_authority.expires_at_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    approvedActionAuthorityAllowed: status === 'ready',
    approvedActionAuthorized: status === 'ready',
    actionConsumed: false,
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(actionId ? { actionId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    ...(input.preflight.releaseLabel ? { releaseLabel: input.preflight.releaseLabel } : {}),
    evidenceRefs: unique([...input.preflight.evidenceRefs, actionId, expiresAtRef]),
    runbookSteps: [...input.preflight.runbookSteps],
    authorizedAction: {
      kind: 'release_governance_approved_action_authority',
      ...(input.preflight.preflightRef ? { preflightRef: input.preflight.preflightRef } : {}),
      ...(input.preflight.actionPolicyRef ? { policyRef: input.preflight.actionPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_preflight']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_authority_review']
        : ['resolve_release_governance_approved_action_authority_blockers'],
  };
}
