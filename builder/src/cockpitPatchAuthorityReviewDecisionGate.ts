import type { CockpitPatchAuthorityReviewIntake } from './cockpitPatchAuthorityReviewIntake.js';

export type CockpitPatchAuthorityReviewDecision = 'approve' | 'defer' | 'reject';
export type CockpitPatchAuthorityReviewDecisionGateStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchAuthorityReviewDecisionGateInput {
  intake: CockpitPatchAuthorityReviewIntake;
  decision: CockpitPatchAuthorityReviewDecision;
  decisionRef?: string;
  authorityRef?: string;
  rationaleRef?: string;
}

export interface CockpitPatchAuthorityReviewDecisionGate {
  status: CockpitPatchAuthorityReviewDecisionGateStatus;
  authorityDecisionGateAllowed: boolean;
  decision: CockpitPatchAuthorityReviewDecision;
  permitIssued: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  decisionRef?: string;
  authorityRef?: string;
  rationaleRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorityDecision: {
    kind: 'cockpit_patch_authority_review_decision';
    requestKind: 'cockpit_patch_permit_issuance_request';
    permitKind: 'cockpit_patch_application';
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

export function decideCockpitPatchAuthorityReview(
  input: CockpitPatchAuthorityReviewDecisionGateInput,
): CockpitPatchAuthorityReviewDecisionGate {
  const decisionRef = normalize(input.decisionRef);
  const authorityRef = normalize(input.authorityRef);
  const rationaleRef = normalize(input.rationaleRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.intake.status === 'blocked') {
    blockers.push(...input.intake.blockers.map((blocker) => `cockpit_patch_authority_review_decision.intake_blocked:${blocker}`));
  }
  if (input.intake.status === 'review_required') {
    reviewItems.push(...input.intake.reviewItems.map((item) => `cockpit_patch_authority_review_decision.intake_review_required:${item}`));
  }
  if (!input.intake.authorityReviewIntakeAllowed) {
    blockers.push('cockpit_patch_authority_review_decision.intake_not_allowed');
  }
  if (
    input.intake.permitIssued !== false
    || input.intake.patchApplyAllowed !== false
    || input.intake.serverMutationExecuted !== false
    || input.intake.routeMutationExecuted !== false
    || input.intake.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_authority_review_decision.action_gates_must_stay_closed');
  }
  if (!decisionRef) {
    reviewItems.push('cockpit_patch_authority_review_decision.decision_ref_required');
  }
  if (!authorityRef) {
    reviewItems.push('cockpit_patch_authority_review_decision.authority_ref_required');
  }
  if (!rationaleRef) {
    reviewItems.push('cockpit_patch_authority_review_decision.rationale_ref_required');
  }
  if (input.decision !== 'approve') {
    blockers.push(`cockpit_patch_authority_review_decision.authority_${input.decision}`);
  }

  const status: CockpitPatchAuthorityReviewDecisionGateStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    authorityDecisionGateAllowed: status === 'ready',
    decision: input.decision,
    permitIssued: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(decisionRef ? { decisionRef } : {}),
    ...(authorityRef ? { authorityRef } : {}),
    ...(rationaleRef ? { rationaleRef } : {}),
    routePath: input.intake.routePath,
    envGateName: input.intake.envGateName,
    proposedFiles: [...input.intake.proposedFiles],
    evidenceRefs: unique([...input.intake.evidenceRefs, decisionRef, rationaleRef]),
    authorityDecision: {
      kind: 'cockpit_patch_authority_review_decision',
      requestKind: 'cockpit_patch_permit_issuance_request',
      permitKind: 'cockpit_patch_application',
      ...(input.intake.authorityReviewRef ? { intakeRef: input.intake.authorityReviewRef } : {}),
      ...(input.intake.reviewerRef ? { reviewerRef: input.intake.reviewerRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_issue_preflight']
      : status === 'review_required'
        ? ['complete_cockpit_patch_authority_review_decision_review']
        : ['resolve_cockpit_patch_authority_review_decision_blockers'],
  };
}
