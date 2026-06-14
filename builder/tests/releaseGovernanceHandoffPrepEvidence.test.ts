import assert from 'node:assert/strict';

import { buildReleaseGovernanceHandoffPrepEvidence } from '../src/releaseGovernanceHandoffPrepEvidence.js';
import type { ReleaseGovernanceApprovedActionHandoffPrep } from '../src/releaseGovernanceApprovedActionHandoffPrep.js';

const handoffPrep: ReleaseGovernanceApprovedActionHandoffPrep = {
  status: 'ready',
  handoffPrepAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  handoffPrepRef: 'handoff-prep:release-governance',
  operatorRef: 'operator:release',
  recipientRef: 'recipient:maintainer',
  releaseLabel: 'bpk-083-086-approved-action-prep',
  evidenceRefs: ['review-packets/BPK-086.md'],
  runbookSteps: ['verify_review_packets', 'open_operator_handoff'],
  handoffPacket: {
    kind: 'release_governance_approved_action',
    decisionRef: 'decision:release-governance',
    approvalRef: 'approval:release-governance',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyEvidencePack(): void {
  const evidence = buildReleaseGovernanceHandoffPrepEvidence({
    handoffPrep,
    evidenceRef: 'review-packets/BPK-090.md',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-082.md'],
  });

  assert.equal(evidence.status, 'ready');
  assert.equal(evidence.evidencePackAllowed, true);
  assert.equal(evidence.mergeAllowed, false);
  assert.equal(evidence.externalActionAllowed, false);
  assert.equal(evidence.handoffPacket.kind, 'release_governance_approved_action');
  assert.ok(evidence.evidenceRefs.includes('review-packets/BPK-086.md'));
  assert.ok(evidence.evidenceRefs.includes('review-packets/BPK-090.md'));
}

function testMissingEvidenceRefRequiresReview(): void {
  const evidence = buildReleaseGovernanceHandoffPrepEvidence({
    handoffPrep,
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-082.md'],
  });

  assert.equal(evidence.status, 'review_required');
  assert.ok(evidence.reviewItems.includes('release_governance_handoff_prep_evidence.evidence_ref_required'));
}

function testBlockedHandoffPrepBlocksEvidencePack(): void {
  const evidence = buildReleaseGovernanceHandoffPrepEvidence({
    handoffPrep: {
      ...handoffPrep,
      status: 'blocked',
      handoffPrepAllowed: false,
      blockers: ['release_approved_handoff_prep.final_decision_not_allowed'],
    },
    evidenceRef: 'review-packets/BPK-090.md',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-082.md'],
  });

  assert.equal(evidence.status, 'blocked');
  assert.equal(evidence.evidencePackAllowed, false);
  assert.ok(evidence.blockers.includes('release_governance_handoff_prep_evidence.handoff_prep_not_allowed'));
}

testReadyEvidencePack();
testMissingEvidenceRefRequiresReview();
testBlockedHandoffPrepBlocksEvidencePack();

console.log('releaseGovernanceHandoffPrepEvidence tests passed');
