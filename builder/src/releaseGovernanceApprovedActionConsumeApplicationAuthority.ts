import type { ReleaseGovernanceApprovedActionConsumeApplicationPreflight } from './releaseGovernanceApprovedActionConsumeApplicationPreflight.js';

export type ReleaseGovernanceApprovedActionConsumeApplicationAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeApplicationAuthorityInput {
  preflight: ReleaseGovernanceApprovedActionConsumeApplicationPreflight;
  applicationAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeApplicationAuthority {
  status: ReleaseGovernanceApprovedActionConsumeApplicationAuthorityStatus;
  consumeApplicationAuthorityAllowed: boolean;
  consumeApplicationAuthorized: boolean;
  approvedActionConsumeAuthorized: boolean;
  approvedActionAuthorized: boolean;
  actionConsumed: false;
  mergeAllowed: false;
  externalActionAllowed: false;
  actionId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorizedApplication: {
    kind: 'release_governance_approved_action_consume_application_authority';
    actionRef?: string;
    applicationRef?: string;
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

export function authorizeReleaseGovernanceApprovedActionConsumeApplication(
  input: ReleaseGovernanceApprovedActionConsumeApplicationAuthorityInput,
): ReleaseGovernanceApprovedActionConsumeApplicationAuthority {
  const applicationAuthorityId = normalize(input.applicationAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `release_governance_approved_action_consume_application_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `release_governance_approved_action_consume_application_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeApplicationPreflightAllowed) {
    blockers.push('release_governance_approved_action_consume_application_authority.preflight_not_allowed');
  }
  if (!input.preflight.approvedActionConsumeAuthorized) {
    blockers.push('release_governance_approved_action_consume_application_authority.consume_must_be_authorized');
  }
  if (
    input.preflight.actionConsumed !== false
    || input.preflight.mergeAllowed !== false
    || input.preflight.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_application_authority.merge_and_external_actions_must_stay_closed');
  }
  if (!applicationAuthorityId) {
    reviewItems.push('release_governance_approved_action_consume_application_authority.application_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('release_governance_approved_action_consume_application_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('release_governance_approved_action_consume_application_authority.expires_at_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeApplicationAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeApplicationAuthorityAllowed: status === 'ready',
    consumeApplicationAuthorized: status === 'ready',
    approvedActionConsumeAuthorized: input.preflight.approvedActionConsumeAuthorized,
    approvedActionAuthorized: input.preflight.approvedActionAuthorized,
    actionConsumed: false,
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(input.preflight.actionId ? { actionId: input.preflight.actionId } : {}),
    ...(input.preflight.consumeAuthorityId ? { consumeAuthorityId: input.preflight.consumeAuthorityId } : {}),
    ...(applicationAuthorityId ? { applicationAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    ...(input.preflight.releaseLabel ? { releaseLabel: input.preflight.releaseLabel } : {}),
    evidenceRefs: unique([...input.preflight.evidenceRefs, applicationAuthorityId, expiresAtRef]),
    runbookSteps: [...input.preflight.runbookSteps],
    authorizedApplication: {
      kind: 'release_governance_approved_action_consume_application_authority',
      ...(input.preflight.actionId ? { actionRef: input.preflight.actionId } : {}),
      ...(input.preflight.applicationRef ? { applicationRef: input.preflight.applicationRef } : {}),
      ...(input.preflight.applicationPolicyRef ? { policyRef: input.preflight.applicationPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_preflight']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_application_authority_review']
        : ['resolve_release_governance_approved_action_consume_application_authority_blockers'],
  };
}
