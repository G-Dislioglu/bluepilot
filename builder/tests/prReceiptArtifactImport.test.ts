import assert from 'node:assert/strict';

import { importPrReceiptArtifact } from '../src/prReceiptArtifactImport.js';

const artifact = {
  releaseLabel: 'bpk-operational-preflight',
  candidates: [{
    taskId: 'BPK-030',
    branch: 'bpk-027-030-operational-preflight-bundle',
    commit: '244dfea',
    status: 'pushed',
    title: 'Operational preflight',
    summary: 'Add report, adapter, cache, and route preflight plans.',
    checks: [{ name: 'builder-test', status: 'pass' }],
  }],
  receipts: [{
    taskId: 'BPK-030',
    prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/30',
    headCommit: '244dfea',
    reviewDecision: 'approved',
    checks: [{ name: 'builder-test', status: 'pass' }],
  }],
};

function testImportsObjectArtifact(): void {
  const result = importPrReceiptArtifact({
    artifact,
    requirePrReceipts: true,
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.report?.mergeAllowed, true);
  assert.equal(result.artifactSummary.candidateCount, 1);
  assert.equal(result.artifactSummary.receiptCount, 1);
}

function testImportsJsonStringArtifact(): void {
  const result = importPrReceiptArtifact({
    artifact: JSON.stringify(artifact),
    requirePrReceipts: true,
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.report?.receiptCoverage.acceptedReceipts, 1);
}

function testInvalidJsonBlocks(): void {
  const result = importPrReceiptArtifact({
    artifact: '{not json',
    requirePrReceipts: true,
  });

  assert.equal(result.status, 'blocked');
  assert.ok(result.blockers.includes('pr_receipt_artifact.invalid_json_or_empty_artifact'));
}

function testBadReceiptRequiresReview(): void {
  const result = importPrReceiptArtifact({
    artifact: {
      ...artifact,
      receipts: [{ ...artifact.receipts[0], reviewDecision: 'later' }],
    },
  });

  assert.equal(result.status, 'review_required');
  assert.ok(result.reviewItems.some((item) => item.includes('bpk_manual_pr.invalid_review_decision:later')));
}

testImportsObjectArtifact();
testImportsJsonStringArtifact();
testInvalidJsonBlocks();
testBadReceiptRequiresReview();

console.log('prReceiptArtifactImport tests passed');
