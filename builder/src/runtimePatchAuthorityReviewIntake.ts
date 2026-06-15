import type { RuntimePatchPermitIssuanceRequestPacket } from './runtimePatchPermitIssuanceRequestPacket.js';

export type RuntimePatchAuthorityReviewIntakeStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchAuthorityReviewIntakeInput {
  requestPacket: RuntimePatchPermitIssuanceRequestPacket;
  authorityReviewRef?: string;
  reviewerRef?: string;
  intakeEvidenceRef?: string;
}

export interface RuntimePatchAuthorityReviewIntake {
  status: RuntimePatchAuthorityReviewIntakeStatus;
  authorityReviewIntakeAllowed: boolean;
  permitIssued: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
  authorityReviewRef?: string;
  reviewerRef?: string;
  intakeEvidenceRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorityReview: {
    kind: 'runtime_patch_authority_review_intake';
    requestKind: 'runtime_patch_permit_issuance_request';
    permitKind: 'runtime_patch_application';
    requestRef?: string;
    requesterRef?: string;
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

export function intakeRuntimePatchAuthorityReview(
  input: RuntimePatchAuthorityReviewIntakeInput,
): RuntimePatchAuthorityReviewIntake {
  const authorityReviewRef = normalize(input.authorityReviewRef);
  const reviewerRef = normalize(input.reviewerRef);
  const intakeEvidenceRef = normalize(input.intakeEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.requestPacket.status === 'blocked') {
    blockers.push(...input.requestPacket.blockers.map((blocker) => `runtime_patch_authority_review_intake.request_blocked:${blocker}`));
  }
  if (input.requestPacket.status === 'review_required') {
    reviewItems.push(...input.requestPacket.reviewItems.map((item) => `runtime_patch_authority_review_intake.request_review_required:${item}`));
  }
  if (!input.requestPacket.requestPacketAllowed) {
    blockers.push('runtime_patch_authority_review_intake.request_packet_not_allowed');
  }
  if (
    input.requestPacket.permitIssued !== false
    || input.requestPacket.patchApplyAllowed !== false
    || input.requestPacket.serverMutationExecuted !== false
    || input.requestPacket.routeMutationExecuted !== false
    || input.requestPacket.executionExecuted !== false
    || input.requestPacket.executionAllowed !== false
  ) {
    blockers.push('runtime_patch_authority_review_intake.runtime_action_gates_must_stay_closed');
  }
  if (!authorityReviewRef) {
    reviewItems.push('runtime_patch_authority_review_intake.authority_review_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('runtime_patch_authority_review_intake.reviewer_ref_required');
  }
  if (!intakeEvidenceRef) {
    reviewItems.push('runtime_patch_authority_review_intake.intake_evidence_ref_required');
  }

  const status: RuntimePatchAuthorityReviewIntakeStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    authorityReviewIntakeAllowed: status === 'ready',
    permitIssued: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    ...(authorityReviewRef ? { authorityReviewRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    ...(intakeEvidenceRef ? { intakeEvidenceRef } : {}),
    routePath: input.requestPacket.routePath,
    envGateName: input.requestPacket.envGateName,
    proposedFiles: [...input.requestPacket.proposedFiles],
    evidenceRefs: unique([...input.requestPacket.evidenceRefs, authorityReviewRef, intakeEvidenceRef]),
    authorityReview: {
      kind: 'runtime_patch_authority_review_intake',
      requestKind: 'runtime_patch_permit_issuance_request',
      permitKind: 'runtime_patch_application',
      ...(input.requestPacket.requestRef ? { requestRef: input.requestPacket.requestRef } : {}),
      ...(input.requestPacket.requesterRef ? { requesterRef: input.requestPacket.requesterRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_authority_review_decision']
      : status === 'review_required'
        ? ['complete_runtime_patch_authority_review_intake_review']
        : ['resolve_runtime_patch_authority_review_intake_blockers'],
  };
}
