import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflightInput {
  auditReceipt: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt;
  auditReceiptRecordRef?: string;
  auditReceiptRecorderRef?: string;
  auditReceiptRecordPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflight {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflightStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditAuthorized: boolean;
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
  auditReceiptRecordRef?: string;
  auditReceiptRecorderRef?: string;
  auditReceiptRecordPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  auditReceiptRecordPlan: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight';
    auditRef?: string;
    receiptRef?: string;
    receiptAuthorityRef?: string;
    recordRef?: string;
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

export function preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflightInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflight {
  const auditReceiptRecordRef = normalize(input.auditReceiptRecordRef);
  const auditReceiptRecorderRef = normalize(input.auditReceiptRecorderRef);
  const auditReceiptRecordPolicyRef = normalize(input.auditReceiptRecordPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.auditReceipt.status === 'blocked') {
    blockers.push(...input.auditReceipt.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_blocked:${blocker}`));
  }
  if (input.auditReceipt.status === 'review_required') {
    reviewItems.push(...input.auditReceipt.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_review_required:${item}`));
  }
  if (!input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecorded || !input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded');
  }
  if (
    input.auditReceipt.actionConsumed !== false
    || input.auditReceipt.mergeAllowed !== false
    || input.auditReceipt.externalActionAllowed !== false
    || input.auditReceipt.durablePersistenceAllowed !== false
    || input.auditReceipt.auditWriteAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!auditReceiptRecordRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_record_ref_required');
  }
  if (!auditReceiptRecorderRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_recorder_ref_required');
  }
  if (!auditReceiptRecordPolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_record_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed,
    consumeExecutionReceiptRecordAudited: input.auditReceipt.consumeExecutionReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: input.auditReceipt.executionReceiptRecorded,
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.auditReceipt.actionId ? { actionId: input.auditReceipt.actionId } : {}),
    ...(input.auditReceipt.receiptRecordRef ? { receiptRecordRef: input.auditReceipt.receiptRecordRef } : {}),
    ...(input.auditReceipt.auditRef ? { auditRef: input.auditReceipt.auditRef } : {}),
    ...(input.auditReceipt.auditAuthorityId ? { auditAuthorityId: input.auditReceipt.auditAuthorityId } : {}),
    ...(input.auditReceipt.auditReceiptRef ? { auditReceiptRef: input.auditReceipt.auditReceiptRef } : {}),
    ...(input.auditReceipt.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.auditReceipt.auditReceiptAuthorityId } : {}),
    ...(auditReceiptRecordRef ? { auditReceiptRecordRef } : {}),
    ...(auditReceiptRecorderRef ? { auditReceiptRecorderRef } : {}),
    ...(auditReceiptRecordPolicyRef ? { auditReceiptRecordPolicyRef } : {}),
    ...(input.auditReceipt.releaseLabel ? { releaseLabel: input.auditReceipt.releaseLabel } : {}),
    evidenceRefs: unique([...input.auditReceipt.evidenceRefs, auditReceiptRecordRef, auditReceiptRecordPolicyRef]),
    runbookSteps: [...input.auditReceipt.runbookSteps],
    auditReceiptRecordPlan: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight',
      ...(input.auditReceipt.auditRef ? { auditRef: input.auditReceipt.auditRef } : {}),
      ...(input.auditReceipt.auditReceiptRef ? { receiptRef: input.auditReceipt.auditReceiptRef } : {}),
      ...(input.auditReceipt.auditReceiptAuthorityId ? { receiptAuthorityRef: input.auditReceipt.auditReceiptAuthorityId } : {}),
      ...(auditReceiptRecordRef ? { recordRef: auditReceiptRecordRef } : {}),
      ...(auditReceiptRecordPolicyRef ? { policyRef: auditReceiptRecordPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight_blockers'],
  };
}
