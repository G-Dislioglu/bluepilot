import type { ReleaseGovernanceAuthorityReviewIntake } from './releaseGovernanceAuthorityReviewIntake.js';

export type ReleaseGovernanceAuthorityReviewDecision = 'approve' | 'defer' | 'reject';
export type ReleaseGovernanceAuthorityReviewDecisionGateStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceAuthorityReviewDecisionGateInput {
  intake: ReleaseGovernanceAuthorityReviewIntake;
  decision: ReleaseGovernanceAuthorityReviewDecision;
  decisionRef?: string;
  authorityRef?: string;
  rationaleRef?: string;
}

export interface ReleaseGovernanceAuthorityReviewDecisionGate {
  status: ReleaseGovernanceAuthorityReviewDecisionGateStatus;
  authorityDecisionGateAllowed: boolean;
  decision: ReleaseGovernanceAuthorityReviewDecision;
  mergeAllowed: false;
  externalActionAllowed: false;
  decisionRef?: string;
  authorityRef?: string;
  rationaleRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorityDecision: {
    kind: 'release_governance_authority_review_decision';
    requestKind: 'release_governance_approved_action_request';
    intakeRef?: string;
    reviewerRef?: string;
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

export function decideReleaseGovernanceAuthorityReview(
  input: ReleaseGovernanceAuthorityReviewDecisionGateInput,
): ReleaseGovernanceAuthorityReviewDecisionGate {
  const decisionRef = normalize(input.decisionRef);
  const authorityRef = normalize(input.authorityRef);
  const rationaleRef = normalize(input.rationaleRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.intake.status === 'blocked') {
    blockers.push(...input.intake.blockers.map((blocker) => `release_governance_authority_review_decision.intake_blocked:${blocker}`));
  }
  if (input.intake.status === 'review_required') {
    reviewItems.push(...input.intake.reviewItems.map((item) => `release_governance_authority_review_decision.intake_review_required:${item}`));
  }
  if (!input.intake.authorityReviewIntakeAllowed) {
    blockers.push('release_governance_authority_review_decision.intake_not_allowed');
  }
  if (input.intake.mergeAllowed !== false || input.intake.externalActionAllowed !== false) {
    blockers.push('release_governance_authority_review_decision.merge_and_external_actions_must_stay_closed');
  }
  if (!decisionRef) {
    reviewItems.push('release_governance_authority_review_decision.decision_ref_required');
  }
  if (!authorityRef) {
    reviewItems.push('release_governance_authority_review_decision.authority_ref_required');
  }
  if (!rationaleRef) {
    reviewItems.push('release_governance_authority_review_decision.rationale_ref_required');
  }
  if (input.decision !== 'approve') {
    blockers.push(`release_governance_authority_review_decision.authority_${input.decision}`);
  }

  const status: ReleaseGovernanceAuthorityReviewDecisionGateStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    authorityDecisionGateAllowed: status === 'ready',
    decision: input.decision,
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(decisionRef ? { decisionRef } : {}),
    ...(authorityRef ? { authorityRef } : {}),
    ...(rationaleRef ? { rationaleRef } : {}),
    ...(input.intake.releaseLabel ? { releaseLabel: input.intake.releaseLabel } : {}),
    evidenceRefs: unique([...input.intake.evidenceRefs, decisionRef, rationaleRef]),
    runbookSteps: [...input.intake.runbookSteps],
    authorityDecision: {
      kind: 'release_governance_authority_review_decision',
      requestKind: 'release_governance_approved_action_request',
      ...(input.intake.authorityReviewRef ? { intakeRef: input.intake.authorityReviewRef } : {}),
      ...(input.intake.reviewerRef ? { reviewerRef: input.intake.reviewerRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_preflight']
      : status === 'review_required'
        ? ['complete_release_governance_authority_review_decision_review']
        : ['resolve_release_governance_authority_review_decision_blockers'],
  };
}
