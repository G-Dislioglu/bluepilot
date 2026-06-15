import assert from 'node:assert/strict';

import { buildCockpitPatchPermitIssuanceReadiness } from '../src/cockpitPatchPermitIssuanceReadiness.js';
import type { CockpitPatchPermitPrepEvidence } from '../src/cockpitPatchPermitPrepEvidence.js';

const evidence: CockpitPatchPermitPrepEvidence = {
  status: 'ready',
  evidencePackAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  evidenceRef: 'review-packets/BPK-087.md',
  reviewerRef: 'reviewer:operator',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyRoute.ts'],
  evidenceRefs: ['review-packets/BPK-087.md'],
  permitRequest: { kind: 'cockpit_patch_application', decisionRef: 'decision:cockpit', approvalRef: 'approval:cockpit' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyIssuanceReadiness(): void {
  const readiness = buildCockpitPatchPermitIssuanceReadiness({
    evidence,
    issuanceReadinessRef: 'issuance-readiness:cockpit',
    issuerRef: 'issuer:operator',
    policyRef: 'policy:one-shot-permit',
  });

  assert.equal(readiness.status, 'ready');
  assert.equal(readiness.permitIssuanceReadinessAllowed, true);
  assert.equal(readiness.permitIssued, false);
  assert.equal(readiness.patchApplyAllowed, false);
  assert.equal(readiness.issuanceGate.kind, 'cockpit_patch_permit_issuance');
}

function testMissingPolicyRequiresReview(): void {
  const readiness = buildCockpitPatchPermitIssuanceReadiness({
    evidence,
    issuanceReadinessRef: 'issuance-readiness:cockpit',
    issuerRef: 'issuer:operator',
  });

  assert.equal(readiness.status, 'review_required');
  assert.ok(readiness.reviewItems.includes('cockpit_patch_permit_issuance_readiness.policy_ref_required'));
}

function testBlockedEvidenceBlocksReadiness(): void {
  const readiness = buildCockpitPatchPermitIssuanceReadiness({
    evidence: { ...evidence, status: 'blocked', evidencePackAllowed: false, blockers: ['blocked'] },
    issuanceReadinessRef: 'issuance-readiness:cockpit',
    issuerRef: 'issuer:operator',
    policyRef: 'policy:one-shot-permit',
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.blockers.includes('cockpit_patch_permit_issuance_readiness.evidence_pack_not_allowed'));
}

testReadyIssuanceReadiness();
testMissingPolicyRequiresReview();
testBlockedEvidenceBlocksReadiness();

console.log('cockpitPatchPermitIssuanceReadiness tests passed');
