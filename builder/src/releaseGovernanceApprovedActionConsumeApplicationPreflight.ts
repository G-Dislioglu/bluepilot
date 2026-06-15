import type { ReleaseGovernanceApprovedActionConsumeAuthority } from './releaseGovernanceApprovedActionConsumeAuthority.js';

export type ReleaseGovernanceApprovedActionConsumeApplicationPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeApplicationPreflightInput {
  authority: ReleaseGovernanceApprovedActionConsumeAuthority;
  applicationRef?: string;
  operatorRef?: string;
  applicationPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeApplicationPreflight {
  status: ReleaseGovernanceApprovedActionConsumeApplicationPreflightStatus;
  consumeApplicationPreflightAllowed: boolean;
  approvedActionConsumeAuthorized: boolean;
  approvedActionAuthorized: boolean;
  actionConsumed: false;
  mergeAllowed: false;
  externalActionAllowed: false;
  actionId?: string;
  consumeAuthorityId?: string;
  applicationRef?: string;
  operatorRef?: string;
  applicationPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  consumeApplication: {
    kind: 'release_governance_approved_action_consume_application_preflight';
    actionRef?: string;
    authorityRef?: string;
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

export function preflightReleaseGovernanceApprovedActionConsumeApplication(
  input: ReleaseGovernanceApprovedActionConsumeApplicationPreflightInput,
): ReleaseGovernanceApprovedActionConsumeApplicationPreflight {
  const applicationRef = normalize(input.applicationRef);
  const operatorRef = normalize(input.operatorRef);
  const applicationPolicyRef = normalize(input.applicationPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `release_governance_approved_action_consume_application_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `release_governance_approved_action_consume_application_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.approvedActionConsumeAuthorityAllowed) {
    blockers.push('release_governance_approved_action_consume_application_preflight.authority_not_allowed');
  }
  if (!input.authority.approvedActionConsumeAuthorized) {
    blockers.push('release_governance_approved_action_consume_application_preflight.consume_must_be_authorized');
  }
  if (
    input.authority.actionConsumed !== false
    || input.authority.mergeAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_application_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!applicationRef) {
    reviewItems.push('release_governance_approved_action_consume_application_preflight.application_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('release_governance_approved_action_consume_application_preflight.operator_ref_required');
  }
  if (!applicationPolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_application_preflight.application_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeApplicationPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeApplicationPreflightAllowed: status === 'ready',
    approvedActionConsumeAuthorized: input.authority.approvedActionConsumeAuthorized,
    approvedActionAuthorized: input.authority.approvedActionAuthorized,
    actionConsumed: false,
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(input.authority.actionId ? { actionId: input.authority.actionId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(applicationRef ? { applicationRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(applicationPolicyRef ? { applicationPolicyRef } : {}),
    ...(input.authority.releaseLabel ? { releaseLabel: input.authority.releaseLabel } : {}),
    evidenceRefs: unique([...input.authority.evidenceRefs, applicationRef, applicationPolicyRef]),
    runbookSteps: [...input.authority.runbookSteps],
    consumeApplication: {
      kind: 'release_governance_approved_action_consume_application_preflight',
      ...(input.authority.actionId ? { actionRef: input.authority.actionId } : {}),
      ...(input.authority.consumeAuthorityId ? { authorityRef: input.authority.consumeAuthorityId } : {}),
      ...(applicationPolicyRef ? { policyRef: applicationPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_application_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_application_preflight_review']
        : ['resolve_release_governance_approved_action_consume_application_preflight_blockers'],
  };
}
