import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildProviderRuntimeActivationContract,
  buildProviderRuntimeActivationPreflight,
} from '../src/providerRuntimeActivationPreflight.js';

const reachable = { reachable: true, status: 'reachable', reason: 'ok' };
const recorded = { reachable: true, status: 'reachable', recorded: true, reason: 'recorded' };

test('provider runtime activation contract keeps all activation side effects closed', () => {
  const contract = buildProviderRuntimeActivationContract(new Date('2026-06-15T17:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-provider-runtime-activation-preflight-contract-v0.1');
  assert.equal(contract.gateDependency, '/probe/maya-core-gate-enforcement-preflight');
  assert.deepEqual(contract.protectedTargets, ['provider_call', 'runtime_dry_run']);
  assert.equal(contract.activationBoundary.callsMayaCore, false);
  assert.equal(contract.activationBoundary.callsProviders, false);
  assert.equal(contract.activationBoundary.executesRuntime, false);
  assert.equal(contract.sideEffects.providerCalls, false);
  assert.equal(contract.sideEffects.runtimeExecution, false);
});

test('provider activation preflight becomes review-ready with Maya gate evidence', () => {
  const preflight = buildProviderRuntimeActivationPreflight({
    target: 'provider_call',
    requestedBy: 'operator:g-dislioglu',
    providerIsolationRef: 'provider-isolation:budgeted-dry-lane',
    mayaGate: {
      mayaCoreConfigured: true,
      budget: reachable,
      cost: recorded,
    },
  }, new Date('2026-06-15T17:00:00.000Z'));

  assert.equal(preflight.status, 'ready_for_activation_review');
  assert.equal(preflight.target, 'provider_call');
  assert.equal(preflight.providerActivationAllowed, false);
  assert.equal(preflight.sideEffects.providerCalls, false);
  assert.equal(preflight.mayaGatePreflight?.status, 'ready_for_activation_review');
});

test('provider activation preflight blocks missing Maya budget evidence', () => {
  const preflight = buildProviderRuntimeActivationPreflight({
    target: 'provider_call',
    providerIsolationRef: 'provider-isolation:budgeted-dry-lane',
    mayaGate: {
      mayaCoreConfigured: true,
      cost: recorded,
    },
  }, new Date('2026-06-15T17:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('provider_runtime.provider_gate_blocked:maya_gate.budget_reachable_required'));
  assert.equal(preflight.providerActivationAllowed, false);
});

test('runtime dry-run activation preflight becomes review-ready with gate and runtime evidence', () => {
  const preflight = buildProviderRuntimeActivationPreflight({
    target: 'runtime_dry_run',
    instruction: 'Summarize the dry-run plan only',
    requestedBy: 'operator:g-dislioglu',
    operatorApprovalRef: 'operator:runtime-dry-run',
    providerIsolationRef: 'provider:isolated',
    maxRuntimeSeconds: 120,
    mayaGate: {
      mayaCoreConfigured: true,
      budget: reachable,
      corridor: reachable,
    },
  }, new Date('2026-06-15T17:00:00.000Z'));

  assert.equal(preflight.status, 'ready_for_activation_review');
  assert.equal(preflight.target, 'runtime_dry_run');
  assert.equal(preflight.runtimeActivationAllowed, false);
  assert.equal(preflight.dryRunRouteMountAllowed, false);
  assert.equal(preflight.runtimeDecision?.status, 'ready');
  assert.equal(preflight.runtimeDecision?.runtimeExecutionAllowed, true);
  assert.equal(preflight.sideEffects.runtimeExecution, false);
});

test('runtime dry-run activation preflight blocks instruction and runtime limit gaps', () => {
  const preflight = buildProviderRuntimeActivationPreflight({
    target: 'runtime_dry_run',
    operatorApprovalRef: 'operator:runtime-dry-run',
    providerIsolationRef: 'provider:isolated',
    mayaGate: {
      mayaCoreConfigured: true,
      budget: reachable,
      corridor: reachable,
    },
  }, new Date('2026-06-15T17:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('provider_runtime.runtime_instruction_required'));
  assert.ok(preflight.blockers.includes('provider_runtime.runtime_decision_blocked:runtime_execution.dry_run_plan_not_allowed'));
  assert.ok(preflight.blockers.includes('provider_runtime.runtime_decision_blocked:runtime_execution.max_runtime_seconds_out_of_bounds:0'));
  assert.equal(preflight.runtimeActivationAllowed, false);
});
