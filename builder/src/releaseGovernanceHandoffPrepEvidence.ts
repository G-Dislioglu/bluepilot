import type { ReleaseGovernanceApprovedActionHandoffPrep } from './releaseGovernanceApprovedActionHandoffPrep.js';

export type ReleaseGovernanceHandoffPrepEvidenceStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceHandoffPrepEvidenceInput {
  handoffPrep: ReleaseGovernanceApprovedActionHandoffPrep;
  evidenceRef?: string;
  reviewerRef?: string;
  evidenceRefs?: string[];
}

export interface ReleaseGovernanceHandoffPrepEvidence {
  status: ReleaseGovernanceHandoffPrepEvidenceStatus;
  evidencePackAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  evidenceRef?: string;
  reviewerRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  handoffPacket: {
    kind: 'release_governance_approved_action';
    decisionRef?: string;
    approvalRef?: string;
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

export function buildReleaseGovernanceHandoffPrepEvidence(
  input: ReleaseGovernanceHandoffPrepEvidenceInput,
): ReleaseGovernanceHandoffPrepEvidence {
  const evidenceRef = normalize(input.evidenceRef);
  const reviewerRef = normalize(input.reviewerRef);
  const suppliedEvidenceRefs = unique((input.evidenceRefs ?? []).map((ref) => ref.trim()));
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.handoffPrep.status === 'blocked') {
    blockers.push(...input.handoffPrep.blockers.map((blocker) => `release_governance_handoff_prep_evidence.handoff_prep_blocked:${blocker}`));
  }
  if (input.handoffPrep.status === 'review_required') {
    reviewItems.push(...input.handoffPrep.reviewItems.map((item) => `release_governance_handoff_prep_evidence.handoff_prep_review_required:${item}`));
  }
  if (!input.handoffPrep.handoffPrepAllowed) {
    blockers.push('release_governance_handoff_prep_evidence.handoff_prep_not_allowed');
  }
  if (input.handoffPrep.mergeAllowed !== false || input.handoffPrep.externalActionAllowed !== false) {
    blockers.push('release_governance_handoff_prep_evidence.merge_and_external_actions_must_stay_closed');
  }
  if (!evidenceRef) {
    reviewItems.push('release_governance_handoff_prep_evidence.evidence_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('release_governance_handoff_prep_evidence.reviewer_ref_required');
  }
  if (suppliedEvidenceRefs.length === 0) {
    reviewItems.push('release_governance_handoff_prep_evidence.evidence_refs_required');
  }

  const status: ReleaseGovernanceHandoffPrepEvidenceStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    evidencePackAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(evidenceRef ? { evidenceRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    ...(input.handoffPrep.releaseLabel ? { releaseLabel: input.handoffPrep.releaseLabel } : {}),
    evidenceRefs: unique([...input.handoffPrep.evidenceRefs, ...suppliedEvidenceRefs, evidenceRef]),
    runbookSteps: [...input.handoffPrep.runbookSteps],
    handoffPacket: {
      kind: 'release_governance_approved_action',
      ...(input.handoffPrep.handoffPacket.decisionRef ? { decisionRef: input.handoffPrep.handoffPacket.decisionRef } : {}),
      ...(input.handoffPrep.handoffPacket.approvalRef ? { approvalRef: input.handoffPrep.handoffPacket.approvalRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['attach_release_governance_handoff_prep_evidence_to_operator_review']
      : status === 'review_required'
        ? ['complete_release_governance_handoff_prep_evidence_review']
        : ['resolve_release_governance_handoff_prep_evidence_blockers'],
  };
}
