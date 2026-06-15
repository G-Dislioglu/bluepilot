import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority } from './cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority.js';

export type CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditStatus = 'audited' | 'review_required' | 'blocked';

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditInput {
  authority: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority;
  auditedAtRef?: string;
  auditEvidenceRef?: string;
}

export interface CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit {
  status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: boolean;
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
  auditedAtRef?: string;
  auditEvidenceRef?: string;
  routePath: string;
  envGateName: string;
  proposedFiles: string[];
  evidenceRefs: string[];
  recordedAuditReceiptRecordAudit: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit';
    permitKind: 'cockpit_patch_application';
    recordRef?: string;
    auditRef?: string;
    auditAuthorityRef?: string;
    auditedAtRef?: string;
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

export function recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit(
  input: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditInput,
): CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit {
  const auditedAtRef = normalize(input.auditedAtRef);
  const auditEvidenceRef = normalize(input.auditEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.audit_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptRecordRecorded || !input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized) {
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.audit_receipt_record_must_be_recorded');
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
    blockers.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.action_gates_must_stay_closed');
  }
  if (!auditedAtRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.audited_at_ref_required');
  }
  if (!auditEvidenceRef) {
    reviewItems.push('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.audit_evidence_ref_required');
  }

  const status: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'audited';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAudited: status === 'audited',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed,
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
    ...(auditedAtRef ? { auditedAtRef } : {}),
    ...(auditEvidenceRef ? { auditEvidenceRef } : {}),
    routePath: input.authority.routePath,
    envGateName: input.authority.envGateName,
    proposedFiles: [...input.authority.proposedFiles],
    evidenceRefs: unique([...input.authority.evidenceRefs, auditedAtRef, auditEvidenceRef]),
    recordedAuditReceiptRecordAudit: {
      kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit',
      permitKind: 'cockpit_patch_application',
      ...(input.authority.auditReceiptRecordRef ? { recordRef: input.authority.auditReceiptRecordRef } : {}),
      ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
      ...(input.authority.auditReceiptRecordAuditAuthorityId ? { auditAuthorityRef: input.authority.auditReceiptRecordAuditAuthorityId } : {}),
      ...(auditedAtRef ? { auditedAtRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'audited'
      ? ['open_task_lock_for_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight']
      : status === 'review_required'
        ? ['complete_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_review']
        : ['resolve_cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_blockers'],
  };
}
