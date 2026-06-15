import assert from 'node:assert/strict';

import { intakeMemoryCacheAuditExportAuthorityReview } from '../src/memoryCacheAuditExportAuthorityReviewIntake.js';
import type { MemoryCacheAuditExportPermitIssuanceRequestPacket } from '../src/memoryCacheAuditExportPermitIssuanceRequestPacket.js';

const requestPacket: MemoryCacheAuditExportPermitIssuanceRequestPacket = {
  status: 'ready',
  requestPacketAllowed: true,
  permitIssued: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  requestRef: 'request:memory',
  requesterRef: 'requester:operator',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-096.md'],
  packet: { kind: 'memory_cache_audit_export_permit_issuance_request', permitKind: 'memory_cache_audit_export' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyIntake(): void {
  const intake = intakeMemoryCacheAuditExportAuthorityReview({
    requestPacket,
    authorityReviewRef: 'authority-review:memory',
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-100.md',
  });

  assert.equal(intake.status, 'ready');
  assert.equal(intake.authorityReviewIntakeAllowed, true);
  assert.equal(intake.permitIssued, false);
  assert.equal(intake.fileWriteAllowed, false);
  assert.equal(intake.authorityReview.kind, 'memory_cache_audit_export_authority_review_intake');
}

function testMissingAuthorityRefRequiresReview(): void {
  const intake = intakeMemoryCacheAuditExportAuthorityReview({
    requestPacket,
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-100.md',
  });

  assert.equal(intake.status, 'review_required');
  assert.ok(intake.reviewItems.includes('memory_cache_audit_export_authority_review_intake.authority_review_ref_required'));
}

function testBlockedPacketBlocksIntake(): void {
  const intake = intakeMemoryCacheAuditExportAuthorityReview({
    requestPacket: { ...requestPacket, status: 'blocked', requestPacketAllowed: false, blockers: ['blocked'] },
    authorityReviewRef: 'authority-review:memory',
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-100.md',
  });

  assert.equal(intake.status, 'blocked');
  assert.ok(intake.blockers.includes('memory_cache_audit_export_authority_review_intake.request_packet_not_allowed'));
}

testReadyIntake();
testMissingAuthorityRefRequiresReview();
testBlockedPacketBlocksIntake();

console.log('memoryCacheAuditExportAuthorityReviewIntake tests passed');
