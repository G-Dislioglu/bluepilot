import assert from 'node:assert/strict';

import { adoptCockpitProjection } from '../src/cockpitProjectionAdoptionContract.js';
import type { DispatchFrontendReadinessProjection } from '../src/dispatchFrontendReadiness.js';
import type { RuntimeDispatchIntegrationContract } from '../src/runtimeDispatchIntegrationContract.js';

const readiness: DispatchFrontendReadinessProjection = {
  stage: 'dispatch_ready',
  dispatchAllowed: true,
  frontendProjectionAllowed: true,
  reviewRequired: false,
  reasons: [],
  contractTaskId: 'BPK-903',
  surface: 'operator_cockpit',
  summary: {
    allowedFileCount: 2,
    cardCount: 1,
    claimCount: 1,
    evidenceRequirements: ['test_result'],
  },
  gates: {
    cardConditionedDispatch: 'allow',
    preRegisteredClaims: 'allow',
    contractEvidence: 'ready',
  },
  frontendSections: [{
    id: 'dispatch_decision',
    title: 'Dispatch decision',
    status: 'ready',
    items: ['dispatch_allowed:true'],
  }],
};

const runtime: RuntimeDispatchIntegrationContract = {
  status: 'runtime_candidate',
  dryRunAllowed: true,
  runtimeDispatchAllowed: false,
  writePermitRequired: false,
  reasons: [],
  contractTaskId: 'BPK-903',
  mode: 'dry_run_only',
  boundary: {
    executableRouteAllowed: false,
    providerCallAllowed: false,
    databaseWriteAllowed: false,
    githubWriteAllowed: false,
  },
  checklist: [],
};

function testReadyCockpitModel(): void {
  const model = adoptCockpitProjection({ readiness, runtime });

  assert.equal(model.status, 'ready');
  assert.equal(model.cockpitModelAllowed, true);
  assert.equal(model.executableActionAllowed, false);
  assert.equal(model.audience, 'operator');
  assert.equal(model.headline, 'Ready for operator inspection');
  assert.equal(model.panels.length, 2);
  assert.equal(model.actions.every((action) => action.enabled === false), true);
}

function testReviewCockpitModel(): void {
  const model = adoptCockpitProjection({
    readiness: {
      ...readiness,
      stage: 'frontend_review',
      dispatchAllowed: false,
      reviewRequired: true,
      reasons: ['card_condition.review_required:review-001'],
      frontendSections: [{ ...readiness.frontendSections[0], status: 'review' }],
    },
    runtime: {
      ...runtime,
      status: 'operator_review',
      dryRunAllowed: false,
      reasons: ['runtime_integration.readiness_review_required'],
    },
    audience: 'reviewer',
  });

  assert.equal(model.status, 'review');
  assert.equal(model.cockpitModelAllowed, true);
  assert.equal(model.audience, 'reviewer');
  assert.ok(model.reasons.includes('card_condition.review_required:review-001'));
  assert.equal(model.panels.find((panel) => panel.id === 'runtime.integration')?.status, 'review');
}

function testBlockedStillRenderableForInspection(): void {
  const model = adoptCockpitProjection({
    readiness: {
      ...readiness,
      stage: 'blocked',
      dispatchAllowed: false,
      reasons: ['dispatch_frontend.evidence_required_empty'],
      frontendSections: [{ ...readiness.frontendSections[0], status: 'blocked' }],
    },
    runtime: {
      ...runtime,
      status: 'blocked',
      dryRunAllowed: false,
      reasons: ['runtime_integration.readiness_blocked'],
    },
  });

  assert.equal(model.status, 'blocked');
  assert.equal(model.cockpitModelAllowed, true);
  assert.equal(model.executableActionAllowed, false);
  assert.equal(model.headline, 'Blocked before execution');
}

function testTaskMismatchInvalidatesAdoption(): void {
  const model = adoptCockpitProjection({
    readiness,
    runtime: { ...runtime, contractTaskId: 'BPK-OTHER' },
  });

  assert.equal(model.status, 'invalid');
  assert.equal(model.cockpitModelAllowed, false);
  assert.ok(model.reasons.includes('cockpit_projection.task_mismatch:BPK-903->BPK-OTHER'));
}

function testDoesNotMutateInputs(): void {
  const before = JSON.stringify({ readiness, runtime });
  adoptCockpitProjection({ readiness, runtime });
  assert.equal(JSON.stringify({ readiness, runtime }), before);
}

testReadyCockpitModel();
testReviewCockpitModel();
testBlockedStillRenderableForInspection();
testTaskMismatchInvalidatesAdoption();
testDoesNotMutateInputs();

console.log('cockpitProjectionAdoptionContract tests passed');
