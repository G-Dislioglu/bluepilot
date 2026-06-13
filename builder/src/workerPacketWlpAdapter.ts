import { classifyBuilderTask, type BuilderTaskClass } from './builderSafetyPolicy.js';
import type { EditEnvelope, WorkerClaim } from './opusEnvelopeValidator.js';

export type WlpTaskType = 'code_task' | 'doc_task' | 'ui_task' | 'config_task' | 'governance_task';
export type WlpMode = 'lite' | 'standard' | 'critical' | 'dual-control';
export type WlpReuseTarget = 'next_task_pre_lock' | 'session_log' | 'aicos_card_candidate' | 'review_packet';
export type WlpEvidence = 'test_result' | 'runtime_check' | 'content_check' | 'link_check' | 'screenshot_check' | 'playwright_flow' | 'human_ui_review' | 'diff_ref' | 'build_result' | 'lint_result';

export interface WorkerPacket {
  taskId: string;
  taskName: string;
  goal: string;
  worker: string;
  summary: string;
  envelope: EditEnvelope;
  taskType?: WlpTaskType;
  mode?: WlpMode;
  riskClass?: 'low' | 'medium' | 'high' | 'critical';
  impactClass?: string;
  targetPersona?: 'beginner_user' | 'operator_user' | 'power_user' | null;
  governanceArtifactPaths?: string[];
  forbiddenFiles?: string[];
  scopeOut?: string[];
  assumptions?: string[];
  requiredCommands?: string[];
  baselineRef?: string;
}

export interface WlpContractDraft {
  task_id: string;
  task_name: string;
  created: string;
  scope: string;
  mode: WlpMode;
  task_type: WlpTaskType;
  risk_class: string;
  impact_class: string;
  target_persona: 'beginner_user' | 'operator_user' | 'power_user' | null;
  council_session_required: boolean;
  goal: string;
  eligible_context: string[];
  excluded_context: string[];
  allowed_files: string[];
  forbidden_files: string[];
  scope_out: string[];
  claims: string[];
  assumptions: string[];
  dod: string[];
  evidence_required: WlpEvidence[];
  required_commands: string[];
  stop_conditions: string[];
  prior_task_findings: string;
  reuse_target: WlpReuseTarget[];
  baseline_ref?: string;
  worker_packet: {
    worker: string;
    summary: string;
    edit_paths: string[];
    task_class: BuilderTaskClass;
  };
}

export type WorkerPacketWlpAdapterResult =
  | { ok: true; contract: WlpContractDraft; warnings: string[] }
  | { ok: false; errors: string[] };

const DEFAULT_FORBIDDEN_FILES = [
  '.env*',
  'node_modules/**',
  '.git/**',
  'package-lock.json',
  'builder/package-lock.json',
  '.github/workflows/**',
] as const;

const DEFAULT_EXCLUDED_CONTEXT = [
  '.env*',
  'node_modules/**',
  '.git/**',
  'C:/Users/**/.env*',
] as const;

const TASK_TYPE_EVIDENCE: Record<WlpTaskType, WlpEvidence[]> = {
  code_task: ['test_result'],
  doc_task: ['content_check'],
  ui_task: ['screenshot_check', 'playwright_flow', 'human_ui_review'],
  config_task: ['diff_ref', 'lint_result'],
  governance_task: ['diff_ref', 'content_check'],
};

const DEFAULT_REUSE_TARGETS: WlpReuseTarget[] = ['session_log', 'review_packet', 'next_task_pre_lock'];
const TASK_ID_RE = /^[A-Z0-9][A-Z0-9-]{1,80}$/;
const SAFE_REPO_PATH_RE = /^[A-Za-z0-9._/@-]+(?:\/[A-Za-z0-9._/@-]+)*$/;
const VALID_TASK_TYPES = new Set<WlpTaskType>(['code_task', 'doc_task', 'ui_task', 'config_task', 'governance_task']);
const VALID_MODES = new Set<WlpMode>(['lite', 'standard', 'critical', 'dual-control']);

