export type DurableAuditReceiptTarget = 'provider_call' | 'runtime_dry_run' | 'write_action' | 'activation_bundle';

export interface ExecutorMountEvidence {
  status?: unknown;
  executorMountReady?: unknown;
  target?: unknown;
  ref?: unknown;
}

export interface DurableAuditReceiptStoreRequest {
  confirm?: unknown;
  target?: unknown;
  operatorStoreRef?: unknown;
  auditRunRef?: unknown;
  receiptBatchRef?: unknown;
  retentionPolicyRef?: unknown;
  providerCallMount?: ExecutorMountEvidence;
  runtimeDryRunMount?: ExecutorMountEvidence;
  writeActionMount?: ExecutorMountEvidence;
}

export interface DurableAuditReceiptStoreSideEffects {
  fileWrites: false;
  githubWrites: false;
  providerCalls: false;
  runtimeExecution: false;
  durablePersistence: false;
  databaseWrites: false;
  deploys: false;
  merges: false;
  routeMutation: false;
  permitsIssued: false;
}

export interface DurableAuditReceiptStoreContract {
  service: 'bluepilot-builder';
  version: 'bluepilot-durable-audit-receipt-store-contract-v0.1';
  generatedAt: string;
  upstreamLocks: {
    providerCall: '/probe/provider-call-executor-mount-lock-preflight';
    runtimeDryRun: '/probe/runtime-dry-run-executor-mount-lock-preflight';
    writeAction: '/probe/write-executor-mount-lock-preflight';
  };
  protectedTargets: DurableAuditReceiptTarget[];
  requiredEvidence: string[];
  storeBoundary: {
    durablePersistenceAllowed: false;
    databaseWritesAllowed: false;
    fileWritesAllowed: false;
    githubWritesAllowed: false;
    providerCallsAllowed: false;
    runtimeExecutionAllowed: false;
  };
  sideEffects: DurableAuditReceiptStoreSideEffects;
}

export interface PlannedAuditReceiptRecord {
  kind: 'durable_audit_receipt_store_review_record';
  target: DurableAuditReceiptTarget;
  operatorStoreRef: string;
  auditRunRef: string;
  receiptBatchRef: string;
  retentionPolicyRef: string;
  evidenceTargets: string[];
}

export interface DurableAuditReceiptStorePreflight {
  service: 'bluepilot-builder';
  version: 'bluepilot-durable-audit-receipt-store-preflight-v0.1';
  generatedAt: string;
  status: 'store_ready_for_activation_review' | 'review_required' | 'blocked';
  target?: DurableAuditReceiptTarget;
  blockers: string[];
  reviewItems: string[];
  storeReady: boolean;
  durablePersistenceAllowed: false;
  databaseWritesAllowed: false;
  fileWritesAllowed: false;
  githubWritesAllowed: false;
  providerCallsAllowed: false;
  runtimeExecutionAllowed: false;
  plannedRecord?: PlannedAuditReceiptRecord;
  nextStep: string;
  contract: DurableAuditReceiptStoreContract;
  sideEffects: DurableAuditReceiptStoreSideEffects;
}

export const DURABLE_AUDIT_RECEIPT_STORE_CONFIRM = 'prepare-durable-audit-receipt-store-review-only';

const TARGETS: DurableAuditReceiptTarget[] = ['provider_call', 'runtime_dry_run', 'write_action', 'activation_bundle'];

const REQUIRED_EVIDENCE = [
  'confirm',
  'target',
  'operatorStoreRef',
  'auditRunRef',
  'receiptBatchRef',
  'retentionPolicyRef',
  'at_least_one_executor_mount_ready',
];

function lockedSideEffects(): DurableAuditReceiptStoreSideEffects {
  return {
    fileWrites: false,
    githubWrites: false,
    providerCalls: false,
    runtimeExecution: false,
    durablePersistence: false,
    databaseWrites: false,
    deploys: false,
    merges: false,
    routeMutation: false,
    permitsIssued: false,
  };
}

export function buildDurableAuditReceiptStoreContract(now = new Date()): DurableAuditReceiptStoreContract {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-durable-audit-receipt-store-contract-v0.1',
    generatedAt: now.toISOString(),
    upstreamLocks: {
      providerCall: '/probe/provider-call-executor-mount-lock-preflight',
      runtimeDryRun: '/probe/runtime-dry-run-executor-mount-lock-preflight',
      writeAction: '/probe/write-executor-mount-lock-preflight',
    },
    protectedTargets: TARGETS,
    requiredEvidence: REQUIRED_EVIDENCE,
    storeBoundary: {
      durablePersistenceAllowed: false,
      databaseWritesAllowed: false,
      fileWritesAllowed: false,
      githubWritesAllowed: false,
      providerCallsAllowed: false,
      runtimeExecutionAllowed: false,
    },
    sideEffects: lockedSideEffects(),
  };
}

