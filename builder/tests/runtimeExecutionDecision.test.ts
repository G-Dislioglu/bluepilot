import assert from 'node:assert/strict';

import { decideRuntimeExecution } from '../src/runtimeExecutionDecision.js';
import type { RuntimeDryRunAdapterPlan } from '../src/runtimeDryRunAdapterContract.js';

const plan: RuntimeDryRunAdapterPlan = {
  status: 'ready',
  dryRunInvocationAllowed: true,
  runtimeDispatchAllowed: false,
  contractTaskId: 'BPK-runtime-sample',
  instruction: 'Summarize dry-run plan only',
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

function testContractOnlyKeepsExecutionClosed(): void {
  const decision = decideRuntimeExecution({
    mode: 'contract_only',
    plan,
  });

  assert.equal(decision.status, 'review_required');
  assert.equal(decision.runtimeExecutionAllowed, false);
  assert.ok(decision.reviewItems.includes('runtime_execution.contract_only_mode'));
}

function testDryRunExecutionReadyWithEvidence(): void {
  const decision = decideRuntimeExecution({
    mode: 'dry_run_execution',
    plan,
    operatorApprovalRef: 'operator:BPK-026',
    mayaGateEvidenceRef: 'maya-gate:green',
    providerIsolationRef: 'provider:dry-run-budgeted',
    maxRuntimeSeconds: 120,
  });

  assert.equal(decision.status, 'ready');
  assert.equal(decision.runtimeExecutionAllowed, true);
  assert.equal(decision.writeExecutionAllowed, false);
  assert.equal(decision.routeMutationAllowed, false);
}

function testDryRunExecutionBlocksWithoutGateEvidence(): void {
  const decision = decideRuntimeExecution({
    mode: 'dry_run_execution',
    plan,
    operatorApprovalRef: 'operator:BPK-026',
    providerIsolationRef: 'provider:dry-run-budgeted',
    maxRuntimeSeconds: 120,
  });

  assert.equal(decision.status, 'blocked');
  assert.ok(decision.blockers.includes('runtime_execution.maya_gate_evidence_required'));
}

function testWriteExecutionBlocked(): void {
  const decision = decideRuntimeExecution({
    mode: 'write_execution',
    plan,
  });

  assert.equal(decision.status, 'blocked');
  assert.equal(decision.writeExecutionAllowed, false);
  assert.ok(decision.blockers.includes('runtime_execution.write_execution_requires_separate_permit_authority_contract'));
}

testContractOnlyKeepsExecutionClosed();
testDryRunExecutionReadyWithEvidence();
testDryRunExecutionBlocksWithoutGateEvidence();
testWriteExecutionBlocked();

console.log('runtimeExecutionDecision tests passed');
