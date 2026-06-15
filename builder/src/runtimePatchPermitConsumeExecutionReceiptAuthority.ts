import type { RuntimePatchPermitConsumeExecutionReceiptPreflight } from './runtimePatchPermitConsumeExecutionReceiptPreflight.js';

export type RuntimePatchPermitConsumeExecutionReceiptAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface RuntimePatchPermitConsumeExecutionReceiptAuthorityInput {
  preflight: RuntimePatchPermitConsumeExecutionReceiptPreflight;
  receiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface RuntimePatchPermitConsumeExecutionReceiptAuthority {
  status: RuntimePatchPermitConsumeExecutionReceiptAuthorityStatus;
  consumeExecutionReceiptAuthorityAllowed: boolean;
  consumeExecutionReceiptAuthorized: boolean;
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
  receiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorizedReceipt: {
    kind: 'runtime_patch_permit_consume_execution_receipt_authority';
    permitKind: 'runtime_patch_application';
    permitRef?: string;
    executionAuthorityRef?: string;
    receiptRef?: string;
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

export function authorizeRuntimePatchPermitConsumeExecutionReceipt(
  input: RuntimePatchPermitConsumeExecutionReceiptAuthorityInput,
): RuntimePatchPermitConsumeExecutionReceiptAuthority {
  const receiptAuthorityId = normalize(input.receiptAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `runtime_patch_permit_consume_execution_receipt_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `runtime_patch_permit_consume_execution_receipt_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptPreflightAllowed) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_authority.execution_must_be_authorized');
  }
  if (!input.preflight.permitConsumeAuthorized) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_authority.consume_must_be_authorized');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.executionReceiptRecorded !== false
    || input.preflight.patchApplyAllowed !== false
    || input.preflight.serverMutationExecuted !== false
    || input.preflight.routeMutationExecuted !== false
    || input.preflight.executionExecuted !== false
    || input.preflight.executionAllowed !== false
  ) {
    blockers.push('runtime_patch_permit_consume_execution_receipt_authority.runtime_action_gates_must_stay_closed');
  }
  if (!receiptAuthorityId) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_authority.receipt_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('runtime_patch_permit_consume_execution_receipt_authority.expires_at_ref_required');
  }

  const status: RuntimePatchPermitConsumeExecutionReceiptAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptAuthorized: status === 'ready',
    consumeExecutionAuthorized: input.preflight.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.preflight.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.preflight.permitConsumeAuthorized,
    permitIssued: input.preflight.permitIssued,
    permitConsumed: false,
    executionReceiptRecorded: false,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executionExecuted: false,
    executionAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(input.preflight.consumeAuthorityId ? { consumeAuthorityId: input.preflight.consumeAuthorityId } : {}),
    ...(input.preflight.applicationAuthorityId ? { applicationAuthorityId: input.preflight.applicationAuthorityId } : {}),
    ...(input.preflight.executionAuthorityId ? { executionAuthorityId: input.preflight.executionAuthorityId } : {}),
    ...(receiptAuthorityId ? { receiptAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, receiptAuthorityId, expiresAtRef]),
    authorizedReceipt: {
      kind: 'runtime_patch_permit_consume_execution_receipt_authority',
      permitKind: 'runtime_patch_application',
      ...(input.preflight.permitId ? { permitRef: input.preflight.permitId } : {}),
      ...(input.preflight.executionAuthorityId ? { executionAuthorityRef: input.preflight.executionAuthorityId } : {}),
      ...(input.preflight.receiptRef ? { receiptRef: input.preflight.receiptRef } : {}),
      ...(input.preflight.receiptPolicyRef ? { policyRef: input.preflight.receiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_runtime_patch_permit_consume_execution_receipt_record_preflight']
      : status === 'review_required'
        ? ['complete_runtime_patch_permit_consume_execution_receipt_authority_review']
        : ['resolve_runtime_patch_permit_consume_execution_receipt_authority_blockers'],
  };
}
