import {
  buildAicosPermissionMapReadonly,
  buildBpkExecutionLedgerReadonly,
  buildPatrolVisualCoverageReadonly,
  buildRepoMutationKillSwitchReadonly,
  type SideEffectLock,
} from './readonlyIntegrationSurfaces.js';
import { buildGoatDesktopBridgeContract } from './goatDesktopBridgeContract.js';
import { buildMayaCoreGateEnforcementContract } from './mayaCoreGateEnforcementContract.js';
import { buildProviderRuntimeActivationContract } from './providerRuntimeActivationPreflight.js';

export type IntegrationPointStatus =
  | 'wired_read_only'
  | 'wired_contract_only'
  | 'locked_ready_for_review'
  | 'deferred_until_lock';

export interface IntegrationPoint {
  id: string;
  title: string;
  status: IntegrationPointStatus;
  endpoint?: string;
  operatorValue: string;
  lockedActions: string[];
  nextStep: string;
}

export interface EightPointIntegrationReadiness {
  service: 'bluepilot-builder';
  version: 'bluepilot-eight-point-integration-readiness-v0.1';
  generatedAt: string;
  summary: {
    totalPoints: 8;
    wiredReadOnly: number;
    wiredContractOnly: number;
    lockedForLaterActivation: number;
  };
  points: IntegrationPoint[];
  sideEffects: SideEffectLock & {
    merges: false;
    deploys: false;
  };
}

export interface OperatorDashboardPanel {
  id: string;
  title: string;
  status: IntegrationPointStatus;
  lines: string[];
}

export interface OperatorDashboardModel {
  service: 'bluepilot-builder';
  version: 'bluepilot-operator-dashboard-readonly-v0.1';
  generatedAt: string;
  headline: string;
  panels: OperatorDashboardPanel[];
  sideEffects: EightPointIntegrationReadiness['sideEffects'];
}

function lockedSideEffects(): EightPointIntegrationReadiness['sideEffects'] {
  return {
    fileWrites: false,
    githubWrites: false,
    providerCalls: false,
    runtimeExecution: false,
    durablePersistence: false,
    desktopActions: false,
    merges: false,
    deploys: false,
  };
}

export function buildEightPointIntegrationReadiness(now = new Date()): EightPointIntegrationReadiness {
  const points: IntegrationPoint[] = [
    {
      id: 'operator_ledger_ui',
      title: 'Operator UI fuer BPK Execution Ledger',
      status: 'wired_read_only',
      endpoint: '/probe/bpk-execution-ledger',
      operatorValue: 'BPK lanes are visible as a reviewable cockpit chain.',
      lockedActions: ['permit_consumption', 'patch_apply', 'runtime_execution', 'merge'],
      nextStep: 'Render this panel in a richer Builder/Cockpit UI.',
    },
    {
      id: 'soulmatch_builder_patrol_ui',
      title: 'Soulmatch Builder/Patrol Readonly Surface',
      status: 'wired_read_only',
      endpoint: '/probe/patrol-visual-coverage',
      operatorValue: 'Patrol and visual review focus areas are visible before task creation.',
      lockedActions: ['screenshot_capture', 'visual_provider_call', 'repair_task_creation'],
      nextStep: 'Add readonly findings data once a stable source exists.',
    },
    {
      id: 'repo_mutation_kill_switch',
      title: 'Repo Mutation Kill Switch',
      status: 'wired_read_only',
      endpoint: '/probe/repo-mutation-kill-switch',
      operatorValue: 'Repo mutation is explicitly visible as locked.',
      lockedActions: ['toggle_persistence', 'github_write', 'sandbox_write_enablement'],
      nextStep: 'Design a persistenceless toggle contract before any write window.',
    },
    {
      id: 'aicos_permission_review',
      title: 'AICOS Permission Review',
      status: 'wired_read_only',
      endpoint: '/probe/aicos-permission-map',
      operatorValue: 'AICOS permission hints are mapped to Bluepilot surfaces.',
      lockedActions: ['registry_write', 'permission_grant', 'runtime_activation'],
      nextStep: 'Verify static IDs against aicos-registry before task-lock binding.',
    },
    {
      id: 'goat_desktop_bridge',
      title: 'GOAT Desktop Bridge',
      status: 'wired_contract_only',
      endpoint: '/probe/goat-desktop-bridge-contract',
      operatorValue: 'Desktop bridge has a local-only builder-cue contract and dry preflight.',
      lockedActions: ['mouse_move', 'keyboard_input', 'screen_capture', 'desktop_action_execution'],
      nextStep: 'Review dry builder-cue payloads before any local GOAT bridge call is enabled.',
    },
    {
      id: 'maya_core_gate_enforcement',
      title: 'Maya-Core Gate Enforcement',
      status: 'wired_contract_only',
      endpoint: '/probe/maya-core-gate-enforcement',
      operatorValue: 'Budget, corridor, and cost evidence are required before activation review.',
      lockedActions: ['provider_call', 'write_action', 'runtime_action_without_gate'],
      nextStep: 'Submit health/maya-gate evidence to the dry enforcement preflight before activation.',
    },
    {
      id: 'provider_runtime_flows',
      title: 'Provider and Runtime Flows',
      status: 'wired_contract_only',
      endpoint: '/probe/provider-runtime-activation-contract',
      operatorValue: 'Provider and runtime activation can be preflighted from Maya-Gate evidence.',
      lockedActions: ['provider_call', 'runtime_execution', 'patch_apply', 'database_write'],
      nextStep: 'Submit provider/runtime activation evidence for review; execution remains closed.',
    },
    {
      id: 'merge_release_readiness',
      title: 'Merge and Release Readiness',
      status: 'deferred_until_lock',
      operatorValue: 'Merge/release is tracked as an explicit governance action, not an implicit side effect.',
      lockedActions: ['branch_merge', 'pr_creation', 'deploy', 'external_release_action'],
      nextStep: 'Create PR sequence review and merge lock before any merge or deploy.',
    },
  ];

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-eight-point-integration-readiness-v0.1',
    generatedAt: now.toISOString(),
    summary: {
      totalPoints: 8,
      wiredReadOnly: points.filter((point) => point.status === 'wired_read_only').length,
      wiredContractOnly: points.filter((point) => point.status === 'wired_contract_only').length,
      lockedForLaterActivation: points.filter((point) => (
        point.status !== 'wired_read_only' && point.status !== 'wired_contract_only'
      )).length,
    },
    points,
    sideEffects: lockedSideEffects(),
  };
}

