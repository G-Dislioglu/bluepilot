export type BuilderTaskClass = 'class_1' | 'class_2' | 'class_3';
export type ExecutionPolicy = 'allow_push' | 'dry_run_only' | 'manual_only';
export type BuilderGateDecision = 'approve' | 'block' | 'uncertain';

export type BuilderSafetyDecision = {
  taskClass: BuilderTaskClass;
  executionPolicy: ExecutionPolicy;
  decision: BuilderGateDecision;
  pushAllowed: boolean;
  requiredExternalApproval: boolean;
  approvalId?: string;
  approvalReason?: string;
  protectedPathsTouched: string[];
  reasons: string[];
};

export type GuardedBuilderPushResult<T> =
  | {
      executed: false;
      decision: BuilderSafetyDecision;
      pushBlockedReason: string;
    }
  | {
      executed: true;
      decision: BuilderSafetyDecision;
      result: T;
    };

type BuilderSafetyInput = {
  instruction?: string;
  scope?: string[];
  targetFile?: string;
  files?: string[];
  dryRun?: boolean;
  allowAutonomousPush?: boolean;
  approvalId?: string;
  hasApprovedPlan?: boolean;
  approvalValid?: boolean;
  approvalValidationReason?: string;
  judgeDecision?: BuilderGateDecision;
  targetBranch?: string;
};

const MANUAL_ONLY_RULES = [
  'server/src/lib/opusTaskOrchestrator.ts',
  'server/src/lib/opusSmartPush.ts',
  'server/src/lib/specHardening.ts',
  'server/src/lib/builderFusionChat.ts',
  'server/src/lib/opusBridgeController.ts',
  'server/src/lib/opusBridgeAuth.ts',
  'server/src/lib/builderGithubBridge.ts',
  'server/src/lib/builderGates.ts',
  'tools/wait-for-deploy.sh',
  '.github/workflows/',
  '.env',
  'server/.env',
] as const;

const MANUAL_ONLY_PATTERNS = [
  /^\.env(?:\..+)?$/i,
  /^server\/\.env(?:\..+)?$/i,
  /^\.github\/workflows\//i,
  /^(?:server\/src\/lib|tools|\.github)\/.*(?:auth|token|secret)/i,
  /^(?:server\/src\/lib|tools|\.github)\/.*deploy/i,
] as const;

function normalizePath(filePath: string): string {
  return filePath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .trim()
    .replace(/[.,;:!?]+$/, '');
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths.map(normalizePath).filter((entry) => entry.length > 0))];
}

function matchesRule(filePath: string, rule: string): boolean {
  const normalizedPath = normalizePath(filePath);
  const normalizedRule = normalizePath(rule);

  return (
    normalizedPath === normalizedRule ||
    normalizedPath.startsWith(`${normalizedRule}/`) ||
    (normalizedRule.endsWith('/') && normalizedPath.startsWith(normalizedRule))
  );
}

