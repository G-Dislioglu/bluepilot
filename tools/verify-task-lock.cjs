#!/usr/bin/env node

/**
 * verify-task-lock.cjs - Workcell Lock Protocol v0.1b
 *
 * Modes:
 *   --preflight   Before a task: verifies that the working tree is clean.
 *   --verify      After a task: checks changed files against allowed/forbidden.
 *
 * Usage:
 *   node tools/verify-task-lock.cjs BP-001 --preflight
 *   node tools/verify-task-lock.cjs BP-001 --verify
 *   node tools/verify-task-lock.cjs BP-001 --verify --contract contracts/custom.json
 *
 * Exit codes:
 *   0 -> clean
 *   1 -> Drift/REWORK
 *   2 -> HARD STOP
 */

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function failUsage(message) {
  if (message) console.error(message);
  console.error('Usage: node tools/verify-task-lock.cjs <TASK_ID> --preflight|--verify [--contract <path>]');
  process.exit(1);
}

if (args.length === 0 || args[0].startsWith('--')) {
  failUsage();
}

const taskId = args[0];
const isPreflight = args.includes('--preflight');
const isVerify = args.includes('--verify');

if (isPreflight && isVerify) {
  failUsage('Choose exactly one mode: --preflight or --verify.');
}

if (!isPreflight && !isVerify) {
  console.error('Modus fehlt. Bitte --preflight oder --verify angeben.');
  console.error('Vor dem Task:  node tools/verify-task-lock.cjs BP-001 --preflight');
  console.error('Nach dem Task: node tools/verify-task-lock.cjs BP-001 --verify');
  process.exit(1);
}

const contractFlagIndex = args.indexOf('--contract');
let contractPath;

if (contractFlagIndex > -1) {
  const contractArg = args[contractFlagIndex + 1];
  if (!contractArg || contractArg.startsWith('--')) {
    console.error('--contract erwartet einen Pfad als naechstes Argument.');
    console.error('Beispiel: --contract contracts/BP-001.json');
    process.exit(1);
  }
  contractPath = path.resolve(contractArg);
} else {
  contractPath = path.resolve(__dirname, '..', 'contracts', `${taskId}.json`);
}

function runGit(argsForGit) {
  return execFileSync('git', argsForGit, { encoding: 'utf-8' }).trim();
}

