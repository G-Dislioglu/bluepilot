import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflight } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflight.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthorityInput {
  preflight: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflight;
  auditReceiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthority {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthorityStatus;
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: boolean;
  actionConsumed: false;
  executionReceiptRecorded: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  durablePersistenceAllowed: false;
  auditWriteAllowed: false;
  actionId?: string;
  receiptRecordRef?: string;
  auditRef?: string;
  auditAuthorityId?: string;
  auditReceiptRef?: string;
  auditReceiptAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorizedAuditReceipt: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority';
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

export function authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthorityInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthority {
  const auditReceiptAuthorityId = normalize(input.auditReceiptAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptRecordAudited || !input.preflight.consumeExecutionReceiptRecordAuditAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority.audit_must_be_authorized');
  }
  if (
    input.preflight.actionConsumed !== false
    || input.preflight.mergeAllowed !== false
    || input.preflight.externalActionAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.auditWriteAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority.merge_and_external_actions_must_stay_closed');
  }
  if (!auditReceiptAuthorityId) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority.audit_receipt_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority.expires_at_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthorityStatus = blockers.length > 0
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
    actionConsumed: false,
    executionReceiptRecorded: input.preflight.executionReceiptRecorded,
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.preflight.actionId ? { actionId: input.preflight.actionId } : {}),
    ...(input.preflight.receiptRecordRef ? { receiptRecordRef: input.preflight.receiptRecordRef } : {}),
    ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
    ...(input.preflight.auditAuthorityId ? { auditAuthorityId: input.preflight.auditAuthorityId } : {}),
    ...(input.preflight.auditReceiptRef ? { auditReceiptRef: input.preflight.auditReceiptRef } : {}),
    ...(auditReceiptAuthorityId ? { auditReceiptAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    ...(input.preflight.releaseLabel ? { releaseLabel: input.preflight.releaseLabel } : {}),
    evidenceRefs: unique([...input.preflight.evidenceRefs, auditReceiptAuthorityId, expiresAtRef]),
    runbookSteps: [...input.preflight.runbookSteps],
    authorizedAuditReceipt: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority',
      ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
      ...(input.preflight.auditAuthorityId ? { auditAuthorityRef: input.preflight.auditAuthorityId } : {}),
      ...(input.preflight.auditReceiptRef ? { receiptRef: input.preflight.auditReceiptRef } : {}),
      ...(auditReceiptAuthorityId ? { receiptAuthorityRef: auditReceiptAuthorityId } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_receipt']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority_blockers'],
  };
}
