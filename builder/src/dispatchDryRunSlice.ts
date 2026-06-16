// @orphan-by-design: dry-run dispatch composition; live exposure in WIRE-SLICE-002; consumer = future route/orchestrator
import { planCardConditionedDispatch, type CardConditionedDispatchPlan, type DispatchConditionCard } from './cardConditionedDispatch.js';
import { projectDispatchFrontendReadiness, type DispatchFrontendReadinessProjection, type DispatchFrontendSurface } from './dispatchFrontendReadiness.js';
import { evaluatePreRegisteredClaims, type PreRegisteredClaim, type PreRegisteredClaimsGateResult } from './preRegisteredClaims.js';
import { classifyRuntimeDispatchIntegration, type RuntimeDispatchAdoptionMode, type RuntimeDispatchIntegrationContract } from './runtimeDispatchIntegrationContract.js';
import { adaptWorkerPacketToWlpContract, type WorkerPacket, type WlpContractDraft } from './workerPacketWlpAdapter.js';

export interface DispatchDryRunSliceInput {
  workerPacket: WorkerPacket;
  requestedCardIds: string[];
  cards: DispatchConditionCard[];
  claimRegistrations: PreRegisteredClaim[];
  now?: Date;
  frontendSurface?: DispatchFrontendSurface;
  runtimeMode?: RuntimeDispatchAdoptionMode;
  requiredRuntimeEvidence?: string[];
}

export interface DispatchDryRunSliceResult {
  status: 'dry_run_ready' | 'review_required' | 'blocked';
  invokedSteps: Array<
    | 'workerPacketWlpAdapter'
    | 'cardConditionedDispatch'
    | 'preRegisteredClaims'
    | 'dispatchFrontendReadiness'
    | 'runtimeDispatchIntegrationContract'
  >;
  contract?: WlpContractDraft;
  adapterWarnings: string[];
  adapterErrors: string[];
  dispatchPlan?: CardConditionedDispatchPlan;
  claimGate?: PreRegisteredClaimsGateResult;
  readiness?: DispatchFrontendReadinessProjection;
  runtimeIntegration?: RuntimeDispatchIntegrationContract;
  sideEffects: {
    providerCall: false;
    fileWrite: false;
    routeMount: false;
    databaseCall: false;
    orchestratorCall: false;
  };
}

const CLOSED_SIDE_EFFECTS: DispatchDryRunSliceResult['sideEffects'] = {
  providerCall: false,
  fileWrite: false,
  routeMount: false,
  databaseCall: false,
  orchestratorCall: false,
};

function statusFromRuntimeIntegration(runtimeIntegration: RuntimeDispatchIntegrationContract): DispatchDryRunSliceResult['status'] {
  if (runtimeIntegration.status === 'blocked') {
    return 'blocked';
  }
  if (runtimeIntegration.status === 'operator_review') {
    return 'review_required';
  }
  return 'dry_run_ready';
}

export function runDispatchDryRunSlice(input: DispatchDryRunSliceInput): DispatchDryRunSliceResult {
  const invokedSteps: DispatchDryRunSliceResult['invokedSteps'] = [];
  const adapterResult = adaptWorkerPacketToWlpContract(input.workerPacket, input.now ?? new Date());
  invokedSteps.push('workerPacketWlpAdapter');

  if (!adapterResult.ok) {
    return {
      status: 'blocked',
      invokedSteps,
      adapterWarnings: [],
      adapterErrors: adapterResult.errors,
      sideEffects: { ...CLOSED_SIDE_EFFECTS },
    };
  }

  const dispatchPlan = planCardConditionedDispatch({
    contract: adapterResult.contract,
    requestedCardIds: input.requestedCardIds,
    cards: input.cards,
  });
  invokedSteps.push('cardConditionedDispatch');

  const claimGate = evaluatePreRegisteredClaims({
    contract: adapterResult.contract,
    dispatchPlan,
    registrations: input.claimRegistrations,
  });
  invokedSteps.push('preRegisteredClaims');

  const readiness = projectDispatchFrontendReadiness({
    contract: adapterResult.contract,
    dispatchPlan,
    claimGate,
    ...(input.frontendSurface ? { surface: input.frontendSurface } : {}),
  });
  invokedSteps.push('dispatchFrontendReadiness');

  const runtimeIntegration = classifyRuntimeDispatchIntegration({
    readiness,
    mode: input.runtimeMode ?? 'dry_run_only',
    requiredEvidence: input.requiredRuntimeEvidence ?? adapterResult.contract.evidence_required,
  });
  invokedSteps.push('runtimeDispatchIntegrationContract');

  return {
    status: statusFromRuntimeIntegration(runtimeIntegration),
    invokedSteps,
    contract: adapterResult.contract,
    adapterWarnings: adapterResult.warnings,
    adapterErrors: [],
    dispatchPlan,
    claimGate,
    readiness,
    runtimeIntegration,
    sideEffects: { ...CLOSED_SIDE_EFFECTS },
  };
}
