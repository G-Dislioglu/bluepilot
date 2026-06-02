import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assessBudget,
  assessCorridor,
  recordCost,
  resetMayaBuilderGateClientForTests,
  setMayaBuilderGateFetchForTests
} from '../src/mayaBuilderGateClient.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

test('maya builder gate fails closed without reachable maya-core for premium and write actions', async () => {
  const originalMayaCoreUrl = process.env.MAYA_CORE_URL;
  const originalGateToken = process.env.MAYA_CORE_GATE_TOKEN;

  try {
    delete process.env.MAYA_CORE_URL;
    delete process.env.MAYA_CORE_GATE_TOKEN;

    const premiumWithoutGate = await assessBudget({
      providerId: 'anthropic',
      modelId: 'claude-opus-4-8',
      inputTokens: 1000,
      outputTokens: 1000
    });
    assert.equal(premiumWithoutGate.allowed, false);
    assert.equal(premiumWithoutGate.reason, 'gate_unavailable');

    const cheapWithoutGate = await assessBudget({
      providerId: 'gemini',
      modelId: 'gemini-2.5-flash',
      inputTokens: 1000,
      outputTokens: 1000
    });
    assert.equal(cheapWithoutGate.allowed, true);
    assert.equal(cheapWithoutGate.gateAvailable, false);

    const corridorWithoutGate = await assessCorridor({
      intent: 'write a file to the repository',
      actionKind: 'push'
    });
    assert.equal(corridorWithoutGate.allowed, false);
    assert.equal(corridorWithoutGate.reason, 'gate_unavailable');
    assert.equal(corridorWithoutGate.dryRunOnly, true);
  } finally {
    resetMayaBuilderGateClientForTests();
    if (originalMayaCoreUrl === undefined) {
      delete process.env.MAYA_CORE_URL;
    } else {
      process.env.MAYA_CORE_URL = originalMayaCoreUrl;
    }
    if (originalGateToken === undefined) {
      delete process.env.MAYA_CORE_GATE_TOKEN;
    } else {
      process.env.MAYA_CORE_GATE_TOKEN = originalGateToken;
    }
  }
});

test('maya builder gate sends gate token and records cost through maya-core endpoints', async () => {
  const originalMayaCoreUrl = process.env.MAYA_CORE_URL;
  const originalGateToken = process.env.MAYA_CORE_GATE_TOKEN;

  try {
    process.env.MAYA_CORE_URL = 'https://maya-core.example/';
    process.env.MAYA_CORE_GATE_TOKEN = 'secret-token';

    let budgetUrl = '';
    let budgetBody: Record<string, unknown> = {};
    setMayaBuilderGateFetchForTests(async (input, init) => {
      budgetUrl = String(input);
      budgetBody = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
      assert.equal((init?.headers as Record<string, string>)['x-maya-core-gate-token'], 'secret-token');
      return jsonResponse({ allowed: false, reason: 'budget_stop', requiresOperatorDecision: true }) as any;
    });

    const budgetStop = await assessBudget({
      providerId: 'openai',
      modelId: 'gpt-5.5',
      inputTokens: 10,
      outputTokens: 20,
      taskDescription: 'expensive builder call'
    });
    assert.equal(budgetUrl, 'https://maya-core.example/api/builder/budget/assess');
    assert.equal(budgetBody.providerId, 'openai');
    assert.equal(budgetBody.modelId, 'gpt-5.5');
    assert.equal(budgetStop.allowed, false);

    let recordUrl = '';
    setMayaBuilderGateFetchForTests(async (input) => {
      recordUrl = String(input);
      return jsonResponse({ recorded: true }) as any;
    });
    const costRecord = await recordCost({
      providerId: 'gemini',
      modelId: 'gemini-2.5-flash',
      inputTokens: 3,
      outputTokens: 5,
      taskId: 'test-task'
    });
    assert.equal(costRecord.recorded, true);
    assert.equal(recordUrl, 'https://maya-core.example/api/builder/cost/record');
  } finally {
    resetMayaBuilderGateClientForTests();
    if (originalMayaCoreUrl === undefined) {
      delete process.env.MAYA_CORE_URL;
    } else {
      process.env.MAYA_CORE_URL = originalMayaCoreUrl;
    }
    if (originalGateToken === undefined) {
      delete process.env.MAYA_CORE_GATE_TOKEN;
    } else {
      process.env.MAYA_CORE_GATE_TOKEN = originalGateToken;
    }
  }
});

test('maya builder gate forwards write permit corridor fields', async () => {
  const originalMayaCoreUrl = process.env.MAYA_CORE_URL;
  const originalGateToken = process.env.MAYA_CORE_GATE_TOKEN;

  try {
    process.env.MAYA_CORE_URL = 'https://maya-core.example';
    process.env.MAYA_CORE_GATE_TOKEN = 'secret-token';

    let corridorBody: Record<string, unknown> = {};
    setMayaBuilderGateFetchForTests(async (_input, init) => {
      corridorBody = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
      return jsonResponse({ allowed: true, reason: 'permit_consumed' }) as any;
    });

    const decision = await assessCorridor({
      intent: 'write permitted file',
      actionKind: 'push',
      permitId: 'permit-123',
      repo: 'G-Dislioglu/bluepilot-sandbox',
      branch: 'main',
      path: '.bluepilot/permit.md',
      op: 'create',
      baseSha: '',
      contentHash: 'sha256:abc',
      contentLen: 13
    });

    assert.equal(decision.allowed, true);
    assert.equal(corridorBody.permitId, 'permit-123');
    assert.equal(corridorBody.repo, 'G-Dislioglu/bluepilot-sandbox');
    assert.equal(corridorBody.path, '.bluepilot/permit.md');
    assert.equal(corridorBody.op, 'create');
    assert.equal(corridorBody.contentHash, 'sha256:abc');
    assert.equal(corridorBody.contentLen, 13);
  } finally {
    resetMayaBuilderGateClientForTests();
    if (originalMayaCoreUrl === undefined) {
      delete process.env.MAYA_CORE_URL;
    } else {
      process.env.MAYA_CORE_URL = originalMayaCoreUrl;
    }
    if (originalGateToken === undefined) {
      delete process.env.MAYA_CORE_GATE_TOKEN;
    } else {
      process.env.MAYA_CORE_GATE_TOKEN = originalGateToken;
    }
  }
});
