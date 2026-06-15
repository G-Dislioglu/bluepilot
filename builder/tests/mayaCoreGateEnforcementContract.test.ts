import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMayaCoreGateEnforcementContract,
  buildMayaCoreGateEnforcementPreflight,
} from '../src/mayaCoreGateEnforcementContract.js';

const reachable = { reachable: true, status: 'reachable', reason: 'ok' };
const recorded = { reachable: true, status: 'reachable', recorded: true, reason: 'recorded' };

test('maya core gate enforcement contract keeps activation side effects closed', () => {
  const contract = buildMayaCoreGateEnforcementContract(new Date('2026-06-15T16:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-maya-core-gate-enforcement-contract-v0.1');
  assert.equal(contract.sourceProbe, '/health/maya-gate');
  assert.deepEqual(contract.protectedTargets, ['provider_call', 'write_action', 'runtime_execution']);
  assert.ok(contract.requiredEvidence.provider_call.includes('budget.reachable'));
  assert.ok(contract.requiredEvidence.write_action.includes('corridor.reachable'));
  assert.equal(contract.activationBoundary.callsMayaCore, false);
  assert.equal(contract.activationBoundary.callsProviders, false);
  assert.equal(contract.activationBoundary.executesRuntime, false);
  assert.equal(contract.sideEffects.providerCalls, false);
  assert.equal(contract.sideEffects.runtimeExecution, false);
});

test('provider activation preflight requires budget, cost, and provider isolation evidence', () => {
  const preflight = buildMayaCoreGateEnforcementPreflight({
    target: 'provider_call',
    mayaCoreConfigured: true,
    budget: reachable,
    cost: recorded,
    providerIsolationRef: 'provider-isolation:dry-run-budgeted',
  }, new Date('2026-06-15T16:00:00.000Z'));

  assert.equal(preflight.status, 'ready_for_activation_review');
  assert.equal(preflight.target, 'provider_call');
  assert.deepEqual(preflight.blockers, []);
  assert.equal(preflight.sideEffects.providerCalls, false);
  assert.equal(preflight.contract.activationBoundary.callsMayaCore, false);
});

test('write activation preflight fails closed without corridor, approval, and permit evidence', () => {
  const preflight = buildMayaCoreGateEnforcementPreflight({
    target: 'write_action',
    mayaCoreConfigured: true,
  }, new Date('2026-06-15T16:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('maya_gate.corridor_reachable_required'));
  assert.ok(preflight.blockers.includes('maya_gate.operatorApprovalRef_required'));
  assert.ok(preflight.blockers.includes('maya_gate.permitRef_required'));
  assert.equal(preflight.sideEffects.fileWrites, false);
});

test('runtime activation preflight requires both gates and operator evidence', () => {
  const preflight = buildMayaCoreGateEnforcementPreflight({
    target: 'runtime_execution',
    mayaCoreConfigured: true,
    budget: reachable,
    corridor: reachable,
    operatorApprovalRef: 'operator:runtime-dry-run',
    providerIsolationRef: 'provider:isolated',
  }, new Date('2026-06-15T16:00:00.000Z'));

  assert.equal(preflight.status, 'ready_for_activation_review');
  assert.equal(preflight.target, 'runtime_execution');
  assert.equal(preflight.sideEffects.runtimeExecution, false);
});

test('maya gate enforcement blocks unsupported targets and missing Maya configuration', () => {
  const preflight = buildMayaCoreGateEnforcementPreflight({
    target: 'merge',
    mayaCoreConfigured: false,
  }, new Date('2026-06-15T16:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('maya_gate.unsupported_target:merge'));
  assert.equal(preflight.requiredEvidence.length, 0);
});
