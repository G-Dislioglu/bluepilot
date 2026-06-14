import assert from 'node:assert/strict';

import { buildCockpitPatchPermitPrepEvidence } from '../src/cockpitPatchPermitPrepEvidence.js';
import type { CockpitPatchApprovedActionPermitPrep } from '../src/cockpitPatchApprovedActionPermitPrep.js';

const permitPrep: CockpitPatchApprovedActionPermitPrep = {
  status: 'ready',
  permitPrepAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  permitPrepRef: 'permit-prep:cockpit-patch',
  requesterRef: 'requester:operator',
  scopeRef: 'scope:cockpit-patch',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyRoute.ts'],
  evidenceRefs: ['review-packets/BPK-083.md'],
  permitRequest: {
    kind: 'cockpit_patch_application',
    decisionRef: 'decision:cockpit-patch',
    approvalRef: 'approval:cockpit-patch',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyEvidencePack(): void {
  const evidence = buildCockpitPatchPermitPrepEvidence({
    permitPrep,
    evidenceRef: 'review-packets/BPK-087.md',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-079.md'],
  });

  assert.equal(evidence.status, 'ready');
  assert.equal(evidence.evidencePackAllowed, true);
  assert.equal(evidence.permitIssued, false);
  assert.equal(evidence.patchApplyAllowed, false);
  assert.equal(evidence.permitRequest.kind, 'cockpit_patch_application');
  assert.ok(evidence.evidenceRefs.includes('review-packets/BPK-083.md'));
  assert.ok(evidence.evidenceRefs.includes('review-packets/BPK-087.md'));
}

function testMissingEvidenceRefRequiresReview(): void {
  const evidence = buildCockpitPatchPermitPrepEvidence({
    permitPrep,
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-079.md'],
  });

  assert.equal(evidence.status, 'review_required');
  assert.ok(evidence.reviewItems.includes('cockpit_patch_permit_prep_evidence.evidence_ref_required'));
}

function testBlockedPermitPrepBlocksEvidencePack(): void {
  const evidence = buildCockpitPatchPermitPrepEvidence({
    permitPrep: {
      ...permitPrep,
      status: 'blocked',
      permitPrepAllowed: false,
      blockers: ['cockpit_patch_permit_prep.decision_gate_not_allowed'],
    },
    evidenceRef: 'review-packets/BPK-087.md',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-079.md'],
  });

  assert.equal(evidence.status, 'blocked');
  assert.equal(evidence.evidencePackAllowed, false);
  assert.ok(evidence.blockers.includes('cockpit_patch_permit_prep_evidence.permit_prep_not_allowed'));
}

testReadyEvidencePack();
testMissingEvidenceRefRequiresReview();
testBlockedPermitPrepBlocksEvidencePack();

console.log('cockpitPatchPermitPrepEvidence tests passed');
