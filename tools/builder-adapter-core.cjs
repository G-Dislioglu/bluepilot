'use strict';

const VALID_DECISIONS = new Set(['allow_single_track', 'require_human_review', 'reject']);
const BLOCKED_OPERATIONS = [
  'render_integration',
  'builder_chat_fusion',
  'auto_merge',
  'auto_deploy',
  'aicos_write',
  'maya_write',
  'desktop_bridge_write',
  'patrol_auto_repair',
  'unbounded_worker_tracks',
];

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [value];
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeRepoPath(filePath) {
  return String(filePath || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function patternToRegex(pattern) {
  const normalizedPattern = normalizeRepoPath(pattern);
  let source = '';

  for (let index = 0; index < normalizedPattern.length; index += 1) {
    const char = normalizedPattern[index];
    const next = normalizedPattern[index + 1];

    if (char === '*' && next === '*') {
      source += '.*';
      index += 1;
      continue;
    }

    if (char === '*') {
      source += '[^/]*';
      continue;
    }

    source += escapeRegex(char);
  }

  return new RegExp(`^${source}$`);
}

function matchesAny(file, patterns) {
  return patterns.some((pattern) => patternToRegex(pattern).test(normalizeRepoPath(file)));
}

function validateEnvelope(input) {
  const errors = [];

  for (const field of ['run_id', 'task_contract_ref', 'target_repo']) {
    if (typeof input[field] !== 'string' || input[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  }

  if (!isObject(input.phase_scanner_result)) {
    errors.push('phase_scanner_result is required');
  } else {
    const decision = input.phase_scanner_result.decision;
    if (!VALID_DECISIONS.has(decision)) errors.push(`phase_scanner_result.decision is invalid: ${decision}`);
    if (typeof input.phase_scanner_result.human_gate_required !== 'boolean') {
      errors.push('phase_scanner_result.human_gate_required must be boolean');
    }
  }

  for (const field of ['allowed_files', 'forbidden_files', 'required_evidence']) {
    const values = input[field];
    if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== 'string' || value.length === 0)) {
      errors.push(`${field} must be a non-empty string array`);
    }
  }

  if (!isObject(input.human_gate)) {
    errors.push('human_gate is required');
  } else {
    if (typeof input.human_gate.required !== 'boolean') errors.push('human_gate.required must be boolean');
    if (!['pending', 'approved', 'rejected'].includes(input.human_gate.status)) {
      errors.push('human_gate.status must be pending, approved, or rejected');
    }
  }

  return errors;
}

function findScopeViolations(input) {
  const changedFiles = asArray(input.mock_changed_files).map(normalizeRepoPath);
  if (changedFiles.length === 0) return [];

  return changedFiles.filter((file) => {
    const forbidden = matchesAny(file, input.forbidden_files);
    const allowed = matchesAny(file, input.allowed_files);
    return forbidden || !allowed;
  });
}

function buildEvidenceRefs(input, adapterRunId) {
  return {
    task_evidence_ref: `mock-builder://${input.run_id}/evidence`,
    artifacts_ref: `mock-builder://${input.run_id}/artifacts`,
    task_audit_ref: `mock-builder://${input.run_id}/task-audit`,
    bridge_audit_ref: `mock-builder://${adapterRunId}/bridge-audit`,
  };
}

function blockedOutput(input, adapterRunId, reasons) {
  return {
    adapter_run_id: adapterRunId,
    status: 'blocked',
    builder_task_id: null,
    decision_ready: false,
    changed_files: asArray(input.mock_changed_files).map(normalizeRepoPath),
    evidence: {},
    blocked_reasons: reasons,
    requires_human_gate: true,
    mock: true,
  };
}

function runAdapter(input) {
  const adapterRunId = `mock-builder-adapter-${input.run_id || 'invalid'}`;
  const validationErrors = validateEnvelope(input);
  if (validationErrors.length > 0) {
    return blockedOutput(input, adapterRunId, validationErrors);
  }

  const requestedOperations = asArray(input.requested_operations);
  const blockedOperations = requestedOperations.filter((operation) => BLOCKED_OPERATIONS.includes(operation));
  if (blockedOperations.length > 0) {
    return blockedOutput(input, adapterRunId, [`Blocked operation requested: ${blockedOperations.join(', ')}`]);
  }

  const decision = input.phase_scanner_result.decision;
  if (decision === 'reject') {
    return blockedOutput(input, adapterRunId, ['Phase Scanner decision is reject. No Builder call allowed.']);
  }

  if (input.human_gate.required && input.human_gate.status !== 'approved') {
    return blockedOutput(input, adapterRunId, [`Human gate is ${input.human_gate.status}. No Builder call allowed.`]);
  }

  if (decision === 'require_human_review' && input.human_gate.status !== 'approved') {
    return blockedOutput(input, adapterRunId, ['Phase Scanner requires human review before Builder call.']);
  }

  const scopeViolations = findScopeViolations(input);
  if (scopeViolations.length > 0) {
    return blockedOutput(input, adapterRunId, [`Scope gate violation: ${scopeViolations.join(', ')}`]);
  }

  const changedFiles = asArray(input.mock_changed_files).map(normalizeRepoPath);

  return {
    adapter_run_id: adapterRunId,
    status: 'completed',
    builder_task_id: `mock-builder-task-${input.run_id}`,
    decision_ready: false,
    changed_files: changedFiles,
    evidence: buildEvidenceRefs(input, adapterRunId),
    blocked_reasons: [],
    requires_human_gate: true,
    mock: true,
  };
}

module.exports = {
  runAdapter,
  blockedOutput,
};
