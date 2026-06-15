import type { MemoryCacheAuditExportPermitIssuanceReadiness } from './memoryCacheAuditExportPermitIssuanceReadiness.js';

export type MemoryCacheAuditExportPermitIssuanceRequestPacketStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitIssuanceRequestPacketInput {
  readiness: MemoryCacheAuditExportPermitIssuanceReadiness;
  requestRef?: string;
  requesterRef?: string;
}

export interface MemoryCacheAuditExportPermitIssuanceRequestPacket {
  status: MemoryCacheAuditExportPermitIssuanceRequestPacketStatus;
  requestPacketAllowed: boolean;
  permitIssued: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  requestRef?: string;
  requesterRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  packet: {
    kind: 'memory_cache_audit_export_permit_issuance_request';
    permitKind: 'memory_cache_audit_export';
    issuerRef?: string;
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

export function buildMemoryCacheAuditExportPermitIssuanceRequestPacket(
  input: MemoryCacheAuditExportPermitIssuanceRequestPacketInput,
): MemoryCacheAuditExportPermitIssuanceRequestPacket {
  const requestRef = normalize(input.requestRef);
  const requesterRef = normalize(input.requesterRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.readiness.status === 'blocked') {
    blockers.push(...input.readiness.blockers.map((blocker) => `memory_cache_audit_export_permit_issuance_request.evidence_blocked:${blocker}`));
  }
  if (input.readiness.status === 'review_required') {
    reviewItems.push(...input.readiness.reviewItems.map((item) => `memory_cache_audit_export_permit_issuance_request.readiness_review_required:${item}`));
  }
  if (!input.readiness.permitIssuanceReadinessAllowed) {
    blockers.push('memory_cache_audit_export_permit_issuance_request.readiness_not_allowed');
  }
  if (
    input.readiness.permitIssued !== false
    || input.readiness.fileWriteAllowed !== false
    || input.readiness.durablePersistenceAllowed !== false
    || input.readiness.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_issuance_request.write_and_external_gates_must_stay_closed');
  }
  if (!requestRef) {
    reviewItems.push('memory_cache_audit_export_permit_issuance_request.request_ref_required');
  }
  if (!requesterRef) {
    reviewItems.push('memory_cache_audit_export_permit_issuance_request.requester_ref_required');
  }

  const status: MemoryCacheAuditExportPermitIssuanceRequestPacketStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    requestPacketAllowed: status === 'ready',
    permitIssued: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(requestRef ? { requestRef } : {}),
    ...(requesterRef ? { requesterRef } : {}),
    format: input.readiness.format,
    cacheRef: input.readiness.cacheRef,
    previewLines: [...input.readiness.previewLines],
    evidenceRefs: unique([...input.readiness.evidenceRefs, requestRef]),
    packet: {
      kind: 'memory_cache_audit_export_permit_issuance_request',
      permitKind: 'memory_cache_audit_export',
      ...(input.readiness.issuerRef ? { issuerRef: input.readiness.issuerRef } : {}),
      ...(input.readiness.policyRef ? { policyRef: input.readiness.policyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['submit_memory_cache_audit_export_permit_issuance_request_to_authority_review']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_issuance_request_review']
        : ['resolve_memory_cache_audit_export_permit_issuance_request_blockers'],
  };
}
