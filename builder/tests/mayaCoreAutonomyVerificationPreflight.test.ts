import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMayaCoreAutonomyVerificationContract,
  buildMayaCoreAutonomyVerificationPreflight,
} from '../src/mayaCoreAutonomyVerificationPreflight.js';

const hardStopCategories = [
  'banking',
  'financial_transaction',
  'illegal_action',
  'ethics_charter_violation',
  'malware_or_abuse',
  'privacy_invasion',
  'deception_or_impersonation',
  'weapons',
  'self_harm',
  'medical_or_legal_high_stakes_submission',
];

const decision = {
  status: 'maya_autonomy_decision_allowed',
  authorityRef: 'maya-kaya:authority:canonical',
  decisionRef: 'maya-kaya:decision:bluepilot-runtime',
  subjectRef: 'user:g-dislioglu',
  autonomyMode: 'full_access',
  grantScope: 'full_access',
  ethicsCharterRef: 'maya-ethics-charter:canonical',
  safetyEvidenceRef: 'safety:evidence:bluepilot-runtime',
  expiresAt: '2026-06-16T17:00:00.000Z',
  hardStopCategories,
};

test('maya-core autonomy verification contract prepares live verify without side effects', () => {
  const contract = buildMayaCoreAutonomyVerificationContract(new Date('2026-06-16T16:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-maya-core-autonomy-verification-contract-v0.1');
  assert.equal(contract.mayaCoreEndpoint, '/api/maya/autonomy/authority');
  assert.equal(contract.boundary.callsMayaKaya, false);
  assert.equal(contract.boundary.grantsAutonomyLocally, false);
  assert.equal(contract.sideEffects.callsMayaKaya, false);
  assert.equal(contract.sideEffects.executesRuntime, false);
});

test('ready preflight creates planned Maya-core verify request only', () => {
  const preflight = buildMayaCoreAutonomyVerificationPreflight({
    target: 'runtime_dry_run',
    expectedAutonomyMode: 'full_access',
    expectedGrantScope: 'full_access',
    expectedSubjectRef: 'user:g-dislioglu',
    expectedEthicsCharterRef: 'maya-ethics-charter:canonical',
    mayaCoreUrlConfigured: true,
    mayaCoreGateTokenConfigured: true,
    verificationEndpoint: '/api/maya/autonomy/authority',
    decision,
  }, new Date('2026-06-16T16:00:00.000Z'));

  assert.equal(preflight.status, 'ready_for_live_verification_review');
  assert.equal(preflight.liveVerificationReady, true);
  assert.equal(preflight.intakeReady, true);
  assert.equal(preflight.plannedRequest?.method, 'POST');
  assert.equal(preflight.plannedRequest?.path, '/api/maya/autonomy/authority');
  assert.equal(preflight.plannedRequest?.body.mode, 'verify');
  assert.equal(preflight.sideEffects.callsMayaKaya, false);
});

test('preflight blocks missing config or invalid authority decision', () => {
  const preflight = buildMayaCoreAutonomyVerificationPreflight({
    target: 'runtime_dry_run',
    expectedAutonomyMode: 'full_access',
    expectedGrantScope: 'full_access',
    decision: {
      ...decision,
      grantScope: 'supervised_execution',
    },
  }, new Date('2026-06-16T16:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('maya_core_autonomy.maya_core_url_required'));
  assert.ok(preflight.blockers.includes('maya_core_autonomy.gate_token_required'));
  assert.ok(preflight.blockers.includes('intake.maya_autonomy_authority.full_access_scope_required'));
  assert.equal(preflight.plannedRequest, undefined);
});
