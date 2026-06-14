import assert from 'node:assert/strict';

import { decideMemoryCacheAuditExportAuthorityReview } from '../src/memoryCacheAuditExportAuthorityReviewDecisionGate.js';
import type { MemoryCacheAuditExportAuthorityReviewIntake } from '../src/memoryCacheAuditExportAuthorityReviewIntake.js';

const intake: MemoryCacheAuditExportAuthorityReviewIntake = {
  status: 'ready',
  authorityReviewIntakeAllowed: true,
  permitIssued: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  authorityReviewRef: 'authority-review:memory',
  reviewerRef: 'authority:operator',
  intakeEvidenceRef: 'review-packets/BPK-100.md',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-100.md'],
  authorityReview: {
    kind: 'memory_cache_audit_export_authority_review_intake',
    requestKind: 'memory_cache_audit_export_permit_issuance_request',
    permitKind: 'memory_cache_audit_export',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testApprovedDecisionGate(): void {
  const gate = decideMemoryCacheAuditExportAuthorityReview({
    intake,
    decision: 'approve',
    decisionRef: 'decision:memory-authority',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:memory',
  });

  assert.equal(gate.status, 'ready');
  assert.equal(gate.authorityDecisionGateAllowed, true);
  assert.equal(gate.permitIssued, false);
  assert.equal(gate.fileWriteAllowed, false);
  assert.equal(gate.authorityDecision.kind, 'memory_cache_audit_export_authority_review_decision');
}

function testMissingDecisionRefRequiresReview(): void {
  const gate = decideMemoryCacheAuditExportAuthorityReview({
    intake,
    decision: 'approve',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:memory',
  });

  assert.equal(gate.status, 'review_required');
  assert.ok(gate.reviewItems.includes('memory_cache_audit_export_authority_review_decision.decision_ref_required'));
}

function testRejectedDecisionBlocksGate(): void {
  const gate = decideMemoryCacheAuditExportAuthorityReview({
    intake,
    decision: 'reject',
    decisionRef: 'decision:memory-authority',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:memory',
  });

  assert.equal(gate.status, 'blocked');
  assert.ok(gate.blockers.includes('memory_cache_audit_export_authority_review_decision.authority_reject'));
}

testApprovedDecisionGate();
testMissingDecisionRefRequiresReview();
testRejectedDecisionBlocksGate();

console.log('memoryCacheAuditExportAuthorityReviewDecisionGate tests passed');
