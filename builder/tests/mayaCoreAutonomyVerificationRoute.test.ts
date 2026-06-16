import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleMayaCoreAutonomyVerificationRequest } from '../src/mayaCoreAutonomyVerificationRoute.js';

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

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleMayaCoreAutonomyVerificationRequest(request, response, {
      now: new Date('2026-06-16T16:00:00.000Z'),
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

test('GET /probe/maya-core-autonomy-verification-contract exposes closed boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/maya-core-autonomy-verification-contract`);
    const body = await response.json() as {
      version: string;
      sourceOfTruth: string;
      boundary: { callsMayaKaya: boolean };
      sideEffects: { callsMayaKaya: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-maya-core-autonomy-verification-contract-v0.1');
    assert.equal(body.sourceOfTruth, 'maya_kaya');
    assert.equal(body.boundary.callsMayaKaya, false);
    assert.equal(body.sideEffects.callsMayaKaya, false);
  });
});

test('POST /probe/maya-core-autonomy-verification-preflight prepares verify payload', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/maya-core-autonomy-verification-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        target: 'runtime_dry_run',
        expectedAutonomyMode: 'full_access',
        expectedGrantScope: 'full_access',
        mayaCoreUrlConfigured: true,
        mayaCoreGateTokenConfigured: true,
        decision: {
          status: 'maya_autonomy_decision_allowed',
          authorityRef: 'maya-kaya:authority:canonical',
          decisionRef: 'maya-kaya:decision:bluepilot-runtime',
          subjectRef: 'user:g-dislioglu',
          autonomyMode: 'full_access',
          grantScope: 'full_access',
          scopeRef: 'bluepilot:runtime_dry_run',
          ethicsCharterRef: 'maya-ethics-charter:canonical',
          safetyEvidenceRef: 'safety:evidence:bluepilot-runtime',
          expiresAt: '2026-06-16T17:00:00.000Z',
          hardStopCategories,
          sourceOfTruth: 'maya_kaya',
        },
      }),
    });
    const body = await response.json() as {
      status: string;
      liveVerificationReady: boolean;
      plannedRequest: { path: string };
      sideEffects: { callsMayaKaya: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ready_for_live_verification_review');
    assert.equal(body.liveVerificationReady, true);
    assert.equal(body.plannedRequest.path, '/api/maya/autonomy/authority');
    assert.equal(body.sideEffects.callsMayaKaya, false);
  });
});

test('maya-core autonomy verification route rejects wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/maya-core-autonomy-verification-contract`, { method: 'POST' });
    assert.equal(methodResponse.status, 405);

    const jsonResponse = await fetch(`${url}/probe/maya-core-autonomy-verification-preflight`, {
      method: 'POST',
      body: '{',
    });
    assert.equal(jsonResponse.status, 400);
  });
});
