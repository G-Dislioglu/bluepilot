import assert from 'node:assert/strict';

import { buildBranchPrReceiptIntakeReport } from '../src/branchPrReceiptIntakeReport.js';
import type { BpkBranchCandidate } from '../src/bpkBranchMergeReleaseSequencing.js';

const candidates: BpkBranchCandidate[] = [
  {
    taskId: 'BPK-023',
    branch: 'bpk-023-026-consolidation-live-runtime-decisions',
    commit: '00fa035',
    status: 'pushed',
    title: 'Decision bundle',
    summary: 'Add consolidation, cockpit, cache, and runtime decisions.',
    checks: [{ name: 'builder-test', status: 'pass' }],
  },
];

const receipt = {
  taskId: 'BPK-023',
  prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/23',
  headCommit: '00fa035',
  reviewDecision: 'approved',
  checks: [{ name: 'builder-test', status: 'pass' }],
};

function testReadyReportAllowsMergeWithGreenReceipt(): void {
  const report = buildBranchPrReceiptIntakeReport({
    releaseLabel: 'bpk-decision-bundle',
    candidates,
    receipts: [receipt],
    requirePrReceipts: true,
  });

  assert.equal(report.status, 'ready');
  assert.equal(report.mergeAllowed, true);
  assert.equal(report.receiptCoverage.acceptedReceipts, 1);
  assert.ok(report.reportLines.includes('merge_allowed:true'));
}

function testIncompleteReceiptCoverageBlocks(): void {
  const report = buildBranchPrReceiptIntakeReport({
    releaseLabel: 'bpk-decision-bundle',
    candidates,
    receipts: [],
    requirePrReceipts: true,
  });

  assert.equal(report.status, 'blocked');
  assert.equal(report.mergeAllowed, false);
  assert.ok(report.blockers.includes('pr_receipt_intake.receipt_coverage_incomplete:0/1'));
}

function testQuarantinedReceiptRequiresReview(): void {
  const report = buildBranchPrReceiptIntakeReport({
    releaseLabel: 'bpk-decision-bundle',
    candidates,
    receipts: [{ ...receipt, reviewDecision: 'ship_it' }],
  });

  assert.equal(report.status, 'review_required');
  assert.equal(report.receiptCoverage.quarantinedReceipts, 1);
  assert.ok(report.reviewItems.some((item) => item.includes('bpk_manual_pr.invalid_review_decision:ship_it')));
}

testReadyReportAllowsMergeWithGreenReceipt();
testIncompleteReceiptCoverageBlocks();
testQuarantinedReceiptRequiresReview();

console.log('branchPrReceiptIntakeReport tests passed');
