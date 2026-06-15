import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflightInput {
  audit: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit;
  auditReceiptRef?: string;
  auditReceiptRecorderRef?: string;
  auditReceiptPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflight {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflightStatus;
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
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
  auditAuthorityId?: string;
  auditReceiptRef?: string;
  auditReceiptRecorderRef?: string;
  auditReceiptPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  auditReceiptPlan: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight';
    auditRef?: string;
    auditAuthorityRef?: string;
    receiptRef?: string;
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

export function preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflightInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflight {
  const auditReceiptRef = normalize(input.auditReceiptRef);
  const auditReceiptRecorderRef = normalize(input.auditReceiptRecorderRef);
  const auditReceiptPolicyRef = normalize(input.auditReceiptPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.audit.status === 'blocked') {
    blockers.push(...input.audit.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight.audit_blocked:${blocker}`));
  }
  if (input.audit.status === 'review_required') {
    reviewItems.push(...input.audit.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight.audit_review_required:${item}`));
  }
  if (!input.audit.consumeExecutionReceiptRecordAudited || !input.audit.consumeExecutionReceiptRecordAuditAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight.audit_not_complete');
  }
  if (
    input.audit.actionConsumed !== false
    || input.audit.mergeAllowed !== false
    || input.audit.externalActionAllowed !== false
    || input.audit.durablePersistenceAllowed !== false
    || input.audit.auditWriteAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!auditReceiptRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_ref_required');
  }
  if (!auditReceiptRecorderRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_recorder_ref_required');
  }
  if (!auditReceiptPolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAudited: input.audit.consumeExecutionReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditAuthorized: input.audit.consumeExecutionReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecorded: input.audit.consumeExecutionReceiptRecorded,
    consumeExecutionReceiptRecordAuthorized: input.audit.consumeExecutionReceiptRecordAuthorized,
    consumeExecutionReceiptAuthorized: input.audit.consumeExecutionReceiptAuthorized,
    consumeExecutionAuthorized: input.audit.consumeExecutionAuthorized,
    consumeApplicationAuthorized: input.audit.consumeApplicationAuthorized,
    approvedActionConsumeAuthorized: input.audit.approvedActionConsumeAuthorized,
    approvedActionAuthorized: input.audit.approvedActionAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: input.audit.executionReceiptRecorded,
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.audit.actionId ? { actionId: input.audit.actionId } : {}),
    ...(input.audit.receiptRecordRef ? { receiptRecordRef: input.audit.receiptRecordRef } : {}),
    ...(input.audit.receiptRecordAuthorityId ? { receiptRecordAuthorityId: input.audit.receiptRecordAuthorityId } : {}),
    ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
    ...(input.audit.auditAuthorityId ? { auditAuthorityId: input.audit.auditAuthorityId } : {}),
    ...(auditReceiptRef ? { auditReceiptRef } : {}),
    ...(auditReceiptRecorderRef ? { auditReceiptRecorderRef } : {}),
    ...(auditReceiptPolicyRef ? { auditReceiptPolicyRef } : {}),
    ...(input.audit.releaseLabel ? { releaseLabel: input.audit.releaseLabel } : {}),
    evidenceRefs: unique([...input.audit.evidenceRefs, auditReceiptRef, auditReceiptPolicyRef]),
    runbookSteps: [...input.audit.runbookSteps],
    auditReceiptPlan: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight',
      ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
      ...(input.audit.auditAuthorityId ? { auditAuthorityRef: input.audit.auditAuthorityId } : {}),
      ...(auditReceiptRef ? { receiptRef: auditReceiptRef } : {}),
      ...(auditReceiptPolicyRef ? { policyRef: auditReceiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight_blockers'],
  };
}
