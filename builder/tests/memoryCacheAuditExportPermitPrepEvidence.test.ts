import assert from 'node:assert/strict';

import { buildMemoryCacheAuditExportPermitPrepEvidence } from '../src/memoryCacheAuditExportPermitPrepEvidence.js';
import type { MemoryCacheAuditExportApprovedActionPermitPrep } from '../src/memoryCacheAuditExportApprovedActionPermitPrep.js';

const permitPrep: MemoryCacheAuditExportApprovedActionPermitPrep = {
  status: 'ready',
  permitPrepAllowed: true,
  permitIssued: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  permitPrepRef: 'permit-prep:memory-cache-export',
  requesterRef: 'requester:operator',
  scopeRef: 'scope:memory-cache-export',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-084.md'],
  permitRequest: {
    kind: 'memory_cache_audit_export',
    decisionRef: 'decision:memory-cache-export',
    approvalRef: 'approval:memory-cache-export',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyEvidencePack(): void {
  const evidence = buildMemoryCacheAuditExportPermitPrepEvidence({
    permitPrep,
    evidenceRef: 'review-packets/BPK-088.md',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-080.md'],
  });

  assert.equal(evidence.status, 'ready');
  assert.equal(evidence.evidencePackAllowed, true);
  assert.equal(evidence.permitIssued, false);
  assert.equal(evidence.fileWriteAllowed, false);
  assert.equal(evidence.permitRequest.kind, 'memory_cache_audit_export');
  assert.ok(evidence.evidenceRefs.includes('review-packets/BPK-084.md'));
  assert.ok(evidence.evidenceRefs.includes('review-packets/BPK-088.md'));
}

function testMissingEvidenceRefRequiresReview(): void {
  const evidence = buildMemoryCacheAuditExportPermitPrepEvidence({
    permitPrep,
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-080.md'],
  });

  assert.equal(evidence.status, 'review_required');
  assert.ok(evidence.reviewItems.includes('memory_cache_audit_export_permit_prep_evidence.evidence_ref_required'));
}

function testBlockedPermitPrepBlocksEvidencePack(): void {
  const evidence = buildMemoryCacheAuditExportPermitPrepEvidence({
    permitPrep: {
      ...permitPrep,
      status: 'blocked',
      permitPrepAllowed: false,
      blockers: ['memory_cache_audit_export_permit_prep.decision_gate_not_allowed'],
    },
    evidenceRef: 'review-packets/BPK-088.md',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-080.md'],
  });

  assert.equal(evidence.status, 'blocked');
  assert.equal(evidence.evidencePackAllowed, false);
  assert.ok(evidence.blockers.includes('memory_cache_audit_export_permit_prep_evidence.permit_prep_not_allowed'));
}

testReadyEvidencePack();
testMissingEvidenceRefRequiresReview();
testBlockedPermitPrepBlocksEvidencePack();

console.log('memoryCacheAuditExportPermitPrepEvidence tests passed');
