import assert from 'node:assert/strict';

import { buildPrReceiptLoaderOperatorRunbook } from '../src/prReceiptLoaderOperatorRunbook.js';
import type { PrReceiptFileLoaderImplementationResult } from '../src/prReceiptFileLoaderImplementation.js';

const loaderResult: PrReceiptFileLoaderImplementationResult = {
  status: 'ready',
  fileReadAllowed: true,
  path: 'artifacts/pr-receipts/bpk-046.json',
  bytesRead: 512,
  artifact: {
    status: 'ready',
    artifactSummary: {
      releaseLabel: 'bpk-046-fixture',
      candidateCount: 1,
      receiptCount: 1,
    },
    blockers: [],
    reviewItems: [],
    nextActions: [],
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRunbook(): void {
  const runbook = buildPrReceiptLoaderOperatorRunbook({
    loaderResult,
    operatorApprovalRef: 'approval:operator:bpk-050',
    rootPolicyRef: 'policy:local-pr-receipts-root',
    evidenceRefs: ['review-packets/BPK-046.md'],
  });

  assert.equal(runbook.status, 'ready');
  assert.equal(runbook.runbookAllowed, true);
  assert.equal(runbook.fileReadAllowed, false);
  assert.equal(runbook.externalActionAllowed, false);
}

function testMissingApprovalRequiresReview(): void {
  const runbook = buildPrReceiptLoaderOperatorRunbook({
    loaderResult,
    rootPolicyRef: 'policy:local-pr-receipts-root',
    evidenceRefs: ['review-packets/BPK-046.md'],
  });

  assert.equal(runbook.status, 'review_required');
  assert.ok(runbook.reviewItems.includes('pr_receipt_loader_runbook.operator_approval_ref_required'));
}

function testBlockedLoaderBlocksRunbook(): void {
  const runbook = buildPrReceiptLoaderOperatorRunbook({
    loaderResult: {
      ...loaderResult,
      status: 'blocked',
      artifact: undefined,
      blockers: ['pr_receipt_file_loader_impl.file_missing'],
    },
    operatorApprovalRef: 'approval:operator:bpk-050',
    rootPolicyRef: 'policy:local-pr-receipts-root',
    evidenceRefs: ['review-packets/BPK-046.md'],
  });

  assert.equal(runbook.status, 'blocked');
  assert.ok(runbook.blockers.includes('pr_receipt_loader_runbook.ready_loader_artifact_required'));
}

testReadyRunbook();
testMissingApprovalRequiresReview();
testBlockedLoaderBlocksRunbook();

console.log('prReceiptLoaderOperatorRunbook tests passed');
