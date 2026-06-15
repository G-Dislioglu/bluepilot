import type { PrReceiptFileLoaderImplementationResult } from './prReceiptFileLoaderImplementation.js';

export type PrReceiptLoaderOperatorRunbookStatus = 'ready' | 'review_required' | 'blocked';

export interface PrReceiptLoaderOperatorRunbookInput {
  loaderResult: PrReceiptFileLoaderImplementationResult;
  operatorApprovalRef?: string;
  rootPolicyRef?: string;
  evidenceRefs?: string[];
}

export interface PrReceiptLoaderOperatorRunbook {
  status: PrReceiptLoaderOperatorRunbookStatus;
  runbookAllowed: boolean;
  fileReadAllowed: false;
  externalActionAllowed: false;
  operatorApprovalRef?: string;
  rootPolicyRef?: string;
  evidenceRefs: string[];
  checklist: Array<{
    id: string;
    passed: boolean;
    detail: string;
  }>;
  steps: string[];
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildPrReceiptLoaderOperatorRunbook(
  input: PrReceiptLoaderOperatorRunbookInput,
): PrReceiptLoaderOperatorRunbook {
  const operatorApprovalRef = normalize(input.operatorApprovalRef);
  const rootPolicyRef = normalize(input.rootPolicyRef);
  const evidenceRefs = unique((input.evidenceRefs ?? []).map(normalize).filter(Boolean));
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.loaderResult.status === 'blocked') {
    blockers.push(...input.loaderResult.blockers.map((blocker) => `pr_receipt_loader_runbook.loader_blocked:${blocker}`));
  }
  if (input.loaderResult.status === 'review_required') {
    reviewItems.push(...input.loaderResult.reviewItems.map((item) => `pr_receipt_loader_runbook.loader_review_required:${item}`));
  }
  if (input.loaderResult.status !== 'ready' || !input.loaderResult.artifact) {
    blockers.push('pr_receipt_loader_runbook.ready_loader_artifact_required');
  }
  if (!input.loaderResult.path) {
    blockers.push('pr_receipt_loader_runbook.loaded_path_required');
  }
  if (!operatorApprovalRef) {
    reviewItems.push('pr_receipt_loader_runbook.operator_approval_ref_required');
  }
  if (!rootPolicyRef) {
    reviewItems.push('pr_receipt_loader_runbook.root_policy_ref_required');
  }
  if (evidenceRefs.length === 0) {
    reviewItems.push('pr_receipt_loader_runbook.evidence_ref_required');
  }

  const status: PrReceiptLoaderOperatorRunbookStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    runbookAllowed: status === 'ready',
    fileReadAllowed: false,
    externalActionAllowed: false,
    ...(operatorApprovalRef ? { operatorApprovalRef } : {}),
    ...(rootPolicyRef ? { rootPolicyRef } : {}),
    evidenceRefs,
    checklist: [
      {
        id: 'loader_ready',
        passed: input.loaderResult.status === 'ready',
        detail: input.loaderResult.status,
      },
      {
        id: 'root_policy_present',
        passed: Boolean(rootPolicyRef),
        detail: rootPolicyRef || 'missing',
      },
      {
        id: 'operator_approval_present',
        passed: Boolean(operatorApprovalRef),
        detail: operatorApprovalRef || 'missing',
      },
      {
        id: 'evidence_refs_present',
        passed: evidenceRefs.length > 0,
        detail: `${evidenceRefs.length}`,
      },
      {
        id: 'external_actions_closed',
        passed: true,
        detail: 'no_github_no_pr_no_merge_no_write',
      },
    ],
    steps: [
      'confirm_operator_approval_ref',
      'confirm_allowed_root_policy_ref',
      'run_bpk_046_loader_with_guarded_path',
      'record_loader_result_and_artifact_summary',
      'use_report_only_for_release_governance_review',
    ],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['operator_may_attach_runbook_to_pr_receipt_governance_review']
      : status === 'review_required'
        ? ['complete_pr_receipt_loader_runbook_review']
        : ['resolve_pr_receipt_loader_runbook_blockers'],
  };
}
