import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecord.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflightInput {
  record: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord;
  auditRef?: string;
  auditorRef?: string;
  auditPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflightStatus;
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
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  auditPlan: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_preflight';
    recordRef?: string;
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

export function preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflightInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight {
  const auditRef = normalize(input.auditRef);
  const auditorRef = normalize(input.auditorRef);
  const auditPolicyRef = normalize(input.auditPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.record.status === 'blocked') {
    blockers.push(...input.record.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_preflight.record_blocked:${blocker}`));
  }
  if (input.record.status === 'review_required') {
    reviewItems.push(...input.record.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_preflight.record_review_required:${item}`));
  }
  if (!input.record.consumeExecutionReceiptRecorded || !input.record.executionReceiptRecorded) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_preflight.record_not_complete');
  }
  if (
    input.record.actionConsumed !== false
    || input.record.mergeAllowed !== false
    || input.record.externalActionAllowed !== false
    || input.record.durablePersistenceAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!auditRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_preflight.audit_ref_required');
  }
  if (!auditorRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_preflight.auditor_ref_required');
  }
  if (!auditPolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_preflight.audit_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecorded: input.record.consumeExecutionReceiptRecorded,
    consumeExecutionReceiptRecordAuthorized: input.record.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.record.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.record.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.record.consumeApplicationAuthorized,
    approvedActionConsumeAuthorized: input.record.approvedActionConsumeAuthorized,
    approvedActionAuthorized: input.record.approvedActionAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: input.record.executionReceiptRecorded,
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.record.actionId ? { actionId: input.record.actionId } : {}),
    ...(input.record.receiptRecordRef ? { receiptRecordRef: input.record.receiptRecordRef } : {}),
    ...(input.record.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.record.receiptRecordAuthorityId } : {}),
    ...(auditRef ? { auditRef } : {}),
    ...(auditorRef ? { auditorRef } : {}),
    ...(auditPolicyRef ? { auditPolicyRef } : {}),
    ...(input.record.releaseLabel ? { releaseLabel: input.record.releaseLabel } : {}),
    evidenceRefs: unique([...input.record.evidenceRefs, auditRef, auditPolicyRef]),
    runbookSteps: [...input.record.runbookSteps],
    auditPlan: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_preflight',
      ...(input.record.receiptRecordRef ? { recordRef: input.record.receiptRecordRef } : {}),
      ...(auditRef ? { auditRef } : {}),
      ...(auditPolicyRef ? { policyRef: auditPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_preflight_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_preflight_blockers'],
  };
}
