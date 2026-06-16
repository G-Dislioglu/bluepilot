import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { handleActivationDecisionOperatorModeRequest } from '../src/activationDecisionOperatorModeRoute.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleActivationDecisionOperatorModeRequest(request, response, {
      now: new Date('2026-06-16T15:00:00.000Z'),
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

test('GET /probe/activation-decision-operator-mode-contract exposes autonomy contract', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/activation-decision-operator-mode-contract`);
    const body = await response.json() as {
      version: string;
      autonomyModes: string[];
      hardStopCategories: string[];
      autonomyAuthority: { sourceOfTruth: string; localAppRole: string };
      decisionBoundary: { evaluatesOnly: boolean; callsProviders: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-activation-decision-operator-mode-contract-v0.1');
    assert.ok(body.autonomyModes.includes('full_access'));
    assert.ok(body.hardStopCategories.includes('banking'));
    assert.equal(body.autonomyAuthority.sourceOfTruth, 'maya_kaya');
    assert.equal(body.autonomyAuthority.localAppRole, 'consumer_and_executor_guard');
    assert.equal(body.decisionBoundary.evaluatesOnly, true);
    assert.equal(body.decisionBoundary.callsProviders, false);
  });
});

test('POST /probe/activation-decision-operator-mode-preflight allows full access without execution side effects', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/activation-decision-operator-mode-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        autonomyMode: 'full_access',
        target: 'runtime_dry_run',
        operatorGrantRef: 'operator:grant:full-access-session',
        operatorGrantScope: 'full_access',
        activationDecisionRef: 'activation:decision:runtime',
        ethicsCharterRef: 'maya-ethics-charter:canonical',
        safetyEvidenceRef: 'safety:evidence:runtime',
        userIntentRef: 'user:intent:continue-autonomously',
        mayaAuthorityDecision: {
          status: 'maya_autonomy_decision_allowed',
          authorityRef: 'maya-kaya:authority:canonical',
          decisionRef: 'maya-kaya:decision:runtime',
          subjectRef: 'user:g-dislioglu',
          autonomyMode: 'full_access',
          grantScope: 'full_access',
          ethicsCharterRef: 'maya-ethics-charter:canonical',
          safetyEvidenceRef: 'safety:evidence:runtime',
        },
        executorEvidence: {
          status: 'executor_mount_lock_ready',
          executorMountReady: true,
        },
        durableReceiptStore: {
          status: 'store_ready_for_activation_review',
          storeReady: true,
        },
      }),
    });
    const body = await response.json() as {
      status: string;
      executeAllowed: boolean;
      repeatedPromptRequired: boolean;
      authoritySource: string;
      mayaAuthorityDecisionReady: boolean;
      allowedActions: { runtimeDryRun: boolean };
      sideEffects: { runtimeExecution: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'execute_allowed');
    assert.equal(body.executeAllowed, true);
    assert.equal(body.repeatedPromptRequired, false);
    assert.equal(body.authoritySource, 'maya_kaya');
    assert.equal(body.mayaAuthorityDecisionReady, true);
    assert.equal(body.allowedActions.runtimeDryRun, true);
    assert.equal(body.sideEffects.runtimeExecution, false);
  });
});

test('activation decision route rejects wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/activation-decision-operator-mode-contract`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/activation-decision-operator-mode-preflight`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
