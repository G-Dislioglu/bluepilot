import assert from 'node:assert/strict';

import { authorizeMemoryCacheAuditExportPermitConsumeExecution } from '../src/memoryCacheAuditExportPermitConsumeExecutionAuthority.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionPreflight } from '../src/memoryCacheAuditExportPermitConsumeExecutionPreflight.js';

const preflight: MemoryCacheAuditExportPermitConsumeExecutionPreflight = {
  status: 'ready',
  consumeExecutionPreflightAllowed: true,
  consumeApplicationAuthorized: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  permitId: 'permit:memory',
  consumeAuthorityId: 'consume-authority:memory',
  applicationAuthorityId: 'application-authority:memory',
  executionPreflightRef: 'execution-preflight:memory',
  executorRef: 'executor:operator',
  executionPolicyRef: 'policy:execution',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-132.md'],
  consumeExecution: {
    kind: 'memory_cache_audit_export_permit_consume_execution_preflight',
    permitKind: 'memory_cache_audit_export',
    permitRef: 'permit:memory',
    applicationAuthorityRef: 'application-authority:memory',
    policyRef: 'policy:execution',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesExecutionWithoutEffects(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecution({
    preflight,
    executionAuthorityId: 'execution-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionAuthorized, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.fileWriteAllowed, false);
  assert.equal(authority.authorizedExecution.kind, 'memory_cache_audit_export_permit_consume_execution_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecution({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionAuthorized, false);
  assert.ok(authority.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_authority.execution_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecution({
    preflight: { ...preflight, status: 'blocked', consumeExecutionPreflightAllowed: false, permitConsumeAuthorized: false, blockers: ['blocked'] },
    executionAuthorityId: 'execution-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionAuthorized, false);
  assert.ok(authority.blockers.includes('memory_cache_audit_export_permit_consume_execution_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesExecutionWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('memoryCacheAuditExportPermitConsumeExecutionAuthority tests passed');
