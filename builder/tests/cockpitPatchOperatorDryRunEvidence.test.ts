import assert from 'node:assert/strict';

import { buildCockpitPatchOperatorDryRunEvidence } from '../src/cockpitPatchOperatorDryRunEvidence.js';
import type { CockpitServerPatchOperatorDryRun } from '../src/cockpitServerPatchOperatorDryRun.js';

const dryRun: CockpitServerPatchOperatorDryRun = {
  status: 'ready',
  dryRunAllowed: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  dryRunRef: 'dry-run:cockpit-patch',
  operatorRef: 'operator:cockpit',
  simulationRef: 'simulation:cockpit-patch',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyRoute.ts'],
  simulatedSteps: ['load_patch_candidate_metadata', 'stop_before_any_server_or_route_mutation'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyCockpitDryRunEvidence(): void {
  const evidence = buildCockpitPatchOperatorDryRunEvidence({
    dryRun,
    evidenceRef: 'evidence:cockpit-dry-run',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-071.md'],
  });

  assert.equal(evidence.status, 'ready');
  assert.equal(evidence.evidencePackAllowed, true);
  assert.equal(evidence.patchApplyAllowed, false);
  assert.equal(evidence.serverMutationExecuted, false);
  assert.ok(evidence.simulatedSteps.includes('stop_before_any_server_or_route_mutation'));
}

function testMissingEvidenceRefRequiresReview(): void {
  const evidence = buildCockpitPatchOperatorDryRunEvidence({
    dryRun,
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-071.md'],
  });

  assert.equal(evidence.status, 'review_required');
  assert.ok(evidence.reviewItems.includes('cockpit_patch_dry_run_evidence.evidence_ref_required'));
}

function testBlockedDryRunBlocksEvidence(): void {
  const evidence = buildCockpitPatchOperatorDryRunEvidence({
    dryRun: {
      ...dryRun,
      status: 'blocked',
      dryRunAllowed: false,
      blockers: ['cockpit_patch_operator_dry_run.readiness_not_allowed'],
    },
    evidenceRef: 'evidence:cockpit-dry-run',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-071.md'],
  });

  assert.equal(evidence.status, 'blocked');
  assert.ok(evidence.blockers.includes('cockpit_patch_dry_run_evidence.dry_run_not_allowed'));
}

testReadyCockpitDryRunEvidence();
testMissingEvidenceRefRequiresReview();
testBlockedDryRunBlocksEvidence();

console.log('cockpitPatchOperatorDryRunEvidence tests passed');
