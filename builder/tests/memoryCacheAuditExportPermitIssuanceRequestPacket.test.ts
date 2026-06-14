import assert from 'node:assert/strict';

import { buildMemoryCacheAuditExportPermitIssuanceRequestPacket } from '../src/memoryCacheAuditExportPermitIssuanceRequestPacket.js';
import type { MemoryCacheAuditExportPermitIssuanceReadiness } from '../src/memoryCacheAuditExportPermitIssuanceReadiness.js';

const readiness: MemoryCacheAuditExportPermitIssuanceReadiness = {
  status: 'ready',
  permitIssuanceReadinessAllowed: true,
  permitIssued: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  issuanceReadinessRef: 'issuance-readiness:memory',
  issuerRef: 'issuer:operator',
  policyRef: 'policy:export-permit',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-092.md'],
  permitRequest: { kind: 'memory_cache_audit_export' },
  issuanceGate: { kind: 'memory_cache_audit_export_permit_issuance' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRequestPacket(): void {
  const packet = buildMemoryCacheAuditExportPermitIssuanceRequestPacket({
    readiness,
    requestRef: 'request:memory',
    requesterRef: 'requester:operator',
  });

  assert.equal(packet.status, 'ready');
  assert.equal(packet.requestPacketAllowed, true);
  assert.equal(packet.permitIssued, false);
  assert.equal(packet.fileWriteAllowed, false);
  assert.equal(packet.packet.kind, 'memory_cache_audit_export_permit_issuance_request');
}

function testMissingRequestRefRequiresReview(): void {
  const packet = buildMemoryCacheAuditExportPermitIssuanceRequestPacket({ readiness, requesterRef: 'requester:operator' });

  assert.equal(packet.status, 'review_required');
  assert.ok(packet.reviewItems.includes('memory_cache_audit_export_permit_issuance_request.request_ref_required'));
}

function testBlockedReadinessBlocksPacket(): void {
  const packet = buildMemoryCacheAuditExportPermitIssuanceRequestPacket({
    readiness: { ...readiness, status: 'blocked', permitIssuanceReadinessAllowed: false, blockers: ['blocked'] },
    requestRef: 'request:memory',
    requesterRef: 'requester:operator',
  });

  assert.equal(packet.status, 'blocked');
  assert.ok(packet.blockers.includes('memory_cache_audit_export_permit_issuance_request.readiness_not_allowed'));
}

testReadyRequestPacket();
testMissingRequestRefRequiresReview();
testBlockedReadinessBlocksPacket();

console.log('memoryCacheAuditExportPermitIssuanceRequestPacket tests passed');
