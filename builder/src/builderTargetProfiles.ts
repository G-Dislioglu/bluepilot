export type BuilderTargetProfileId =
  | 'soulmatch'
  | 'bluepilot-sandbox'
  | 'big-bro'
  | 'goat-control-adapter'
  | 'goat-desktop';

export type BuilderTargetRuntime =
  | 'soulmatch-web'
  | 'sandbox-repo'
  | 'node-express-react'
  | 'python-local-bridge'
  | 'windows-desktop-app';

export type BuilderTargetWritePolicy =
  | 'soulmatch_guarded_push'
  | 'dry_run_only'
  | 'planned_only'
  | 'sandbox_real_write';

export interface BuilderTargetProfile {
  id: BuilderTargetProfileId;
  label: string;
  repo: string | null;
  branch: string;
  runtime: BuilderTargetRuntime;
  status: 'active' | 'local_only' | 'planned';
  scopePolicy: 'repo_index' | 'explicit_scope_only';
  writePolicy: BuilderTargetWritePolicy;
  pushAllowed: boolean;
  evidenceRequired: string[];
  notes: string[];
}

export interface ResolvedBuilderTargetProfile {
  requestedId: string | null;
  profile: BuilderTargetProfile;
  defaulted: boolean;
  effectiveDryRun: boolean;
  warnings: string[];
}

const TARGET_PROFILES: Record<BuilderTargetProfileId, BuilderTargetProfile> = {
  soulmatch: {
    id: 'soulmatch',
    label: 'Soulmatch Builder/Web',
    repo: 'G-Dislioglu/soulmatch',
    branch: 'main',
    runtime: 'soulmatch-web',
    status: 'active',
    scopePolicy: 'repo_index',
    writePolicy: 'soulmatch_guarded_push',
    pushAllowed: true,
    evidenceRequired: ['builder-repo-index', 'scope-gate', 'judge', 'workflow-simulation'],
    notes: ['Default target. Existing Builder safety and push gates apply.'],
  },
  'bluepilot-sandbox': {
    id: 'bluepilot-sandbox',
    label: 'Bluepilot Sandbox',
    repo: 'G-Dislioglu/bluepilot-sandbox',
    branch: 'main',
    runtime: 'sandbox-repo',
    status: 'active',
    scopePolicy: 'explicit_scope_only',
    writePolicy: 'sandbox_real_write',
    pushAllowed: true,
    evidenceRequired: ['explicit-scope', 'sandbox-token-write-check', 'operator-approval-before-real-write'],
    notes: ['Phase-B sandbox target. Real writes are allowed only through guarded sandbox-only endpoints and Maya corridor approval.'],
  },
  'big-bro': {
    id: 'big-bro',
    label: 'Big-Bro Watch-only App',
    repo: 'G-Dislioglu/Big-Bro',
    branch: 'main',
    runtime: 'node-express-react',
    status: 'active',
    scopePolicy: 'explicit_scope_only',
    writePolicy: 'dry_run_only',
    pushAllowed: false,
    evidenceRequired: ['explicit-scope', 'dry-run-output', 'cross-repo-approval-before-write'],
    notes: ['Big-Bro consumes Builder/Maya contracts but must not be mutated by Builder v1.'],
  },
  'goat-control-adapter': {
    id: 'goat-control-adapter',
    label: 'GOAT Control Adapter',
    repo: null,
    branch: 'master',
    runtime: 'python-local-bridge',
    status: 'local_only',
    scopePolicy: 'explicit_scope_only',
    writePolicy: 'dry_run_only',
    pushAllowed: false,
    evidenceRequired: ['explicit-local-path', 'read-only-safety-proof', 'manual-local-review'],
    notes: ['Local adapter is read-only/refusal-only. No click, type, hotkey, provider, or trading action.'],
  },
  'goat-desktop': {
    id: 'goat-desktop',
    label: 'GOAT Desktop',
    repo: null,
    branch: 'main',
    runtime: 'windows-desktop-app',
    status: 'planned',
    scopePolicy: 'explicit_scope_only',
    writePolicy: 'planned_only',
    pushAllowed: false,
    evidenceRequired: ['target-repo-created', 'desktop-screenshot-or-screencast', 'local-authority-proof'],
    notes: ['Planned target from GOAT-DESKTOP-VISION-v0.4. Builder may plan only until a real repo adapter exists.'],
  },
};

export function listBuilderTargetProfiles(): BuilderTargetProfile[] {
  return Object.values(TARGET_PROFILES);
}

export function getBuilderTargetProfile(id: string | undefined | null): BuilderTargetProfile | null {
  if (!id) {
    return TARGET_PROFILES.soulmatch;
  }
  const normalized = id.trim().toLowerCase();
  return (TARGET_PROFILES as Record<string, BuilderTargetProfile>)[normalized] ?? null;
}

export function resolveBuilderTargetProfile(
  requestedId: string | undefined | null,
  requestedDryRun: boolean | undefined,
): ResolvedBuilderTargetProfile | null {
  const profile = getBuilderTargetProfile(requestedId);
  if (!profile) {
    return null;
  }

  const defaulted = !requestedId || requestedId.trim().length === 0;
  const forcedDryRun = !profile.pushAllowed;
  const warnings = forcedDryRun
    ? [`target ${profile.id} is ${profile.writePolicy}; Builder will run dry-run/proposal-only`]
    : [];

  return {
    requestedId: requestedId?.trim() || null,
    profile,
    defaulted,
    effectiveDryRun: requestedDryRun === true || forcedDryRun,
    warnings,
  };
}

export function isSoulmatchTarget(profile: BuilderTargetProfile): boolean {
  return profile.id === 'soulmatch';
}