export function buildDurableAuditReceiptStorePreflight(
  request: DurableAuditReceiptStoreRequest,
  now = new Date(),
): DurableAuditReceiptStorePreflight {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const confirm = normalizeString(request.confirm);
  const target = normalizeTarget(request.target, blockers);
  const operatorStoreRef = normalizeString(request.operatorStoreRef);
  const auditRunRef = normalizeString(request.auditRunRef);
  const receiptBatchRef = normalizeString(request.receiptBatchRef);
  const retentionPolicyRef = normalizeString(request.retentionPolicyRef);

  if (confirm !== DURABLE_AUDIT_RECEIPT_STORE_CONFIRM) {
    blockers.push('durable_audit_receipt_store.confirm_required');
  }
  requireRef(operatorStoreRef, 'durable_audit_receipt_store.operator_store_ref_required', blockers);
  requireRef(auditRunRef, 'durable_audit_receipt_store.audit_run_ref_required', blockers);
  requireRef(receiptBatchRef, 'durable_audit_receipt_store.receipt_batch_ref_required', blockers);
  requireRef(retentionPolicyRef, 'durable_audit_receipt_store.retention_policy_ref_required', blockers);

  const evidenceTargets = collectReadyEvidenceTargets(request, blockers);
  if (evidenceTargets.length === 0) {
    blockers.push('durable_audit_receipt_store.executor_mount_evidence_required');
  }
  if (target === 'activation_bundle' && evidenceTargets.length < 3) {
    reviewItems.push('durable_audit_receipt_store.activation_bundle_prefers_all_three_executor_mounts');
  }

  const status: DurableAuditReceiptStorePreflight['status'] = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'store_ready_for_activation_review';

  const canPlanRecord = status !== 'blocked'
    && target
    && operatorStoreRef
    && auditRunRef
    && receiptBatchRef
    && retentionPolicyRef;

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-durable-audit-receipt-store-preflight-v0.1',
    generatedAt: now.toISOString(),
    status,
    ...(target ? { target } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    storeReady: status === 'store_ready_for_activation_review',
    durablePersistenceAllowed: false,
    databaseWritesAllowed: false,
    fileWritesAllowed: false,
    githubWritesAllowed: false,
    providerCallsAllowed: false,
    runtimeExecutionAllowed: false,
    ...(canPlanRecord ? {
      plannedRecord: {
        kind: 'durable_audit_receipt_store_review_record',
        target,
        operatorStoreRef,
        auditRunRef,
        receiptBatchRef,
        retentionPolicyRef,
        evidenceTargets,
      },
    } : {}),
    nextStep: nextStepForStatus(status),
    contract: buildDurableAuditReceiptStoreContract(now),
    sideEffects: lockedSideEffects(),
  };
}

function collectReadyEvidenceTargets(request: DurableAuditReceiptStoreRequest, blockers: string[]): string[] {
  const entries: Array<[string, ExecutorMountEvidence | undefined]> = [
    ['provider_call', request.providerCallMount],
    ['runtime_dry_run', request.runtimeDryRunMount],
    ['write_action', request.writeActionMount],
  ];

  return entries.flatMap(([target, evidence]) => {
    if (!evidence) {
      return [];
    }
    const status = normalizeString(evidence.status);
    if (status !== 'executor_mount_lock_ready' || evidence.executorMountReady !== true) {
      blockers.push(`durable_audit_receipt_store.executor_mount_not_ready:${target}`);
      return [];
    }
    return [target];
  });
}

function normalizeTarget(value: unknown, blockers: string[]): DurableAuditReceiptTarget | undefined {
  if (typeof value !== 'string' || !value.trim()) {
    blockers.push('durable_audit_receipt_store.target_required');
    return undefined;
  }
  const target = value.trim();
  if (!TARGETS.includes(target as DurableAuditReceiptTarget)) {
    blockers.push(`durable_audit_receipt_store.unsupported_target:${target}`);
    return undefined;
  }
  return target as DurableAuditReceiptTarget;
}

function normalizeString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  return normalized || undefined;
}

function requireRef(value: string | undefined, blocker: string, blockers: string[]): void {
  if (!value) {
    blockers.push(blocker);
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function nextStepForStatus(status: DurableAuditReceiptStorePreflight['status']): string {
  if (status === 'store_ready_for_activation_review') {
    return 'Audit receipt store plan is ready for review; durable persistence remains a later gated activation.';
  }
  if (status === 'review_required') {
    return 'Resolve review items before treating this audit receipt store plan as ready.';
  }
  return 'Resolve blockers before durable audit receipt store review.';
}
