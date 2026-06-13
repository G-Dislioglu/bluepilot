import assert from 'node:assert/strict';

import { decidePrReceiptArtifactFileLoader } from '../src/prReceiptArtifactFileLoaderDecision.js';

function testReadyFileLoaderDecision(): void {
  const decision = decidePrReceiptArtifactFileLoader({
    path: 'artifacts/pr-receipts/bpk-031.json',
    operatorApprovalRef: 'operator:BPK-038',
    maxBytes: 4096,
  });

  assert.equal(decision.status, 'ready');
  assert.equal(decision.fileReadAllowed, true);
}

function testMissingApprovalRequiresReview(): void {
  const decision = decidePrReceiptArtifactFileLoader({
    path: 'artifacts/pr-receipts/bpk-031.json',
  });

  assert.equal(decision.status, 'review_required');
  assert.equal(decision.fileReadAllowed, false);
  assert.ok(decision.reviewItems.includes('pr_receipt_file_loader.operator_approval_ref_required'));
}

function testUnsafePathBlocks(): void {
  const decision = decidePrReceiptArtifactFileLoader({
    path: '../secrets/pr.json',
    operatorApprovalRef: 'operator:BPK-038',
  });

  assert.equal(decision.status, 'blocked');
  assert.equal(decision.fileReadAllowed, false);
  assert.ok(decision.blockers.some((blocker) => blocker.startsWith('pr_receipt_file_loader.relative_segment_forbidden:')));
}

testReadyFileLoaderDecision();
testMissingApprovalRequiresReview();
testUnsafePathBlocks();

console.log('prReceiptArtifactFileLoaderDecision tests passed');