function extractInstructionPaths(instruction?: string): string[] {
  if (!instruction) {
    return [];
  }

  const matches = instruction.match(/(?:\.github\/workflows\/[^\s"'`]+|\.env(?:\.[^\s"'`]+)?|(?:[A-Za-z0-9._-]+\/)+[A-Za-z0-9._-]+)/g) ?? [];
  return uniquePaths(matches);
}

function collectCandidatePaths(input: BuilderSafetyInput): string[] {
  return uniquePaths([
    ...(input.scope ?? []),
    ...(input.files ?? []),
    ...(input.targetFile ? [input.targetFile] : []),
    ...extractInstructionPaths(input.instruction),
  ]);
}

function isProtectedPath(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);
  return MANUAL_ONLY_RULES.some((rule) => matchesRule(normalizedPath, rule))
    || MANUAL_ONLY_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

function normalizeBranch(branch?: string): string | undefined {
  const normalized = branch?.trim();
  return normalized ? normalized : undefined;
}

function isProtectedBranch(branch?: string): boolean {
  const normalized = normalizeBranch(branch)?.toLowerCase();
  return normalized === 'main' || normalized === 'master';
}

export function classifyBuilderTask(input: BuilderSafetyInput): BuilderSafetyDecision {
  const candidatePaths = collectCandidatePaths(input);
  const protectedPathsTouched = candidatePaths.filter((path) => isProtectedPath(path));
  const protectedBranch = normalizeBranch(input.targetBranch);
  const reasons: string[] = [];

  const taskClass: BuilderTaskClass = protectedPathsTouched.length > 0 || isProtectedBranch(protectedBranch)
    ? 'class_3'
    : candidatePaths.length === 0
      ? 'class_2'
      : candidatePaths.length > 1
        ? 'class_2'
        : 'class_1';

  let decision: BuilderGateDecision = input.judgeDecision ?? 'approve';
  let executionPolicy: ExecutionPolicy = 'allow_push';
  let requiredExternalApproval = false;
  let approvalReason: string | undefined;
  const approvedPlan = input.hasApprovedPlan === true;
  const approvalId = input.approvalId?.trim() || undefined;
  const approvalValid = input.approvalValid !== false;

  if (protectedPathsTouched.length > 0) {
    decision = 'block';
    executionPolicy = 'manual_only';
    requiredExternalApproval = true;
    approvalReason = `Protected builder paths require manual review: ${protectedPathsTouched.join(', ')}`;
    reasons.push(approvalReason);
  }

  if (isProtectedBranch(protectedBranch)) {
    decision = 'block';
    executionPolicy = 'manual_only';
    requiredExternalApproval = true;
    const branchReason = `Protected branch requires manual proof gate before live push: ${protectedBranch}`;
    approvalReason = approvalReason ?? branchReason;
    reasons.push(branchReason);
  }

  if (taskClass === 'class_2' && (!approvedPlan || !approvalId)) {
    if (executionPolicy === 'allow_push') {
      executionPolicy = 'dry_run_only';
    }
    requiredExternalApproval = true;
    approvalReason = approvedPlan
      ? 'class_2 requires approvalId before live push.'
      : 'class_2 requires approved plan + approvalId before live push.';
    reasons.push(approvalReason);
  }

  if (taskClass === 'class_2' && !approvalValid) {
    if (executionPolicy === 'allow_push') {
      executionPolicy = 'dry_run_only';
    }
    requiredExternalApproval = true;
    approvalReason = input.approvalValidationReason?.trim()
      || 'class_2 approvalId failed approval_ticket validation before live push.';
    reasons.push(approvalReason);
  }

  if (decision === 'uncertain') {
    if (executionPolicy === 'allow_push') {
      executionPolicy = 'dry_run_only';
    }
    requiredExternalApproval = true;
    approvalReason = 'Judge decision uncertain: external approval required before live push.';
    reasons.push(approvalReason);
  }

  if (decision === 'block') {
    if (executionPolicy === 'allow_push') {
      executionPolicy = taskClass === 'class_3' ? 'manual_only' : 'dry_run_only';
    }
    requiredExternalApproval = true;
    approvalReason = approvalReason ?? 'Judge requires approval before live push.';
    if (!reasons.includes(approvalReason)) {
      reasons.push(approvalReason);
    }
  }

  if (input.dryRun) {
    if (executionPolicy === 'allow_push') {
      executionPolicy = 'dry_run_only';
    }
    reasons.push('dryRun=true keeps autonomous push disabled.');
  }

  if (input.allowAutonomousPush === false) {
    if (executionPolicy === 'allow_push') {
      executionPolicy = 'dry_run_only';
    }
    reasons.push('allowAutonomousPush=false keeps autonomous push disabled.');
  }

  return {
    taskClass,
    executionPolicy,
    decision,
    pushAllowed: executionPolicy === 'allow_push',
    requiredExternalApproval,
    approvalId,
    approvalReason,
    protectedPathsTouched,
    reasons,
  };
}

export async function guardBuilderPush<T>(
  decision: BuilderSafetyDecision,
  runPush: () => Promise<T> | T,
): Promise<GuardedBuilderPushResult<T>> {
  const pushBlockedReason = decision.reasons[0] ?? 'Autonomous push requires proof or operator approval.';

  if (!decision.pushAllowed) {
    return {
      executed: false,
      decision,
      pushBlockedReason,
    };
  }

  return {
    executed: true,
    decision,
    result: await runPush(),
  };
}
