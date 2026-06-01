/**
 * Opus-Task Orchestrator v2 — Minimal Viable Pipeline
 *
 * Changes from v1:
 * - Deterministic scope via builderScopeResolver (no LLM guessing)
 * - Full-file overwrite instead of SEARCH/REPLACE
 * - TypeScript syntax check before push
 * - Structured errors instead of silent catch
 * - Single runId through all phases
 * - dryRun mode for safe testing
 */

let ts: typeof import('typescript') | null = null;
try {
  ts = await import('typescript');
} catch {
  // typescript not available at runtime — TS check will be skipped
}
import { callProvider } from './providers.js';
import { waitForDeploy } from './opusAssist.js';
import { WORKER_REGISTRY, DEFAULT_WORKERS, JUDGE_WORKER } from './opusWorkerRegistry.js';
import { resolveScope, fetchFileContents, probeRepoFilePresence, isIndexedRepoFile, type ScopeMethod } from './builderScopeResolver.js';
import { findRelatedFiles, loadBuilderFileIndex, type RelatedFile } from './builderRelatedFiles.js';
import { decideChangeMode, getWorkerPromptForMode, type ChangeMode } from './opusChangeRouter.js';
import { judgeValidCandidates } from './opusJudge.js';
import { evaluateCandidateClaims, resolveGateMode } from './opusClaimGate.js';
import { smartPush } from './opusSmartPush.js';
import { parseEnvelope, validateEnvelope, type EditEnvelope } from './opusEnvelopeValidator.js';
import { classifyBuilderTask, guardBuilderPush, type BuilderGateDecision, type BuilderSafetyDecision, type BuilderTaskClass, type ExecutionPolicy } from './builderSafetyPolicy.js';
import { validateApprovalArtifact, type ApprovalArtifactValidationResult } from './builderApprovalArtifacts.js';
import { hardenInstruction, type SpecHardeningReport } from './specHardening.js';
import { assembleArchitectInstruction, type ArchitectTaskAugmentations } from './architectPhase1.js';
import { type BuilderSideEffectsContract } from './builderSideEffects.js';
import { buildWorkflowSimulation, type BuilderWorkflowSimulation } from './builderWorkflowSimulation.js';
import { buildRecommendationOutput, type BuilderRecommendationOutput } from './builderRecommendationOutput.js';
import { buildAnalysisOutput, type BuilderAnalysisOutput } from './builderAnalysisOutput.js';
import {
  isSoulmatchTarget,
  resolveBuilderTargetProfile,
  type BuilderTargetProfile,
} from './builderTargetProfiles.js';
import { devLogger } from './devLogger.js';

// ─── Types ───

export interface OpusTaskInput {
  instruction: string;
  scope?: string[];
  targetFile?: string;
  acceptanceSmoke?: boolean;
  sourceAsyncJobId?: string;
  sideEffects?: BuilderSideEffectsContract;
  workers?: string[];
  maxTokens?: number;
  skipDeploy?: boolean;
  /**
   * Run push but skip orchestrator's inline deploy-wait and self-test phases.
   * Used by outer orchestrators (e.g. /build) that own post-push verification.
   */
  skipInlinePostPushChecks?: boolean;
  dryRun?: boolean;
  approvalId?: string;
  hasApprovedPlan?: boolean;
  sourceTaskId?: string;
  sourceRunId?: string;
  metaSourceIds?: string[];
  assumptions?: string[];
  assumptionIds?: string[];
  targetProfileId?: string;
}

export interface OpusTaskResult {
  status: 'success' | 'partial' | 'failed' | 'dry_run';
  runId: string;
  phases: PhaseResult[];
  totalDurationMs: number;
  summary: string;
  edits?: EditEnvelope;
  taskClass?: BuilderTaskClass;
  executionPolicy?: ExecutionPolicy;
  decision?: BuilderGateDecision;
  pushAllowed?: boolean;
  requiredExternalApproval?: boolean;
  approvalId?: string;
  approvalReason?: string;
  pushBlockedReason?: string;
  protectedPathsTouched?: string[];
  /** True only if dispatches landed on main (verified by pushResultWaiter). Undefined for synchronous direct-patch path where landing equals success. */
  landed?: boolean;
  /** Verified commit SHA from GitHub Actions execution-result callback, if available. */
  verifiedCommit?: string;
  workflowSimulation?: BuilderWorkflowSimulation;
  recommendation?: BuilderRecommendationOutput;
  analysis?: BuilderAnalysisOutput;
  hardening?: SpecHardeningReport;
  dispatchHardening?: SpecHardeningReport;
  targetProfile?: BuilderTargetProfile;
  targetProfileWarnings?: string[];
  scopeProposal?: BuilderScopeProposal;
}

interface PhaseResult {
  phase: string;
  status: 'ok' | 'skipped' | 'error';
  durationMs: number;
  detail?: unknown;
}

/** The one and only change format. No SEARCH/REPLACE. No diff. No regex. */
// ─── Helpers ───

