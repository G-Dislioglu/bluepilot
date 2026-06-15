import assert from 'node:assert/strict';

import { issueMemoryCacheAuditExportPermitAuthority } from '../src/memoryCacheAuditExportPermitIssueAuthority.js';
import type { MemoryCacheAuditExportPermitIssuePreflight } from '../src/memoryCacheAuditExportPermitIssuePreflight.js';

const preflight: MemoryCacheAuditExportPermitIssuePreflight = {
  status: 'ready',
  permitIssuePreflightAllowed: true,
  permitIssued: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  preflightRef: 'preflight:memory',
  issuerRef: 'issuer:authority',
  issuePolicyRef: 'policy:export-permit-issue',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-108.md'],
  permitIssue: { kind: 'memory_cache_audit_export_permit_issue_preflight', permitKind: 'memory_cache_audit_export' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityIssuesSideEffectFreePermit(): void {
  const authority = issueMemoryCacheAuditExportPermitAuthority({
    preflight,
    permitId: 'permit:memory',
    issuedByRef: 'issuer:authority',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.permitIssued, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.fileWriteAllowed, false);
  assert.equal(authority.issuedPermit.kind, 'memory_cache_audit_export_permit');
}

function testMissingPermitIdRequiresReview(): void {
  const authority = issueMemoryCacheAuditExportPermitAuthority({
    preflight,
    issuedByRef: 'issuer:authority',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.permitIssued, false);
  assert.ok(authority.reviewItems.includes('memory_cache_audit_export_permit_issue_authority.permit_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = issueMemoryCacheAuditExportPermitAuthority({
    preflight: { ...preflight, status: 'blocked', permitIssuePreflightAllowed: false, blockers: ['blocked'] },
    permitId: 'permit:memory',
    issuedByRef: 'issuer:authority',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.permitIssued, false);
  assert.ok(authority.blockers.includes('memory_cache_audit_export_permit_issue_authority.preflight_not_allowed'));
}

testReadyAuthorityIssuesSideEffectFreePermit();
testMissingPermitIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('memoryCacheAuditExportPermitIssueAuthority tests passed');