export function buildOperatorDashboardModel(now = new Date()): OperatorDashboardModel {
  const readiness = buildEightPointIntegrationReadiness(now);
  const ledger = buildBpkExecutionLedgerReadonly(now);
  const patrol = buildPatrolVisualCoverageReadonly(now);
  const killSwitch = buildRepoMutationKillSwitchReadonly(now);
  const aicos = buildAicosPermissionMapReadonly(now);
  const goat = buildGoatDesktopBridgeContract(now);
  const mayaGate = buildMayaCoreGateEnforcementContract(now);
  const providerRuntime = buildProviderRuntimeActivationContract(now);

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-operator-dashboard-readonly-v0.1',
    generatedAt: now.toISOString(),
    headline: 'Bluepilot Operator Dashboard Readonly',
    sideEffects: readiness.sideEffects,
    panels: [
      {
        id: 'bpk-ledger',
        title: 'BPK Execution Ledger',
        status: 'wired_read_only',
        lines: [
          `completed:${ledger.bpkPath.completed}/${ledger.bpkPath.total}`,
          `lanes:${ledger.stages.map((stage) => stage.lane).join(',')}`,
          'executeAllowed:false',
        ],
      },
      {
        id: 'patrol-summary',
        title: 'Patrol Visual Coverage',
        status: 'wired_read_only',
        lines: [
          `routes:${patrol.routes.length}`,
          `blocked:${patrol.blockedActions.join(',')}`,
          'taskCreation:false',
        ],
      },
      {
        id: 'kill-switch',
        title: 'Repo Mutation Kill Switch',
        status: 'wired_read_only',
        lines: [
          `state:${killSwitch.state}`,
          `requires:${killSwitch.writeEnablementRequires.join(',')}`,
          'githubWrites:false',
        ],
      },
      {
        id: 'aicos-permissions',
        title: 'AICOS Permission Review',
        status: 'wired_read_only',
        lines: [
          `entries:${aicos.entries.length}`,
          'allowedByDefault:false',
          'registryWrites:false',
        ],
      },
      {
        id: 'goat_desktop_bridge',
        title: 'GOAT Desktop Bridge',
        status: 'wired_contract_only',
        lines: [
          `endpoint:${goat.bridge.proposalEndpoint}`,
          `sources:${goat.payloadContract.acceptedLocalGeometrySources.join(',')}`,
          `mayExecute:${goat.activationBoundary.mayExecute}`,
        ],
      },
      {
        id: 'maya_core_gate_enforcement',
        title: 'Maya-Core Gate Enforcement',
        status: 'wired_contract_only',
        lines: [
          `sourceProbe:${mayaGate.sourceProbe}`,
          `targets:${mayaGate.protectedTargets.join(',')}`,
          `callsMayaCore:${mayaGate.activationBoundary.callsMayaCore}`,
        ],
      },
      {
        id: 'provider_runtime_flows',
        title: 'Provider and Runtime Flows',
        status: 'wired_contract_only',
        lines: [
          `gateDependency:${providerRuntime.gateDependency}`,
          `targets:${providerRuntime.protectedTargets.join(',')}`,
          `executesRuntime:${providerRuntime.activationBoundary.executesRuntime}`,
        ],
      },
      ...readiness.points.slice(7).map((point) => ({
        id: point.id,
        title: point.title,
        status: point.status,
        lines: [
          point.operatorValue,
          `locked:${point.lockedActions.join(',')}`,
          `next:${point.nextStep}`,
        ],
      })),
    ],
  };
}
