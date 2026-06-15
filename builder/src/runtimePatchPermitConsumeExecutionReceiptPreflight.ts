import type { RuntimePatchPermitConsumeExecutionAuthority } from './runtimePatchPermitConsumeExecutionAuthority.js';

export type RuntimePatchPermitConsumeExecutionReceiptPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeExecutionReceiptPreflightInput {
  authority: RuntimePatchPermitConsumeExecutionAuthority;
  receiptRef?: string;
  recorderRef?: string;
  receiptPolicyRef?: string;
}

export interface RuntimePatchPermitConsumeExecutionReceiptPreflight {
  status: RuntimePatchPermitConsumeExecutionReceiptPreflightStatus;
  consumeExecutionReceiptPreflightAllowed: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  executionReceiptRecorded: false;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executionExecuted: false;
  executionAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  executionAuthorityId?: string;
  receiptRef?: string;
  recorderRef?: string;
  receiptPolicyRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  consumeExecutionReceipt: {
    kind: 'runtime_patch_permit_consume_execution_receipt_preflight';
    permitKind: 'runtime_patch_application';
    permitRef?: string;
    executionAuthorityRef?: string;
    policyRef?: string;
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

export function preflightRuntimePatchPermitConsumeExecutionReceipt(
  input: RuntimePatchPermitConsumeExecutionReceiptPreflightInput,
): RuntimePatchPermitConsumeExecutionReceiptPreflight {
  const receiptRef = normalize(input.receiptRef);
  const recorderRef = normalize(input.recorderRef);
  const receiptPolicyRef = normalize(input.receiptPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `runtime_patch_permit_consume_execution_receipt_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `runtime_patch_permit_consume_execution_receipt_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionAuthorityAllowed || !input.authority.consumeExecutionAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_preflight.execution_authority_not_allowed');
  }
  if (!input.authority.consumeApplicationAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_preflight.application_must_be_authorized');
  }
  if (!input.authority.permitConsumeAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_preflight.consume_must_be_authorized');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.patchApplyAllowed !== false
    || input.authority.serverMutationExecuted !== false
    || input.authority.routeMutationExecuted !== false
    || input.authority.executionExecuted !== false
    || input.authority.executionAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_preflight.runtime_action_gates_must_stay_closed');
  }
  if (!receiptRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_preflight.receipt_ref_required');
  }
  if (!recorderRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_preflight.recorder_ref_required');
  }
  if (!receiptPolicyRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_preflight.receipt_policy_ref_required');
  }

  const status: RuntimePatchPermitConsumeExecutionReceiptPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptPreflightAllowed: status === 'ready',
    consumeExecutionAuthorized: input.authority.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.authority.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.authority.permitConsumeAuthorized,
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(input.authority.applicationAuthorityId ? { applicationAuthorityId: input.authority.applicationAuthorityId } : {}),
    ...(input.authority.executionAuthorityId ? { executionAuthorityId: input.authority.executionAuthorityId } : {}),
    ...(receiptRef ? { receiptRef } : {}),
    ...(recorderRef ? { recorderRef } : {}),
    ...(receiptPolicyRef ? { receiptPolicyRef } : {}),
    routePath: input.authority.routePath,
    envGateName: input.authority.envGateName,
    proposedFiles: [...input.authority.proposedFiles],
    evidenceRefs: unique([...input.authority.evidenceRefs, receiptRef, receiptPolicyRef]),
    consumeExecutionReceipt: {
      kind: 'runtime_patch_permit_consume_execution_receipt_preflight',
      permitKind: 'runtime_patch_application',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.executionAuthorityId ? { executionAuthorityRef: input.authority.executionAuthorityId } : {}),
      ...(receiptPolicyRef ? { policyRef: receiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_receipt_authority']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_execution_receipt_preflight_review']
        : ['resolve_runtime_patch_permit_consume_execution_receipt_preflight_blockers'],
  };
}
