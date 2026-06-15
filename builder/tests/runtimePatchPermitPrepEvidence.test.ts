import assert from 'node:assert/strict';

import { buildRuntimePatchPermitPrepEvidence } from '../src/runtimePatchPermitPrepEvidence.js';
import type { RuntimePatchApprovedActionPermitPrep } from '../src/runtimePatchApprovedActionPermitPrep.js';

const permitPrep: RuntimePatchApprovedActionPermitPrep = {
  status: 'ready',
  permitPrepAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  permitPrepRef: 'permit-prep:runtime-patch',
  requesterRef: 'requester:operator',
  scopeRef: 'scope:runtime-patch',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/runtimeExecutionRoute.ts'],
  evidenceRefs: ['review-packets/BPK-085.md'],
  permitRequest: {
    kind: 'runtime_patch_application',
    decisionRef: 'decision:runtime-patch',
    approvalRef: 'approval:runtime-patch',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyEvidencePack(): void {
  const evidence = buildRuntimePatchPermitPrepEvidence({
    permitPrep,
    evidenceRef: 'review-packets/BPK-089.md',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-081.md'],
  });

  assert.equal(evidence.status, 'ready');
  assert.equal(evidence.evidencePackAllowed, true);
  assert.equal(evidence.permitIssued, false);
  assert.equal(evidence.executionAllowed, false);
  assert.equal(evidence.permitRequest.kind, 'runtime_patch_application');
  assert.ok(evidence.evidenceRefs.includes('review-packets/BPK-085.md'));
  assert.ok(evidence.evidenceRefs.includes('review-packets/BPK-089.md'));
}

function testMissingEvidenceRefRequiresReview(): void {
  const evidence = buildRuntimePatchPermitPrepEvidence({
    permitPrep,
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-081.md'],
  });

  assert.equal(evidence.status, 'review_required');
  assert.ok(evidence.reviewItems.includes('runtime_patch_permit_prep_evidence.evidence_ref_required'));
}

function testBlockedPermitPrepBlocksEvidencePack(): void {
  const evidence = buildRuntimePatchPermitPrepEvidence({
    permitPrep: {
      ...permitPrep,
      status: 'blocked',
      permitPrepAllowed: false,
      blockers: ['runtime_patch_permit_prep.decision_gate_not_allowed'],
    },
    evidenceRef: 'review-packets/BPK-089.md',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-081.md'],
  });

  assert.equal(evidence.status, 'blocked');
  assert.equal(evidence.evidencePackAllowed, false);
  assert.ok(evidence.blockers.includes('runtime_patch_permit_prep_evidence.permit_prep_not_allowed'));
}

testReadyEvidencePack();
testMissingEvidenceRefRequiresReview();
testBlockedPermitPrepBlocksEvidencePack();

console.log('runtimePatchPermitPrepEvidence tests passed');
