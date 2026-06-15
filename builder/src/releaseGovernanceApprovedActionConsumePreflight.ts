import type { ReleaseGovernanceApprovedActionAuthority } from './releaseGovernanceApprovedActionAuthority.js';

export type ReleaseGovernanceApprovedActionConsumePreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumePreflightInput {
  authority: ReleaseGovernanceApprovedActionAuthority;
  consumeRef?: string;
  consumerRef?: string;
  consumePolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumePreflight {
  status: ReleaseGovernanceApprovedActionConsumePreflightStatus;
  approvedActionConsumePreflightAllowed: boolean;
  approvedActionAuthorized: boolean;
  actionConsumed: false;
  mergeAllowed: false;
  externalActionAllowed: false;
  actionId?: string;
  consumeRef?: string;
  consumerRef?: string;
  consumePolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  actionConsume: {
    kind: 'release_governance_approved_action_consume_preflight';
    actionRef?: string;
    authorityRef?: string;
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

export function preflightReleaseGovernanceApprovedActionConsume(
  input: ReleaseGovernanceApprovedActionConsumePreflightInput,
): ReleaseGovernanceApprovedActionConsumePreflight {
  const consumeRef = normalize(input.consumeRef);
  const consumerRef = normalize(input.consumerRef);
  const consumePolicyRef = normalize(input.consumePolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `release_governance_approved_action_consume_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `release_governance_approved_action_consume_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.approvedActionAuthorityAllowed) {
    blockers.push('release_governance_approved_action_consume_preflight.authority_not_allowed');
  }
  if (!input.authority.approvedActionAuthorized) {
    blockers.push('release_governance_approved_action_consume_preflight.action_must_be_authorized');
  }
  if (
    input.authority.actionConsumed !== false
    || input.authority.mergeAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!consumeRef) {
    reviewItems.push('release_governance_approved_action_consume_preflight.consume_ref_required');
  }
  if (!consumerRef) {
    reviewItems.push('release_governance_approved_action_consume_preflight.consumer_ref_required');
  }
  if (!consumePolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_preflight.consume_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumePreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    approvedActionConsumePreflightAllowed: status === 'ready',
    approvedActionAuthorized: input.authority.approvedActionAuthorized,
    actionConsumed: false,
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(input.authority.actionId ? { actionId: input.authority.actionId } : {}),
    ...(consumeRef ? { consumeRef } : {}),
    ...(consumerRef ? { consumerRef } : {}),
    ...(consumePolicyRef ? { consumePolicyRef } : {}),
    ...(input.authority.releaseLabel ? { releaseLabel: input.authority.releaseLabel } : {}),
    evidenceRefs: unique([...input.authority.evidenceRefs, consumeRef, consumePolicyRef]),
    runbookSteps: [...input.authority.runbookSteps],
    actionConsume: {
      kind: 'release_governance_approved_action_consume_preflight',
      ...(input.authority.actionId ? { actionRef: input.authority.actionId } : {}),
      ...(input.authority.authorizedByRef ? { authorityRef: input.authority.authorizedByRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_preflight_review']
        : ['resolve_release_governance_approved_action_consume_preflight_blockers'],
  };
}
