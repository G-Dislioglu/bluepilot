import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightInput {
  auditReceipt: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt;
  auditReceiptRecordAuditReceiptRecordRef?: string;
  auditReceiptRecordAuditReceiptRecorderRef?: string;
  auditReceiptRecordAuditReceiptRecordPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: boolean;
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
  auditReceiptRecordAuditReceiptRecordRef?: string;
  auditReceiptRecordAuditReceiptRecorderRef?: string;
  auditReceiptRecordAuditReceiptRecordPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  auditReceiptRecordAuditReceiptRecordPlan: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight';
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

export function preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight {
  const auditReceiptRecordAuditReceiptRecordRef = normalize(input.auditReceiptRecordAuditReceiptRecordRef);
  const auditReceiptRecordAuditReceiptRecorderRef = normalize(input.auditReceiptRecordAuditReceiptRecorderRef);
  const auditReceiptRecordAuditReceiptRecordPolicyRef = normalize(input.auditReceiptRecordAuditReceiptRecordPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.auditReceipt.status === 'blocked') {
    blockers.push(...input.auditReceipt.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_blocked:${blocker}`));
  }
  if (input.auditReceipt.status === 'review_required') {
    reviewItems.push(...input.auditReceipt.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_review_required:${item}`));
  }
  if (!input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded || !input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded');
  }
  if (
    input.auditReceipt.actionConsumed !== false
    || input.auditReceipt.mergeAllowed !== false
    || input.auditReceipt.externalActionAllowed !== false
    || input.auditReceipt.durablePersistenceAllowed !== false
    || input.auditReceipt.auditWriteAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!auditReceiptRecordAuditReceiptRecordRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_record_audit_receipt_record_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptRecorderRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_record_audit_receipt_recorder_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptRecordPolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_record_audit_receipt_record_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordAudited: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.auditReceipt.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: input.auditReceipt.executionReceiptRecorded,
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.auditReceipt.actionId ? { actionId: input.auditReceipt.actionId } : {}),
    ...(input.auditReceipt.receiptRecordRef ? { receiptRecordRef: input.auditReceipt.receiptRecordRef } : {}),
    ...(input.auditReceipt.sourceAuditRef ? { sourceAuditRef: input.auditReceipt.sourceAuditRef } : {}),
    ...(input.auditReceipt.auditReceiptRef ? { auditReceiptRef: input.auditReceipt.auditReceiptRef } : {}),
    ...(input.auditReceipt.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.auditReceipt.auditReceiptAuthorityId } : {}),
    ...(input.auditReceipt.auditReceiptRecordRef ? { auditReceiptRecordRef: input.auditReceipt.auditReceiptRecordRef } : {}),
    ...(input.auditReceipt.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.auditReceipt.auditReceiptRecordAuthorityId } : {}),
    ...(input.auditReceipt.auditRef ? { auditRef: input.auditReceipt.auditRef } : {}),
    ...(input.auditReceipt.auditReceiptRecordAuditAuthorityId ? { auditReceiptRecordAuditAuthorityId: input.auditReceipt.auditReceiptRecordAuditAuthorityId } : {}),
    ...(input.auditReceipt.auditReceiptRecordAuditReceiptRef ? { auditReceiptRecordAuditReceiptRef: input.auditReceipt.auditReceiptRecordAuditReceiptRef } : {}),
    ...(input.auditReceipt.auditReceiptRecordAuditReceiptAuthorityId ? { auditReceiptRecordAuditReceiptAuthorityId: input.auditReceipt.auditReceiptRecordAuditReceiptAuthorityId } : {}),
    ...(auditReceiptRecordAuditReceiptRecordRef ? { auditReceiptRecordAuditReceiptRecordRef } : {}),
    ...(auditReceiptRecordAuditReceiptRecorderRef ? { auditReceiptRecordAuditReceiptRecorderRef } : {}),
    ...(auditReceiptRecordAuditReceiptRecordPolicyRef ? { auditReceiptRecordAuditReceiptRecordPolicyRef } : {}),
    ...(input.auditReceipt.releaseLabel ? { releaseLabel: input.auditReceipt.releaseLabel } : {}),
    evidenceRefs: unique([...input.auditReceipt.evidenceRefs, auditReceiptRecordAuditReceiptRecordRef, auditReceiptRecordAuditReceiptRecordPolicyRef]),
    runbookSteps: [...input.auditReceipt.runbookSteps],
    auditReceiptRecordAuditReceiptRecordPlan: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight',
      ...(input.auditReceipt.auditReceiptRecordAuditReceiptRef ? { receiptRef: input.auditReceipt.auditReceiptRecordAuditReceiptRef } : {}),
      ...(input.auditReceipt.auditReceiptRecordAuditReceiptAuthorityId ? { receiptAuthorityRef: input.auditReceipt.auditReceiptRecordAuditReceiptAuthorityId } : {}),
      ...(auditReceiptRecordAuditReceiptRecordRef ? { recordRef: auditReceiptRecordAuditReceiptRecordRef } : {}),
      ...(auditReceiptRecordAuditReceiptRecordPolicyRef ? { policyRef: auditReceiptRecordAuditReceiptRecordPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight_blockers'],
  };
}
