import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from './releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';

export type ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightInput {
  audit: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit;
  auditReceiptRecordAuditReceiptRef?: string;
  auditReceiptRecordAuditReceiptRecorderRef?: string;
  auditReceiptRecordAuditReceiptPolicyRef?: string;
}

export interface ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight {
  status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightStatus;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: boolean;
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: boolean;
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
  auditReceiptRecordAuditReceiptRecorderRef?: string;
  auditReceiptRecordAuditReceiptPolicyRef?: string;
  releaseLabel?: string;
  evidenceRefs: string[];
  runbookSteps: string[];
  auditReceiptRecordAuditReceiptPlan: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight';
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

export function preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt(
  input: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightInput,
): ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight {
  const auditReceiptRecordAuditReceiptRef = normalize(input.auditReceiptRecordAuditReceiptRef);
  const auditReceiptRecordAuditReceiptRecorderRef = normalize(input.auditReceiptRecordAuditReceiptRecorderRef);
  const auditReceiptRecordAuditReceiptPolicyRef = normalize(input.auditReceiptRecordAuditReceiptPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.audit.status === 'blocked') {
    blockers.push(...input.audit.blockers.map((blocker) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_blocked:${blocker}`));
  }
  if (input.audit.status === 'review_required') {
    reviewItems.push(...input.audit.reviewItems.map((item) => `release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_review_required:${item}`));
  }
  if (!input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited || !input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_not_complete');
  }
  if (
    input.audit.actionConsumed !== false
    || input.audit.mergeAllowed !== false
    || input.audit.externalActionAllowed !== false
    || input.audit.durablePersistenceAllowed !== false
    || input.audit.auditWriteAllowed !== false
  ) {
    blockers.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.merge_and_external_actions_must_stay_closed');
  }
  if (!auditReceiptRecordAuditReceiptRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptRecorderRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_recorder_ref_required');
  }
  if (!auditReceiptRecordAuditReceiptPolicyRef) {
    reviewItems.push('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_policy_ref_required');
  }

  const status: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: status === 'ready',
    consumeExecutionReceiptRecordAuditReceiptRecordAudited: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed,
    consumeExecutionReceiptRecordAuditReceiptRecordRecorded: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordRecorded,
    consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: input.audit.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized,
    consumeExecutionReceiptRecordAuditReceiptRecorded: input.audit.consumeExecutionReceiptRecordAuditReceiptRecorded,
    consumeExecutionReceiptRecordAuditReceiptAuthorized: input.audit.consumeExecutionReceiptRecordAuditReceiptAuthorized,
    actionConsumed: false,
    executionReceiptRecorded: input.audit.executionReceiptRecorded,
    mergeAllowed: false,
    externalActionAllowed: false,
    durablePersistenceAllowed: false,
    auditWriteAllowed: false,
    ...(input.audit.actionId ? { actionId: input.audit.actionId } : {}),
    ...(input.audit.receiptRecordRef ? { receiptRecordRef: input.audit.receiptRecordRef } : {}),
    ...(input.audit.sourceAuditRef ? { sourceAuditRef: input.audit.sourceAuditRef } : {}),
    ...(input.audit.auditReceiptRef ? { auditReceiptRef: input.audit.auditReceiptRef } : {}),
    ...(input.audit.auditReceiptAuthorityId ? { auditReceiptAuthorityId: input.audit.auditReceiptAuthorityId } : {}),
    ...(input.audit.auditReceiptRecordRef ? { auditReceiptRecordRef: input.audit.auditReceiptRecordRef } : {}),
    ...(input.audit.auditReceiptRecordAuthorityId ? { auditReceiptRecordAuthorityId: input.audit.auditReceiptRecordAuthorityId } : {}),
    ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
    ...(input.audit.auditReceiptRecordAuditAuthorityId ? { auditReceiptRecordAuditAuthorityId: input.audit.auditReceiptRecordAuditAuthorityId } : {}),
    ...(auditReceiptRecordAuditReceiptRef ? { auditReceiptRecordAuditReceiptRef } : {}),
    ...(auditReceiptRecordAuditReceiptRecorderRef ? { auditReceiptRecordAuditReceiptRecorderRef } : {}),
    ...(auditReceiptRecordAuditReceiptPolicyRef ? { auditReceiptRecordAuditReceiptPolicyRef } : {}),
    ...(input.audit.releaseLabel ? { releaseLabel: input.audit.releaseLabel } : {}),
    evidenceRefs: unique([...input.audit.evidenceRefs, auditReceiptRecordAuditReceiptRef, auditReceiptRecordAuditReceiptPolicyRef]),
    runbookSteps: [...input.audit.runbookSteps],
    auditReceiptRecordAuditReceiptPlan: {
      kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight',
      ...(input.audit.auditRef ? { auditRef: input.audit.auditRef } : {}),
      ...(input.audit.auditReceiptRecordAuditAuthorityId ? { auditAuthorityRef: input.audit.auditReceiptRecordAuditAuthorityId } : {}),
      ...(auditReceiptRecordAuditReceiptRef ? { receiptRef: auditReceiptRecordAuditReceiptRef } : {}),
      ...(auditReceiptRecordAuditReceiptPolicyRef ? { policyRef: auditReceiptRecordAuditReceiptPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority']
      : status === 'review_required'
        ? ['complete_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight_review']
        : ['resolve_release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight_blockers'],
  };
}
