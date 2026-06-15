import type { CockpitPatchAuthorityReviewDecisionGate } from './cockpitPatchAuthorityReviewDecisionGate.js';

export type CockpitPatchPermitIssuePreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitIssuePreflightInput {
  decisionGate: CockpitPatchAuthorityReviewDecisionGate;
  preflightRef?: string;
  issuerRef?: string;
  issuePolicyRef?: string;
}

export interface CockpitPatchPermitIssuePreflight {
  status: CockpitPatchPermitIssuePreflightStatus;
  permitIssuePreflightAllowed: boolean;
  permitIssued: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  preflightRef?: string;
  issuerRef?: string;
  issuePolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  permitIssue: {
    kind: 'cockpit_patch_permit_issue_preflight';
    permitKind: 'cockpit_patch_application';
    decisionRef?: string;
    authorityRef?: string;
  };
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function preflightCockpitPatchPermitIssue(
  input: CockpitPatchPermitIssuePreflightInput,
): CockpitPatchPermitIssuePreflight {
  const preflightRef = normalize(input.preflightRef);
  const issuerRef = normalize(input.issuerRef);
  const issuePolicyRef = normalize(input.issuePolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.decisionGate.status === 'blocked') {
    blockers.push(...input.decisionGate.blockers.map((blocker) => `cockpit_patch_permit_issue_preflight.decision_blocked:${blocker}`));
  }
  if (input.decisionGate.status === 'review_required') {
    reviewItems.push(...input.decisionGate.reviewItems.map((item) => `cockpit_patch_permit_issue_preflight.decision_review_required:${item}`));
  }
  if (!input.decisionGate.authorityDecisionGateAllowed) {
    blockers.push('cockpit_patch_permit_issue_preflight.decision_gate_not_allowed');
  }
  if (input.decisionGate.decision !== 'approve') {
    blockers.push('cockpit_patch_permit_issue_preflight.decision_must_be_approve');
  }
  if (
    input.decisionGate.permitIssued !== false
    || input.decisionGate.patchApplyAllowed !== false
    || input.decisionGate.serverMutationExecuted !== false
    || input.decisionGate.routeMutationExecuted !== false
    || input.decisionGate.executableActionAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_issue_preflight.action_gates_must_stay_closed');
  }
  if (!preflightRef) {
    reviewItems.push('cockpit_patch_permit_issue_preflight.preflight_ref_required');
  }
  if (!issuerRef) {
    reviewItems.push('cockpit_patch_permit_issue_preflight.issuer_ref_required');
  }
  if (!issuePolicyRef) {
    reviewItems.push('cockpit_patch_permit_issue_preflight.issue_policy_ref_required');
  }

  const status: CockpitPatchPermitIssuePreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitIssuePreflightAllowed: status === 'ready',
    permitIssued: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    ...(preflightRef ? { preflightRef } : {}),
    ...(issuerRef ? { issuerRef } : {}),
    ...(issuePolicyRef ? { issuePolicyRef } : {}),
    routePath: input.decisionGate.routePath,
    envGateName: input.decisionGate.envGateName,
    proposedFiles: [...input.decisionGate.proposedFiles],
    evidenceRefs: unique([...input.decisionGate.evidenceRefs, preflightRef, issuePolicyRef]),
    permitIssue: {
      kind: 'cockpit_patch_permit_issue_preflight',
      permitKind: 'cockpit_patch_application',
      ...(input.decisionGate.decisionRef ? { decisionRef: input.decisionGate.decisionRef } : {}),
      ...(input.decisionGate.authorityRef ? { authorityRef: input.decisionGate.authorityRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_issue_authority']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_issue_preflight_review']
        : ['resolve_cockpit_patch_permit_issue_preflight_blockers'],
  };
}
