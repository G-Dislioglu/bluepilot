import type { PrReceiptArtifactFileLoaderDecision } from './prReceiptArtifactFileLoaderDecision.js';

export interface PrReceiptFileLoaderContractRequest {
  method: string;
  confirm?: string;
  path: string;
}

export interface PrReceiptFileLoaderContractResponse {
  statusCode: 200 | 400 | 405 | 409;
  body: {
    ok: boolean;
    code: string;
    fileReadAllowed: false;
    path?: string;
    reasons: string[];
  };
}

export const PR_RECEIPT_FILE_LOADER_CONFIRM = 'pr-receipt-file-loader-contract-only';

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildPrReceiptFileLoaderContractResponse(
  request: PrReceiptFileLoaderContractRequest,
  decision: PrReceiptArtifactFileLoaderDecision,
): PrReceiptFileLoaderContractResponse {
  const method = normalize(request.method).toUpperCase();
  const confirm = normalize(request.confirm);
  const path = normalize(request.path).replace(/\\/g, '/').replace(/^\.\//, '');
  const reasons: string[] = [];

  if (method !== 'POST') {
    return {
      statusCode: 405,
      body: { ok: false, code: 'method_not_allowed', fileReadAllowed: false, reasons: ['pr_receipt_file_loader_contract.post_required'] },
    };
  }
  if (confirm !== PR_RECEIPT_FILE_LOADER_CONFIRM) {
    reasons.push('pr_receipt_file_loader_contract.confirm_required');
  }
  if (path !== decision.path) {
    reasons.push(`pr_receipt_file_loader_contract.path_mismatch:${path}->${decision.path}`);
  }
  if (decision.status === 'blocked') {
    reasons.push(...decision.blockers.map((blocker) => `pr_receipt_file_loader_contract.decision_blocked:${blocker}`));
  }
  if (decision.status === 'review_required') {
    reasons.push(...decision.reviewItems.map((item) => `pr_receipt_file_loader_contract.decision_review_required:${item}`));
  }
  if (!decision.fileReadAllowed) {
    reasons.push('pr_receipt_file_loader_contract.file_read_not_allowed');
  }

  if (reasons.length > 0) {
    return {
      statusCode: decision.status === 'review_required' && reasons.every((reason) => reason.includes('decision_review_required')) ? 409 : 400,
      body: {
        ok: false,
        code: 'pr_receipt_file_loader_contract_not_ready',
        fileReadAllowed: false,
        path,
        reasons: unique(reasons),
      },
    };
  }

  return {
    statusCode: 200,
    body: {
      ok: true,
      code: 'pr_receipt_file_loader_contract_ready',
      fileReadAllowed: false,
      path,
      reasons: ['pr_receipt_file_loader_contract.contract_only_no_file_read'],
    },
  };
}
