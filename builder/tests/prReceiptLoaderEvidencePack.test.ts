import assert from 'node:assert/strict';

import { buildPrReceiptLoaderEvidencePack } from '../src/prReceiptLoaderEvidencePack.js';
import type { PrReceiptFileLoaderImplementationResult } from '../src/prReceiptFileLoaderImplementation.js';
import type { PrReceiptLoaderOperatorRunbook } from '../src/prReceiptLoaderOperatorRunbook.js';

const loaderResult: PrReceiptFileLoaderImplementationResult = {
  status: 'ready',
  fileReadAllowed: true,
  path: 'artifacts/pr-receipts/bpk-046.json',
  bytesRead: 512,
  artifact: {
    status: 'ready',
    artifactSummary: {
      releaseLabel: 'bpk-054-fixture',
      candidateCount: 2,
      receiptCount: 2,
    },
    blockers: [],
    reviewItems: [],
    nextActions: [],
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const runbook: PrReceiptLoaderOperatorRunbook = {
  status: 'ready',
  runbookAllowed: true,
  fileReadAllowed: false,
  externalActionAllowed: false,
  operatorApprovalRef: 'approval:operator:bpk-050',
  rootPolicyRef: 'policy:local-pr-receipts-root',
  evidenceRefs: ['review-packets/BPK-046.md', 'review-packets/BPK-050.md'],
  checklist: [],
  steps: [],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyEvidencePack(): void {
  const pack = buildPrReceiptLoaderEvidencePack({
    loaderResult,
    runbook,
    evidenceRefs: ['review-packets/BPK-054.md'],
    packRef: 'evidence-pack:bpk-054',
  });

  assert.equal(pack.status, 'ready');
  assert.equal(pack.evidencePackAllowed, true);
  assert.equal(pack.mergeAllowed, false);
  assert.equal(pack.externalActionAllowed, false);
  assert.equal(pack.summary.receiptCount, 2);
}

function testMissingPackRefRequiresReview(): void {
  const pack = buildPrReceiptLoaderEvidencePack({
    loaderResult,
    runbook,
  });

  assert.equal(pack.status, 'review_required');
  assert.ok(pack.reviewItems.includes('pr_receipt_loader_evidence_pack.pack_ref_required'));
}

function testBlockedRunbookBlocksPack(): void {
  const pack = buildPrReceiptLoaderEvidencePack({
    loaderResult,
    runbook: {
      ...runbook,
      status: 'blocked',
      runbookAllowed: false,
      blockers: ['pr_receipt_loader_runbook.ready_loader_artifact_required'],
    },
    evidenceRefs: ['review-packets/BPK-054.md'],
    packRef: 'evidence-pack:bpk-054',
  });

  assert.equal(pack.status, 'blocked');
  assert.ok(pack.blockers.includes('pr_receipt_loader_evidence_pack.runbook_not_allowed'));
}

testReadyEvidencePack();
testMissingPackRefRequiresReview();
testBlockedRunbookBlocksPack();

console.log('prReceiptLoaderEvidencePack tests passed');
