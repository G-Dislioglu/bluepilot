import { promises as fs } from 'node:fs';
import path from 'node:path';

import {
  buildPrReceiptFileLoaderContractResponse,
  type PrReceiptFileLoaderContractRequest,
} from './prReceiptFileLoaderContract.js';
import type { PrReceiptArtifactFileLoaderDecision } from './prReceiptArtifactFileLoaderDecision.js';
import {
  importPrReceiptArtifact,
  type PrReceiptArtifactImport,
} from './prReceiptArtifactImport.js';

export type PrReceiptFileLoaderImplementationStatus = 'ready' | 'review_required' | 'blocked';

export interface PrReceiptFileLoaderImplementationInput {
  rootDir: string;
  request: PrReceiptFileLoaderContractRequest;
  decision: PrReceiptArtifactFileLoaderDecision;
  requirePrReceipts?: boolean;
}

export interface PrReceiptFileLoaderImplementationResult {
  status: PrReceiptFileLoaderImplementationStatus;
  fileReadAllowed: boolean;
  path?: string;
  bytesRead: number;
  artifact?: PrReceiptArtifactImport;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizePath(value: string): string {
  return value.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function isInsideRoot(rootDir: string, filePath: string): boolean {
  const relative = path.relative(rootDir, filePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export async function loadPrReceiptFileArtifact(
  input: PrReceiptFileLoaderImplementationInput,
): Promise<PrReceiptFileLoaderImplementationResult> {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const rootDir = path.resolve(input.rootDir);
  const normalizedPath = normalizePath(input.request.path);
  const contractResponse = buildPrReceiptFileLoaderContractResponse(input.request, input.decision);

  if (contractResponse.statusCode !== 200 || !contractResponse.body.ok) {
    blockers.push(...contractResponse.body.reasons.map((reason) => `pr_receipt_file_loader_impl.contract_not_ready:${reason}`));
  }
  if (input.decision.status === 'blocked') {
    blockers.push(...input.decision.blockers.map((blocker) => `pr_receipt_file_loader_impl.decision_blocked:${blocker}`));
  }
  if (input.decision.status === 'review_required') {
    reviewItems.push(...input.decision.reviewItems.map((item) => `pr_receipt_file_loader_impl.decision_review_required:${item}`));
  }
  if (!input.decision.fileReadAllowed) {
    blockers.push('pr_receipt_file_loader_impl.file_read_not_allowed_by_decision');
  }
  if (!input.rootDir.trim()) {
    blockers.push('pr_receipt_file_loader_impl.root_dir_required');
  }

  const filePath = path.resolve(rootDir, normalizedPath);
  if (!isInsideRoot(rootDir, filePath)) {
    blockers.push(`pr_receipt_file_loader_impl.path_outside_root:${normalizedPath}`);
  }

  if (blockers.length > 0 || reviewItems.length > 0) {
    const status: PrReceiptFileLoaderImplementationStatus = blockers.length > 0 ? 'blocked' : 'review_required';
    return {
      status,
      fileReadAllowed: false,
      path: normalizedPath,
      bytesRead: 0,
      blockers: unique(blockers),
      reviewItems: unique(reviewItems),
      nextActions: status === 'review_required'
        ? ['complete_pr_receipt_file_loader_review']
        : ['resolve_pr_receipt_file_loader_blockers'],
    };
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    return {
      status: 'blocked',
      fileReadAllowed: false,
      path: normalizedPath,
      bytesRead: 0,
      blockers: ['pr_receipt_file_loader_impl.file_missing'],
      reviewItems,
      nextActions: ['provide_existing_pr_receipt_file'],
    };
  }

  if (!stat.isFile()) {
    return {
      status: 'blocked',
      fileReadAllowed: false,
      path: normalizedPath,
      bytesRead: 0,
      blockers: ['pr_receipt_file_loader_impl.file_required'],
      reviewItems,
      nextActions: ['provide_file_pr_receipt_artifact'],
    };
  }
  if (stat.size > input.decision.maxBytes) {
    return {
      status: 'blocked',
      fileReadAllowed: false,
      path: normalizedPath,
      bytesRead: 0,
      blockers: [`pr_receipt_file_loader_impl.file_too_large:${stat.size}->${input.decision.maxBytes}`],
      reviewItems,
      nextActions: ['reduce_pr_receipt_file_size_or_raise_contract_limit'],
    };
  }

  const raw = await fs.readFile(filePath, 'utf8');
  const artifact = importPrReceiptArtifact({
    artifact: raw,
    requirePrReceipts: input.requirePrReceipts,
  });
  blockers.push(...artifact.blockers.map((blocker) => `pr_receipt_file_loader_impl.artifact_blocked:${blocker}`));
  reviewItems.push(...artifact.reviewItems.map((item) => `pr_receipt_file_loader_impl.artifact_review_required:${item}`));

  const status: PrReceiptFileLoaderImplementationStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    fileReadAllowed: status === 'ready',
    path: normalizedPath,
    bytesRead: Buffer.byteLength(raw, 'utf8'),
    artifact,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['use_loaded_pr_receipt_report_for_release_governance']
      : status === 'review_required'
        ? ['review_loaded_pr_receipt_artifact']
        : ['resolve_loaded_pr_receipt_artifact_blockers'],
  };
}
