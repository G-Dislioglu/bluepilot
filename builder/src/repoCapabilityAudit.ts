export type RepoCapabilityCategory =
  | 'builder_runtime'
  | 'operator_surface'
  | 'governance_registry'
  | 'desktop_bridge'
  | 'product_app'
  | 'review_provider';

export type BluepilotAdoptionStatus =
  | 'already_present'
  | 'wired_read_only'
  | 'candidate'
  | 'deferred';

export interface RepoCapabilitySource {
  repo: string;
  remote: string;
  localPathHint: string;
  categories: RepoCapabilityCategory[];
  observedCapabilities: string[];
  bluepilotValue: string;
  integrationRisk: 'low' | 'medium' | 'high';
}

export interface BluepilotAdoptionCandidate {
  id: string;
  sourceRepo: string;
  status: BluepilotAdoptionStatus;
  value: string;
  firstSafeWiring: string;
  blockedSideEffects: string[];
  nextImplementationSlice: string;
}

export interface RepoCapabilityAudit {
  service: 'bluepilot-builder';
  version: 'bluepilot-repo-capability-audit-v0.1';
  generatedAt: string;
  sideEffects: {
    fileWrites: false;
    githubWrites: false;
    providerCalls: false;
    runtimeExecution: false;
    deploys: false;
    merges: false;
  };
  sources: RepoCapabilitySource[];
  adoptionCandidates: BluepilotAdoptionCandidate[];
  recommendedNextSlice: string;
}

const SOURCES: RepoCapabilitySource[] = [
  {
    repo: 'soulmatch',
    remote: 'https://github.com/G-Dislioglu/soulmatch',
    localPathHint: '2026-05-06/hi-mit-der-webversion-von-chatgpt/soulmatch',
    categories: ['builder_runtime', 'operator_surface', 'product_app'],
    observedCapabilities: [
      '/api/meta and /api/health deploy freshness checks',
      '/api/builder and /api/builder/patrol protected Builder routes',
      'Builder Studio, Patrol Console, Visual Review surface',
      'repo-mutation kill-switch, decision preview, execution ledger contracts',
      'GOAT proxy endpoints for chat, STT, TTS, and vision hints',
    ],
    bluepilotValue: 'Turns Bluepilot from contract/governance inventory into an operator-visible control surface.',
    integrationRisk: 'medium',
  },
  {
    repo: 'aicos-registry',
    remote: 'https://github.com/G-Dislioglu/aicos-registry',
    localPathHint: '2026-05-06/hi-mit-der-webversion-von-chatgpt/aicos-registry',
    categories: ['governance_registry'],
    observedCapabilities: [
      'card, decision, and permission mapping registries',
      'verify:aicos-bluepilot-agent-registry and verify:bluepilot-maya-consumer-readiness',
      'negative-fixture, redaction, and runtime-activation governance packs',
    ],
    bluepilotValue: 'Provides external governance truth and permission vocabulary for Bluepilot task locks.',
    integrationRisk: 'low',
  },
  {
    repo: 'Big-Bro',
    remote: 'https://github.com/G-Dislioglu/Big-Bro',
    localPathHint: '2026-05-06/hi-mit-der-webversion-von-chatgpt/Big-Bro',
    categories: ['review_provider'],
    observedCapabilities: [
      'review and fast-reader producer contracts',
      'safe server smoke scripts',
      'external review pipeline evidence in RADAR/STATE',
    ],
    bluepilotValue: 'Adds a review-provider lane for Bluepilot evidence packets without making provider calls by default.',
    integrationRisk: 'medium',
  },
  {
    repo: 'goat-desktop',
    remote: 'https://github.com/G-Dislioglu/goat-desktop',
    localPathHint: '2026-05-16/files-mentioned-by-the-user-files/goat-desktop',
    categories: ['desktop_bridge'],
    observedCapabilities: [
      'local-only FastAPI bridge on 127.0.0.1',
      '/builder-cue proposal path with no desktop action execution',
      '/screen-cue, /screen-capture, /active-window and local verifier',
      'LiveTalk shell and builder-proxy STT/TTS/Vision handoff docs',
    ],
    bluepilotValue: 'Gives Bluepilot a local desktop boundary where Builder proposes and Desktop verifies.',
    integrationRisk: 'high',
  },
  {
    repo: 'maya-the-living-ai',
    remote: 'https://github.com/G-Dislioglu/maya-the-living-ai',
    localPathHint: '2026-05-06/hi-mit-der-webversion-von-chatgpt/maya-the-living-ai',
    categories: ['product_app'],
    observedCapabilities: [
      'Vite React app with shadcn/Radix UI stack',
      'Supabase-ready product shell',
      'Maya-oriented frontend composition patterns',
    ],
    bluepilotValue: 'Useful as UI pattern source, but less directly valuable than Soulmatch Builder/GOAT bridge wiring.',
    integrationRisk: 'medium',
  },
];

