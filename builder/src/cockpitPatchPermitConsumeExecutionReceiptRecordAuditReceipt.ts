import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority } from './cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority.js';

export type CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptStatus = 'recorded' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptInput {
  authority: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority;
  recordedAtRef?: string;
  auditReceiptEvidenceRef?: string;
}

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt {
  status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptStatus;
  consumeExecutionReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
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
  recordedAtRef?: string;
  auditReceiptEvidenceRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  recordedAuditReceipt: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt';
    permitKind: 'cockpit_patch_application';
    auditRef?: string;
    auditAuthorityRef?: string;
    receiptRef?: string;
    receiptAuthorityRef?: string;
    recordedAtRef?: string;
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

export function recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt(
  input: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptInput,
): CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt {
  const recordedAtRef = normalize(input.recordedAtRef);
  const auditReceiptEvidenceRef = normalize(input.auditReceiptEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt.audit_receipt_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptRecordAudited || !input.authority.consumeExecutionReceiptRecordAuditAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt.audit_must_be_authorized');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.patchApplyAllowed !== false
    || input.authority.serverMutationExecuted !== false
    || input.authority.routeMutationExecuted !== false
    || input.authority.executableActionAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.auditWriteAllowed !== false
  ) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt.action_gates_must_stay_closed');
  }
  if (!recordedAtRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt.recorded_at_ref_required');
  }
  if (!auditReceiptEvidenceRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt.audit_receipt_evidence_ref_required');
  }

  const status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'recorded';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecorded: status === 'recorded',
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: input.authority.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed,
    consumeExecutionReceiptRecordAudited: input.authority.consumeExecutionReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditAuthorized: input.authority.consumeExecutionReceiptRecordAuditAuthorized,
    permitConsumed: false,
    executionReceiptRecorded: input.authority.executionReceiptRecorded,
    patchApplyAllowed: false,
    serverMutationExecuted: false,
    routeMutationExecuted: false,
    executableActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.receiptRecordRef ? { receiptRecordRef: input.authority.receiptRecordRef } : {}),
    ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
    ...(input.authority.auditAuthorityId ? { auditAuthorityId: input.authority.auditAuthorityId } : {}),
    ...(input.authority.auditReceiptRef ? { auditReceiptRef: input.authority.auditReceiptRef } : {}),
    ...(input.authority.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.authority.auditReceiptAuthorityId } : {}),
    ...(input.authority.authorizedByRef ? { authorizedByRef: input.authority.authorizedByRef } : {}),
    ...(input.authority.expiresAtRef ? { expiresAtRef: input.authority.expiresAtRef } : {}),
    ...(recordedAtRef ? { recordedAtRef } : {}),
    ...(auditReceiptEvidenceRef ? { auditReceiptEvidenceRef } : {}),
    routePath: input.authority.routePath,
    envGateName: input.authority.envGateName,
    proposedFiles: [...input.authority.proposedFiles],
    evidenceRefs: unique([...input.authority.evidenceRefs, recordedAtRef, auditReceiptEvidenceRef]),
    recordedAuditReceipt: {
      kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt',
      permitKind: 'cockpit_patch_application',
      ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
      ...(input.authority.auditAuthorityId ? { auditAuthorityRef: input.authority.auditAuthorityId } : {}),
      ...(input.authority.auditReceiptRef ? { receiptRef: input.authority.auditReceiptRef } : {}),
      ...(input.authority.auditReceiptAuthorityId ? { receiptAuthorityRef: input.authority.auditReceiptAuthorityId } : {}),
      ...(recordedAtRef ? { recordedAtRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'recorded'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_review']
        : ['resolve_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_blockers'],
  };
}
