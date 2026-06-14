import assert from 'node:assert/strict';

import { prepareMemoryCacheAuditExportApprovedActionPermit } from '../src/memoryCacheAuditExportApprovedActionPermitPrep.js';
import type { MemoryCacheAuditExportDecisionGate } from '../src/memoryCacheAuditExportDecisionGate.js';

const decisionGate: MemoryCacheAuditExportDecisionGate = {
  status: 'ready',
  decisionGateAllowed: true,
  decision: 'approve',
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  decisionRef: 'decision:aicos-cache-export',
  operatorRef: 'operator:cache',
  approvalRef: 'approval:aicos-cache-export',
  format: 'markdown',
  cacheRef: 'memory:aicos-cards',
  previewLines: ['cacheRef: memory:aicos-cards'],
  evidenceRefs: ['review-packets/BPK-080.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPermitPrep(): void {
  const prep = prepareMemoryCacheAuditExportApprovedActionPermit({
    decisionGate,
    permitPrepRef: 'permit-prep:aicos-cache-export',
    requesterRef: 'requester:operator',
    scopeRef: 'scope:aicos-cache-export',
  });

  assert.equal(prep.status, 'ready');
  assert.equal(prep.permitPrepAllowed, true);
  assert.equal(prep.permitIssued, false);
  assert.equal(prep.fileWriteAllowed, false);
  assert.equal(prep.permitRequest.kind, 'memory_cache_audit_export');
}

function testMissingPermitPrepRefRequiresReview(): void {
  const prep = prepareMemoryCacheAuditExportApprovedActionPermit({
    decisionGate,
    requesterRef: 'requester:operator',
    scopeRef: 'scope:aicos-cache-export',
  });

  assert.equal(prep.status, 'review_required');
  assert.ok(prep.reviewItems.includes('memory_cache_audit_export_permit_prep.permit_prep_ref_required'));
}

function testBlockedDecisionBlocksPermitPrep(): void {
  const prep = prepareMemoryCacheAuditExportApprovedActionPermit({
    decisionGate: {
      ...decisionGate,
      status: 'blocked',
      decisionGateAllowed: false,
      blockers: ['memory_cache_audit_export_decision.evidence_not_allowed'],
    },
    permitPrepRef: 'permit-prep:aicos-cache-export',
    requesterRef: 'requester:operator',
    scopeRef: 'scope:aicos-cache-export',
  });

  assert.equal(prep.status, 'blocked');
  assert.ok(prep.blockers.includes('memory_cache_audit_export_permit_prep.decision_gate_not_allowed'));
}

testReadyPermitPrep();
testMissingPermitPrepRefRequiresReview();
testBlockedDecisionBlocksPermitPrep();

console.log('memoryCacheAuditExportApprovedActionPermitPrep tests passed');
