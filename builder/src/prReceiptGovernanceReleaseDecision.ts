import type { PrReceiptEvidencePromotionGate } from './prReceiptEvidencePromotionGate.js';

export type PrReceiptGovernanceReleaseDecisionStatus = 'ready' | 'review_required' | 'blocked';

export interface PrReceiptGovernanceReleaseDecisionInput {
  promotionGate: PrReceiptEvidencePromotionGate;
  decisionRef?: string;
  governanceReviewerRef?: string;
  releaseWindowRef?: string;
}

export interface PrReceiptGovernanceReleaseDecision {
  status: PrReceiptGovernanceReleaseDecisionStatus;
  releaseGovernanceAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  decisionRef?: string;
  governanceReviewerRef?: string;
  releaseWindowRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
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

export function decidePrReceiptGovernanceRelease(
  input: PrReceiptGovernanceReleaseDecisionInput,
): PrReceiptGovernanceReleaseDecision {
  const decisionRef = normalize(input.decisionRef);
  const governanceReviewerRef = normalize(input.governanceReviewerRef);
  const releaseWindowRef = normalize(input.releaseWindowRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.promotionGate.status === 'blocked') {
    blockers.push(...input.promotionGate.blockers.map((blocker) => `pr_receipt_governance_release.promotion_blocked:${blocker}`));
  }
  if (input.promotionGate.status === 'review_required') {
    reviewItems.push(...input.promotionGate.reviewItems.map((item) => `pr_receipt_governance_release.promotion_review_required:${item}`));
  }
  if (!input.promotionGate.promotionAllowed) {
    blockers.push('pr_receipt_governance_release.promotion_not_allowed');
  }
  if (input.promotionGate.mergeAllowed !== false || input.promotionGate.externalActionAllowed !== false) {
    blockers.push('pr_receipt_governance_release.external_actions_must_stay_closed');
  }
  if (!decisionRef) {
    reviewItems.push('pr_receipt_governance_release.decision_ref_required');
  }
  if (!governanceReviewerRef) {
    reviewItems.push('pr_receipt_governance_release.governance_reviewer_ref_required');
  }
  if (!releaseWindowRef) {
    reviewItems.push('pr_receipt_governance_release.release_window_ref_required');
  }

  const status: PrReceiptGovernanceReleaseDecisionStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    releaseGovernanceAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(decisionRef ? { decisionRef } : {}),
    ...(governanceReviewerRef ? { governanceReviewerRef } : {}),
    ...(releaseWindowRef ? { releaseWindowRef } : {}),
    ...(input.promotionGate.releaseLabel ? { releaseLabel: input.promotionGate.releaseLabel } : {}),
    evidenceRefs: [...input.promotionGate.evidenceRefs],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['record_release_governance_decision_without_merge']
      : status === 'review_required'
        ? ['complete_pr_receipt_governance_release_review']
        : ['resolve_pr_receipt_governance_release_blockers'],
  };
}
