import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDurableAuditReceiptStoreContract,
  buildDurableAuditReceiptStorePreflight,
  DURABLE_AUDIT_RECEIPT_STORE_CONFIRM,
} from '../src/durableAuditReceiptStore.js';

const readyMount = {
  status: 'executor_mount_lock_ready',
  executorMountReady: true,
};

function readyRequest() {
  return {
    confirm: DURABLE_AUDIT_RECEIPT_STORE_CONFIRM,
    target: 'activation_bundle',
    operatorStoreRef: 'operator:store:review',
    auditRunRef: 'audit:run:2026-06-16',
    receiptBatchRef: 'receipt:batch:activation-locks',
    retentionPolicyRef: 'retention:policy:operator-audit',
    providerCallMount: { ...readyMount, ref: 'provider:mount:ready' },
    runtimeDryRunMount: { ...readyMount, ref: 'runtime:mount:ready' },
    writeActionMount: { ...readyMount, ref: 'write:mount:ready' },
  };
}

test('durable audit receipt store contract keeps persistence closed', () => {
  const contract = buildDurableAuditReceiptStoreContract(new Date('2026-06-16T14:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-durable-audit-receipt-store-contract-v0.1');
  assert.equal(contract.storeBoundary.durablePersistenceAllowed, false);
  assert.equal(contract.storeBoundary.databaseWritesAllowed, false);
  assert.equal(contract.sideEffects.durablePersistence, false);
  assert.equal(contract.sideEffects.databaseWrites, false);
});

test('durable audit receipt store can become review-ready without persistence', () => {
  const preflight = buildDurableAuditReceiptStorePreflight(readyRequest(), new Date('2026-06-16T14:00:00.000Z'));

  assert.equal(preflight.status, 'store_ready_for_activation_review');
  assert.equal(preflight.storeReady, true);
  assert.equal(preflight.plannedRecord?.target, 'activation_bundle');
  assert.deepEqual(preflight.plannedRecord?.evidenceTargets, ['provider_call', 'runtime_dry_run', 'write_action']);
  assert.equal(preflight.durablePersistenceAllowed, false);
  assert.equal(preflight.databaseWritesAllowed, false);
});

test('durable audit receipt store blocks missing confirmation', () => {
  const request = readyRequest();
  request.confirm = 'wrong';
  const preflight = buildDurableAuditReceiptStorePreflight(request, new Date('2026-06-16T14:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('durable_audit_receipt_store.confirm_required'));
  assert.equal(preflight.storeReady, false);
});

test('durable audit receipt store blocks unready mount evidence', () => {
  const request = readyRequest();
  request.writeActionMount = { status: 'blocked', executorMountReady: false, ref: 'write:mount:blocked' };
  const preflight = buildDurableAuditReceiptStorePreflight(request, new Date('2026-06-16T14:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('durable_audit_receipt_store.executor_mount_not_ready:write_action'));
  assert.equal(preflight.durablePersistenceAllowed, false);
});
