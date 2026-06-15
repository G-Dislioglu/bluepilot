import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthorityInput {
  preflight: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight;
  auditAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthority {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthorityStatus;
  consumeExecutionReceiptRecordAuditAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditPreflightAllowed: boolean;
  consumeExecutionReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuthorized: boolean;
  consumeExecutionReceiptAuthorized: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  approvedActionConsumeAuthorized: boolean;
  approvedActionAuthorized: boolean;
  actionConsumed: false;
  executionReceiptRecorded: boolean;
  mergeAllowed: false;
  externalActionAllowed: false;
  durablePersistenceAllowed: false;
  auditWriteAllowed: false;
  actionId?: string;
  receiptRecordRef?: string;
  receiptRecordAuthorityId?: string;
  auditRef?: string;
  auditorRef?: string;
  auditPolicyRef?: string;
  auditAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  authorizedAudit: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_authority';
    recordRef?: string;
    auditRef?: string;
    policyRef?: string;
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

export function authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthorityInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthority {
  const auditAuthorityId = normalize(input.auditAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionReceiptRecordAuditPreflightAllowed) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeExecutionReceiptRecorded || !input.preflight.executionReceiptRecorded) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_authority.record_must_be_recorded');
  }
  if (
    input.preflight.actionConsumed !== false
    || input.preflight.mergeAllowed !== false
    || input.preflight.externalActionAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.auditWriteAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_authority.merge_and_external_actions_must_stay_closed');
  }
  if (!auditAuthorityId) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_authority.audit_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_authority.expires_at_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditAuthorityAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditAuthorized: status === 'ready',
    consumeExecutionReceiptRecordAuditPreflightAllowed: input.preflight.consumeExecutionReceiptRecordAuditPreflightAllowed,
    consumeExecutionReceiptRecorded: input.preflight.consumeExecutionReceiptRecorded,
    consumeExecutionReceiptRecordAuthorized: input.preflight.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.preflight.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.preflight.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.preflight.consumeApplicationAuthorized,
    approvedActionConsumeAuthorized: input.preflight.approvedActionConsumeAuthorized,
    approvedActionAuthorized: input.preflight.approvedActionAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: input.preflight.executionReceiptRecorded,
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.preflight.actionId ? { actionId: input.preflight.actionId } : {}),
    ...(input.preflight.receiptRecordRef ? { receiptRecordRef: input.preflight.receiptRecordRef } : {}),
    ...(input.preflight.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.preflight.receiptRecordAuthorityId } : {}),
    ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
    ...(input.preflight.auditorRef ? { auditorRef: input.preflight.auditorRef } : {}),
    ...(input.preflight.auditPolicyRef ? { auditPolicyRef: input.preflight.auditPolicyRef } : {}),
    ...(auditAuthorityId ? { auditAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    ...(input.preflight.releaseLabel ? { releaseLabel: input.preflight.releaseLabel } : {}),
    evidenceRefs: unique([...input.preflight.evidenceRefs, auditAuthorityId, expiresAtRef]),
    runbookSteps: [...input.preflight.runbookSteps],
    authorizedAudit: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_authority',
      ...(input.preflight.receiptRecordRef ? { recordRef: input.preflight.receiptRecordRef } : {}),
      ...(input.preflight.auditRef ? { auditRef: input.preflight.auditRef } : {}),
      ...(input.preflight.auditPolicyRef ? { policyRef: input.preflight.auditPolicyRef } : {}),
      ...(auditAuthorityId ? { auditAuthorityRef: auditAuthorityId } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_authority_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_authority_blockers'],
  };
}
