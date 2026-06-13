import assert from 'node:assert/strict';

import { preflightRuntimeExecutionMount } from '../src/runtimeExecutionMountPreflight.js';
import type { RuntimeExecutionDecision } from '../src/runtimeExecutionDecision.js';

const decision: RuntimeExecutionDecision = {
  status: 'ready',
  mode: 'dry_run_execution',
  runtimeExecutionAllowed: true,
  writeExecutionAllowed: false,
  routeMutationAllowed: false,
  contractTaskId: 'BPK-runtime-execution',
  blockers: [],
  reviewItems: [],
  checklist: [],
  nextActions: [],
};

function testReadyPreflightForNewDefaultOffRoute(): void {
  const preflight = preflightRuntimeExecutionMount({
    decision,
    proposedRoute: '/probe/runtime-dry-run-execution',
    envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
    confirmPhrase: 'runtime-dry-run-execution-contract',
    operatorRunbookRef: 'runbook:BPK-030',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.executionMountPreflightReady, true);
  assert.equal(preflight.routeMutationAllowed, false);
  assert.equal(preflight.writeExecutionAllowed, false);
}

function testExistingRouteMutationBlocks(): void {
  const preflight = preflightRuntimeExecutionMount({
    decision,
    proposedRoute: '/probe/runtime-dry-run',
    envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
    confirmPhrase: 'runtime-dry-run-execution-contract',
    operatorRunbookRef: 'runbook:BPK-030',
  });

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('runtime_mount_preflight.existing_route_must_not_be_mutated:/probe/runtime-dry-run'));
}

function testMissingRunbookRequiresReview(): void {
  const preflight = preflightRuntimeExecutionMount({
    decision,
    proposedRoute: '/probe/runtime-dry-run-execution',
    envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
    confirmPhrase: 'runtime-dry-run-execution-contract',
  });

  assert.equal(preflight.status, 'review_required');
  assert.ok(preflight.reviewItems.includes('runtime_mount_preflight.operator_runbook_ref_required'));
}

function testClosedDecisionBlocksMountPreflight(): void {
  const preflight = preflightRuntimeExecutionMount({
    decision: {
      ...decision,
      status: 'blocked',
      runtimeExecutionAllowed: false,
      blockers: ['runtime_execution.maya_gate_evidence_required'],
    },
    proposedRoute: '/probe/runtime-dry-run-execution',
    envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
    confirmPhrase: 'runtime-dry-run-execution-contract',
    operatorRunbookRef: 'runbook:BPK-030',
  });

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('runtime_mount_preflight.runtime_execution_not_allowed'));
}

testReadyPreflightForNewDefaultOffRoute();
testExistingRouteMutationBlocks();
testMissingRunbookRequiresReview();
testClosedDecisionBlocksMountPreflight();

console.log('runtimeExecutionMountPreflight tests passed');
