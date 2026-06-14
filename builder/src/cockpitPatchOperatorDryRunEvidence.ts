import type { CockpitServerPatchOperatorDryRun } from './cockpitServerPatchOperatorDryRun.js';

export type CockpitPatchOperatorDryRunEvidenceStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchOperatorDryRunEvidenceInput {
  dryRun: CockpitServerPatchOperatorDryRun;
  evidenceRef?: string;
  reviewerRef?: string;
  evidenceRefs?: string[];
}

export interface CockpitPatchOperatorDryRunEvidence {
  status: CockpitPatchOperatorDryRunEvidenceStatus;
  evidencePackAllowed: boolean;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  evidenceRef?: string;
  reviewerRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  simulatedSteps: string[];
  evidenceRefs: string[];
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function normalizeRefs(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => normalize(value)).filter(Boolean))];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildCockpitPatchOperatorDryRunEvidence(
  input: CockpitPatchOperatorDryRunEvidenceInput,
): CockpitPatchOperatorDryRunEvidence {
  const evidenceRef = normalize(input.evidenceRef);
  const reviewerRef = normalize(input.reviewerRef);
  const evidenceRefs = normalizeRefs(input.evidenceRefs);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.dryRun.status === 'blocked') {
    blockers.push(...input.dryRun.blockers.map((blocker) => `cockpit_patch_dry_run_evidence.dry_run_blocked:${blocker}`));
  }
  if (input.dryRun.status === 'review_required') {
    reviewItems.push(...input.dryRun.reviewItems.map((item) => `cockpit_patch_dry_run_evidence.dry_run_review_required:${item}`));
  }
  if (!input.dryRun.dryRunAllowed) {
    blockers.push('cockpit_patch_dry_run_evidence.dry_run_not_allowed');
  }
  if (input.dryRun.patchApplyAllowed !== false) {
    blockers.push('cockpit_patch_dry_run_evidence.patch_apply_must_stay_closed');
  }
  if (input.dryRun.serverMutationExecuted !== false || input.dryRun.routeMutationExecuted !== false) {
    blockers.push('cockpit_patch_dry_run_evidence.mutation_must_not_be_executed');
  }
  if (input.dryRun.executableActionAllowed !== false) {
    blockers.push('cockpit_patch_dry_run_evidence.executable_actions_must_stay_disabled');
  }
  if (!evidenceRef) {
    reviewItems.push('cockpit_patch_dry_run_evidence.evidence_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('cockpit_patch_dry_run_evidence.reviewer_ref_required');
  }
  if (evidenceRefs.length === 0) {
    reviewItems.push('cockpit_patch_dry_run_evidence.evidence_refs_required');
  }

  const status: CockpitPatchOperatorDryRunEvidenceStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    evidencePackAllowed: status === 'ready',
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(evidenceRef ? { evidenceRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    routePath: input.dryRun.routePath,
    envGateName: input.dryRun.envGateName,
    proposedFiles: [...input.dryRun.proposedFiles],
    simulatedSteps: [...input.dryRun.simulatedSteps],
    evidenceRefs,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['attach_cockpit_patch_dry_run_evidence_to_operator_review']
      : status === 'review_required'
        ? ['complete_cockpit_patch_dry_run_evidence_review']
        : ['resolve_cockpit_patch_dry_run_evidence_blockers'],
  };
}
