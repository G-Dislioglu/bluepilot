import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority } from './cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority.js';

export type CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptStatus = 'recorded' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptInput {
  authority: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority;
  recordedAtRef?: string;
  auditReceiptRecordAuditReceiptEvidenceRef?: string;
}

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt {
  status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorized: boolean;
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
  sourceAuditRef?: string;
  auditReceiptRef?: string;
  auditReceiptAuthorityId?: string;
  auditReceiptRecordRef?: string;
  auditReceiptRecordAuthorityId?: string;
  auditRef?: string;
  auditReceiptRecordAuditAuthorityId?: string;
  auditReceiptRecordAuditReceiptRef?: string;
  auditReceiptRecordAuditReceiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  recordedAtRef?: string;
  auditReceiptRecordAuditReceiptEvidenceRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  recordedAuditReceiptRecordAuditReceipt: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt';
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

export function recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt(
  input: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptInput,
): CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt {
  const recordedAtRef = normalize(input.recordedAtRef);
  const auditReceiptRecordAuditReceiptEvidenceRef = normalize(input.auditReceiptRecordAuditReceiptEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.audit_receipt_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAudited || !input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.audit_must_be_authorized');
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
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.action_gates_must_stay_closed');
  }
  if (!recordedAtRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.recorded_at_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptEvidenceRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.audit_receipt_record_audit_receipt_evidence_ref_required');
  }

  const status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'recorded';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: status === 'recorded',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordAudited: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.authority.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.authority.consumeExecutionReceiptRecordAuditReceiptAuthorized,
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
    ...(input.authority.sourceAuditRef ? { sourceAuditRef: input.authority.sourceAuditRef } : {}),
    ...(input.authority.auditReceiptRef ? { auditReceiptRef: input.authority.auditReceiptRef } : {}),
    ...(input.authority.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.authority.auditReceiptAuthorityId } : {}),
    ...(input.authority.auditReceiptRecordRef ? { auditReceiptRecordRef: input.authority.auditReceiptRecordRef } : {}),
    ...(input.authority.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.authority.auditReceiptRecordAuthorityId } : {}),
    ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
    ...(input.authority.auditReceiptRecordAuditAuthorityId ? { auditReceiptRecordAuditAuthorityId: input.authority.auditReceiptRecordAuditAuthorityId } : {}),
    ...(input.authority.auditReceiptRecordAuditReceiptRef ? { auditReceiptRecordAuditReceiptRef: input.authority.auditReceiptRecordAuditReceiptRef } : {}),
    ...(input.authority.auditReceiptRecordAuditReceiptAuthorityId ? { auditReceiptRecordAuditReceiptAuthorityId: input.authority.auditReceiptRecordAuditReceiptAuthorityId } : {}),
    ...(input.authority.authorizedByRef ? { authorizedByRef: input.authority.authorizedByRef } : {}),
    ...(input.authority.expiresAtRef ? { expiresAtRef: input.authority.expiresAtRef } : {}),
    ...(recordedAtRef ? { recordedAtRef } : {}),
    ...(auditReceiptRecordAuditReceiptEvidenceRef ? { auditReceiptRecordAuditReceiptEvidenceRef } : {}),
    routePath: input.authority.routePath,
    envGateName: input.authority.envGateName,
    proposedFiles: [...input.authority.proposedFiles],
    evidenceRefs: unique([...input.authority.evidenceRefs, recordedAtRef, auditReceiptRecordAuditReceiptEvidenceRef]),
    recordedAuditReceiptRecordAuditReceipt: {
      kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt',
      permitKind: 'cockpit_patch_application',
      ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
      ...(input.authority.auditReceiptRecordAuditAuthorityId ? { auditAuthorityRef: input.authority.auditReceiptRecordAuditAuthorityId } : {}),
      ...(input.authority.auditReceiptRecordAuditReceiptRef ? { receiptRef: input.authority.auditReceiptRecordAuditReceiptRef } : {}),
      ...(input.authority.auditReceiptRecordAuditReceiptAuthorityId ? { receiptAuthorityRef: input.authority.auditReceiptRecordAuditReceiptAuthorityId } : {}),
      ...(recordedAtRef ? { recordedAtRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'recorded'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_review']
        : ['resolve_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_blockers'],
  };
}
