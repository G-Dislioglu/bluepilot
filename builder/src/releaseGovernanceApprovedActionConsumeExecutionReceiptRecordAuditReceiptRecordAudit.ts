import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditStatus = 'audited' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditInput {
  authority: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority;
  auditedAtRef?: string;
  auditEvidenceRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: boolean;
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
  auditedAtRef?: string;
  auditEvidenceRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  recordedAuditReceiptRecordAudit: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit';
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

export function recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit {
  const auditedAtRef = normalize(input.auditedAtRef);
  const auditEvidenceRef = normalize(input.auditEvidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit.authority_review_required:${item}`));
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed || !input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit.audit_authority_not_allowed');
  }
  if (!input.authority.consumeExecutionReceiptRecordAuditReceiptRecordRecorded || !input.authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit.audit_receipt_record_must_be_recorded');
  }
  if (
    input.authority.actionConsumed !== false
    || input.authority.mergeAllowed !== false
    || input.authority.externalActionAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.auditWriteAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit.merge_and_external_actions_must_stay_closed');
  }
  if (!auditedAtRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit.audited_at_ref_required');
  }
  if (!auditEvidenceRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit.audit_evidence_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditStatus = blockers.length > 0
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
    ...(auditedAtRef ? { auditedAtRef } : {}),
    ...(auditEvidenceRef ? { auditEvidenceRef } : {}),
    ...(input.authority.releaseLabel ? { releaseLabel: input.authority.releaseLabel } : {}),
    evidenceRefs: unique([...input.authority.evidenceRefs, auditedAtRef, auditEvidenceRef]),
    runbookSteps: [...input.authority.runbookSteps],
    recordedAuditReceiptRecordAudit: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit',
      ...(input.authority.auditReceiptRecordRef ? { recordRef: input.authority.auditReceiptRecordRef } : {}),
      ...(input.authority.auditRef ? { auditRef: input.authority.auditRef } : {}),
      ...(input.authority.auditReceiptRecordAuditAuthorityId ? { auditAuthorityRef: input.authority.auditReceiptRecordAuditAuthorityId } : {}),
      ...(auditedAtRef ? { auditedAtRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'audited'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_blockers'],
  };
}
