import assert from 'node:assert/strict';

import { decidePrReceiptGovernanceRelease } from '../src/prReceiptGovernanceReleaseDecision.js';
import type { PrReceiptEvidencePromotionGate } from '../src/prReceiptEvidencePromotionGate.js';

const promotionGate: PrReceiptEvidencePromotionGate = {
  status: 'ready',
  promotionAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  promotionRef: 'promotion:pr-receipt-evidence:bpk-058',
  releaseManagerApprovalRef: 'approval:release-manager:bpk-058',
  releaseLabel: 'bpk-062-fixture',
  evidenceRefs: ['review-packets/BPK-054.md', 'review-packets/BPK-058.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyReleaseDecision(): void {
  const decision = decidePrReceiptGovernanceRelease({
    promotionGate,
    decisionRef: 'release-decision:bpk-062',
    governanceReviewerRef: 'reviewer:release-governance',
    releaseWindowRef: 'window:bpk-release-review',
  });

  assert.equal(decision.status, 'ready');
  assert.equal(decision.releaseGovernanceAllowed, true);
  assert.equal(decision.mergeAllowed, false);
  assert.equal(decision.externalActionAllowed, false);
}

function testMissingDecisionRefRequiresReview(): void {
  const decision = decidePrReceiptGovernanceRelease({
    promotionGate,
    governanceReviewerRef: 'reviewer:release-governance',
    releaseWindowRef: 'window:bpk-release-review',
  });

  assert.equal(decision.status, 'review_required');
  assert.ok(decision.reviewItems.includes('pr_receipt_governance_release.decision_ref_required'));
}

function testBlockedPromotionBlocksReleaseDecision(): void {
  const decision = decidePrReceiptGovernanceRelease({
    promotionGate: {
      ...promotionGate,
      status: 'blocked',
      promotionAllowed: false,
      blockers: ['pr_receipt_evidence_promotion.pack_not_allowed'],
    },
    decisionRef: 'release-decision:bpk-062',
    governanceReviewerRef: 'reviewer:release-governance',
    releaseWindowRef: 'window:bpk-release-review',
  });

  assert.equal(decision.status, 'blocked');
  assert.ok(decision.blockers.includes('pr_receipt_governance_release.promotion_not_allowed'));
}

testReadyReleaseDecision();
testMissingDecisionRefRequiresReview();
testBlockedPromotionBlocksReleaseDecision();

console.log('prReceiptGovernanceReleaseDecision tests passed');
