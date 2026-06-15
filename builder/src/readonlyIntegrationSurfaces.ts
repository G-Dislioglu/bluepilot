export type IntegrationSurfaceStatus = 'ready' | 'review_required' | 'deferred';

export interface SideEffectLock {
  fileWrites: false;
  githubWrites: false;
  providerCalls: false;
  runtimeExecution: false;
  durablePersistence: false;
  desktopActions: false;
}

export interface BpkExecutionLedgerStage {
  id: string;
  bpkRange: string;
  lane: 'cockpit' | 'memory' | 'runtime' | 'release';
  artifact: string;
  status: IntegrationSurfaceStatus;
  executeAllowed: false;
  notes: string[];
}

export interface BpkExecutionLedgerReadonly {
  service: 'bluepilot-builder';
  version: 'bluepilot-bpk-execution-ledger-readonly-v0.1';
  generatedAt: string;
  bpkPath: {
    completed: 226;
    total: 226;
    knownPathComplete: true;
  };
  stages: BpkExecutionLedgerStage[];
  sideEffects: SideEffectLock;
  nextAction: 'wire_operator_ledger_ui';
}

export interface PatrolVisualCoverageRoute {
  route: string;
  label: string;
  focus: string;
  sourceRepo: 'soulmatch';
  status: IntegrationSurfaceStatus;
}

export interface PatrolVisualCoverageReadonly {
  service: 'bluepilot-builder';
  version: 'bluepilot-patrol-visual-coverage-contract-v0.1';
  generatedAt: string;
  routes: PatrolVisualCoverageRoute[];
  blockedActions: string[];
  sideEffects: SideEffectLock;
  nextAction: 'mount_readonly_patrol_summary_after_operator_review';
}

export interface RepoMutationKillSwitchReadonly {
  service: 'bluepilot-builder';
  version: 'bluepilot-repo-mutation-kill-switch-readonly-v0.1';
  generatedAt: string;
  state: 'locked';
  sourceRepo: 'soulmatch';
  protectedSurfaces: string[];
  writeEnablementRequires: string[];
  sideEffects: SideEffectLock;
  nextAction: 'add_operator_visible_toggle_contract_without_persistence';
}

export interface AicosPermissionMapEntry {
  bluepilotSurface: string;
  aicosPermissionHint: string;
  status: IntegrationSurfaceStatus;
  allowedByDefault: false;
}

export interface AicosPermissionMapReadonly {
  service: 'bluepilot-builder';
  version: 'bluepilot-aicos-permission-map-readonly-v0.1';
  generatedAt: string;
  sourceRepo: 'aicos-registry';
  entries: AicosPermissionMapEntry[];
  sideEffects: SideEffectLock;
  nextAction: 'bind_static_permission_ids_to_task_locks_after_registry_review';
}

function lockedSideEffects(): SideEffectLock {
  return {
    fileWrites: false,
    githubWrites: false,
    providerCalls: false,
    runtimeExecution: false,
    durablePersistence: false,
    desktopActions: false,
  };
}

export function buildBpkExecutionLedgerReadonly(now = new Date()): BpkExecutionLedgerReadonly {
  const stages: BpkExecutionLedgerStage[] = [
    {
      id: 'cockpit_patch_permit_chain',
      bpkRange: 'BPK-001..226',
      lane: 'cockpit',
      artifact: 'preflight -> authority -> receipt -> record -> audit -> receipt-record authority',
      status: 'ready',
      executeAllowed: false,
      notes: [
        'Cockpit patch artifacts are inspectable as a chain.',
        'Patch apply, server mutation, and route mutation remain disabled.',
      ],
    },
    {
      id: 'memory_cache_audit_export_chain',
      bpkRange: 'BPK-001..226',
      lane: 'memory',
      artifact: 'preflight -> authority -> receipt -> record -> audit -> receipt-record authority',
      status: 'ready',
      executeAllowed: false,
      notes: [
        'Memory audit export artifacts are inspectable as a chain.',
        'File writes and durable persistence remain disabled.',
      ],
    },
    {
      id: 'runtime_patch_permit_chain',
      bpkRange: 'BPK-001..226',
      lane: 'runtime',
      artifact: 'preflight -> authority -> receipt -> record -> audit -> receipt-record authority',
      status: 'ready',
      executeAllowed: false,
      notes: [
        'Runtime patch artifacts are inspectable as a chain.',
        'Runtime execution and patch apply remain disabled.',
      ],
    },
    {
      id: 'release_governance_action_chain',
      bpkRange: 'BPK-001..226',
      lane: 'release',
      artifact: 'preflight -> authority -> receipt -> record -> audit -> receipt-record authority',
      status: 'ready',
      executeAllowed: false,
      notes: [
        'Release governance action artifacts are inspectable as a chain.',
        'Merge, PR creation, and external release actions remain disabled.',
      ],
    },
  ];

  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-bpk-execution-ledger-readonly-v0.1',
    generatedAt: now.toISOString(),
    bpkPath: {
      completed: 226,
      total: 226,
      knownPathComplete: true,
    },
    stages,
    sideEffects: lockedSideEffects(),
    nextAction: 'wire_operator_ledger_ui',
  };
}

