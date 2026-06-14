import assert from 'node:assert/strict';

import { buildRuntimePatchPermitIssuanceReadiness } from '../src/runtimePatchPermitIssuanceReadiness.js';
import type { RuntimePatchPermitPrepEvidence } from '../src/runtimePatchPermitPrepEvidence.js';

const evidence: RuntimePatchPermitPrepEvidence = {
  status: 'ready',
  evidencePackAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  evidenceRef: 'review-packets/BPK-089.md',
  reviewerRef: 'reviewer:operator',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/runtimeExecutionRoute.ts'],
  evidenceRefs: ['review-packets/BPK-089.md'],
  permitRequest: { kind: 'runtime_patch_application', decisionRef: 'decision:runtime', approvalRef: 'approval:runtime' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyIssuanceReadiness(): void {
  const readiness = buildRuntimePatchPermitIssuanceReadiness({
    evidence,
    issuanceReadinessRef: 'issuance-readiness:runtime',
    issuerRef: 'issuer:operator',
    policyRef: 'policy:runtime-permit',
  });

  assert.equal(readiness.status, 'ready');
  assert.equal(readiness.permitIssuanceReadinessAllowed, true);
  assert.equal(readiness.permitIssued, false);
  assert.equal(readiness.executionAllowed, false);
  assert.equal(readiness.issuanceGate.kind, 'runtime_patch_permit_issuance');
}

function testMissingPolicyRequiresReview(): void {
  const readiness = buildRuntimePatchPermitIssuanceReadiness({
    evidence,
    issuanceReadinessRef: 'issuance-readiness:runtime',
    issuerRef: 'issuer:operator',
  });

  assert.equal(readiness.status, 'review_required');
  assert.ok(readiness.reviewItems.includes('runtime_patch_permit_issuance_readiness.policy_ref_required'));
}

function testBlockedEvidenceBlocksReadiness(): void {
  const readiness = buildRuntimePatchPermitIssuanceReadiness({
    evidence: { ...evidence, status: 'blocked', evidencePackAllowed: false, blockers: ['blocked'] },
    issuanceReadinessRef: 'issuance-readiness:runtime',
    issuerRef: 'issuer:operator',
    policyRef: 'policy:runtime-permit',
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.blockers.includes('runtime_patch_permit_issuance_readiness.evidence_pack_not_allowed'));
}

testReadyIssuanceReadiness();
testMissingPolicyRequiresReview();
testBlockedEvidenceBlocksReadiness();

console.log('runtimePatchPermitIssuanceReadiness tests passed');
