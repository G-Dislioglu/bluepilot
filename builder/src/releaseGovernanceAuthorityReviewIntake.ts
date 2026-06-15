import type { ReleaseGovernanceApprovedActionRequestPacket } from './releaseGovernanceApprovedActionRequestPacket.js';

export type ReleaseGovernanceAuthorityReviewIntakeStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceAuthorityReviewIntakeInput {
  requestPacket: ReleaseGovernanceApprovedActionRequestPacket;
  authorityReviewRef?: string;
  reviewerRef?: string;
  intakeEvidenceRef?: string;
}

export interface ReleaseGovernanceAuthorityReviewIntake {
  status: ReleaseGovernanceAuthorityReviewIntakeStatus;
  authorityReviewIntakeAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  authorityReviewRef?: string;
  reviewerRef?: string;
  intakeEvidenceRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorityReview: {
    kind: 'release_governance_authority_review_intake';
    requestKind: 'release_governance_approved_action_request';
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

export function intakeReleaseGovernanceAuthorityReview(
  input: ReleaseGovernanceAuthorityReviewIntakeInput,
): ReleaseGovernanceAuthorityReviewIntake {
  const authorityReviewRef = normalize(input.authorityReviewRef);
  const reviewerRef = normalize(input.reviewerRef);
  const intakeEvidenceRef = normalize(input.intakeEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.requestPacket.status === 'blocked') {
    blockers.push(...input.requestPacket.blockers.map((blocker) => `release_governance_authority_review_intake.request_blocked:${blocker}`));
  }
  if (input.requestPacket.status === 'review_required') {
    reviewItems.push(...input.requestPacket.reviewItems.map((item) => `release_governance_authority_review_intake.request_review_required:${item}`));
  }
  if (!input.requestPacket.requestPacketAllowed) {
    blockers.push('release_governance_authority_review_intake.request_packet_not_allowed');
  }
  if (input.requestPacket.mergeAllowed !== false || input.requestPacket.externalActionAllowed !== false) {
    blockers.push('release_governance_authority_review_intake.merge_and_external_actions_must_stay_closed');
  }
  if (!authorityReviewRef) {
    reviewItems.push('release_governance_authority_review_intake.authority_review_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('release_governance_authority_review_intake.reviewer_ref_required');
  }
  if (!intakeEvidenceRef) {
    reviewItems.push('release_governance_authority_review_intake.intake_evidence_ref_required');
  }

  const status: ReleaseGovernanceAuthorityReviewIntakeStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    authorityReviewIntakeAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(authorityReviewRef ? { authorityReviewRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    ...(intakeEvidenceRef ? { intakeEvidenceRef } : {}),
    ...(input.requestPacket.releaseLabel ? { releaseLabel: input.requestPacket.releaseLabel } : {}),
    evidenceRefs: unique([...input.requestPacket.evidenceRefs, authorityReviewRef, intakeEvidenceRef]),
    runbookSteps: [...input.requestPacket.runbookSteps],
    authorityReview: {
      kind: 'release_governance_authority_review_intake',
      requestKind: 'release_governance_approved_action_request',
      ...(input.requestPacket.requestRef ? { requestRef: input.requestPacket.requestRef } : {}),
      ...(input.requestPacket.requesterRef ? { requesterRef: input.requestPacket.requesterRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_authority_review_decision']
      : status === 'review_required'
        ? ['complete_release_governance_authority_review_intake_review']
        : ['resolve_release_governance_authority_review_intake_blockers'],
  };
}
