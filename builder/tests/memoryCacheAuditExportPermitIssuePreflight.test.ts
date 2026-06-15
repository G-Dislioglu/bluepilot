import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitIssue } from '../src/memoryCacheAuditExportPermitIssuePreflight.js';
import type { MemoryCacheAuditExportAuthorityReviewDecisionGate } from '../src/memoryCacheAuditExportAuthorityReviewDecisionGate.js';

const decisionGate: MemoryCacheAuditExportAuthorityReviewDecisionGate = {
  status: 'ready',
  authorityDecisionGateAllowed: true,
  decision: 'approve',
  permitIssued: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  decisionRef: 'decision:memory-authority',
  authorityRef: 'authority:operator',
  rationaleRef: 'rationale:memory',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-104.md'],
  authorityDecision: {
    kind: 'memory_cache_audit_export_authority_review_decision',
    requestKind: 'memory_cache_audit_export_permit_issuance_request',
    permitKind: 'memory_cache_audit_export',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitIssue({
    decisionGate,
    preflightRef: 'preflight:memory',
    issuerRef: 'issuer:authority',
    issuePolicyRef: 'policy:export-permit-issue',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.permitIssuePreflightAllowed, true);
  assert.equal(preflight.permitIssued, false);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.permitIssue.kind, 'memory_cache_audit_export_permit_issue_preflight');
}

function testMissingPreflightRefRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitIssue({
    decisionGate,
    issuerRef: 'issuer:authority',
    issuePolicyRef: 'policy:export-permit-issue',
  });

  assert.equal(preflight.status, 'review_required');
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_issue_preflight.preflight_ref_required'));
}

function testDeferredDecisionBlocksPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitIssue({
    decisionGate: { ...decisionGate, status: 'blocked', authorityDecisionGateAllowed: false, decision: 'defer', blockers: ['deferred'] },
    preflightRef: 'preflight:memory',
    issuerRef: 'issuer:authority',
    issuePolicyRef: 'policy:export-permit-issue',
  });

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_issue_preflight.decision_gate_not_allowed'));
}

testReadyPreflight();
testMissingPreflightRefRequiresReview();
testDeferredDecisionBlocksPreflight();

console.log('memoryCacheAuditExportPermitIssuePreflight tests passed');
