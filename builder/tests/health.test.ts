import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { checkDbReadiness, handleHealthRequest, type DbReadinessPayload, type HealthPayload } from '../src/health.js';

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
