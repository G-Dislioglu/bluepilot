import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityInput {
  preflight: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight;
  auditReceiptRecordAuditAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: boolean;
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
  authorizedByRef?: string;
  expiresAtRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorizedAuditReceiptRecordAudit: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority';
    recordRef?: string;
    auditRef?: string;
    auditAuthorityRef?: string;
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

export function authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority {
  const auditReceiptRecordAuditAuthorityId = normalize(input.auditReceiptRecordAuditAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordRecorded || !input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority.audit_receipt_record_must_be_ready');
  }
  if (
    input.preflight.actionConsumed !== false
    || input.preflight.mergeAllowed !== false
    || input.preflight.externalActionAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.auditWriteAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority.merge_and_external_actions_must_stay_closed');
  }
  if (!auditReceiptRecordAuditAuthorityId) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority.audit_receipt_record_audit_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority.expires_at_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.preflight.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.preflight.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: input.preflight.executionReceiptRecorded,
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.preflight.actionId ? { actionId: input.preflight.actionId } : {}),
    ...(input.preflight.receiptRecordRef ? { receiptRecordRef: input.preflight.receiptRecordRef } : {}),
    ...(input.preflight.sourceAuditRef ? { sourceAuditRef: input.preflight.sourceAuditRef } : {}),
    ...(input.preflight.auditReceiptRef ? { auditReceiptRef: input.preflight.auditReceiptRef } : {}),
    ...(input.preflight.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.preflight.auditReceiptAuthorityId } : {}),
    ...(input.preflight.auditReceiptRecordRef ? { auditReceiptRecordRef: input.preflight.auditReceiptRecordRef } : {}),
    ...(input.preflight.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.preflight.auditReceiptRecordAuthorityId } : {}),
    ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
    ...(auditReceiptRecordAuditAuthorityId ? { auditReceiptRecordAuditAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    ...(input.preflight.releaseLabel ? { releaseLabel: input.preflight.releaseLabel } : {}),
    evidenceRefs: unique([...input.preflight.evidenceRefs, auditReceiptRecordAuditAuthorityId, expiresAtRef]),
    runbookSteps: [...input.preflight.runbookSteps],
    authorizedAuditReceiptRecordAudit: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority',
      ...(input.preflight.auditReceiptRecordRef ? { recordRef: input.preflight.auditReceiptRecordRef } : {}),
      ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
      ...(auditReceiptRecordAuditAuthorityId ? { auditAuthorityRef: auditReceiptRecordAuditAuthorityId } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority_blockers'],
  };
}
