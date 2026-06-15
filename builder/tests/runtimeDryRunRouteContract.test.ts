import assert from 'node:assert/strict';

import type { RuntimeDryRunAdapterPlan } from '../src/runtimeDryRunAdapterContract.js';
import {
  buildRuntimeDryRunRouteContractResponse,
  RUNTIME_DRY_RUN_CONFIRM,
  type RuntimeDryRunRouteRequest,
} from '../src/runtimeDryRunRouteContract.js';

const plan: RuntimeDryRunAdapterPlan = {
  status: 'ready',
  dryRunInvocationAllowed: true,
  runtimeDispatchAllowed: false,
  contractTaskId: 'BPK-903',
  instruction: 'Inspect dry run.',
  requestedBy: 'operator',
  blockers: [],
  reviewItems: [],
  invocation: {
    dryRun: true,
    skipDeploy: true,
    allowProviderCalls: false,
    allowDatabaseWrites: false,
    allowGitHubWrites: false,
    allowRuntimeRoute: false,
  },
  nextActions: [],
};

const request: RuntimeDryRunRouteRequest = {
  method: 'POST',
  body: {
    confirm: RUNTIME_DRY_RUN_CONFIRM,
    instruction: 'Inspect dry run.',
    requestedBy: 'operator',
  },
};

function testReadyResponse(): void {
  const response = buildRuntimeDryRunRouteContractResponse(request, plan);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.code, 'runtime_dry_run_route_ready');
  assert.equal(response.body.plan, plan);
}

function testWrongMethod(): void {
  const response = buildRuntimeDryRunRouteContractResponse({ ...request, method: 'GET' }, plan);

  assert.equal(response.statusCode, 405);
  assert.ok(response.body.reasons.includes('runtime_dry_run_route.post_required'));
}

function testMissingConfirm(): void {
  const response = buildRuntimeDryRunRouteContractResponse({ ...request, body: { ...request.body, confirm: 'no' } }, plan);

  assert.equal(response.statusCode, 400);
  assert.ok(response.body.reasons.includes('runtime_dry_run_route.confirm_required'));
}

function testBlockedPlan(): void {
  const response = buildRuntimeDryRunRouteContractResponse(request, {
    ...plan,
    status: 'blocked',
    dryRunInvocationAllowed: false,
    blockers: ['runtime_dry_run.instruction_required'],
  });

  assert.equal(response.statusCode, 400);
  assert.ok(response.body.reasons.includes('runtime_dry_run_route.plan_blocked:runtime_dry_run.instruction_required'));
}

function testReviewPlan(): void {
  const response = buildRuntimeDryRunRouteContractResponse(request, {
    ...plan,
    status: 'review_required',
    dryRunInvocationAllowed: false,
    reviewItems: ['runtime_dry_run.integration_review_required'],
  });

  assert.equal(response.statusCode, 409);
  assert.ok(response.body.reasons.includes('runtime_dry_run_route.plan_review_required:runtime_dry_run.integration_review_required'));
}

function testDoesNotMutateInputs(): void {
  const before = JSON.stringify({ request, plan });
  buildRuntimeDryRunRouteContractResponse(request, plan);
  assert.equal(JSON.stringify({ request, plan }), before);
}

testReadyResponse();
testWrongMethod();
testMissingConfirm();
testBlockedPlan();
testReviewPlan();
testDoesNotMutateInputs();

console.log('runtimeDryRunRouteContract tests passed');
