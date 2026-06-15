import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight } from './cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight.js';

export type CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthorityInput {
  preflight: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight;
  auditReceiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority {
  status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthorityStatus;
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: boolean;
  permitConsumed: false;
  executionReceiptRecorded: boolean;
  patchApplyAllowed: false;
  serverMutationExecuted: false;
  routeMutationExecuted: false;
  executableActionAllowed: false;
  durablePersistenceAllowed: false;
  auditWriteAllowed: false;
  permitId?: string;
  receiptRecordRef?: string;
  auditRef?: string;
  auditAuthorityId?: string;
  auditReceiptRef?: string;
  auditReceiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  authorizedAuditReceipt: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority';
    permitKind: 'cockpit_patch_application';
    auditRef?: string;
    auditAuthorityRef?: string;
    receiptRef?: string;
    receiptAuthorityRef?: string;
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

export function authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt(
  input: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthorityInput,
): CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority {
  const auditReceiptAuthorityId = normalize(input.auditReceiptAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptRecordAudited || !input.preflight.consumeExecutionReceiptRecordAuditAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority.audit_must_be_authorized');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.patchApplyAllowed !== false
    || input.preflight.serverMutationExecuted !== false
    || input.preflight.routeMutationExecuted !== false
    || input.preflight.executableActionAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.auditWriteAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority.action_gates_must_stay_closed');
  }
  if (!auditReceiptAuthorityId) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority.audit_receipt_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority.expires_at_ref_required');
  }

  const status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptAuthorized: status === 'ready',
    consumeExecutionReceiptRecordAudited: input.preflight.consumeExecutionReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditAuthorized: input.preflight.consumeExecutionReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: input.preflight.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed,
    permitConsumed: false,
    executionReceiptRecorded: input.preflight.executionReceiptRecorded,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(input.preflight.receiptRecordRef ? { receiptRecordRef: input.preflight.receiptRecordRef } : {}),
    ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
    ...(input.preflight.auditAuthorityId ? { auditAuthorityId: input.preflight.auditAuthorityId } : {}),
    ...(input.preflight.auditReceiptRef ? { auditReceiptRef: input.preflight.auditReceiptRef } : {}),
    ...(auditReceiptAuthorityId ? { auditReceiptAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    routePath: input.preflight.routePath,
    envGateName: input.preflight.envGateName,
    proposedFiles: [...input.preflight.proposedFiles],
    evidenceRefs: unique([...input.preflight.evidenceRefs, auditReceiptAuthorityId, expiresAtRef]),
    authorizedAuditReceipt: {
      kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority',
      permitKind: 'cockpit_patch_application',
      ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
      ...(input.preflight.auditAuthorityId ? { auditAuthorityRef: input.preflight.auditAuthorityId } : {}),
      ...(input.preflight.auditReceiptRef ? { receiptRef: input.preflight.auditReceiptRef } : {}),
      ...(auditReceiptAuthorityId ? { receiptAuthorityRef: auditReceiptAuthorityId } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority_review']
        : ['resolve_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority_blockers'],
  };
}
