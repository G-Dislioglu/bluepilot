import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleMayaCoreAutonomyLiveVerificationRequest } from '../src/mayaCoreAutonomyLiveVerificationRoute.js';
import type { MayaCoreAutonomyLiveVerificationFetch } from '../src/mayaCoreAutonomyLiveVerificationRunner.js';

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
  decisionRef: 'maya-kaya:decision:bluepilot-route-live',
  subjectRef: 'user:g-dislioglu',
  autonomyMode: 'full_access',
  grantScope: 'full_access',
  scopeRef: 'bluepilot:runtime_dry_run',
  ethicsCharterRef: 'maya-ethics-charter:canonical',
  safetyEvidenceRef: 'safety:evidence:bluepilot-route-live',
  issuedAt: '2026-06-16T16:00:00.000Z',
  expiresAt: '2026-06-16T17:00:00.000Z',
  hardStopCategories,
  sourceOfTruth: 'maya_kaya',
};

async function withRoute(
  run: (url: string) => Promise<void>,
  fetchImpl?: MayaCoreAutonomyLiveVerificationFetch,
): Promise<void> {
  const server = createServer((request, response) => {
    void handleMayaCoreAutonomyLiveVerificationRequest(request, response, {
      now: new Date('2026-06-16T16:00:00.000Z'),
      env: {
        MAYA_CORE_URL: 'https://maya-core.example',
        MAYA_CORE_GATE_TOKEN: 'gate-token',
      },
      fetchImpl,
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

test('GET /probe/maya-core-autonomy-live-verification-contract exposes live verify boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/maya-core-autonomy-live-verification-contract`);
    const body = await response.json() as {
      version: string;
      boundary: { requiresExplicitExecuteFlag: boolean; executesActions: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-maya-core-autonomy-live-verification-contract-v0.1');
    assert.equal(body.boundary.requiresExplicitExecuteFlag, true);
    assert.equal(body.boundary.executesActions, false);
  });
});

test('POST /probe/maya-core-autonomy-live-verification-run verifies with Maya-core stub', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/maya-core-autonomy-live-verification-run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        executeLiveVerification: true,
        target: 'runtime_dry_run',
        expectedAutonomyMode: 'full_access',
        expectedGrantScope: 'full_access',
        expectedSubjectRef: 'user:g-dislioglu',
        expectedEthicsCharterRef: 'maya-ethics-charter:canonical',
        decision,
      }),
    });
    const body = await response.json() as {
      status: string;
      liveVerificationVerified: boolean;
      sideEffects: { callsMayaKaya: boolean; executesRuntime: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'verified_by_maya_core');
    assert.equal(body.liveVerificationVerified, true);
    assert.equal(body.sideEffects.callsMayaKaya, true);
    assert.equal(body.sideEffects.executesRuntime, false);
  }, async () => ({
    ok: true,
    status: 200,
    json: async () => ({ status: 'verified' }),
  }));
});

test('maya-core live verification route rejects wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/maya-core-autonomy-live-verification-contract`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/maya-core-autonomy-live-verification-run`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
