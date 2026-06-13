import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { loadPrReceiptFileArtifact } from '../src/prReceiptFileLoaderImplementation.js';
import { PR_RECEIPT_FILE_LOADER_CONFIRM } from '../src/prReceiptFileLoaderContract.js';
import type { PrReceiptArtifactFileLoaderDecision } from '../src/prReceiptArtifactFileLoaderDecision.js';

const decision: PrReceiptArtifactFileLoaderDecision = {
  status: 'ready',
  fileReadAllowed: true,
  path: 'artifacts/pr-receipts/bpk-046.json',
  maxBytes: 4096,
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const artifact = {
  releaseLabel: 'bpk-046-fixture',
  candidates: [{
    taskId: 'BPK-046',
    branch: 'bpk-043-046-handler-store-loader-implementations',
    commit: 'abc123',
    status: 'ready',
    title: 'PR Receipt Loader',
    summary: 'fixture',
    requiredPredecessors: [],
    checks: [{ name: 'test', status: 'pass' }],
  }],
  receipts: [{
    taskId: 'BPK-046',
    prUrl: 'https://github.com/G-Dislioglu/bluepilot/pull/46',
    headCommit: 'abc123',
    reviewDecision: 'approved',
    checks: [{ name: 'test', status: 'pass' }],
  }],
};

async function withTempRoot(test: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'bluepilot-bpk-046-'));
  try {
    await mkdir(path.join(root, 'artifacts/pr-receipts'), { recursive: true });
    await test(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function testLoadsApprovedLocalJson(): Promise<void> {
  await withTempRoot(async (root) => {
    await writeFile(path.join(root, decision.path), JSON.stringify(artifact), 'utf8');

    const result = await loadPrReceiptFileArtifact({
      rootDir: root,
      request: {
        method: 'POST',
        confirm: PR_RECEIPT_FILE_LOADER_CONFIRM,
        path: decision.path,
      },
      decision,
      requirePrReceipts: true,
    });

    assert.equal(result.status, 'ready');
    assert.equal(result.fileReadAllowed, true);
    assert.equal(result.artifact?.artifactSummary.receiptCount, 1);
  });
}

async function testOversizeFileBlocksBeforeReadImport(): Promise<void> {
  await withTempRoot(async (root) => {
    await writeFile(path.join(root, decision.path), JSON.stringify(artifact), 'utf8');

    const result = await loadPrReceiptFileArtifact({
      rootDir: root,
      request: {
        method: 'POST',
        confirm: PR_RECEIPT_FILE_LOADER_CONFIRM,
        path: decision.path,
      },
      decision: { ...decision, maxBytes: 4 },
    });

    assert.equal(result.status, 'blocked');
    assert.equal(result.bytesRead, 0);
    assert.ok(result.blockers.some((blocker) => blocker.startsWith('pr_receipt_file_loader_impl.file_too_large:')));
  });
}

async function testContractGuardBlocksRead(): Promise<void> {
  await withTempRoot(async (root) => {
    await writeFile(path.join(root, decision.path), JSON.stringify(artifact), 'utf8');

    const result = await loadPrReceiptFileArtifact({
      rootDir: root,
      request: {
        method: 'GET',
        path: decision.path,
      },
      decision,
    });

    assert.equal(result.status, 'blocked');
    assert.equal(result.bytesRead, 0);
    assert.ok(result.blockers.some((blocker) => blocker.includes('pr_receipt_file_loader_contract.post_required')));
  });
}

await testLoadsApprovedLocalJson();
await testOversizeFileBlocksBeforeReadImport();
await testContractGuardBlocksRead();

console.log('prReceiptFileLoaderImplementation tests passed');
