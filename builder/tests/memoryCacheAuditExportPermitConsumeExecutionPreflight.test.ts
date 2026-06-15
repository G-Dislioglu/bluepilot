import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsumeExecution } from '../src/memoryCacheAuditExportPermitConsumeExecutionPreflight.js';
import type { MemoryCacheAuditExportPermitConsumeApplicationAuthority } from '../src/memoryCacheAuditExportPermitConsumeApplicationAuthority.js';

const authority: MemoryCacheAuditExportPermitConsumeApplicationAuthority = {
  status: 'ready',
  consumeApplicationAuthorityAllowed: true,
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
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-128.md'],
  authorizedApplication: {
    kind: 'memory_cache_audit_export_permit_consume_application_authority',
    permitKind: 'memory_cache_audit_export',
    permitRef: 'permit:memory',
    applicationRef: 'application:memory',
    policyRef: 'policy:application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsExecutionWithoutEffects(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecution({
    authority,
    executionPreflightRef: 'execution-preflight:memory',
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionPreflightAllowed, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.durablePersistenceAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.consumeExecution.kind, 'memory_cache_audit_export_permit_consume_execution_preflight');
}

function testMissingExecutionRefRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecution({
    authority,
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_preflight.execution_preflight_ref_required'));
}

function testBlockedAuthorityBlocksExecutionPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecution({
    authority: { ...authority, status: 'blocked', consumeApplicationAuthorityAllowed: false, consumeApplicationAuthorized: false, blockers: ['blocked'] },
    executionPreflightRef: 'execution-preflight:memory',
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_consume_execution_preflight.application_authority_not_allowed'));
}

testReadyAuthorityPreflightsExecutionWithoutEffects();
testMissingExecutionRefRequiresReview();
testBlockedAuthorityBlocksExecutionPreflight();

console.log('memoryCacheAuditExportPermitConsumeExecutionPreflight tests passed');
