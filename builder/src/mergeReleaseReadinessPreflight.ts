import {
  planBpkBranchPrConsolidation,
  type BpkBranchPrConsolidationPlan,
} from './bpkBranchPrConsolidation.js';
import type { BpkBranchCandidate } from './bpkBranchMergeReleaseSequencing.js';
import type { BpkPrReviewRecord } from './bpkPrReviewExecution.js';

export interface MergeReleaseReadinessPreflightRequest {
  releaseLabel?: unknown;
  candidates?: unknown;
  reviews?: unknown;
  requirePrReceipts?: unknown;
}

export interface MergeReleaseReadinessSideEffects {
  fileWrites: false;
  githubWrites: false;
  providerCalls: false;
  runtimeExecution: false;
  durablePersistence: false;
  databaseWrites: false;
  pullRequestCreation: false;
  merges: false;
  deploys: false;
}

export interface MergeReleaseReadinessContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-merge-release-readiness-preflight-contract-v0.1';
  generatedAt: string;
  consolidationDependency: 'planBpkBranchPrConsolidation';
  activationBoundary: {
    createsPullRequests: false;
    mergesBranches: false;
    deploysRelease: false;
    callsGitHub: false;
    writesFiles: false;
  };
  requiredInputs: string[];
  sideEffects: MergeReleaseReadinessSideEffects;
}

export interface MergeReleaseReadinessPreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-merge-release-readiness-preflight-v0.1';
  generatedAt: string;
  status: 'ready_for_pr_sequence_review' | 'review_required' | 'blocked';
  releaseLabel: string;
  blockers: string[];
  reviewItems: string[];
  orderedPullRequestSequence: Array<{
    order: number;
    taskId: string;
    branch: string;
    commit: string;
    prUrl?: string;
    reviewDecision?: string;
  }>;
  operatorHints: {
    mayOpenPullRequestsInOrder: boolean;
    mayMergeAfterReceiptsInOrder: boolean;
    releaseNotesReady: boolean;
  };
  applicationActions: {
    pullRequestCreationAllowed: false;
    mergeExecutionAllowed: false;
    deployExecutionAllowed: false;
  };
  consolidationPlan: BpkBranchPrConsolidationPlan;
  nextStep: string;
  contract: MergeReleaseReadinessContract;
  sideEffects: MergeReleaseReadinessSideEffects;
}

function lockedSideEffects(): MergeReleaseReadinessSideEffects {
  return {
    fileWrites: false,
    githubWrites: false,
    providerCalls: false,
    runtimeExecution: false,
    durablePersistence: false,
    databaseWrites: false,
    pullRequestCreation: false,
    merges: false,
    deploys: false,
  };
}

export function buildMergeReleaseReadinessContract(now = new Date()): MergeReleaseReadinessContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-merge-release-readiness-preflight-contract-v0.1',
    generatedAt: now.toISOString(),
    consolidationDependency: 'planBpkBranchPrConsolidation',
    activationBoundary: {
      createsPullRequests: false,
      mergesBranches: false,
      deploysRelease: false,
      callsGitHub: false,
      writesFiles: false,
    },
    requiredInputs: ['releaseLabel', 'candidates[].taskId', 'candidates[].branch', 'candidates[].commit', 'candidates[].checks'],
    sideEffects: lockedSideEffects(),
  };
}

export function buildMergeReleaseReadinessPreflight(
  request: MergeReleaseReadinessPreflightRequest,
  now = new Date(),
): MergeReleaseReadinessPreflight {
  const blockers: string[] = [];
  const releaseLabel = normalizeReleaseLabel(request.releaseLabel);
  const candidates = normalizeCandidates(request.candidates, blockers);
  const reviews = normalizeReviews(request.reviews, blockers);
  const requirePrReceipts = request.requirePrReceipts === true;

  const consolidationPlan = planBpkBranchPrConsolidation({
    releaseLabel,
    candidates,
    reviews,
    requirePrReceipts,
  });

  blockers.push(...consolidationPlan.blockers.map((blocker) => `merge_release.consolidation_blocked:${blocker}`));
  const reviewItems = consolidationPlan.reviewItems.map((item) => `merge_release.consolidation_review:${item}`);

  const status: MergeReleaseReadinessPreflight['status'] = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready_for_pr_sequence_review';

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-merge-release-readiness-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    releaseLabel: consolidationPlan.releaseLabel,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    orderedPullRequestSequence: buildSequence(consolidationPlan),
    operatorHints: {
      mayOpenPullRequestsInOrder: status === 'ready_for_pr_sequence_review' && consolidationPlan.pullRequestCreationAllowed,
      mayMergeAfterReceiptsInOrder: status === 'ready_for_pr_sequence_review' && consolidationPlan.mergeAllowed,
      releaseNotesReady: status === 'ready_for_pr_sequence_review' && consolidationPlan.branchSequence.releaseNotes.length > 0,
    },
    applicationActions: {
      pullRequestCreationAllowed: false,
      mergeExecutionAllowed: false,
      deployExecutionAllowed: false,
    },
    consolidationPlan,
    nextStep: nextStepForStatus(status, consolidationPlan),
    contract: buildMergeReleaseReadinessContract(now),
    sideEffects: lockedSideEffects(),
  };
}

function buildSequence(plan: BpkBranchPrConsolidationPlan): MergeReleaseReadinessPreflight['orderedPullRequestSequence'] {
  const prByTask = new Map((plan.prReceipt?.orderedPullRequests ?? []).map((pr) => [pr.taskId, pr]));

  return plan.branchSequence.orderedBranches.map((branch) => {
    const pr = prByTask.get(branch.taskId);
    return {
      order: branch.order,
      taskId: branch.taskId,
      branch: branch.branch,
      commit: branch.commit,
      ...(pr ? { prUrl: pr.prUrl, reviewDecision: pr.reviewDecision } : {}),
    };
  });
}

function normalizeReleaseLabel(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim() : 'bluepilot-integration-release';
}

function normalizeCandidates(value: unknown, blockers: string[]): BpkBranchCandidate[] {
  if (!Array.isArray(value)) {
    blockers.push('merge_release.candidates_required');
    return [];
  }

  return value.map((candidate) => candidate as BpkBranchCandidate);
}

function normalizeReviews(value: unknown, blockers: string[]): BpkPrReviewRecord[] {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    blockers.push('merge_release.reviews_must_be_array');
    return [];
  }

  return value.map((review) => review as BpkPrReviewRecord);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function nextStepForStatus(
  status: MergeReleaseReadinessPreflight['status'],
  plan: BpkBranchPrConsolidationPlan,
): string {
  if (status === 'ready_for_pr_sequence_review' && plan.mergeAllowed) {
    return 'Operator may review merge order and receipts manually; Bluepilot does not merge or deploy.';
  }
  if (status === 'ready_for_pr_sequence_review') {
    return 'Operator may open pull requests manually in the listed order; Bluepilot does not create PRs.';
  }
  if (status === 'review_required') {
    return 'Resolve review items before PR or merge readiness can be reviewed.';
  }
  return 'Resolve blockers before PR creation, merge, or deploy readiness review.';
}
