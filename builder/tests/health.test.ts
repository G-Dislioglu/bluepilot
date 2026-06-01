import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkDbReadiness,
  handleHealthRequest,
  type DbReadinessPayload,
  type HealthPayload,
  type MayaGateProbePayload,
} from '../src/health.js';

test('GET /health returns 200 without touching the database', async () => {
  const server = createServer((request, response) => {
    void handleHealthRequest(request, response, {
      dbFactory: () => {
        throw new Error('db should not be called for /health');
      },
      now: new Date('2026-05-31T00:00:00.000Z'),
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    const body = (await response.json()) as HealthPayload;

    assert.equal(response.status, 200);
    assert.equal(body.service, 'bluepilot-builder');
    assert.equal(body.status, 'ok');
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
});

test('DB readiness returns not_configured when BLUEPILOT_BUILDER_DATABASE_URL is unset', async () => {
  const previous = process.env.BLUEPILOT_BUILDER_DATABASE_URL;
  delete process.env.BLUEPILOT_BUILDER_DATABASE_URL;

  try {
    const readiness = await checkDbReadiness(undefined, new Date('2026-05-31T00:00:00.000Z'));

    assert.equal(readiness.service, 'bluepilot-builder');
    assert.equal(readiness.status, 'not_configured');
    assert.equal(readiness.detail, 'BLUEPILOT_BUILDER_DATABASE_URL is not configured');
  } finally {
    if (previous === undefined) {
      delete process.env.BLUEPILOT_BUILDER_DATABASE_URL;
    } else {
      process.env.BLUEPILOT_BUILDER_DATABASE_URL = previous;
    }
  }
});

test('GET /health/db catches failing database probes', async () => {
  const server = createServer((request, response) => {
    void handleHealthRequest(request, response, {
      dbFactory: () => {
        throw new Error('simulated connection failure');
      },
      now: new Date('2026-05-31T00:00:00.000Z'),
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://127.0.0.1:${address.port}/health/db`);
    const body = (await response.json()) as DbReadinessPayload;

    assert.equal(response.status, 503);
    assert.equal(body.status, 'unreachable');
    assert.equal(body.detail, 'database unreachable');
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
});

test('GET /health/maya-gate reports all gates reachable without serializing token values', async () => {
  const previousCoreUrl = process.env.MAYA_CORE_URL;
  const previousGateToken = process.env.MAYA_CORE_GATE_TOKEN;
  const fakeToken = 'bp-135-fake-secret-token';

  process.env.MAYA_CORE_URL = 'https://maya-core.example';
  process.env.MAYA_CORE_GATE_TOKEN = fakeToken;

  const server = createServer((request, response) => {
    void handleHealthRequest(request, response, {
      gateClient: {
        async assessBudget(input) {
          assert.equal(input.providerId, 'openai');
          assert.equal(input.modelId, 'gpt-4.1-nano');
          return {
            allowed: true,
            reason: 'under_threshold',
            gateAvailable: true,
          };
        },
        async assessCorridor(input) {
          assert.equal(input.actionKind, 'push');
          assert.equal(input.dryRun, true);
          return {
            allowed: true,
            reason: 'probe_corridor_allowed',
            dryRunOnly: true,
            gateAvailable: true,
          };
        },
        async recordCost() {
          return { recorded: true };
        },
      },
      now: new Date('2026-06-01T00:00:00.000Z'),
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://127.0.0.1:${address.port}/health/maya-gate`);
    const text = await response.text();
    const body = JSON.parse(text) as MayaGateProbePayload;

    assert.equal(response.status, 200);
    assert.equal(body.mayaCoreConfigured, true);
    assert.equal(body.budget.reachable, true);
    assert.equal(body.budget.reason, 'under_threshold');
    assert.equal(body.corridor.reachable, true);
    assert.equal(body.corridor.reason, 'probe_corridor_allowed');
    assert.equal(body.cost.reachable, true);
    assert.equal(body.cost.recorded, true);
    assert.equal(text.includes(fakeToken), false);
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

    if (previousCoreUrl === undefined) {
      delete process.env.MAYA_CORE_URL;
    } else {
      process.env.MAYA_CORE_URL = previousCoreUrl;
    }

    if (previousGateToken === undefined) {
      delete process.env.MAYA_CORE_GATE_TOKEN;
    } else {
      process.env.MAYA_CORE_GATE_TOKEN = previousGateToken;
    }
  }
});

test('GET /health/maya-gate reports gate unavailable without failing the handler', async () => {
  const previousCoreUrl = process.env.MAYA_CORE_URL;
  const previousGateToken = process.env.MAYA_CORE_GATE_TOKEN;

  delete process.env.MAYA_CORE_URL;
  delete process.env.MAYA_CORE_GATE_TOKEN;

  const server = createServer((request, response) => {
    void handleHealthRequest(request, response, {
      gateClient: {
        async assessBudget() {
          return {
            allowed: true,
            reason: 'gate_unavailable',
            gateAvailable: false,
          };
        },
        async assessCorridor(input) {
          assert.equal(input.actionKind, 'push');
          assert.equal(input.dryRun, true);
          return {
            allowed: false,
            reason: 'gate_unavailable',
            requiresApproval: true,
            dryRunOnly: true,
            gateAvailable: false,
          };
        },
        async recordCost() {
          return { recorded: false, error: 'maya_core_url_not_configured' };
        },
      },
      now: new Date('2026-06-01T00:00:00.000Z'),
    });
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');

    const response = await fetch(`http://127.0.0.1:${address.port}/health/maya-gate`);
    const body = (await response.json()) as MayaGateProbePayload;

    assert.equal(response.status, 503);
    assert.equal(body.mayaCoreConfigured, false);
    assert.equal(body.budget.reachable, false);
    assert.equal(body.budget.reason, 'gate_unavailable');
    assert.equal(body.corridor.reachable, false);
    assert.equal(body.corridor.reason, 'gate_unavailable');
    assert.equal(body.cost.reachable, false);
    assert.equal(body.cost.recorded, false);
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

    if (previousCoreUrl === undefined) {
      delete process.env.MAYA_CORE_URL;
    } else {
      process.env.MAYA_CORE_URL = previousCoreUrl;
    }

    if (previousGateToken === undefined) {
      delete process.env.MAYA_CORE_GATE_TOKEN;
    } else {
      process.env.MAYA_CORE_GATE_TOKEN = previousGateToken;
    }
  }
});
