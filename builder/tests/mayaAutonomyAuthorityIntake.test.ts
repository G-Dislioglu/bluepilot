import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMayaAutonomyAuthorityContract,
  buildMayaAutonomyAuthorityIntakePreflight,
} from '../src/mayaAutonomyAuthorityIntake.js';

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

function decision(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    status: 'maya_autonomy_decision_allowed',
    authorityRef: 'maya-kaya:authority:canonical',
    decisionRef: 'maya-kaya:decision:bluepilot-runtime',
    subjectRef: 'user:g-dislioglu',
    autonomyMode: 'full_access',
    grantScope: 'full_access',
    scopeRef: 'bluepilot:runtime_dry_run',
    ethicsCharterRef: 'maya-ethics-charter:canonical',
    safetyEvidenceRef: 'safety:evidence:bluepilot-runtime',
    issuedAt: '2026-06-16T15:00:00.000Z',
    expiresAt: '2026-06-16T16:00:00.000Z',
    hardStopCategories,
    sourceOfTruth: 'maya_kaya',
    ...overrides,
  };
}

test('maya autonomy authority contract names Maya/Kaya as source of truth', () => {
  const contract = buildMayaAutonomyAuthorityContract(new Date('2026-06-16T15:30:00.000Z'));

  assert.equal(contract.version, 'bluepilot-maya-autonomy-authority-intake-contract-v0.1');
  assert.equal(contract.sourceOfTruth, 'maya_kaya');
  assert.equal(contract.localAppRole, 'consumer_and_executor_guard');
  assert.equal(contract.boundary.validatesEvidenceOnly, true);
  assert.equal(contract.boundary.callsMayaKaya, false);
  assert.equal(contract.boundary.grantsAutonomyLocally, false);
  assert.equal(contract.sideEffects.callsMayaKaya, false);
  assert.equal(contract.sideEffects.executesRuntime, false);
  assert.ok(contract.requiredDecisionFields.includes('hardStopCategories'));
  assert.ok(contract.requiredDecisionFields.includes('scopeRef'));
  assert.ok(contract.requiredDecisionFields.includes('issuedAt'));
  assert.ok(contract.requiredDecisionFields.includes('expiresAt'));
  assert.ok(contract.requiredDecisionFields.includes('sourceOfTruth'));
});

test('valid Maya/Kaya full-access decision normalizes activation handoff evidence', () => {
  const preflight = buildMayaAutonomyAuthorityIntakePreflight({
    target: 'runtime_dry_run',
    expectedAutonomyMode: 'full_access',
    expectedGrantScope: 'full_access',
    expectedSubjectRef: 'user:g-dislioglu',
    expectedEthicsCharterRef: 'maya-ethics-charter:canonical',
    decision: decision(),
  }, new Date('2026-06-16T15:30:00.000Z'));

  assert.equal(preflight.status, 'ready_for_activation_review');
  assert.equal(preflight.decisionReady, true);
  assert.equal(preflight.authoritySource, 'maya_kaya');
  assert.equal(preflight.normalizedDecision?.status, 'maya_autonomy_decision_allowed');
  assert.equal(preflight.normalizedDecision?.autonomyMode, 'full_access');
  assert.equal(preflight.normalizedDecision?.scopeRef, 'bluepilot:runtime_dry_run');
  assert.equal(preflight.normalizedDecision?.issuedAt, '2026-06-16T15:00:00.000Z');
  assert.equal(preflight.normalizedDecision?.expiresAt, '2026-06-16T16:00:00.000Z');
  assert.equal(preflight.normalizedDecision?.sourceOfTruth, 'maya_kaya');
  assert.equal(preflight.activationDecisionHandoff?.target, 'runtime_dry_run');
  assert.equal(preflight.activationDecisionHandoff?.mayaAuthorityDecision.grantScope, 'full_access');
  assert.deepEqual(preflight.blockers, []);
  assert.equal(preflight.sideEffects.callsMayaKaya, false);
});

test('decision must preserve Maya-core verification fields', () => {
  const preflight = buildMayaAutonomyAuthorityIntakePreflight({
    target: 'runtime_dry_run',
    expectedAutonomyMode: 'full_access',
    decision: decision({
      sourceOfTruth: 'local_app',
    }),
  }, new Date('2026-06-16T15:30:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('maya_autonomy_authority.source_of_truth_must_be_maya_kaya'));
});

test('decision must carry Maya-core timestamp fields', () => {
  const preflight = buildMayaAutonomyAuthorityIntakePreflight({
    target: 'runtime_dry_run',
    expectedAutonomyMode: 'full_access',
    decision: decision({
      issuedAt: undefined,
      expiresAt: undefined,
    }),
  }, new Date('2026-06-16T15:30:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('maya_autonomy_authority.issued_at_required'));
  assert.ok(preflight.blockers.includes('maya_autonomy_authority.expires_at_required'));
});

test('missing authority decision blocks execution handoff', () => {
  const preflight = buildMayaAutonomyAuthorityIntakePreflight({
    target: 'provider_call',
    expectedAutonomyMode: 'full_access',
  }, new Date('2026-06-16T15:30:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.decisionReady, false);
  assert.ok(preflight.blockers.includes('maya_autonomy_authority.decision_required'));
  assert.equal(preflight.activationDecisionHandoff, undefined);
});

test('expired or mismatched decisions fail closed', () => {
  const preflight = buildMayaAutonomyAuthorityIntakePreflight({
    target: 'write_action',
    expectedAutonomyMode: 'full_access',
    expectedSubjectRef: 'user:g-dislioglu',
    decision: decision({
      subjectRef: 'user:other',
      autonomyMode: 'supervised_execution',
      expiresAt: '2026-06-16T14:00:00.000Z',
    }),
  }, new Date('2026-06-16T15:30:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('maya_autonomy_authority.autonomy_mode_mismatch'));
  assert.ok(preflight.blockers.includes('maya_autonomy_authority.subject_ref_mismatch'));
  assert.ok(preflight.blockers.includes('maya_autonomy_authority.decision_expired'));
});

test('decision must carry the shared hard-stop policy', () => {
  const preflight = buildMayaAutonomyAuthorityIntakePreflight({
    target: 'durable_receipt_store',
    expectedAutonomyMode: 'full_access',
    decision: decision({
      hardStopCategories: ['banking'],
    }),
  }, new Date('2026-06-16T15:30:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('maya_autonomy_authority.hard_stop_policy_missing:financial_transaction'));
  assert.ok(preflight.blockers.includes('maya_autonomy_authority.hard_stop_policy_missing:ethics_charter_violation'));
});
