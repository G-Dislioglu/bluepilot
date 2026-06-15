import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptStatus = 'recorded' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptInput {
  authority: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority;
  recordedAtRef?: string;
  auditReceiptRecordAuditReceiptEvidenceRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptStatus;
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
  actionConsumed: false;
  executionReceiptRecorded: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  durablePersistenceAllowed: false;
  auditWriteAllowed: false;
  actionId?: string;
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
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  recordedAuditReceiptRecordAuditReceipt: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt';
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

export function recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt {
  const recordedAtRef = normalize(input.recordedAtRef);
  const auditReceiptRecordAuditReceiptEvidenceRef = normalize(input.auditReceiptRecordAuditReceiptEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt.audit_receipt_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAudited || !input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt.audit_must_be_authorized');
  }
  if (
    input.authority.actionConsumed !== false
    || input.authority.mergeAllowed !== false
    || input.authority.externalActionAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.auditWriteAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt.merge_and_external_actions_must_stay_closed');
  }
  if (!recordedAtRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt.recorded_at_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptEvidenceRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt.audit_receipt_record_audit_receipt_evidence_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptStatus = blockers.length > 0
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
    actionConsumed: false,
    executionReceiptRecorded: input.authority.executionReceiptRecorded,
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.authority.actionId ? { actionId: input.authority.actionId } : {}),
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
    ...(input.authority.releaseLabel ? { releaseLabel: input.authority.releaseLabel } : {}),
    evidenceRefs: unique([...input.authority.evidenceRefs, recordedAtRef, auditReceiptRecordAuditReceiptEvidenceRef]),
    runbookSteps: [...input.authority.runbookSteps],
    recordedAuditReceiptRecordAuditReceipt: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt',
      ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
      ...(input.authority.auditReceiptRecordAuditAuthorityId ? { auditAuthorityRef: input.authority.auditReceiptRecordAuditAuthorityId } : {}),
      ...(input.authority.auditReceiptRecordAuditReceiptRef ? { receiptRef: input.authority.auditReceiptRecordAuditReceiptRef } : {}),
      ...(input.authority.auditReceiptRecordAuditReceiptAuthorityId ? { receiptAuthorityRef: input.authority.auditReceiptRecordAuditReceiptAuthorityId } : {}),
      ...(recordedAtRef ? { recordedAtRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'recorded'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_blockers'],
  };
}
