import type { PrReceiptLoaderEvidencePack } from './prReceiptLoaderEvidencePack.js';

export type PrReceiptEvidencePromotionGateStatus = 'ready' | 'review_required' | 'blocked';

export interface PrReceiptEvidencePromotionGateInput {
  evidencePack: PrReceiptLoaderEvidencePack;
  releaseManagerApprovalRef?: string;
  promotionRef?: string;
}

export interface PrReceiptEvidencePromotionGate {
  status: PrReceiptEvidencePromotionGateStatus;
  promotionAllowed: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  promotionRef?: string;
  releaseManagerApprovalRef?: string;
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

export function gatePrReceiptEvidencePromotion(
  input: PrReceiptEvidencePromotionGateInput,
): PrReceiptEvidencePromotionGate {
  const releaseManagerApprovalRef = normalize(input.releaseManagerApprovalRef);
  const promotionRef = normalize(input.promotionRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.evidencePack.status === 'blocked') {
    blockers.push(...input.evidencePack.blockers.map((blocker) => `pr_receipt_evidence_promotion.pack_blocked:${blocker}`));
  }
  if (input.evidencePack.status === 'review_required') {
    reviewItems.push(...input.evidencePack.reviewItems.map((item) => `pr_receipt_evidence_promotion.pack_review_required:${item}`));
  }
  if (!input.evidencePack.evidencePackAllowed) {
    blockers.push('pr_receipt_evidence_promotion.pack_not_allowed');
  }
  if (input.evidencePack.mergeAllowed !== false || input.evidencePack.externalActionAllowed !== false) {
    blockers.push('pr_receipt_evidence_promotion.external_actions_must_stay_closed');
  }
  if (!releaseManagerApprovalRef) {
    reviewItems.push('pr_receipt_evidence_promotion.release_manager_approval_ref_required');
  }
  if (!promotionRef) {
    reviewItems.push('pr_receipt_evidence_promotion.promotion_ref_required');
  }

  const status: PrReceiptEvidencePromotionGateStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    promotionAllowed: status === 'ready',
    mergeAllowed: false,
    externalActionAllowed: false,
    ...(promotionRef ? { promotionRef } : {}),
    ...(releaseManagerApprovalRef ? { releaseManagerApprovalRef } : {}),
    ...(input.evidencePack.releaseLabel ? { releaseLabel: input.evidencePack.releaseLabel } : {}),
    evidenceRefs: [...input.evidencePack.evidenceRefs],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['promote_evidence_to_release_governance_review_without_merge']
      : status === 'review_required'
        ? ['complete_pr_receipt_evidence_promotion_review']
        : ['resolve_pr_receipt_evidence_promotion_blockers'],
  };
}
