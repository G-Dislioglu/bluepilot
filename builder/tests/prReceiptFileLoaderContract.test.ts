import assert from 'node:assert/strict';

import {
  buildPrReceiptFileLoaderContractResponse,
  PR_RECEIPT_FILE_LOADER_CONFIRM,
} from '../src/prReceiptFileLoaderContract.js';
import type { PrReceiptArtifactFileLoaderDecision } from '../src/prReceiptArtifactFileLoaderDecision.js';

const decision: PrReceiptArtifactFileLoaderDecision = {
  status: 'ready',
  fileReadAllowed: true,
  path: 'artifacts/pr-receipts/bpk-031.json',
  maxBytes: 4096,
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyContractDoesNotReadFile(): void {
  const response = buildPrReceiptFileLoaderContractResponse({
    method: 'POST',
    confirm: PR_RECEIPT_FILE_LOADER_CONFIRM,
    path: 'artifacts/pr-receipts/bpk-031.json',
  }, decision);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.fileReadAllowed, false);
  assert.ok(response.body.reasons.includes('pr_receipt_file_loader_contract.contract_only_no_file_read'));
}

function testMethodGuard(): void {
  const response = buildPrReceiptFileLoaderContractResponse({
    method: 'GET',
    path: 'artifacts/pr-receipts/bpk-031.json',
  }, decision);

  assert.equal(response.statusCode, 405);
}

function testPathMismatchBlocks(): void {
  const response = buildPrReceiptFileLoaderContractResponse({
    method: 'POST',
    confirm: PR_RECEIPT_FILE_LOADER_CONFIRM,
    path: 'artifacts/pr-receipts/other.json',
  }, decision);

  assert.equal(response.statusCode, 400);
  assert.ok(response.body.reasons.includes('pr_receipt_file_loader_contract.path_mismatch:artifacts/pr-receipts/other.json->artifacts/pr-receipts/bpk-031.json'));
}

testReadyContractDoesNotReadFile();
testMethodGuard();
testPathMismatchBlocks();

console.log('prReceiptFileLoaderContract tests passed');
