import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMayaCoreAutonomyLiveVerificationContract,
  runMayaCoreAutonomyLiveVerification,
  type MayaCoreAutonomyLiveVerificationFetch,
} from '../src/mayaCoreAutonomyLiveVerificationRunner.js';

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
  decisionRef: 'maya-kaya:decision:bluepilot-live',
  subjectRef: 'user:g-dislioglu',
  autonomyMode: 'full_access',
  grantScope: 'full_access',
  scopeRef: 'bluepilot:runtime_dry_run',
  ethicsCharterRef: 'maya-ethics-charter:canonical',
  safetyEvidenceRef: 'safety:evidence:bluepilot-live',
  expiresAt: '2026-06-16T17:00:00.000Z',
  hardStopCategories,
  sourceOfTruth: 'maya_kaya',
};

const readyRequest = {
  target: 'runtime_dry_run',
  expectedAutonomyMode: 'full_access',
  expectedGrantScope: 'full_access',
  expectedSubjectRef: 'user:g-dislioglu',
  expectedEthicsCharterRef: 'maya-ethics-charter:canonical',
  decision,
};

test('maya-core live verification contract exposes gated verify boundary', () => {
  const contract = buildMayaCoreAutonomyLiveVerificationContract(new Date('2026-06-16T16:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-maya-core-autonomy-live-verification-contract-v0.1');
  assert.equal(contract.endpointEnv, 'MAYA_CORE_URL');
  assert.deepEqual(contract.tokenEnv, ['MAYA_CORE_GATE_TOKEN', 'MAYA_BUILDER_GATE_TOKEN']);
  assert.equal(contract.boundary.requiresExplicitExecuteFlag, true);
  assert.equal(contract.boundary.callsMayaKayaOnlyForVerify, true);
  assert.equal(contract.boundary.executesActions, false);
  assert.equal(contract.boundary.deploys, false);
});

test('ready live verification without execute flag does not call Maya-core', async () => {
  let calls = 0;
  const result = await runMayaCoreAutonomyLiveVerification(readyRequest, {
    now: new Date('2026-06-16T16:00:00.000Z'),
    env: {
      MAYA_CORE_URL: 'https://maya-core.example',
      MAYA_CORE_GATE_TOKEN: 'gate-token',
    },
    fetchImpl: async () => {
      calls += 1;
      throw new Error('should not call');
    },
  });

  assert.equal(result.status, 'ready_for_live_verification');
  assert.equal(result.executeLiveVerification, false);
  assert.equal(result.liveVerificationReady, true);
  assert.equal(result.liveVerificationVerified, false);
  assert.equal(result.sideEffects.callsMayaKaya, false);
  assert.equal(calls, 0);
});

test('execute flag verifies against Maya-core with gate token only', async () => {
  let capturedUrl = '';
  let capturedToken = '';
  let capturedBody: unknown;
  const fetchImpl: MayaCoreAutonomyLiveVerificationFetch = async (url, init) => {
    capturedUrl = url;
    capturedToken = init.headers['x-maya-core-gate-token'];
    capturedBody = JSON.parse(init.body) as unknown;
    const body = capturedBody as { verify: { decision: { scopeRef: string; sourceOfTruth: string } } };
    assert.equal(body.verify.decision.scopeRef, 'bluepilot:runtime_dry_run');
    assert.equal(body.verify.decision.sourceOfTruth, 'maya_kaya');
    return {
      ok: true,
      status: 200,
      json: async () => ({
        status: 'verified',
        decision: { decisionRef: 'maya-kaya:decision:bluepilot-live' },
      }),
    };
  };

  const result = await runMayaCoreAutonomyLiveVerification({
    ...readyRequest,
    executeLiveVerification: true,
  }, {
    now: new Date('2026-06-16T16:00:00.000Z'),
    env: {
      MAYA_CORE_URL: 'https://maya-core.example/app',
      MAYA_CORE_GATE_TOKEN: 'gate-token',
    },
    fetchImpl,
  });

  assert.equal(result.status, 'verified_by_maya_core');
  assert.equal(result.liveVerificationVerified, true);
  assert.equal(result.sideEffects.callsMayaKaya, true);
  assert.equal(capturedUrl, 'https://maya-core.example/app/api/maya/autonomy/authority');
  assert.equal(capturedToken, 'gate-token');
  assert.equal((capturedBody as { mode: string }).mode, 'verify');
});

test('live verification fails closed when Maya-core rejects verify', async () => {
  const result = await runMayaCoreAutonomyLiveVerification({
    ...readyRequest,
    executeLiveVerification: true,
  }, {
    now: new Date('2026-06-16T16:00:00.000Z'),
    env: {
      MAYA_CORE_URL: 'https://maya-core.example',
      MAYA_CORE_GATE_TOKEN: 'gate-token',
    },
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      json: async () => ({ error: 'unauthorized' }),
    }),
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.liveVerificationVerified, false);
  assert.ok(result.blockers.includes('maya_core_live.http_401'));
  assert.equal(result.sideEffects.callsMayaKaya, true);
});
