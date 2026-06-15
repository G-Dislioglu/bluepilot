import type { ReleaseGovernanceOperatorActionRunbook } from './releaseGovernanceOperatorActionRunbook.js';

export type ReleaseGovernanceRunbookEvidenceStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceRunbookEvidenceInput {
  runbook: ReleaseGovernanceOperatorActionRunbook;
  evidenceRef?: string;
  reviewerRef?: string;
  handoffRef?: string;
}

export interface ReleaseGovernanceRunbookEvidence {
  status: ReleaseGovernanceRunbookEvidenceStatus;
  evidencePackAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  evidenceRef?: string;
  reviewerRef?: string;
  handoffRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildReleaseGovernanceRunbookEvidence(
  input: ReleaseGovernanceRunbookEvidenceInput,
): ReleaseGovernanceRunbookEvidence {
  const evidenceRef = normalize(input.evidenceRef);
  const reviewerRef = normalize(input.reviewerRef);
  const handoffRef = normalize(input.handoffRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.runbook.status === 'blocked') {
    blockers.push(...input.runbook.blockers.map((blocker) => `release_runbook_evidence.runbook_blocked:${blocker}`));
  }
  if (input.runbook.status === 'review_required') {
    reviewItems.push(...input.runbook.reviewItems.map((item) => `release_runbook_evidence.runbook_review_required:${item}`));
  }
  if (!input.runbook.runbookAllowed) {
    blockers.push('release_runbook_evidence.runbook_not_allowed');
  }
  if (input.runbook.mergeAllowed !== false || input.runbook.externalActionAllowed !== false) {
    blockers.push('release_runbook_evidence.merge_and_external_actions_must_stay_closed');
  }
  if (!evidenceRef) {
    reviewItems.push('release_runbook_evidence.evidence_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('release_runbook_evidence.reviewer_ref_required');
  }
  if (!handoffRef) {
    reviewItems.push('release_runbook_evidence.handoff_ref_required');
  }

  const status: ReleaseGovernanceRunbookEvidenceStatus = blockers.length > 0
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
    ...(handoffRef ? { handoffRef } : {}),
    ...(input.runbook.releaseLabel ? { releaseLabel: input.runbook.releaseLabel } : {}),
    evidenceRefs: [...input.runbook.evidenceRefs],
    runbookSteps: [...input.runbook.runbookSteps],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['attach_release_governance_runbook_evidence_to_operator_review']
      : status === 'review_required'
        ? ['complete_release_governance_runbook_evidence_review']
        : ['resolve_release_governance_runbook_evidence_blockers'],
  };
}