function generateRunId(): string {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function buildSafetyResultFields(safetyDecision: BuilderSafetyDecision): Pick<OpusTaskResult,
  'taskClass' |
  'executionPolicy' |
  'decision' |
  'pushAllowed' |
  'requiredExternalApproval' |
  'approvalId' |
  'approvalReason' |
  'pushBlockedReason' |
  'protectedPathsTouched'
> {
  return {
    taskClass: safetyDecision.taskClass,
    executionPolicy: safetyDecision.executionPolicy,
    decision: safetyDecision.decision,
    pushAllowed: safetyDecision.pushAllowed,
    requiredExternalApproval: safetyDecision.requiredExternalApproval,
    approvalId: safetyDecision.approvalId,
    approvalReason: safetyDecision.approvalReason,
    pushBlockedReason: safetyDecision.pushAllowed
      ? undefined
      : (safetyDecision.reasons[0] ?? 'Autonomous push blocked by builder safety policy.'),
    protectedPathsTouched: safetyDecision.protectedPathsTouched,
  };
}

function internalUrl(path: string): string {
  const port = process.env.PORT || 3000;
  const token = process.env.OPUS_BRIDGE_SECRET;
  if (!token) throw new Error('OPUS_BRIDGE_SECRET env not set');
  return `http://localhost:${port}/api/builder/opus-bridge${path}?opus_token=${token}`;
}

type OrchestratorScopeMethod = ScopeMethod | 'manual';
const CREATE_SIGNAL_RE = /erstell|create|neue|hinzufueg|new file/i;

interface ScopePhaseResult {
  files: string[];
  reasoning: string[];
  method: OrchestratorScopeMethod;
  rejectedPaths?: string[];
}

export interface BuilderScopeProposalCandidate {
  path: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'instruction_path' | 'target_repo_tree';
  reason: string;
  existsInTargetRepo?: boolean | null;
}

export interface BuilderScopeProposal {
  kind: 'missing_explicit_scope';
  targetProfileId: string;
  targetLabel: string;
  targetRepo: string | null;
  targetBranch: string;
  runtime: BuilderTargetProfile['runtime'];
  writePolicy: BuilderTargetProfile['writePolicy'];
  mayRunWorkers: false;
  dryRunOnly: true;
  requiredInput: Array<'targetProfileId' | 'scope[] or targetFile'>;
  proposedScope: BuilderScopeProposalCandidate[];
  continuationPayload: {
    targetProfileId: string;
    scope?: string[];
    dryRun: true;
  };
  continuationInstruction: string;
  notes: string[];
}

const PATH_CANDIDATE_RE = /(?:(?:\.{1,2}\/)?[A-Za-z0-9_.@-]+\/){1,8}[A-Za-z0-9_.@-]+\.(?:tsx|ts|jsx|js|mjs|cjs|json|md|py|css|html|yml|yaml|toml|ps1|sh)/g;
const SCOPE_SUGGESTION_STOPWORDS = new Set([
  'the', 'and', 'oder', 'und', 'for', 'mit', 'eine', 'einen', 'der', 'die', 'das',
  'fix', 'baue', 'build', 'task', 'target', 'repo', 'builder', 'bitte', 'please',
]);

function extractInstructionPathCandidates(instruction: string): string[] {
  const matches = instruction.match(PATH_CANDIDATE_RE) ?? [];
  return [...new Set(matches.map((path) => path.replace(/^\.{1,2}\//, '').trim()).filter(Boolean))];
}

function scopeSuggestionKeywords(instruction: string): string[] {
  return [...new Set(
    instruction
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !SCOPE_SUGGESTION_STOPWORDS.has(token)),
  )].slice(0, 24);
}

function scoreRepoTreePath(path: string, keywords: string[]): number {
  if (keywords.length === 0) {
    return 0;
  }

  const lowerPath = path.toLowerCase();
  const filename = lowerPath.split('/').pop() ?? lowerPath;
  let score = 0;

  for (const keyword of keywords) {
    if (filename.includes(keyword)) {
      score += 8;
    } else if (lowerPath.includes(keyword)) {
      score += 3;
    }
  }

  if (/\.(ts|tsx|js|jsx|py)$/.test(lowerPath)) {
    score += 2;
  }
  if (lowerPath.includes('/src/') || lowerPath.startsWith('src/')) {
    score += 2;
  }
  if (lowerPath.includes('/test') || lowerPath.includes('.test.') || lowerPath.includes('.spec.')) {
    score -= 1;
  }

  return score;
}

async function fetchTargetRepoTreePaths(targetProfile: BuilderTargetProfile): Promise<string[]> {
  if (!targetProfile.repo) {
    return [];
  }

  try {
    const branch = encodeURIComponent(targetProfile.branch);
    const githubToken = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
    const headers: Record<string, string> = {
      'User-Agent': 'soulmatch-builder-scope-proposal',
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
    };
    const response = await fetch(`https://api.github.com/repos/${targetProfile.repo}/git/trees/${branch}?recursive=1`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      devLogger.warn('system', 'Target repo tree unavailable for scope proposal', {
        targetProfileId: targetProfile.id,
        repo: targetProfile.repo,
        branch: targetProfile.branch,
        status: response.status,
        statusText: response.statusText,
        authenticated: Boolean(githubToken),
      });
      return [];
    }

    const payload = await response.json() as { tree?: Array<{ path?: unknown; type?: unknown }> };
    return (payload.tree ?? [])
      .filter((entry) => entry.type === 'blob' && typeof entry.path === 'string')
      .map((entry) => entry.path as string)
      .filter((path) => !path.includes('node_modules/') && !path.includes('/dist/') && !path.includes('/build/'));
  } catch (error) {
    devLogger.warn('system', 'Target repo tree fetch failed for scope proposal', {
      targetProfileId: targetProfile.id,
      repo: targetProfile.repo,
      branch: targetProfile.branch,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function buildAdaptiveScopeProposal(input: {
  instruction: string;
  targetProfile: BuilderTargetProfile;
}): Promise<BuilderScopeProposal> {
  const explicitPaths = extractInstructionPathCandidates(input.instruction);
  const repoTreePaths = await fetchTargetRepoTreePaths(input.targetProfile);
  const repoTreeSet = new Set(repoTreePaths);
  const candidates = new Map<string, BuilderScopeProposalCandidate>();

  for (const path of explicitPaths) {
    candidates.set(path, {
      path,
      confidence: repoTreeSet.size === 0 || repoTreeSet.has(path) ? 'high' : 'medium',
      source: 'instruction_path',
      reason: repoTreeSet.has(path)
        ? 'Exact path mentioned in instruction and present in target repo.'
        : 'Exact path mentioned in instruction; target repo truth was unavailable or did not confirm it.',
      existsInTargetRepo: repoTreeSet.size > 0 ? repoTreeSet.has(path) : null,
    });
  }

  const keywords = scopeSuggestionKeywords(input.instruction);
  const scoredRepoPaths = repoTreePaths
    .map((path) => ({ path, score: scoreRepoTreePath(path, keywords) }))
    .filter((entry) => entry.score >= 5)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);

  for (const entry of scoredRepoPaths) {
    if (candidates.has(entry.path)) {
      continue;
    }
    candidates.set(entry.path, {
      path: entry.path,
      confidence: entry.score >= 12 ? 'medium' : 'low',
      source: 'target_repo_tree',
      reason: `Target repo path matched instruction keywords (${entry.score}).`,
      existsInTargetRepo: true,
    });
  }

  const proposedScope = [...candidates.values()].slice(0, 8);
  const scope = proposedScope.map((candidate) => candidate.path);
  const continuationPayload: BuilderScopeProposal['continuationPayload'] = {
    targetProfileId: input.targetProfile.id,
    ...(scope.length > 0 ? { scope } : {}),
    dryRun: true,
  };

  return {
    kind: 'missing_explicit_scope',
    targetProfileId: input.targetProfile.id,
    targetLabel: input.targetProfile.label,
    targetRepo: input.targetProfile.repo,
    targetBranch: input.targetProfile.branch,
    runtime: input.targetProfile.runtime,
    writePolicy: input.targetProfile.writePolicy,
    mayRunWorkers: false,
    dryRunOnly: true,
    requiredInput: ['targetProfileId', 'scope[] or targetFile'],
    proposedScope,
    continuationPayload,
    continuationInstruction: scope.length > 0
      ? `Repeat /opus-task with targetProfileId="${input.targetProfile.id}" and confirm or trim scope[] before worker dispatch.`
      : `Repeat /opus-task with targetProfileId="${input.targetProfile.id}" and provide exact scope[] or targetFile.`,
    notes: [
      'No worker was dispatched.',
      'Builder does not infer write scope for non-Soulmatch targets.',
      input.targetProfile.repo
        ? 'Candidates from target repo tree are read-only suggestions.'
        : 'Target has no reachable repo adapter; provide an exact local path or create the target repo adapter first.',
    ],
  };
}

// ─── Phase 1: Deterministic Scope ───

async function runScopePhase(
  instruction: string,
  manualScope: string[] | undefined,
  targetFile: string | undefined,
  targetProfile: BuilderTargetProfile,
): Promise<ScopePhaseResult> {
  const isSoulmatch = isSoulmatchTarget(targetProfile);
  const hasCreateSignal = CREATE_SIGNAL_RE.test(instruction);

  if (!isSoulmatch && (!manualScope || manualScope.length === 0) && !targetFile) {
    return {
      files: [],
      reasoning: [
        `target ${targetProfile.id} uses explicit_scope_only; provide scope[] or targetFile`,
      ],
      method: 'manual',
      rejectedPaths: [],
    };
  }

  if (manualScope && manualScope.length > 0) {
    const uniqueManualScope = [...new Set(manualScope)];
    const indexed = isSoulmatch ? uniqueManualScope.filter((path) => isIndexedRepoFile(path)) : [];
    const unindexed = isSoulmatch ? uniqueManualScope.filter((path) => !isIndexedRepoFile(path)) : uniqueManualScope;

    let repoVisibleUnindexed: string[] = [];
    let missingUnindexed = unindexed;
    let unreachableUnindexed: string[] = [];

    if (unindexed.length > 0 && !hasCreateSignal && targetProfile.repo) {
      const freshRepoPresence = await probeRepoFilePresence(unindexed, targetProfile.repo, targetProfile.branch);
      repoVisibleUnindexed = unindexed.filter((path) => freshRepoPresence.get(path) === 'found');
      missingUnindexed = unindexed.filter((path) => freshRepoPresence.get(path) === 'not_found');
      unreachableUnindexed = unindexed.filter((path) => freshRepoPresence.get(path) === 'unreachable');
    } else if (unindexed.length > 0 && !hasCreateSignal && !targetProfile.repo) {
      unreachableUnindexed = unindexed;
      missingUnindexed = [];
    }

    if ((missingUnindexed.length > 0 || unreachableUnindexed.length > 0) && !hasCreateSignal) {
      return {
        files: [],
        reasoning: [
          ...repoVisibleUnindexed.map((path) => `${path} (FRESH): manual scope path not in repo index but found via repo truth check`),
          ...unreachableUnindexed.map((path) => `${path} (FRESH-CHECK FAILED): target ${targetProfile.id} has no reachable repo truth for this path`),
          ...missingUnindexed.map((path) => `manual scope path not found in target ${targetProfile.id} and no create signal in instruction: ${path}`),
        ],
        method: 'deterministic',
        rejectedPaths: [...unreachableUnindexed, ...missingUnindexed],
      };
    }

    const reasoning = [`manual override for target ${targetProfile.id}`];
    if (indexed.length > 0) {
      reasoning.push(`manual scope indexed: ${indexed.join(', ')}`);
    }
    if (repoVisibleUnindexed.length > 0) {
      reasoning.push(...repoVisibleUnindexed.map((path) => `${path} (FRESH): manual scope path found via ${targetProfile.id} repo truth check`));
    }
    if (unindexed.length > 0 && hasCreateSignal) {
      reasoning.push(...unindexed.map((path) => `${path} (CREATE): manual scope path not in local index, create signal present`));
    }

    return {
      files: [...indexed, ...repoVisibleUnindexed, ...(hasCreateSignal ? unindexed : [])],
      reasoning,
      method: hasCreateSignal && unindexed.length > 0 ? 'create' : 'manual',
    };
  }

  if (!isSoulmatch && targetFile) {
    return runScopePhase(instruction, [targetFile], undefined, targetProfile);
  }

  const result = resolveScope(instruction);
  if (targetFile && !result.files.includes(targetFile)) {
    result.files.unshift(targetFile);
    result.reasoning.unshift(`${targetFile} (forced): targetFile parameter`);
    if (!isIndexedRepoFile(targetFile) && CREATE_SIGNAL_RE.test(instruction)) {
      result.method = 'create';
      result.reasoning.unshift(`${targetFile} (CREATE): targetFile is not in repo index`);
    }
  }
  return result;
}

// ─── Phase 3: Worker Swarm (Full-File Overwrite) ───

function buildWorkerPrompt(
  instruction: string,
  fileContents: Map<string, string>,
  scopeFiles: string[],
  scopeMethod: OrchestratorScopeMethod,
  fileModes: Array<{ path: string; mode: ChangeMode }>,
  relatedFiles: RelatedFile[],
): string {
  const createTargets = fileModes.filter((entry) => entry.mode === 'create').map((entry) => entry.path);
  const fileSection = scopeFiles.map(f => {
    const content = fileContents.get(f);
    return content
      ? `--- ${f} (${content.split('\n').length} lines) ---\n${content}\n--- END ${f} ---`
      : `--- ${f} (NEW FILE) ---`;
  }).join('\n\n');
  const relatedSection = relatedFiles.length > 0
    ? `\n\n## KONTEXT (nur lesen, nicht editieren)\n${relatedFiles.map((file) => `### ${file.path} (${file.source})\n${file.preview}`).join('\n\n')}`
    : '';

  return `TASK: ${instruction}

SCOPE METHOD: ${scopeMethod}
CREATE TARGETS: ${createTargets.length > 0 ? createTargets.join(', ') : 'none'}

FILES IN SCOPE:
${fileSection}
${relatedSection}

RESPONSE FORMAT — respond with ONLY this JSON structure, nothing else:
{
  "edits": [
    {
      "path": "exact/file/path.ts",
      "mode": "overwrite",
      "content": "COMPLETE new file content"
    }
  ],
  "summary": "one-line description",
  "claims": [
    {
      "text": "short concrete change claim",
      "evidence_refs": [
        { "type": "edit_path", "ref": "exact/file/path.ts" }
      ]
    }
  ]
}

ALTERNATIVE PATCH SHAPE for small targeted edits:
{
  "edits": [
    {
      "path": "exact/file/path.ts",
      "mode": "patch",
      "patches": [
        {
          "search": "exact old text",
          "replace": "exact new text"
        }
      ]
    }
  ],
  "summary": "one-line description"
}

RULES:
- For existing files: prefer a valid patch envelope for small targeted changes; use complete overwrite only when patching is impractical
- For new files: return complete content (mode: create)
- If a file is listed under CREATE TARGETS, do not treat it as an overwrite of an existing file
- Include 1-3 short claims with concrete evidence_refs when possible
- Allowed evidence_ref.type values: edit_path, scope_path, explicit_path, other
- Do NOT invent anchor_status, impact_class, risk_class, or any other governance fields
- Do NOT use unified diff format, prose instructions, or markdown patch blocks
- If you use mode "patch", provide exact search/replace strings inside edits[].patches
- Do NOT wrap in markdown code blocks
- Return ONLY valid JSON`;
}

async function runWorkerSwarm(
  prompt: string, workers: string[], maxTokens: number,
): Promise<Array<{ worker: string; response: string; durationMs: number; error?: string }>> {
  return Promise.all(workers.map(async (worker) => {
    const config = WORKER_REGISTRY[worker];
    if (!config) return { worker, response: '', durationMs: 0, error: `Unknown worker: ${worker}` };
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error('Timeout 150s')), 150_000);
      try {
        const response = await callProvider(config.provider, config.model, {
          system: 'You are a senior TypeScript developer. Respond ONLY with valid JSON. No markdown, no explanation.',
          messages: [{ role: 'user', content: prompt }],
          maxTokens, temperature: 0.3, forceJsonObject: false,
          signal: controller.signal,
        });
        return { worker, response, durationMs: Date.now() - start };
      } finally {
        clearTimeout(timeout);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { worker, response: '', durationMs: Date.now() - start, error: msg.slice(0, 200) };
    }
  }));
}

// ─── Phase 4: Parse + Validate ───

// ─── Phase 5: Push ───

async function pushEdits(
  envelope: EditEnvelope,
  instruction: string,
  safetyDecision: BuilderSafetyDecision,
  acceptanceSmoke?: boolean,
  sourceAsyncJobId?: string,
  sideEffects?: BuilderSideEffectsContract,
  targetRepo?: string | null,
): Promise<{
  pushed: boolean;
  filesCount: number;
  asyncDispatch: boolean;
  taskClass: BuilderTaskClass;
  executionPolicy: ExecutionPolicy;
  decision: BuilderGateDecision;
  pushAllowed: boolean;
  requiredExternalApproval: boolean;
  approvalId?: string;
  approvalReason?: string;
  pushBlockedReason?: string;
  protectedPathsTouched: string[];
  policyBlocked?: boolean;
  error?: string;
  durationMs: number;
  landed?: boolean;
  verifiedCommit?: string;
}> {
  const start = Date.now();
  const guardedPush = await guardBuilderPush(safetyDecision, async () => {
    const files = envelope.edits.map((edit) =>
      edit.mode === 'patch'
        ? { file: edit.path, patches: edit.patches }
        : { file: edit.path, mode: edit.mode, content: edit.content ?? '' },
    );
    return {
      files,
      result: await smartPush(files, `feat(opus-task): ${instruction.slice(0, 80)}`, {
        acceptanceSmoke,
        sourceAsyncJobId,
        sideEffects,
        targetRepo,
      }),
    };
  });

  if (!guardedPush.executed) {
    return {
      pushed: false,
      filesCount: envelope.edits.length,
      asyncDispatch: false,
      taskClass: safetyDecision.taskClass,
      executionPolicy: safetyDecision.executionPolicy,
      decision: safetyDecision.decision,
      pushAllowed: false,
      requiredExternalApproval: safetyDecision.requiredExternalApproval,
      approvalId: safetyDecision.approvalId,
      approvalReason: safetyDecision.approvalReason,
      pushBlockedReason: guardedPush.pushBlockedReason,
      protectedPathsTouched: safetyDecision.protectedPathsTouched,
      policyBlocked: true,
      durationMs: Date.now() - start,
    };
  }

  try {
    const { files, result } = guardedPush.result;
    return {
      pushed: result.pushed,
      filesCount: files.length,
      asyncDispatch: result.asyncDispatch,
      taskClass: safetyDecision.taskClass,
      executionPolicy: safetyDecision.executionPolicy,
      decision: safetyDecision.decision,
      pushAllowed: safetyDecision.pushAllowed,
      requiredExternalApproval: safetyDecision.requiredExternalApproval,
      approvalId: safetyDecision.approvalId,
      approvalReason: safetyDecision.approvalReason,
      protectedPathsTouched: safetyDecision.protectedPathsTouched,
      error: result.error,
      durationMs: Date.now() - start,
      landed: result.landed,
      verifiedCommit: result.commitHash,
    };
  } catch (e: unknown) {
    return {
      pushed: false,
      filesCount: envelope.edits.length,
      asyncDispatch: false,
      taskClass: safetyDecision.taskClass,
      executionPolicy: safetyDecision.executionPolicy,
      decision: safetyDecision.decision,
      pushAllowed: safetyDecision.pushAllowed,
      requiredExternalApproval: safetyDecision.requiredExternalApproval,
      approvalId: safetyDecision.approvalId,
      approvalReason: safetyDecision.approvalReason,
      protectedPathsTouched: safetyDecision.protectedPathsTouched,
      error: e instanceof Error ? e.message : String(e),
      durationMs: Date.now() - start,
    };
  }
}

// ─── Phase 7: Self-Test ───

async function runSelfTest(): Promise<{ passed: boolean; durationMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(internalUrl('/self-test'), { method: 'POST' });
    const data = await res.json() as Record<string, unknown>;
    return { passed: !!data.allPassed, durationMs: Date.now() - start };
  } catch {
    return { passed: false, durationMs: Date.now() - start };
  }
}

// ─── Main ───

export async function orchestrateTask(input: OpusTaskInput): Promise<OpusTaskResult> {
  const runId = generateRunId();
  const totalStart = Date.now();
  const phases: PhaseResult[] = [];
  const workers = input.workers || DEFAULT_WORKERS;
  const maxTokens = input.maxTokens || 6000;
  let approvalValidation: ApprovalArtifactValidationResult | undefined;
  const targetResolution = resolveBuilderTargetProfile(input.targetProfileId, input.dryRun);
  if (!targetResolution) {
    return {
      runId,
      status: 'failed',
      phases: [{
        phase: 'target-profile',
        status: 'error',
        durationMs: 0,
        detail: { requestedId: input.targetProfileId ?? null },
      }],
      totalDurationMs: Date.now() - totalStart,
      summary: `Unknown Builder target profile: ${input.targetProfileId ?? '(empty)'}`,
    };
  }
  const targetProfile = targetResolution.profile;
  const effectiveDryRun = targetResolution.effectiveDryRun;
  phases.push({
    phase: 'target-profile',
    status: 'ok',
    durationMs: 0,
    detail: {
      requestedId: targetResolution.requestedId,
      defaulted: targetResolution.defaulted,
      profile: targetProfile,
      effectiveDryRun,
      warnings: targetResolution.warnings,
    },
  });
  const preflightSafety = classifyBuilderTask({
    instruction: input.instruction,
    scope: input.scope,
    targetFile: input.targetFile,
    dryRun: effectiveDryRun,
    approvalId: input.approvalId,
    hasApprovedPlan: input.hasApprovedPlan,
  });

  const hardeningStart = Date.now();
  const hardening = hardenInstruction(input.instruction);
  phases.push({
    phase: 'hardening',
    status: hardening.ok ? 'ok' : 'error',
    durationMs: Date.now() - hardeningStart,
    detail: hardening,
  });
  if (!hardening.ok) {
    return {
      runId,
      status: 'failed',
      phases,
      hardening,
      totalDurationMs: Date.now() - totalStart,
      summary: 'Instruction blocked: ' + hardening.stats.blockCount + ' blocking finding(s)',
    };
  }

  if (preflightSafety.taskClass === 'class_3') {
    phases.push({
      phase: 'safety-preflight',
      status: 'error',
      durationMs: 0,
      detail: {
        taskClass: preflightSafety.taskClass,
        executionPolicy: preflightSafety.executionPolicy,
        reasons: preflightSafety.reasons,
        protectedPathsTouched: preflightSafety.protectedPathsTouched,
      },
    });
    return {
      runId,
      status: 'failed',
      phases,
      hardening,
      totalDurationMs: Date.now() - totalStart,
      summary: preflightSafety.reasons[0] ?? 'Protected/manual-only builder task blocked before worker dispatch.',
      ...buildSafetyResultFields(preflightSafety),
    };
  }

  const architectAssembly = await assembleArchitectInstruction(input.instruction, {
    metaSourceIds: input.metaSourceIds,
    assumptions: input.assumptions,
    assumptionIds: input.assumptionIds,
  } satisfies ArchitectTaskAugmentations);
  phases.push({
    phase: 'architect-assembly',
    status: architectAssembly.ok ? 'ok' : 'error',
    durationMs: 0,
    detail: {
      metaFragments: architectAssembly.metaFragments.map((fragment) => ({
        id: fragment.id,
        sourceId: fragment.provenance.sourceId,
        hardeningStatus: fragment.hardeningStatus,
        reuseAllowed: fragment.reuseAllowed,
        truncation: fragment.truncation,
      })),
      selectedAssumptions: architectAssembly.selectedAssumptions.map((fragment) => ({
        id: fragment.id,
        sourceId: fragment.provenance.sourceId,
        hardeningStatus: fragment.hardeningStatus,
        reuseAllowed: fragment.reuseAllowed,
      })),
      omittedMetaFragments: architectAssembly.omittedMetaFragments.map((fragment) => ({
        id: fragment.id,
        sourceId: fragment.provenance.sourceId,
        hardeningStatus: fragment.hardeningStatus,
        findings: fragment.findings,
      })),
      warnings: architectAssembly.warnings,
      findings: architectAssembly.findings,
      finalInstructionLength: architectAssembly.finalInstruction.length,
      dispatchHardening: {
        ok: architectAssembly.dispatchHardening.ok,
        warningCount: architectAssembly.dispatchHardening.stats.warnCount,
        blockCount: architectAssembly.dispatchHardening.stats.blockCount,
      },
      blockReason: architectAssembly.blockReason,
    },
  });
  if (!architectAssembly.ok) {
    return {
      runId,
      status: 'failed',
      phases,
      hardening,
      dispatchHardening: architectAssembly.dispatchHardening,
      totalDurationMs: Date.now() - totalStart,
      summary: architectAssembly.blockReason || 'Architect assembly blocked the task before worker dispatch.',
    };
  }
  const workerInstruction = architectAssembly.finalInstruction;

  // Phase 1: Deterministic Scope
  const s1 = Date.now();
  const scope = await runScopePhase(input.instruction, input.scope, input.targetFile, targetProfile);
  const indexedFiles = isSoulmatchTarget(targetProfile)
    ? scope.files.filter((path) => isIndexedRepoFile(path))
    : [];
  const createTargets = scope.method === 'create'
    ? scope.files.filter((path) => !isSoulmatchTarget(targetProfile) || !isIndexedRepoFile(path))
    : [];
  const missingExplicitTargetScope = scope.files.length === 0
    && !isSoulmatchTarget(targetProfile)
    && targetProfile.scopePolicy === 'explicit_scope_only'
    && (!input.scope || input.scope.length === 0)
    && !input.targetFile;
  phases.push({
    phase: 'scope', status: scope.files.length > 0 ? 'ok' : missingExplicitTargetScope ? 'skipped' : 'error',
    durationMs: Date.now() - s1,
    detail: {
      targetProfileId: targetProfile.id,
      targetRepo: targetProfile.repo,
      targetBranch: targetProfile.branch,
      requiresExplicitScope: missingExplicitTargetScope,
      files: scope.files,
      method: scope.method,
      reasoning: scope.reasoning.slice(0, 5),
      indexedFiles,
      createTargets,
      rejectedPaths: scope.rejectedPaths ?? [],
    },
  });
  if (scope.files.length === 0) {
    if (missingExplicitTargetScope) {
      const scopeProposal = await buildAdaptiveScopeProposal({
        instruction: input.instruction,
        targetProfile,
      });
      phases.push({
        phase: 'scope-proposal',
        status: 'ok',
        durationMs: 0,
        detail: scopeProposal,
      });
      return {
        status: 'partial',
        runId,
        phases,
        hardening,
        totalDurationMs: Date.now() - totalStart,
        summary: `Scope proposal ready for target ${targetProfile.id}: confirm scope[] or targetFile before worker dispatch.`,
        scopeProposal,
        targetProfile,
        targetProfileWarnings: targetResolution.warnings,
        ...buildSafetyResultFields(preflightSafety),
      };
    }

    return {
      status: 'failed',
      runId,
      phases,
      hardening,
      totalDurationMs: Date.now() - totalStart,
      summary: scope.rejectedPaths && scope.rejectedPaths.length > 0
          ? `Scope rejected ${scope.rejectedPaths.length} hallucinated path(s): ${scope.rejectedPaths.join(', ')}. Include exact paths in instruction or provide explicit create signal.`
          : 'Scope resolver found 0 files. Include exact paths in instruction.',
      ...buildSafetyResultFields(preflightSafety),
    };
  }

  if (input.approvalId?.trim()) {
    const sApproval = Date.now();
    approvalValidation = await validateApprovalArtifact({
      approvalId: input.approvalId,
      instruction: input.instruction,
      scope: scope.files,
      sourceTaskId: input.sourceTaskId,
      sourceRunId: input.sourceRunId,
    });
    phases.push({
      phase: 'approval-validation',
      status: approvalValidation.valid ? 'ok' : 'error',
      durationMs: Date.now() - sApproval,
      detail: {
        approvalId: approvalValidation.approvalId,
        valid: approvalValidation.valid,
        reason: approvalValidation.reason,
        instructionFingerprint: approvalValidation.instructionFingerprint,
        scopeFingerprint: approvalValidation.scopeFingerprint,
      },
    });
  }

  // Phase 2: Fetch
  const s2 = Date.now();
  const fileContents = targetProfile.repo
    ? await fetchFileContents(scope.files, targetProfile.repo, targetProfile.branch)
    : new Map<string, string>();
  
  // ChangeRouter: Decide mode for each file
  const fileModes = scope.files.map((filePath) => {
    const content = fileContents.get(filePath) ?? null;
    const changeMode = decideChangeMode(content);
    console.log(`[ChangeRouter] ${filePath}: ${changeMode}`);
    return { path: filePath, mode: changeMode };
  });
  let relatedFiles: RelatedFile[] = [];
  if (isSoulmatchTarget(targetProfile)) {
    try {
      const fileIndex = loadBuilderFileIndex();
      const seen = new Set(scope.files);
      for (const scopeFile of scope.files) {
        const related = await findRelatedFiles(scopeFile, fileIndex, 5);
        for (const candidate of related) {
          if (seen.has(candidate.path)) continue;
          seen.add(candidate.path);
          relatedFiles.push(candidate);
          if (relatedFiles.length >= 5) break;
        }
        if (relatedFiles.length >= 5) break;
      }
    } catch (err) {
      console.error('[related-files] failed to load deterministic context:', err);
    }
  }
  const ambiguousTargets = fileModes.filter((entry) => entry.mode === 'ambiguous').map((entry) => entry.path);
  if (ambiguousTargets.length > 0) {
    phases.push({ phase: 'fetch', status: 'error', durationMs: Date.now() - s2,
      detail: { fetched: fileContents.size, total: scope.files.length, ambiguousTargets } });
    return { status: 'failed', runId, phases, totalDurationMs: Date.now() - totalStart,
      summary: `Ambiguous file state for: ${ambiguousTargets.join(', ')}`, hardening };
  }
  const modePrompts = [...new Set(fileModes.map((entry) => getWorkerPromptForMode(entry.mode)))];

  phases.push({ phase: 'fetch', status: 'ok', durationMs: Date.now() - s2,
    detail: {
      targetProfileId: targetProfile.id,
      targetRepo: targetProfile.repo,
      fetched: fileContents.size,
      total: scope.files.length,
      createTargets: fileModes.filter((entry) => entry.mode === 'create').map((entry) => entry.path),
      relatedFiles: relatedFiles.map((file) => ({ path: file.path, source: file.source })),
    } });

  // Phase 3: Swarm
  const s3 = Date.now();
  const prompt = `${buildWorkerPrompt(workerInstruction, fileContents, scope.files, scope.method, fileModes, relatedFiles)}\n\n${modePrompts.join('\n\n')}`;
  const results = await runWorkerSwarm(prompt, workers, maxTokens);
  const okResults = results.filter(r => r.response.length > 50 && !r.error);
  phases.push({ phase: 'swarm', status: okResults.length > 0 ? 'ok' : 'error',
    durationMs: Date.now() - s3,
    detail: results.map(r => ({ worker: r.worker, chars: r.response.length, ms: r.durationMs, error: r.error })) });
  if (okResults.length === 0) {
    return { status: 'failed', runId, phases, totalDurationMs: Date.now() - totalStart, summary: 'All workers failed.', hardening };
  }

  // Phase 4: Parse + Validate
  const s4 = Date.now();
  const allParsed: Array<{ envelope: EditEnvelope; worker: string; errors: string[]; appliedDiffSnapshot?: import('./opusEnvelopeValidator.js').AppliedDiffSnapshot }> = [];
  for (const r of okResults) {
    console.log(`[validate] raw worker output (${r.worker}):`, r.response.slice(0, 500));
    const envelope = parseEnvelope(r.response, r.worker);
    if (!envelope) continue;
    const v = validateEnvelope(envelope, scope.files, fileContents, input.instruction);
    allParsed.push({ envelope, worker: r.worker, errors: v.errors, appliedDiffSnapshot: v.appliedDiffSnapshot });
  }
  const valid = allParsed.filter(c => c.errors.length === 0);
  phases.push({ phase: 'validate', status: valid.length > 0 ? 'ok' : 'error',
    durationMs: Date.now() - s4,
    detail: { parsed: allParsed.length, valid: valid.length, total: okResults.length,
      errors: allParsed.filter(c => c.errors.length > 0).map(c => ({ worker: c.worker, errors: c.errors })),
      snapshots: allParsed.map(c => ({
        worker: c.worker,
        actualChangedFiles: c.appliedDiffSnapshot?.actualChangedFiles ?? [],
        files: c.appliedDiffSnapshot?.files.map((file) => ({
          path: file.path,
          changed: file.changed,
          changedSegmentsCount: file.changedSegmentsCount,
          changedSegmentsPreview: file.changedSegmentsPreview,
          sectionGuardApplied: file.sectionGuardApplied,
          sectionAnchor: file.sectionAnchor,
          sectionRangeStart: file.sectionRangeStart,
          sectionRangeEnd: file.sectionRangeEnd,
          changedSegmentsOutsideSection: file.changedSegmentsOutsideSection,
          sectionGuardWarnings: file.sectionGuardWarnings,
        })) ?? [],
      })) } });

  if (valid.length === 0) {
    return { status: 'failed', runId, phases, totalDurationMs: Date.now() - totalStart,
      summary: `${allParsed.length} parsed, 0 valid. Workers can't produce a valid overwrite or patch envelope yet.`, hardening };
  }

  // Phase 4a: Claim Gate
  const s4a = Date.now();
  const gateMode = resolveGateMode();
  const gateResults = valid.map(({ envelope, worker }) => ({
    worker,
    result: evaluateCandidateClaims({
      instruction: input.instruction,
      scopeFiles: scope.files,
      envelope,
      mode: gateMode,
    }),
  }));
  const gatedCandidates = gateMode === 'hard'
    ? valid.filter((candidate) => !gateResults.find((entry) => entry.worker === candidate.worker)?.result.blocked)
    : valid;

  devLogger.info('system', 'F13 claim gate evaluated candidates', {
    mode: gateMode,
    runId,
    candidates: gateResults.map((entry) => ({
      worker: entry.worker,
      impactClass: entry.result.impactClass,
      blocked: entry.result.blocked,
      rejectCodes: entry.result.rejectCodes,
      claims: entry.result.claims.map((claim) => ({
        text: claim.text,
        anchorStatus: claim.anchorStatus,
        scopeCompatibility: claim.scopeCompatibility,
        matchedRefs: claim.matchedRefs,
      })),
    })),
  });

  phases.push({
    phase: 'claim-gate',
    status: gatedCandidates.length > 0 ? 'ok' : 'error',
    durationMs: Date.now() - s4a,
    detail: {
      mode: gateMode,
      candidates: gateResults.map((entry) => ({
        worker: entry.worker,
        impactClass: entry.result.impactClass,
        blocked: entry.result.blocked,
        rejectCodes: entry.result.rejectCodes,
        claims: entry.result.claims,
      })),
    },
  });

  if (gatedCandidates.length === 0) {
    const rejectCodes = [...new Set(gateResults.flatMap((entry) => entry.result.rejectCodes))];
    return {
      status: 'failed',
      runId,
      phases,
      hardening,
      totalDurationMs: Date.now() - totalStart,
      summary: `F13 hard gate rejected all candidates: ${rejectCodes.join(', ') || 'unknown_reason'}`,
    };
  }

  // Phase 4b: Judge
  const s4b = Date.now();
  const judge = await judgeValidCandidates(input.instruction, gatedCandidates, {
    scopeFiles: scope.files,
    createTargets: fileModes.filter((entry) => entry.mode === 'create').map((entry) => entry.path),
  });
  phases.push({ phase: 'judge', status: judge.approved && judge.winner ? 'ok' : 'error', durationMs: Date.now() - s4b,
    detail: judge.approved && judge.winner
      ? { winner: judge.worker, judgeLane: judge.judgeLane, files: judge.winner.edits.map(e => e.path), summary: judge.winner.summary, reason: judge.reason }
      : { judgeLane: judge.judgeLane, reason: judge.reason, rejectedWorkers: judge.rejectedWorkers } });
  const judgeDecision: BuilderGateDecision = judge.decision ?? (judge.approved ? 'approve' : 'block');
  if (judgeDecision === 'block' || !judge.winner) {
    const judgeFailureSafety = classifyBuilderTask({
      instruction: input.instruction,
      scope: scope.files,
      targetFile: input.targetFile,
      dryRun: effectiveDryRun,
      approvalId: input.approvalId,
      hasApprovedPlan: input.hasApprovedPlan,
      approvalValid: approvalValidation?.valid,
      approvalValidationReason: approvalValidation?.reason,
      judgeDecision,
    });
    return {
      status: 'failed',
      runId,
      phases,
      totalDurationMs: Date.now() - totalStart,
      summary: `Judge rejected all candidates: ${judge.reason}`,
      hardening,
      ...buildSafetyResultFields(judgeFailureSafety),
    };
  }
  const best = judge.winner;
  const winnerValidation = valid.find((candidate) => candidate.envelope === best);
  const winnerGate = gateResults.find((entry) => entry.worker === best.worker)?.result;
  const finalSafety = classifyBuilderTask({
    instruction: input.instruction,
    scope: scope.files,
    targetFile: input.targetFile,
    files: best.edits.map((edit) => edit.path),
    dryRun: effectiveDryRun,
    approvalId: input.approvalId,
    hasApprovedPlan: input.hasApprovedPlan,
    approvalValid: approvalValidation?.valid,
    approvalValidationReason: approvalValidation?.reason,
    judgeDecision,
  });
  const pushBlockedReason = finalSafety.reasons[0] ?? 'Autonomous push blocked by builder safety policy.';
  const s4c = Date.now();
  const workflowSimulation = buildWorkflowSimulation({
    scopeFiles: scope.files,
    createTargets: fileModes.filter((entry) => entry.mode === 'create').map((entry) => entry.path),
    winner: best,
    winnerClaimGate: winnerGate,
    finalSafety,
    dryRun: effectiveDryRun === true,
    appliedDiffSnapshot: winnerValidation?.appliedDiffSnapshot,
    sideEffectsMode: input.sideEffects?.mode === 'none' ? 'none' : 'default',
  });
  const recommendation = buildRecommendationOutput(workflowSimulation);
  const analysis = buildAnalysisOutput(workflowSimulation);
  phases.push({
    phase: 'workflow-simulation',
    status: workflowSimulation.recommendedAction === 'allow_push'
      || (effectiveDryRun === true && workflowSimulation.recommendedAction === 'dry_run_only')
      ? 'ok'
      : 'error',
    durationMs: Date.now() - s4c,
    detail: workflowSimulation,
  });

  // Dry run?
  if (effectiveDryRun) {
    return { status: 'dry_run', runId, phases, edits: best,
      totalDurationMs: Date.now() - totalStart,
      summary: targetProfile.pushAllowed
        ? `Dry run: ${best.edits.length} file(s) ready. Winner: ${best.worker}`
        : `Dry run only for target ${targetProfile.id}: ${best.edits.length} file(s) proposed. Winner: ${best.worker}`,
      taskClass: finalSafety.taskClass,
      executionPolicy: finalSafety.executionPolicy,
      decision: finalSafety.decision,
      pushAllowed: finalSafety.pushAllowed,
      requiredExternalApproval: finalSafety.requiredExternalApproval,
      approvalId: finalSafety.approvalId,
      approvalReason: finalSafety.approvalReason,
      pushBlockedReason,
      protectedPathsTouched: finalSafety.protectedPathsTouched,
      workflowSimulation,
      recommendation,
      analysis,
      hardening,
      dispatchHardening: architectAssembly.dispatchHardening,
      targetProfile,
      targetProfileWarnings: targetResolution.warnings };
  }

  if (workflowSimulation.recommendedAction !== 'allow_push') {
    const workflowSimulationSummary = workflowSimulation.recommendedAction === 'block_push'
      ? `Workflow simulation requires proof or operator decision before push: ${workflowSimulation.simulatedFindings[0] ?? 'pre-push workflow violation'}`
      : workflowSimulation.recommendedAction === 'dry_run_only'
        ? `Workflow simulation gate downgraded this run to dry-run-only: ${workflowSimulation.simulatedFindings[0] ?? 'pre-push caution'}`
        : `Workflow simulation gate requires review before push: ${workflowSimulation.simulatedFindings[0] ?? workflowSimulation.recommendedAction}`;
    return {
      status: 'partial',
      runId,
      phases,
      edits: best,
      totalDurationMs: Date.now() - totalStart,
      summary: workflowSimulationSummary,
      taskClass: finalSafety.taskClass,
      executionPolicy: finalSafety.executionPolicy,
      decision: finalSafety.decision,
      pushAllowed: false,
      requiredExternalApproval: finalSafety.requiredExternalApproval,
      approvalId: finalSafety.approvalId,
      approvalReason: finalSafety.approvalReason,
      pushBlockedReason: workflowSimulation.simulatedFindings[0] ?? pushBlockedReason,
      protectedPathsTouched: finalSafety.protectedPathsTouched,
      workflowSimulation,
      recommendation,
      analysis,
      hardening,
      dispatchHardening: architectAssembly.dispatchHardening,
      targetProfile,
      targetProfileWarnings: targetResolution.warnings,
    };
  }

  // Phase 5: Push
  if (input.skipDeploy) {
    phases.push({ phase: 'push', status: 'skipped', durationMs: 0 });
  } else {
    const push = await pushEdits(
      best,
      input.instruction,
      finalSafety,
      input.acceptanceSmoke,
      input.sourceAsyncJobId,
      input.sideEffects,
      targetProfile.repo,
    );
    phases.push({ phase: 'push', status: push.pushed ? 'ok' : 'error', durationMs: push.durationMs, detail: push });
    if (!push.pushed) {
      return { status: 'partial', runId, phases, edits: best,
        totalDurationMs: Date.now() - totalStart,
        summary: push.policyBlocked
          ? `Push requires proof or operator approval: ${push.pushBlockedReason}`
          : `Push failed: ${push.error}`,
        taskClass: push.taskClass,
        executionPolicy: push.executionPolicy,
        decision: push.decision,
        pushAllowed: push.pushAllowed,
        requiredExternalApproval: push.requiredExternalApproval,
        approvalId: push.approvalId,
        approvalReason: push.approvalReason,
        pushBlockedReason: push.pushBlockedReason,
        protectedPathsTouched: push.protectedPathsTouched,
        landed: push.landed,
        verifiedCommit: push.verifiedCommit,
        workflowSimulation,
        recommendation,
        analysis,
        hardening,
        dispatchHardening: architectAssembly.dispatchHardening,
        targetProfile,
        targetProfileWarnings: targetResolution.warnings,
      };
    }
  }

  // Phase 6: Deploy-Wait
  if (!input.skipDeploy) {
    const s6 = Date.now();
    const pushPhase = phases.find((phase) => phase.phase === 'push');
    const pushDetail = pushPhase?.detail as { asyncDispatch?: boolean } | undefined;
    if (input.skipInlinePostPushChecks) {
      phases.push({
        phase: 'deploy-wait',
        status: 'skipped',
        durationMs: Date.now() - s6,
        detail: { reason: 'external_post_push_orchestrator' },
      });
    } else if (pushDetail?.asyncDispatch) {
      phases.push({
        phase: 'deploy-wait',
        status: 'skipped',
        durationMs: Date.now() - s6,
        detail: { reason: 'async_push_dispatch', note: 'GitHub executor performs commit and deploy later; inline wait would be stale.' },
      });
    } else {
      const sid = process.env.RENDER_SERVICE_ID || '';
      const key = process.env.RENDER_API_KEY || '';
      if (sid && key) {
      const dep = await waitForDeploy(sid, key);
      phases.push({ phase: 'deploy-wait', status: dep.deployed ? 'ok' : 'error', durationMs: Date.now() - s6, detail: dep });
      } else {
        phases.push({ phase: 'deploy-wait', status: 'skipped', durationMs: 0 });
      }
    }
  }

  // Phase 7: Self-Test
  if (!input.skipDeploy) {
    const pushPhase = phases.find((phase) => phase.phase === 'push');
    const pushDetail = pushPhase?.detail as { asyncDispatch?: boolean } | undefined;
    if (input.skipInlinePostPushChecks) {
      phases.push({ phase: 'self-test', status: 'skipped', durationMs: 0, detail: { reason: 'external_post_push_orchestrator' } });
    } else if (pushDetail?.asyncDispatch) {
      phases.push({ phase: 'self-test', status: 'skipped', durationMs: 0, detail: { reason: 'async_push_dispatch' } });
    } else {
      const t = await runSelfTest();
      phases.push({ phase: 'self-test', status: t.passed ? 'ok' : 'error', durationMs: t.durationMs });
    }
  }

  const allOk = phases.every(p => p.status === 'ok' || p.status === 'skipped');
  const pushPhase = phases.find((phase) => phase.phase === 'push');
  const pushDetail = pushPhase?.detail as { landed?: boolean; verifiedCommit?: string } | undefined;
  return {
    status: allOk ? 'success' : 'partial', runId, phases, edits: best,
    totalDurationMs: Date.now() - totalStart,
    summary: `${allOk ? '✅' : '⚠️'} ${Math.round((Date.now() - totalStart) / 1000)}s | ${best.worker} | ${best.edits.map(e => e.path).join(', ')}`,
    taskClass: finalSafety.taskClass,
    executionPolicy: finalSafety.executionPolicy,
    decision: finalSafety.decision,
    pushAllowed: finalSafety.pushAllowed,
    requiredExternalApproval: finalSafety.requiredExternalApproval,
    approvalId: finalSafety.approvalId,
    approvalReason: finalSafety.approvalReason,
    pushBlockedReason: finalSafety.pushAllowed ? undefined : pushBlockedReason,
    protectedPathsTouched: finalSafety.protectedPathsTouched,
    landed: pushDetail?.landed,
    verifiedCommit: pushDetail?.verifiedCommit,
    workflowSimulation,
    recommendation,
    analysis,
    hardening,
    dispatchHardening: architectAssembly.dispatchHardening,
    targetProfile,
    targetProfileWarnings: targetResolution.warnings,
  };
}