function normalizeRepoPath(value: string): string {
  return value.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function validateRepoPath(rawPath: string, label: string): string | { error: string } {
  const path = normalizeRepoPath(rawPath);
  if (
    !path ||
    path.startsWith('/') ||
    /^[A-Za-z]:\//.test(path) ||
    path.includes('//') ||
    path.split('/').some((segment) => !segment || segment === '.' || segment === '..') ||
    !SAFE_REPO_PATH_RE.test(path)
  ) {
    return { error: `${label}:invalid_path:${rawPath}` };
  }

  return path;
}

function collectEditPaths(envelope: EditEnvelope): { paths: string[]; errors: string[] } {
  const errors: string[] = [];
  if (!Array.isArray(envelope.edits) || envelope.edits.length === 0) {
    return { paths: [], errors: ['worker_packet.edits_required'] };
  }

  const paths: string[] = [];
  for (const edit of envelope.edits) {
    const normalized = validateRepoPath(edit.path, 'edit_path');
    if (typeof normalized !== 'string') {
      errors.push(normalized.error);
      continue;
    }
    paths.push(normalized);
  }

  const duplicates = paths.filter((path, index) => paths.indexOf(path) !== index);
  if (duplicates.length > 0) {
    errors.push(`worker_packet.duplicate_edit_path:${unique(duplicates).join(',')}`);
  }

  return { paths: unique(paths), errors };
}

function normalizeOptionalPaths(paths: string[] | undefined, label: string): { paths: string[]; errors: string[] } {
  const normalizedPaths: string[] = [];
  const errors: string[] = [];

  for (const path of paths ?? []) {
    const normalized = validateRepoPath(path, label);
    if (typeof normalized === 'string') {
      normalizedPaths.push(normalized);
    } else {
      errors.push(normalized.error);
    }
  }

  return { paths: unique(normalizedPaths), errors };
}

function normalizeClaims(claims: WorkerClaim[] | undefined): string[] {
  return unique((claims ?? [])
    .map((claim) => claim.text.trim())
    .filter((claim) => claim.length > 0));
}

function validatePacketBasics(packet: WorkerPacket): string[] {
  const errors: string[] = [];

  if (!TASK_ID_RE.test(packet.taskId)) {
    errors.push('worker_packet.invalid_task_id');
  }
  if (!packet.taskName.trim()) {
    errors.push('worker_packet.task_name_required');
  }
  if (!packet.goal.trim()) {
    errors.push('worker_packet.goal_required');
  }
  if (!packet.worker.trim()) {
    errors.push('worker_packet.worker_required');
  }
  if (!packet.summary.trim()) {
    errors.push('worker_packet.summary_required');
  }
  if (packet.taskType === 'ui_task' && !packet.targetPersona) {
    errors.push('worker_packet.ui_task_target_persona_required');
  }
  if (packet.taskType !== undefined && !VALID_TASK_TYPES.has(packet.taskType)) {
    errors.push('worker_packet.invalid_task_type');
  }
  if (packet.mode !== undefined && !VALID_MODES.has(packet.mode)) {
    errors.push('worker_packet.invalid_mode');
  }

  return errors;
}

export function adaptWorkerPacketToWlpContract(
  packet: WorkerPacket,
  now: Date = new Date(),
): WorkerPacketWlpAdapterResult {
  const errors = validatePacketBasics(packet);
  const taskType = packet.taskType ?? 'code_task';
  const mode = packet.mode ?? 'standard';
  const riskClass = packet.riskClass ?? 'medium';
  const impactClass = packet.impactClass ?? 'builder_worker_packet';
  const editResult = collectEditPaths(packet.envelope);
  errors.push(...editResult.errors);

  const governanceArtifacts = normalizeOptionalPaths(packet.governanceArtifactPaths, 'governance_artifact');
  const forbiddenFiles = normalizeOptionalPaths(packet.forbiddenFiles, 'forbidden_file');
  errors.push(...governanceArtifacts.errors, ...forbiddenFiles.errors);

  if (editResult.paths.length > 0) {
    const safety = classifyBuilderTask({ files: editResult.paths });
    if (safety.taskClass === 'class_3') {
      errors.push(`worker_packet.protected_path:${safety.protectedPathsTouched.join(',')}`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors: unique(errors) };
  }

  const safety = classifyBuilderTask({ files: editResult.paths });
  const allowedFiles = unique([...governanceArtifacts.paths, ...editResult.paths]);
  const claims = normalizeClaims(packet.envelope.claims);
  const warnings = claims.length === 0 ? ['worker_packet.claims_empty'] : [];
  const requiredCommands = packet.requiredCommands ?? (taskType === 'doc_task'
    ? ['node tools/verify-task-lock.cjs ' + packet.taskId + ' --verify', 'git diff --check']
    : ['npm test', 'npm run typecheck', 'node tools/verify-task-lock.cjs ' + packet.taskId + ' --verify', 'git diff --check']);

  return {
    ok: true,
    warnings,
    contract: {
      task_id: packet.taskId,
      task_name: packet.taskName.trim(),
      created: now.toISOString().slice(0, 10),
      scope: `bluepilot/worker-packet/${packet.taskId.toLowerCase()}`,
      mode,
      task_type: taskType,
      risk_class: riskClass,
      impact_class: impactClass,
      target_persona: taskType === 'ui_task' ? packet.targetPersona ?? null : null,
      council_session_required: false,
      goal: packet.goal.trim(),
      eligible_context: unique([...allowedFiles, 'docs/CLAUDE-CONTEXT.md', 'docs/SESSION-LOG.md', 'STATE.md']),
      excluded_context: [...DEFAULT_EXCLUDED_CONTEXT],
      allowed_files: allowedFiles,
      forbidden_files: unique([...DEFAULT_FORBIDDEN_FILES, ...forbiddenFiles.paths]),
      scope_out: packet.scopeOut ?? [
        'Do not widen scope beyond explicit worker edit paths.',
        'Do not change runtime behavior unless a later contract allows it.',
      ],
      claims,
      assumptions: packet.assumptions ?? [
        `Worker packet produced by ${packet.worker.trim()} was already parsed and validated before adaptation.`,
      ],
      dod: [
        'All explicit worker edit paths are either implemented or deliberately removed from scope.',
        'Review packet records worker packet provenance and verification evidence.',
        'Task-lock verification passes for the generated contract.',
      ],
      evidence_required: TASK_TYPE_EVIDENCE[taskType],
      required_commands: requiredCommands,
      stop_conditions: [
        'A protected path becomes necessary.',
        'Scope must be inferred from prose instead of explicit edit paths.',
        'Runtime dispatch or live write behavior becomes necessary.',
      ],
      prior_task_findings: packet.summary.trim(),
      reuse_target: DEFAULT_REUSE_TARGETS,
      ...(packet.baselineRef ? { baseline_ref: packet.baselineRef } : {}),
      worker_packet: {
        worker: packet.worker.trim(),
        summary: packet.summary.trim(),
        edit_paths: editResult.paths,
        task_class: safety.taskClass,
      },
    },
  };
}
