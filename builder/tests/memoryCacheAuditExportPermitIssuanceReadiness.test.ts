import assert from 'node:assert/strict';

import { buildMemoryCacheAuditExportPermitIssuanceReadiness } from '../src/memoryCacheAuditExportPermitIssuanceReadiness.js';
import type { MemoryCacheAuditExportPermitPrepEvidence } from '../src/memoryCacheAuditExportPermitPrepEvidence.js';

const evidence: MemoryCacheAuditExportPermitPrepEvidence = {
  status: 'ready',
  evidencePackAllowed: true,
  permitIssued: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  evidenceRef: 'review-packets/BPK-088.md',
  reviewerRef: 'reviewer:operator',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-088.md'],
  permitRequest: { kind: 'memory_cache_audit_export', decisionRef: 'decision:memory', approvalRef: 'approval:memory' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyIssuanceReadiness(): void {
  const readiness = buildMemoryCacheAuditExportPermitIssuanceReadiness({
    evidence,
    issuanceReadinessRef: 'issuance-readiness:memory',
    issuerRef: 'issuer:operator',
    policyRef: 'policy:export-permit',
  });

  assert.equal(readiness.status, 'ready');
  assert.equal(readiness.permitIssuanceReadinessAllowed, true);
  assert.equal(readiness.permitIssued, false);
  assert.equal(readiness.fileWriteAllowed, false);
  assert.equal(readiness.issuanceGate.kind, 'memory_cache_audit_export_permit_issuance');
}

function testMissingPolicyRequiresReview(): void {
  const readiness = buildMemoryCacheAuditExportPermitIssuanceReadiness({
    evidence,
    issuanceReadinessRef: 'issuance-readiness:memory',
    issuerRef: 'issuer:operator',
  });

  assert.equal(readiness.status, 'review_required');
  assert.ok(readiness.reviewItems.includes('memory_cache_audit_export_permit_issuance_readiness.policy_ref_required'));
}

function testBlockedEvidenceBlocksReadiness(): void {
  const readiness = buildMemoryCacheAuditExportPermitIssuanceReadiness({
    evidence: { ...evidence, status: 'blocked', evidencePackAllowed: false, blockers: ['blocked'] },
    issuanceReadinessRef: 'issuance-readiness:memory',
    issuerRef: 'issuer:operator',
    policyRef: 'policy:export-permit',
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.blockers.includes('memory_cache_audit_export_permit_issuance_readiness.evidence_pack_not_allowed'));
}

testReadyIssuanceReadiness();
testMissingPolicyRequiresReview();
testBlockedEvidenceBlocksReadiness();

console.log('memoryCacheAuditExportPermitIssuanceReadiness tests passed');
