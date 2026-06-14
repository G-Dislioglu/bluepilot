import type { ReleaseGovernanceAuthorityReviewDecisionGate } from './releaseGovernanceAuthorityReviewDecisionGate.js';

export type ReleaseGovernanceApprovedActionPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionPreflightInput {
  decisionGate: ReleaseGovernanceAuthorityReviewDecisionGate;
  preflightRef?: string;
  executorRef?: string;
  actionPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionPreflight {
  status: ReleaseGovernanceApprovedActionPreflightStatus;
  approvedActionPreflightAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  preflightRef?: string;
  executorRef?: string;
  actionPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  approvedAction: {
    kind: 'release_governance_approved_action_preflight';
    decisionRef?: string;
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

export function preflightReleaseGovernanceApprovedAction(
  input: ReleaseGovernanceApprovedActionPreflightInput,
): ReleaseGovernanceApprovedActionPreflight {
  const preflightRef = normalize(input.preflightRef);
  const executorRef = normalize(input.executorRef);
  const actionPolicyRef = normalize(input.actionPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.decisionGate.status === 'blocked') {
    blockers.push(...input.decisionGate.blockers.map((blocker) => `release_governance_approved_action_preflight.decision_blocked:${blocker}`));
  }
  if (input.decisionGate.status === 'review_required') {
    reviewItems.push(...input.decisionGate.reviewItems.map((item) => `release_governance_approved_action_preflight.decision_review_required:${item}`));
  }
  if (!input.decisionGate.authorityDecisionGateAllowed) {
    blockers.push('release_governance_approved_action_preflight.decision_gate_not_allowed');
  }
  if (input.decisionGate.decision !== 'approve') {
    blockers.push('release_governance_approved_action_preflight.decision_must_be_approve');
  }
  if (input.decisionGate.mergeAllowed !== false || input.decisionGate.externalActionAllowed !== false) {
    blockers.push('release_governance_approved_action_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!preflightRef) {
    reviewItems.push('release_governance_approved_action_preflight.preflight_ref_required');
  }
  if (!executorRef) {
    reviewItems.push('release_governance_approved_action_preflight.executor_ref_required');
  }
  if (!actionPolicyRef) {
    reviewItems.push('release_governance_approved_action_preflight.action_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    approvedActionPreflightAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(preflightRef ? { preflightRef } : {}),
    ...(executorRef ? { executorRef } : {}),
    ...(actionPolicyRef ? { actionPolicyRef } : {}),
    ...(input.decisionGate.releaseLabel ? { releaseLabel: input.decisionGate.releaseLabel } : {}),
    evidenceRefs: unique([...input.decisionGate.evidenceRefs, preflightRef, actionPolicyRef]),
    runbookSteps: [...input.decisionGate.runbookSteps],
    approvedAction: {
      kind: 'release_governance_approved_action_preflight',
      ...(input.decisionGate.decisionRef ? { decisionRef: input.decisionGate.decisionRef } : {}),
      ...(input.decisionGate.authorityRef ? { authorityRef: input.decisionGate.authorityRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_preflight_review']
        : ['resolve_release_governance_approved_action_preflight_blockers'],
  };
}
