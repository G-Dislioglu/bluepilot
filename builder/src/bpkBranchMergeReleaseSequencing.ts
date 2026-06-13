export type BpkBranchCandidateStatus = 'verified' | 'pushed' | 'review_required' | 'blocked';
export type BpkCheckStatus = 'pass' | 'fail' | 'missing';
export type BpkReleaseSequenceStatus = 'ready' | 'review_required' | 'blocked';

export interface BpkBranchCheck {
  name: string;
  status: BpkCheckStatus;
}

export interface BpkBranchCandidate {
  taskId: string;
  branch: string;
  commit: string;
  status: BpkBranchCandidateStatus;
  title: string;
  summary: string;
  requiredPredecessors?: string[];
  checks: BpkBranchCheck[];
}

export interface BpkReleaseSequencingInput {
  releaseLabel: string;
  candidates: BpkBranchCandidate[];
}

export interface BpkReleaseSequencingPlan {
  status: BpkReleaseSequenceStatus;
  releaseLabel: string;
  orderedBranches: Array<{
    order: number;
    taskId: string;
    branch: string;
    commit: string;
    status: BpkBranchCandidateStatus;
  }>;
  blockers: string[];
  reviewItems: string[];
  releaseNotes: string[];
  nextActions: string[];
}

const TASK_ID_RE = /^BPK-\d{3}$/;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function taskNumber(taskId: string): number {
  return Number(taskId.split('-')[1] ?? '0');
}

function validateCandidate(candidate: BpkBranchCandidate): string[] {
  const blockers: string[] = [];
  if (!TASK_ID_RE.test(candidate.taskId)) {
    blockers.push(`bpk_release.invalid_task_id:${candidate.taskId}`);
  }
  if (!candidate.branch.trim()) {
    blockers.push(`bpk_release.branch_required:${candidate.taskId}`);
  }
  if (!candidate.commit.trim()) {
    blockers.push(`bpk_release.commit_required:${candidate.taskId}`);
  }
  if (!candidate.title.trim()) {
    blockers.push(`bpk_release.title_required:${candidate.taskId}`);
  }
  if (!candidate.summary.trim()) {
    blockers.push(`bpk_release.summary_required:${candidate.taskId}`);
  }
  return blockers;
}

function candidateHasFailingCheck(candidate: BpkBranchCandidate): string[] {
  return candidate.checks
    .filter((check) => check.status !== 'pass')
    .map((check) => `bpk_release.check_not_green:${candidate.taskId}:${check.name}:${check.status}`);
}

export function planBpkBranchMergeReleaseSequence(
  input: BpkReleaseSequencingInput,
): BpkReleaseSequencingPlan {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const releaseLabel = input.releaseLabel.trim() || 'unlabeled-bpk-release';
  const candidates = [...input.candidates].sort((a, b) => taskNumber(a.taskId) - taskNumber(b.taskId));
  const taskIds = candidates.map((candidate) => candidate.taskId);
  const duplicateTaskIds = taskIds.filter((taskId, index) => taskIds.indexOf(taskId) !== index);

  for (const taskId of unique(duplicateTaskIds)) {
    blockers.push(`bpk_release.duplicate_task:${taskId}`);
  }

  const knownTasks = new Set(taskIds);
  for (const candidate of candidates) {
    blockers.push(...validateCandidate(candidate));

    for (const predecessor of candidate.requiredPredecessors ?? []) {
      if (!knownTasks.has(predecessor)) {
        blockers.push(`bpk_release.missing_predecessor:${candidate.taskId}:${predecessor}`);
      }
    }

    blockers.push(...candidateHasFailingCheck(candidate));

    if (candidate.status === 'blocked') {
      blockers.push(`bpk_release.candidate_blocked:${candidate.taskId}`);
    }
    if (candidate.status === 'review_required') {
      reviewItems.push(`bpk_release.candidate_review_required:${candidate.taskId}`);
    }
  }

  const status: BpkReleaseSequenceStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    releaseLabel,
    orderedBranches: candidates.map((candidate, index) => ({
      order: index + 1,
      taskId: candidate.taskId,
      branch: candidate.branch,
      commit: candidate.commit,
      status: candidate.status,
    })),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    releaseNotes: candidates.map((candidate) => `- ${candidate.taskId} ${candidate.title}: ${candidate.summary}`),
    nextActions: status === 'ready'
      ? ['open_pull_requests_in_order', 'merge_after_green_review', 'cut_release_notes_from_plan']
      : status === 'review_required'
        ? ['resolve_review_items_before_merge', 'rerun_sequence_plan']
        : ['resolve_blockers_before_pr_or_merge', 'rerun_sequence_plan'],
  };
}
