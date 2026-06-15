import assert from 'node:assert/strict';

import { evaluateMemoryCacheAuditExportDecisionGate } from '../src/memoryCacheAuditExportDecisionGate.js';
import type { MemoryCacheAuditExportPreviewEvidence } from '../src/memoryCacheAuditExportPreviewEvidence.js';

const evidence: MemoryCacheAuditExportPreviewEvidence = {
  status: 'ready',
  evidencePackAllowed: true,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  evidenceRef: 'evidence:aicos-cache-preview',
  reviewerRef: 'reviewer:operator',
  format: 'markdown',
  cacheRef: 'memory:aicos-cards',
  preview: 'cacheRef: memory:aicos-cards',
  previewLines: ['cacheRef: memory:aicos-cards'],
  evidenceRefs: ['review-packets/BPK-076.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testApprovedDecisionGate(): void {
  const gate = evaluateMemoryCacheAuditExportDecisionGate({
    evidence,
    decision: 'approve',
    decisionRef: 'decision:aicos-cache-export',
    operatorRef: 'operator:cache',
    approvalRef: 'approval:aicos-cache-export',
  });

  assert.equal(gate.status, 'ready');
  assert.equal(gate.decisionGateAllowed, true);
  assert.equal(gate.fileWriteAllowed, false);
  assert.equal(gate.durablePersistenceAllowed, false);
}

function testMissingDecisionRefRequiresReview(): void {
  const gate = evaluateMemoryCacheAuditExportDecisionGate({
    evidence,
    decision: 'approve',
    operatorRef: 'operator:cache',
    approvalRef: 'approval:aicos-cache-export',
  });

  assert.equal(gate.status, 'review_required');
  assert.ok(gate.reviewItems.includes('memory_cache_audit_export_decision.decision_ref_required'));
}

function testBlockedEvidenceBlocksDecisionGate(): void {
  const gate = evaluateMemoryCacheAuditExportDecisionGate({
    evidence: {
      ...evidence,
      status: 'blocked',
      evidencePackAllowed: false,
      blockers: ['memory_cache_audit_preview_evidence.render_dry_run_not_allowed'],
    },
    decision: 'approve',
    decisionRef: 'decision:aicos-cache-export',
    operatorRef: 'operator:cache',
    approvalRef: 'approval:aicos-cache-export',
  });

  assert.equal(gate.status, 'blocked');
  assert.ok(gate.blockers.includes('memory_cache_audit_export_decision.evidence_not_allowed'));
}

testApprovedDecisionGate();
testMissingDecisionRefRequiresReview();
testBlockedEvidenceBlocksDecisionGate();

console.log('memoryCacheAuditExportDecisionGate tests passed');