function normalizeRepoPath(filePath) {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function assertStringArray(contract, field) {
  if (!Array.isArray(contract[field]) || contract[field].some((value) => typeof value !== 'string' || value.length === 0)) {
    console.error(`Pflichtfeld muss ein nicht-leeres String-Array sein: "${field}"`);
    process.exit(1);
  }
}

function failContract(message) {
  console.error(`Ungueltiger Contract: ${message}`);
  process.exit(1);
}

function includesAny(values, candidates) {
  return candidates.some((candidate) => values.includes(candidate));
}

function validateContractFields(contract) {
  const validTaskTypes = new Set(['code_task', 'doc_task', 'ui_task', 'config_task', 'governance_task']);
  if (!validTaskTypes.has(contract.task_type)) {
    failContract(`task_type muss einer von ${[...validTaskTypes].join(', ')} sein.`);
  }

  if (!Array.isArray(contract.reuse_target) || contract.reuse_target.length === 0) {
    failContract('reuse_target muss mindestens einen benannten Reuse-Pfad enthalten.');
  }

  const validReuseTargets = new Set(['next_task_pre_lock', 'session_log', 'aicos_card_candidate', 'review_packet']);
  for (const target of contract.reuse_target) {
    if (typeof target !== 'string' || !validReuseTargets.has(target)) {
      failContract(`ungueltiger reuse_target: ${target}`);
    }
  }

  assertStringArray(contract, 'evidence_required');

  const evidence = contract.evidence_required;
  const evidenceRules = {
    code_task: () => includesAny(evidence, ['test_result', 'runtime_check']),
    doc_task: () => includesAny(evidence, ['content_check', 'link_check']),
    ui_task: () => ['screenshot_check', 'playwright_flow', 'human_ui_review'].every((item) => evidence.includes(item)),
    config_task: () => evidence.includes('diff_ref') && includesAny(evidence, ['build_result', 'lint_result']),
    governance_task: () => evidence.includes('diff_ref') && evidence.includes('content_check'),
  };

  if (!evidenceRules[contract.task_type]()) {
    failContract(`evidence_required passt nicht zu task_type "${contract.task_type}".`);
  }

  const validUiPersonas = new Set(['beginner_user', 'operator_user', 'power_user']);
  if (contract.task_type === 'ui_task') {
    if (!validUiPersonas.has(contract.target_persona)) {
      failContract('ui_task braucht target_persona: beginner_user, operator_user oder power_user.');
    }
  } else if (contract.target_persona !== null && contract.target_persona !== undefined) {
    failContract('target_persona darf nur fuer ui_task gesetzt sein.');
  }

  if (contract.council_session_required !== undefined && typeof contract.council_session_required !== 'boolean') {
    failContract('council_session_required muss boolean sein, wenn gesetzt.');
  }
}

function loadContract() {
  if (!fs.existsSync(contractPath)) {
    console.error(`Contract nicht gefunden: ${contractPath}`);
    console.error(`Erstelle contracts/${taskId}.json oder nutze --contract <path>.`);
    process.exit(1);
  }

  let contract;
  try {
    contract = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
  } catch (err) {
    console.error(`Contract konnte nicht geladen werden: ${err.message}`);
    process.exit(1);
  }

  const requiredScalars = ['task_id', 'mode'];
  for (const field of requiredScalars) {
    if (typeof contract[field] !== 'string' || contract[field].length === 0) {
      console.error(`Pflichtfeld fehlt im Contract: "${field}"`);
      process.exit(1);
    }
  }

  if (contract.task_id !== taskId) {
    console.error(`TASK_ID mismatch: CLI="${taskId}" contract="${contract.task_id}"`);
    process.exit(1);
  }

  const validModes = new Set(['lite', 'standard', 'critical', 'dual-control']);
  if (!validModes.has(contract.mode)) {
    console.error(`Ungueltiger mode: ${contract.mode}`);
    process.exit(1);
  }

  assertStringArray(contract, 'allowed_files');
  assertStringArray(contract, 'forbidden_files');
  validateContractFields(contract);

  return contract;
}

function runPreflight() {
  let status;
  try {
    status = runGit(['status', '--short']);
  } catch (err) {
    console.error('git status fehlgeschlagen. Bist du in einem Git-Repo?');
    process.exit(2);
  }

  const sep = '-'.repeat(62);
  console.log('');
  console.log(sep);
  console.log(`PREFLIGHT - ${taskId}`);
  console.log(sep);

  if (status.length > 0) {
    console.log('');
    console.log('HARD STOP - DIRTY WORKING TREE');
    console.log('');
    status.split('\n').forEach((line) => console.log(`  ${line}`));
    console.log('');
    console.log('Aenderungen committen, stashen oder verwerfen.');
    console.log(sep);
    process.exit(2);
  }

  const contract = fs.existsSync(contractPath) ? loadContract() : null;
  if (contract && contract.council_session_required === true) {
    assertActiveCouncilSession();
  }

  console.log('');
  console.log('Working Tree clean - Task darf starten.');
  console.log(sep);
  process.exit(0);
}

function assertActiveCouncilSession() {
  const repoRoot = path.resolve(__dirname, '..');
  const councilRoot = process.env.BLUEPILOT_COUNCIL_ROOT
    ? path.resolve(process.env.BLUEPILOT_COUNCIL_ROOT)
    : repoRoot;
  const sessionPath = path.join(councilRoot, '.bluepilot', 'council', 'session.json');

  if (!fs.existsSync(sessionPath)) {
    console.log('');
    console.log('HARD STOP - COUNCIL SESSION REQUIRED');
    console.log('');
    console.log(`Session fehlt: ${sessionPath}`);
    console.log('Starte oder uebergib eine aktive Council Session.');
    process.exit(2);
  }

  let session;
  try {
    session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  } catch (err) {
    console.log('');
    console.log('HARD STOP - COUNCIL SESSION INVALID');
    console.log('');
    console.log(`Session unlesbar: ${err.message}`);
    process.exit(2);
  }

  if (!session || session.status !== 'active') {
    console.log('');
    console.log('HARD STOP - COUNCIL SESSION NOT ACTIVE');
    console.log('');
    console.log(`Session status: ${session && session.status ? session.status : '(missing)'}`);
    process.exit(2);
  }

  console.log('');
  console.log(`Council Session active: ${session.session_id || '(unknown)'}`);
}

function splitOutput(output) {
  return output
    .split('\n')
    .map((file) => normalizeRepoPath(file.trim()))
    .filter(Boolean);
}

function getChangedFiles(baselineRef) {
  const ref = baselineRef || 'HEAD';
  try {
    const committed = runGit(['diff', ref, '--name-only']);
    const staged = runGit(['diff', '--cached', '--name-only']);
    const unstaged = runGit(['diff', '--name-only']);
    const untracked = runGit(['ls-files', '--others', '--exclude-standard']);

    return [...new Set([
      ...splitOutput(committed),
      ...splitOutput(staged),
      ...splitOutput(unstaged),
      ...splitOutput(untracked),
    ])];
  } catch (err) {
    console.error(`git diff fehlgeschlagen: ${err.message}`);
    process.exit(1);
  }
}

function matchesAnyPattern(file, patterns) {
  let picomatch;
  try {
    picomatch = require('picomatch');
  } catch (err) {
    picomatch = null;
  }

  for (const pattern of patterns) {
    if (picomatch) {
      if (picomatch(pattern, { dot: true })(file)) return pattern;
    } else if (matchesFallbackPattern(file, pattern)) {
      return pattern;
    }
  }
  return null;
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

function matchesFallbackPattern(file, pattern) {
  const normalizedFile = normalizeRepoPath(file);
  const normalizedPattern = normalizeRepoPath(pattern);
  const negativeExtglob = normalizedPattern.match(/^(.*)!\(\*([^)]*)\)(.*)$/);

  if (negativeExtglob) {
    const [, prefix, forbiddenSuffix, suffix] = negativeExtglob;
    return normalizedFile.startsWith(prefix)
      && normalizedFile.endsWith(suffix)
      && !normalizedFile.endsWith(`${forbiddenSuffix}${suffix}`);
  }

  return patternToRegex(normalizedPattern).test(normalizedFile);
}

function checkForbidden(changedFiles, contract) {
  return changedFiles
    .map((file) => ({ file, rule: matchesAnyPattern(file, contract.forbidden_files) }))
    .filter((violation) => violation.rule !== null);
}

function checkOutsideAllowed(changedFiles, contract) {
  return changedFiles.filter((file) => !matchesAnyPattern(file, contract.allowed_files));
}

function getDriftDecision(outsideAllowed, mode) {
  if (outsideAllowed.length === 0) return { type: 'CLEAN', exitCode: 0 };
  if (mode === 'critical' || mode === 'dual-control') {
    return { type: 'HARD_STOP', exitCode: 2, reason: `mode:${mode} - outside ALLOWED = HARD STOP` };
  }
  return { type: 'REWORK', exitCode: 1, reason: `mode:${mode} - outside ALLOWED = REWORK` };
}

function runVerify(contract) {
  const sep = '-'.repeat(62);
  const taskType = contract.task_type || 'unbekannt';

  const changedFiles = getChangedFiles(contract.baseline_ref);
  const forbiddenViolations = checkForbidden(changedFiles, contract);
  const outsideAllowed = checkOutsideAllowed(changedFiles, contract);
  const driftDecision = getDriftDecision(outsideAllowed, contract.mode);

  console.log('');
  console.log(sep);
  console.log(`VERIFY - ${contract.task_id}`);
  console.log(sep);
  console.log(`Mode: ${contract.mode}  Type: ${taskType}  Risk: ${contract.risk_class || '-'}`);
  console.log(sep);

  console.log('');
  console.log(`Geaenderte Dateien (${changedFiles.length}):`);
  if (changedFiles.length === 0) {
    console.log('  (keine)');
  } else {
    changedFiles.forEach((file) => console.log(`  ${file}`));
  }

  console.log('');
  console.log(sep);

  if (forbiddenViolations.length > 0) {
    console.log('');
    console.log('HARD STOP - FORBIDDEN_FILES GATE');
    console.log('');
    forbiddenViolations.forEach((violation) => {
      console.log(`  ${violation.file}`);
      console.log(`    matched: ${violation.rule}`);
    });
    console.log('');
    console.log('Gurcan informieren.');
    console.log(sep);
    process.exit(2);
  }

  console.log('');
  console.log('FORBIDDEN_FILES: Keine Verletzungen');

  if (outsideAllowed.length > 0) {
    console.log('');
    console.log(`AUSSERHALB ALLOWED (${outsideAllowed.length}):`);
    outsideAllowed.forEach((file) => console.log(`  ${file}`));
  } else {
    console.log('ALLOWED_FILES: Alle Aenderungen im Scope');
  }

  const evidenceMap = {
    code_task: 'test_result ODER runtime_check (Pflicht)',
    doc_task: 'content_check ODER link_check (Pflicht)',
    ui_task: 'screenshot_check + playwright_flow + human_ui_review (Pflicht)',
    config_task: 'diff_ref + build_result/lint_result (Pflicht)',
    governance_task: 'diff_ref + content_check (Pflicht)',
  };
  if (evidenceMap[taskType]) {
    console.log('');
    console.log(`Evidence-Pflicht: ${evidenceMap[taskType]}`);
  }

  console.log('');
  console.log(sep);

  switch (driftDecision.type) {
    case 'CLEAN':
      console.log('');
      console.log('KEIN DRIFT - Task vollstaendig im Lock');
      break;
    case 'REWORK':
      console.log('');
      console.log('DRIFT -> REWORK');
      console.log(`  ${driftDecision.reason}`);
      break;
    case 'HARD_STOP':
      console.log('');
      console.log('HARD STOP');
      console.log(`  ${driftDecision.reason}`);
      break;
  }

  console.log(sep);
  process.exit(driftDecision.exitCode);
}

if (isPreflight) {
  runPreflight();
}

runVerify(loadContract());
