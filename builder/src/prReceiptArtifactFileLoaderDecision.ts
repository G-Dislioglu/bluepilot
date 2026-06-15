export type PrReceiptArtifactFileLoaderStatus = 'ready' | 'review_required' | 'blocked';

export interface PrReceiptArtifactFileLoaderDecisionInput {
  path: string;
  operatorApprovalRef?: string;
  maxBytes?: number;
}

export interface PrReceiptArtifactFileLoaderDecision {
  status: PrReceiptArtifactFileLoaderStatus;
  fileReadAllowed: boolean;
  path: string;
  maxBytes: number;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

const SAFE_PATH_RE = /^[A-Za-z0-9._/-]+$/;
const DEFAULT_MAX_BYTES = 64 * 1024;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizePath(value: string): string {
  return value.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

export function decidePrReceiptArtifactFileLoader(
  input: PrReceiptArtifactFileLoaderDecisionInput,
): PrReceiptArtifactFileLoaderDecision {
  const path = normalizePath(input.path);
  const operatorApprovalRef = normalize(input.operatorApprovalRef);
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES;
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (!path || path.startsWith('/') || /^[A-Za-z]:\//.test(path) || path.includes('//')) {
    blockers.push(`pr_receipt_file_loader.invalid_path:${input.path || '(missing)'}`);
  }
  if (path.split('/').some((segment) => segment === '..' || segment === '.')) {
    blockers.push(`pr_receipt_file_loader.relative_segment_forbidden:${input.path}`);
  }
  if (!SAFE_PATH_RE.test(path)) {
    blockers.push(`pr_receipt_file_loader.unsafe_characters:${input.path}`);
  }
  if (!path.startsWith('review-packets/') && !path.startsWith('artifacts/pr-receipts/')) {
    blockers.push(`pr_receipt_file_loader.path_prefix_not_allowed:${path}`);
  }
  if (!path.endsWith('.json')) {
    blockers.push(`pr_receipt_file_loader.json_required:${path}`);
  }
  if (maxBytes < 1 || maxBytes > DEFAULT_MAX_BYTES) {
    blockers.push(`pr_receipt_file_loader.max_bytes_out_of_bounds:${maxBytes}`);
  }
  if (!operatorApprovalRef) {
    reviewItems.push('pr_receipt_file_loader.operator_approval_ref_required');
  }

  const status: PrReceiptArtifactFileLoaderStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    fileReadAllowed: status === 'ready',
    path,
    maxBytes,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_separate_file_loader_contract_with_this_path_guard']
      : status === 'review_required'
        ? ['collect_operator_approval_for_receipt_file_loader']
        : ['resolve_receipt_file_loader_blockers'],
  };
}
