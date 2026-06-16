import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import test from 'node:test';

import { DURABLE_AUDIT_RECEIPT_STORE_CONFIRM } from '../src/durableAuditReceiptStore.js';
import { handleDurableAuditReceiptStoreRequest } from '../src/durableAuditReceiptStoreRoute.js';

async function withRoute(run: (url: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    void handleDurableAuditReceiptStoreRequest(request, response, {
      now: new Date('2026-06-16T14:00:00.000Z'),
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

test('GET /probe/durable-audit-receipt-store-contract exposes closed store boundary', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/durable-audit-receipt-store-contract`);
    const body = await response.json() as {
      version: string;
      storeBoundary: { durablePersistenceAllowed: boolean; databaseWritesAllowed: boolean };
      sideEffects: { durablePersistence: boolean; databaseWrites: boolean };
    };

    assert.equal(response.status, 200);
    assert.equal(body.version, 'bluepilot-durable-audit-receipt-store-contract-v0.1');
    assert.equal(body.storeBoundary.durablePersistenceAllowed, false);
    assert.equal(body.storeBoundary.databaseWritesAllowed, false);
    assert.equal(body.sideEffects.durablePersistence, false);
    assert.equal(body.sideEffects.databaseWrites, false);
  });
});

test('POST /probe/durable-audit-receipt-store-preflight validates store plan without persistence', async () => {
  await withRoute(async (url) => {
    const response = await fetch(`${url}/probe/durable-audit-receipt-store-preflight`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        confirm: DURABLE_AUDIT_RECEIPT_STORE_CONFIRM,
        target: 'activation_bundle',
        operatorStoreRef: 'operator:store:review',
        auditRunRef: 'audit:run:2026-06-16',
        receiptBatchRef: 'receipt:batch:activation-locks',
        retentionPolicyRef: 'retention:policy:operator-audit',
        providerCallMount: { status: 'executor_mount_lock_ready', executorMountReady: true },
        runtimeDryRunMount: { status: 'executor_mount_lock_ready', executorMountReady: true },
        writeActionMount: { status: 'executor_mount_lock_ready', executorMountReady: true },
      }),
    });
    const body = await response.json() as {
      status: string;
      storeReady: boolean;
      durablePersistenceAllowed: boolean;
      databaseWritesAllowed: boolean;
    };

    assert.equal(response.status, 200);
    assert.equal(body.status, 'store_ready_for_activation_review');
    assert.equal(body.storeReady, true);
    assert.equal(body.durablePersistenceAllowed, false);
    assert.equal(body.databaseWritesAllowed, false);
  });
});

test('durable audit receipt store route rejects wrong methods and malformed JSON', async () => {
  await withRoute(async (url) => {
    const methodResponse = await fetch(`${url}/probe/durable-audit-receipt-store-contract`, { method: 'POST' });
    const methodBody = await methodResponse.json() as { error: string };

    assert.equal(methodResponse.status, 405);
    assert.equal(methodBody.error, 'method_not_allowed');

    const jsonResponse = await fetch(`${url}/probe/durable-audit-receipt-store-preflight`, {
      method: 'POST',
      body: '{',
    });
    const jsonBody = await jsonResponse.json() as { error: string };

    assert.equal(jsonResponse.status, 400);
    assert.equal(jsonBody.error.length > 0, true);
  });
});
