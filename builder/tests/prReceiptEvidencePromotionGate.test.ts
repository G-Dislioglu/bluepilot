import assert from 'node:assert/strict';

import { gatePrReceiptEvidencePromotion } from '../src/prReceiptEvidencePromotionGate.js';
import type { PrReceiptLoaderEvidencePack } from '../src/prReceiptLoaderEvidencePack.js';

const evidencePack: PrReceiptLoaderEvidencePack = {
  status: 'ready',
  evidencePackAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  packRef: 'evidence-pack:bpk-054',
  releaseLabel: 'bpk-058-fixture',
  loadedPath: 'artifacts/pr-receipts/bpk-046.json',
  bytesRead: 512,
  summary: {
    candidateCount: 2,
    receiptCount: 2,
    evidenceRefCount: 2,
  },
  evidenceRefs: ['review-packets/BPK-046.md', 'review-packets/BPK-054.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPromotionGate(): void {
  const gate = gatePrReceiptEvidencePromotion({
    evidencePack,
    releaseManagerApprovalRef: 'approval:release-manager:bpk-058',
    promotionRef: 'promotion:pr-receipt-evidence:bpk-058',
  });

  assert.equal(gate.status, 'ready');
  assert.equal(gate.promotionAllowed, true);
  assert.equal(gate.mergeAllowed, false);
  assert.equal(gate.externalActionAllowed, false);
}

function testMissingApprovalRequiresReview(): void {
  const gate = gatePrReceiptEvidencePromotion({
    evidencePack,
    promotionRef: 'promotion:pr-receipt-evidence:bpk-058',
  });

  assert.equal(gate.status, 'review_required');
  assert.ok(gate.reviewItems.includes('pr_receipt_evidence_promotion.release_manager_approval_ref_required'));
}

function testBlockedPackBlocksPromotion(): void {
  const gate = gatePrReceiptEvidencePromotion({
    evidencePack: {
      ...evidencePack,
      status: 'blocked',
      evidencePackAllowed: false,
      blockers: ['pr_receipt_loader_evidence_pack.ready_loader_artifact_required'],
    },
    releaseManagerApprovalRef: 'approval:release-manager:bpk-058',
    promotionRef: 'promotion:pr-receipt-evidence:bpk-058',
  });

  assert.equal(gate.status, 'blocked');
  assert.ok(gate.blockers.includes('pr_receipt_evidence_promotion.pack_not_allowed'));
}

testReadyPromotionGate();
testMissingApprovalRequiresReview();
testBlockedPackBlocksPromotion();

console.log('prReceiptEvidencePromotionGate tests passed');