export function buildPatrolVisualCoverageReadonly(now = new Date()): PatrolVisualCoverageReadonly {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-patrol-visual-coverage-contract-v0.1',
    generatedAt: now.toISOString(),
    routes: [
      {
        route: '/builder',
        label: 'Builder Studio',
        focus: 'task list, safety/status, review drawers, operator next actions',
        sourceRepo: 'soulmatch',
        status: 'ready',
      },
      {
        route: '/patrol',
        label: 'Patrol Console',
        focus: 'finding groups, repair badges, filters, visual upload placeholders',
        sourceRepo: 'soulmatch',
        status: 'ready',
      },
      {
        route: '/builder?drawer=visual',
        label: 'Visual Review Drawer',
        focus: 'screenshot artifacts, model selection, fix task creation guardrails',
        sourceRepo: 'soulmatch',
        status: 'ready',
      },
      {
        route: '/builder?sidebar=patrol',
        label: 'Builder Patrol Drawer',
        focus: 'embedded patrol summary and open findings',
        sourceRepo: 'soulmatch',
        status: 'ready',
      },
    ],
    blockedActions: [
      'screen_capture',
      'visual_provider_call',
      'repair_task_creation',
      'file_write',
      'runtime_execution',
    ],
    sideEffects: lockedSideEffects(),
    nextAction: 'mount_readonly_patrol_summary_after_operator_review',
  };
}

export function buildRepoMutationKillSwitchReadonly(now = new Date()): RepoMutationKillSwitchReadonly {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-repo-mutation-kill-switch-readonly-v0.1',
    generatedAt: now.toISOString(),
    state: 'locked',
    sourceRepo: 'soulmatch',
    protectedSurfaces: [
      '/probe/sandbox-write',
      '/probe/sandbox-write-check',
      'smartPush target profiles',
      'future /api/builder repo mutation routes',
    ],
    writeEnablementRequires: [
      'explicit operator window',
      'one-shot permit',
      'scope-limited target profile',
      'content hash binding',
      'post-action audit receipt',
    ],
    sideEffects: lockedSideEffects(),
    nextAction: 'add_operator_visible_toggle_contract_without_persistence',
  };
}

export function buildAicosPermissionMapReadonly(now = new Date()): AicosPermissionMapReadonly {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-aicos-permission-map-readonly-v0.1',
    generatedAt: now.toISOString(),
    sourceRepo: 'aicos-registry',
    entries: [
      {
        bluepilotSurface: 'cockpit_patch_permit_chain',
        aicosPermissionHint: 'bluepilot.cockpit.patch.review_only',
        status: 'ready',
        allowedByDefault: false,
      },
      {
        bluepilotSurface: 'memory_cache_audit_export_chain',
        aicosPermissionHint: 'bluepilot.memory.audit_export.review_only',
        status: 'ready',
        allowedByDefault: false,
      },
      {
        bluepilotSurface: 'runtime_patch_permit_chain',
        aicosPermissionHint: 'bluepilot.runtime.patch.review_only',
        status: 'ready',
        allowedByDefault: false,
      },
      {
        bluepilotSurface: 'release_governance_action_chain',
        aicosPermissionHint: 'bluepilot.release.action.review_only',
        status: 'ready',
        allowedByDefault: false,
      },
      {
        bluepilotSurface: 'goat_desktop_local_bridge',
        aicosPermissionHint: 'bluepilot.desktop.cue.proposal_only',
        status: 'deferred',
        allowedByDefault: false,
      },
    ],
    sideEffects: lockedSideEffects(),
    nextAction: 'bind_static_permission_ids_to_task_locks_after_registry_review',
  };
}
