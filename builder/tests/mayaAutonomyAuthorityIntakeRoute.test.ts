import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleMayaAutonomyAuthorityIntakeRequest } from '../src/mayaAutonomyAuthorityIntakeRoute.js';

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
    void handleMayaAutonomyAuthorityIntakeRequest(request, response, {
      now: new Date('2026-06-16T15:30:00.000Z'),
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

test('GET /probe/maya-autonomy-authority-contract exposes consumer boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/maya-autonomy-authority-contract`);
    const body = await response.json() as {
      version: string;
      sourceOfTruth: string;
      boundary: { callsMayaKaya: boolean; executesActions: boolean };
      sideEffects: { callsMayaKaya: boolean; writesFiles: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-maya-autonomy-authority-intake-contract-v0.1');
    assert.equal(body.sourceOfTruth, 'maya_kaya');
    assert.equal(body.boundary.callsMayaKaya, false);
    assert.equal(body.boundary.executesActions, false);
    assert.equal(body.sideEffects.callsMayaKaya, false);
    assert.equal(body.sideEffects.writesFiles, false);
  });
});

test('POST /probe/maya-autonomy-authority-intake-preflight returns activation handoff evidence', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/maya-autonomy-authority-intake-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        target: 'runtime_dry_run',
        expectedAutonomyMode: 'full_access',
        expectedGrantScope: 'full_access',
        decision: {
          status: 'maya_autonomy_decision_allowed',
          authorityRef: 'maya-kaya:authority:canonical',
          decisionRef: 'maya-kaya:decision:bluepilot-runtime',
          subjectRef: 'user:g-dislioglu',
          autonomyMode: 'full_access',
          grantScope: 'full_access',
          ethicsCharterRef: 'maya-ethics-charter:canonical',
          safetyEvidenceRef: 'safety:evidence:bluepilot-runtime',
          expiresAt: '2026-06-16T16:00:00.000Z',
          hardStopCategories,
        },
      }),
    });
    const body = await response.json() as {
      status: string;
      decisionReady: boolean;
      activationDecisionHandoff: {
        target: string;
        mayaAuthorityDecision: { status: string; grantScope: string };
      };
      sideEffects: { callsMayaKaya: boolean; executesRuntime: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ready_for_activation_review');
    assert.equal(body.decisionReady, true);
    assert.equal(body.activationDecisionHandoff.target, 'runtime_dry_run');
    assert.equal(body.activationDecisionHandoff.mayaAuthorityDecision.status, 'maya_autonomy_decision_allowed');
    assert.equal(body.activationDecisionHandoff.mayaAuthorityDecision.grantScope, 'full_access');
    assert.equal(body.sideEffects.callsMayaKaya, false);
    assert.equal(body.sideEffects.executesRuntime, false);
  });
});

test('maya autonomy authority routes reject wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/maya-autonomy-authority-contract`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/maya-autonomy-authority-intake-preflight`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
