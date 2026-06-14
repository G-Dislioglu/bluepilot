import type { RuntimePatchAuthorityReviewIntake } from './runtimePatchAuthorityReviewIntake.js';

export type RuntimePatchAuthorityReviewDecision = 'approve' | 'defer' | 'reject';
export type RuntimePatchAuthorityReviewDecisionGateStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchAuthorityReviewDecisionGateInput {
  intake: RuntimePatchAuthorityReviewIntake;
  decision: RuntimePatchAuthorityReviewDecision;
  decisionRef?: string;
  authorityRef?: string;
  rationaleRef?: string;
}

export interface RuntimePatchAuthorityReviewDecisionGate {
  status: RuntimePatchAuthorityReviewDecisionGateStatus;
  authorityDecisionGateAllowed: boolean;
  decision: RuntimePatchAuthorityReviewDecision;
  permitIssued: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
  decisionRef?: string;
  authorityRef?: string;
  rationaleRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorityDecision: {
    kind: 'runtime_patch_authority_review_decision';
    requestKind: 'runtime_patch_permit_issuance_request';
    permitKind: 'runtime_patch_application';
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

export function decideRuntimePatchAuthorityReview(
  input: RuntimePatchAuthorityReviewDecisionGateInput,
): RuntimePatchAuthorityReviewDecisionGate {
  const decisionRef = normalize(input.decisionRef);
  const authorityRef = normalize(input.authorityRef);
  const rationaleRef = normalize(input.rationaleRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.intake.status === 'blocked') {
    blockers.push(...input.intake.blockers.map((blocker) => `runtime_patch_authority_review_decision.intake_blocked:${blocker}`));
  }
  if (input.intake.status === 'review_required') {
    reviewItems.push(...input.intake.reviewItems.map((item) => `runtime_patch_authority_review_decision.intake_review_required:${item}`));
  }
  if (!input.intake.authorityReviewIntakeAllowed) {
    blockers.push('runtime_patch_authority_review_decision.intake_not_allowed');
  }
  if (
    input.intake.permitIssued !== false
    || input.intake.patchApplyAllowed !== false
    || input.intake.serverMutationExecuted !== false
    || input.intake.routeMutationExecuted !== false
    || input.intake.executionExecuted !== false
    || input.intake.executionAllowed !== false
  ) {
    blockers.push('runtime_patch_authority_review_decision.runtime_action_gates_must_stay_closed');
  }
  if (!decisionRef) {
    reviewItems.push('runtime_patch_authority_review_decision.decision_ref_required');
  }
  if (!authorityRef) {
    reviewItems.push('runtime_patch_authority_review_decision.authority_ref_required');
  }
  if (!rationaleRef) {
    reviewItems.push('runtime_patch_authority_review_decision.rationale_ref_required');
  }
  if (input.decision !== 'approve') {
    blockers.push(`runtime_patch_authority_review_decision.authority_${input.decision}`);
  }

  const status: RuntimePatchAuthorityReviewDecisionGateStatus = blockers.length > 0
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
    executionExecuted: false,
    executionAllowed: false,
    ...(decisionRef ? { decisionRef } : {}),
    ...(authorityRef ? { authorityRef } : {}),
    ...(rationaleRef ? { rationaleRef } : {}),
    routePath: input.intake.routePath,
    envGateName: input.intake.envGateName,
    proposedFiles: [...input.intake.proposedFiles],
    evidenceRefs: unique([...input.intake.evidenceRefs, decisionRef, rationaleRef]),
    authorityDecision: {
      kind: 'runtime_patch_authority_review_decision',
      requestKind: 'runtime_patch_permit_issuance_request',
      permitKind: 'runtime_patch_application',
      ...(input.intake.authorityReviewRef ? { intakeRef: input.intake.authorityReviewRef } : {}),
      ...(input.intake.reviewerRef ? { reviewerRef: input.intake.reviewerRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_issue_preflight']
      : status === 'review_required'
        ? ['complete_runtime_patch_authority_review_decision_review']
        : ['resolve_runtime_patch_authority_review_decision_blockers'],
  };
}
