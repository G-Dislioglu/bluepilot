import assert from 'node:assert/strict';

import { planCockpitServerPatchOperatorDryRun } from '../src/cockpitServerPatchOperatorDryRun.js';
import type { CockpitServerPatchApplicationReadiness } from '../src/cockpitServerPatchApplicationReadiness.js';

const readiness: CockpitServerPatchApplicationReadiness = {
  status: 'ready',
  applicationReadinessAllowed: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  readinessRef: 'readiness:cockpit-patch',
  operatorApprovalRef: 'approval:operator',
  diffRef: 'diff:cockpit-patch',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyRoute.ts'],
  guardChecks: ['patch_apply_allowed_false'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyCockpitOperatorDryRun(): void {
  const dryRun = planCockpitServerPatchOperatorDryRun({
    readiness,
    dryRunRef: 'dry-run:cockpit-patch',
    operatorRef: 'operator:cockpit',
    simulationRef: 'simulation:cockpit-patch',
  });

  assert.equal(dryRun.status, 'ready');
  assert.equal(dryRun.dryRunAllowed, true);
  assert.equal(dryRun.patchApplyAllowed, false);
  assert.equal(dryRun.serverMutationExecuted, false);
  assert.equal(dryRun.executableActionAllowed, false);
  assert.ok(dryRun.simulatedSteps.includes('stop_before_any_server_or_route_mutation'));
}

function testMissingDryRunRefRequiresReview(): void {
  const dryRun = planCockpitServerPatchOperatorDryRun({
    readiness,
    operatorRef: 'operator:cockpit',
    simulationRef: 'simulation:cockpit-patch',
  });

  assert.equal(dryRun.status, 'review_required');
  assert.ok(dryRun.reviewItems.includes('cockpit_patch_operator_dry_run.dry_run_ref_required'));
}

function testBlockedReadinessBlocksDryRun(): void {
  const dryRun = planCockpitServerPatchOperatorDryRun({
    readiness: {
      ...readiness,
      status: 'blocked',
      applicationReadinessAllowed: false,
      blockers: ['cockpit_patch_application_readiness.candidate_not_allowed'],
    },
    dryRunRef: 'dry-run:cockpit-patch',
    operatorRef: 'operator:cockpit',
    simulationRef: 'simulation:cockpit-patch',
  });

  assert.equal(dryRun.status, 'blocked');
  assert.ok(dryRun.blockers.includes('cockpit_patch_operator_dry_run.readiness_not_allowed'));
}

testReadyCockpitOperatorDryRun();
testMissingDryRunRefRequiresReview();
testBlockedReadinessBlocksDryRun();

console.log('cockpitServerPatchOperatorDryRun tests passed');