const ADOPTION_CANDIDATES: BluepilotAdoptionCandidate[] = [
  {
    id: 'meta_and_capability_audit_surface',
    sourceRepo: 'soulmatch',
    status: 'wired_read_only',
    value: 'Expose deploy freshness, BPK completion, and cross-repo capability candidates through Bluepilot runtime.',
    firstSafeWiring: 'GET /api/meta plus GET /probe/repo-capability-audit, no auth secrets and no live provider calls.',
    blockedSideEffects: ['githubWrites', 'providerCalls', 'runtimeExecution', 'deploys', 'merges'],
    nextImplementationSlice: 'keep endpoint read-only; use it to drive the next Builder/Patrol wiring branch',
  },
  {
    id: 'builder_patrol_visual_review',
    sourceRepo: 'soulmatch',
    status: 'candidate',
    value: 'Add an operator surface for visual findings, repair grouping, and review focus.',
    firstSafeWiring: 'Port patrolVisualCoverage-style planning as a contract module before mounting UI routes.',
    blockedSideEffects: ['screenshotCapture', 'taskCreation', 'fileWrites', 'runtimeExecution'],
    nextImplementationSlice: 'bluepilot-patrol-visual-coverage-contract-v0.1',
  },
  {
    id: 'execution_ledger_and_decision_preview',
    sourceRepo: 'soulmatch',
    status: 'candidate',
    value: 'Make Bluepilot Authority/Receipt chains inspectable as a compact execution ledger.',
    firstSafeWiring: 'Map existing BPK authority and receipt artifacts into a read-only ledger summary.',
    blockedSideEffects: ['permitConsumption', 'patchApply', 'externalAction', 'merge'],
    nextImplementationSlice: 'bluepilot-bpk-execution-ledger-readonly-v0.1',
  },
  {
    id: 'repo_mutation_kill_switch',
    sourceRepo: 'soulmatch',
    status: 'candidate',
    value: 'Give Bluepilot an explicit operator-visible switch that keeps repo mutation disabled unless a later approved window opens.',
    firstSafeWiring: 'Read-only kill-switch status endpoint; no toggle persistence in the first slice.',
    blockedSideEffects: ['fileWrites', 'durablePersistence', 'githubWrites'],
    nextImplementationSlice: 'bluepilot-repo-mutation-kill-switch-readonly-v0.1',
  },
  {
    id: 'aicos_permission_mapping',
    sourceRepo: 'aicos-registry',
    status: 'candidate',
    value: 'Bind BPK task-lock names to a shared AICOS permission vocabulary.',
    firstSafeWiring: 'Import only static IDs and validation expectations, not live registry mutation.',
    blockedSideEffects: ['registryWrites', 'runtimeActivation', 'providerCalls'],
    nextImplementationSlice: 'bluepilot-aicos-permission-map-readonly-v0.1',
  },
  {
    id: 'goat_desktop_local_bridge',
    sourceRepo: 'goat-desktop',
    status: 'deferred',
    value: 'Let Bluepilot propose local desktop cues while GOAT verifies geometry and approvals.',
    firstSafeWiring: 'Contract-only bridge proposal schema; no local action execution.',
    blockedSideEffects: ['mouseMove', 'keyboardInput', 'desktopActionExecution', 'screenCapture'],
    nextImplementationSlice: 'bluepilot-goat-desktop-cue-contract-v0.1',
  },
];

export function buildRepoCapabilityAudit(now = new Date()): RepoCapabilityAudit {
  return {
    service: 'bluepilot-builder',
    version: 'bluepilot-repo-capability-audit-v0.1',
    generatedAt: now.toISOString(),
    sideEffects: {
      fileWrites: false,
      githubWrites: false,
      providerCalls: false,
      runtimeExecution: false,
      deploys: false,
      merges: false,
    },
    sources: SOURCES.map((source) => ({
      ...source,
      categories: [...source.categories],
      observedCapabilities: [...source.observedCapabilities],
    })),
    adoptionCandidates: ADOPTION_CANDIDATES.map((candidate) => ({
      ...candidate,
      blockedSideEffects: [...candidate.blockedSideEffects],
    })),
    recommendedNextSlice: 'bluepilot-bpk-execution-ledger-readonly-v0.1',
  };
}
