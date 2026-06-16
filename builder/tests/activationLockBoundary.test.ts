import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildActivationLockContract,
  buildActivationLockPreflight,
} from '../src/activationLockBoundary.js';

const reachable = { reachable: true, status: 'reachable', reason: 'ok' };
const recorded = { reachable: true, status: 'reachable', recorded: true, reason: 'recorded' };
const requiredRefs = {
  activationIntentRef: 'activation:intent:operator-reviewed',
  operatorDecisionRef: 'operator:decision:approve-activation-review',
  liveEvidenceRef: 'live:evidence:maya-dashboard',
};

test('activation lock contract keeps all executor effects closed', () => {
  const contract = buildActivationLockContract(new Date('2026-06-16T04:30:00.000Z'));

  assert.equal(contract.version, 'bluepilot-activation-lock-boundary-contract-v0.1');
  assert.deepEqual(contract.protectedTargets, ['provider_call', 'runtime_dry_run', 'write_action']);
  assert.equal(contract.upstreamPreflights.mayaCoreGate, '/probe/maya-core-gate-enforcement-preflight');
  assert.equal(contract.upstreamPreflights.providerRuntime, '/probe/provider-runtime-activation-preflight');
  assert.equal(contract.activationBoundary.callsProviders, false);
  assert.equal(contract.activationBoundary.executesRuntime, false);
  assert.equal(contract.activationBoundary.writesGitHub, false);
  assert.equal(contract.activationBoundary.issuesPermits, false);
  assert.equal(contract.sideEffects.providerCalls, false);
  assert.equal(contract.sideEffects.runtimeExecution, false);
});

test('provider call can become activation-lock-ready without allowing provider execution', () => {
  const preflight = buildActivationLockPreflight({
    target: 'provider_call',
    ...requiredRefs,
    providerRuntime: {
      requestedBy: 'operator:g-dislioglu',
      providerIsolationRef: 'provider:isolation:budgeted',
      mayaGate: {
        mayaCoreConfigured: true,
        budget: reachable,
        cost: recorded,
      },
    },
  }, new Date('2026-06-16T04:30:00.000Z'));

  assert.equal(preflight.status, 'activation_lock_ready');
  assert.equal(preflight.activationLockReady, true);
  assert.equal(preflight.providerRuntimePreflight?.status, 'ready_for_activation_review');
  assert.equal(preflight.providerExecutionAllowed, false);
  assert.equal(preflight.sideEffects.providerCalls, false);
});

test('runtime dry-run can become activation-lock-ready while route mount stays closed', () => {
  const preflight = buildActivationLockPreflight({
    target: 'runtime_dry_run',
    ...requiredRefs,
    providerRuntime: {
      instruction: 'Dry-run this activation plan only',
      requestedBy: 'operator:g-dislioglu',
      operatorApprovalRef: 'operator:approval:runtime',
      providerIsolationRef: 'provider:isolation:runtime',
      mayaGateEvidenceRef: 'maya:gate:live',
      maxRuntimeSeconds: 120,
      mayaGate: {
        mayaCoreConfigured: true,
        budget: reachable,
        corridor: reachable,
      },
    },
  }, new Date('2026-06-16T04:30:00.000Z'));

  assert.equal(preflight.status, 'activation_lock_ready');
  assert.equal(preflight.providerRuntimePreflight?.runtimeDecision?.status, 'ready');
  assert.equal(preflight.providerRuntimePreflight?.runtimeDecision?.runtimeExecutionAllowed, true);
  assert.equal(preflight.runtimeExecutionAllowed, false);
  assert.equal(preflight.runtimeRouteMountAllowed, false);
  assert.equal(preflight.sideEffects.runtimeExecution, false);
});

test('write action requires permit, target and content binding but still cannot execute writes', () => {
  const preflight = buildActivationLockPreflight({
    target: 'write_action',
    ...requiredRefs,
    targetRepoRef: 'repo:G-Dislioglu/bluepilot-sandbox',
    targetPathRef: 'path:.bluepilot/activation-lock.md',
    contentHashRef: 'sha256:example-content-hash',
    mayaGate: {
      mayaCoreConfigured: true,
      corridor: reachable,
      operatorApprovalRef: 'operator:approval:write',
      permitRef: 'permit:one-shot:write',
    },
  }, new Date('2026-06-16T04:30:00.000Z'));

  assert.equal(preflight.status, 'activation_lock_ready');
  assert.equal(preflight.mayaGatePreflight?.status, 'ready_for_activation_review');
  assert.equal(preflight.writeExecutionAllowed, false);
  assert.equal(preflight.permitIssueAllowed, false);
  assert.equal(preflight.sideEffects.githubWrites, false);
});

test('write action blocks missing content binding evidence', () => {
  const preflight = buildActivationLockPreflight({
    target: 'write_action',
    ...requiredRefs,
    mayaGate: {
      mayaCoreConfigured: true,
      corridor: reachable,
      operatorApprovalRef: 'operator:approval:write',
      permitRef: 'permit:one-shot:write',
    },
  }, new Date('2026-06-16T04:30:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('activation_lock.target_repo_ref_required'));
  assert.ok(preflight.blockers.includes('activation_lock.target_path_ref_required'));
  assert.ok(preflight.blockers.includes('activation_lock.content_hash_ref_required'));
  assert.equal(preflight.writeExecutionAllowed, false);
});
