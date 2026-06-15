import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightInput {
  auditReceiptRecord: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord;
  auditRef?: string;
  auditorRef?: string;
  auditPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightStatus;
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
  auditorRef?: string;
  auditPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  auditReceiptRecordAuditPlan: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight';
    recordRef?: string;
    recordAuthorityRef?: string;
    auditRef?: string;
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

export function preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight {
  const auditRef = normalize(input.auditRef);
  const auditorRef = normalize(input.auditorRef);
  const auditPolicyRef = normalize(input.auditPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.auditReceiptRecord.status === 'blocked') {
    blockers.push(...input.auditReceiptRecord.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight.record_blocked:${blocker}`));
  }
  if (input.auditReceiptRecord.status === 'review_required') {
    reviewItems.push(...input.auditReceiptRecord.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight.record_review_required:${item}`));
  }
  if (!input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecordRecorded || !input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_receipt_record_not_complete');
  }
  if (!input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecorded || !input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_receipt_not_complete');
  }
  if (
    input.auditReceiptRecord.actionConsumed !== false
    || input.auditReceiptRecord.mergeAllowed !== false
    || input.auditReceiptRecord.externalActionAllowed !== false
    || input.auditReceiptRecord.durablePersistenceAllowed !== false
    || input.auditReceiptRecord.auditWriteAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!auditRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_ref_required');
  }
  if (!auditorRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight.auditor_ref_required');
  }
  if (!auditPolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecordRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.auditReceiptRecord.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: input.auditReceiptRecord.executionReceiptRecorded,
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.auditReceiptRecord.actionId ? { actionId: input.auditReceiptRecord.actionId } : {}),
    ...(input.auditReceiptRecord.receiptRecordRef ? { receiptRecordRef: input.auditReceiptRecord.receiptRecordRef } : {}),
    ...(input.auditReceiptRecord.auditRef ? { sourceAuditRef: input.auditReceiptRecord.auditRef } : {}),
    ...(input.auditReceiptRecord.auditReceiptRef ? { auditReceiptRef: input.auditReceiptRecord.auditReceiptRef } : {}),
    ...(input.auditReceiptRecord.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.auditReceiptRecord.auditReceiptAuthorityId } : {}),
    ...(input.auditReceiptRecord.auditReceiptRecordRef ? { auditReceiptRecordRef: input.auditReceiptRecord.auditReceiptRecordRef } : {}),
    ...(input.auditReceiptRecord.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.auditReceiptRecord.auditReceiptRecordAuthorityId } : {}),
    ...(auditRef ? { auditRef } : {}),
    ...(auditorRef ? { auditorRef } : {}),
    ...(auditPolicyRef ? { auditPolicyRef } : {}),
    ...(input.auditReceiptRecord.releaseLabel ? { releaseLabel: input.auditReceiptRecord.releaseLabel } : {}),
    evidenceRefs: unique([...input.auditReceiptRecord.evidenceRefs, auditRef, auditPolicyRef]),
    runbookSteps: [...input.auditReceiptRecord.runbookSteps],
    auditReceiptRecordAuditPlan: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight',
      ...(input.auditReceiptRecord.auditReceiptRecordRef ? { recordRef: input.auditReceiptRecord.auditReceiptRecordRef } : {}),
      ...(input.auditReceiptRecord.auditReceiptRecordAuthorityId ? { recordAuthorityRef: input.auditReceiptRecord.auditReceiptRecordAuthorityId } : {}),
      ...(auditRef ? { auditRef } : {}),
      ...(auditPolicyRef ? { policyRef: auditPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight_blockers'],
  };
}
