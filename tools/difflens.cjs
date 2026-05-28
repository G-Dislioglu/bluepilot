#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const VERSION = '0.1.0';
const LARGE_DIFF_LINE_THRESHOLD = 400;

function normalizeDiffPath(value) {
  if (!value) return null;
  return String(value).replace(/^a\//, '').replace(/^b\//, '');
}

function isLockfile(filePath) {
  return /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb)$/i.test(filePath);
}

function isPackageManifest(filePath) {
  return /(^|\/)package\.json$/i.test(filePath);
}

function isEnvPath(filePath) {
  return /(^|\/)\.env($|[./_-])/i.test(filePath) || /secret|credential|private[_-]?key/i.test(filePath);
}

function isRuntimePath(filePath) {
  return /^(tools|src|app|api|components|lib)\//i.test(filePath);
}

function createFileRecord(oldPath, newPath) {
  const filePath = normalizeDiffPath(newPath) || normalizeDiffPath(oldPath) || 'unknown';
  return {
    file_path: filePath,
    old_path: normalizeDiffPath(oldPath),
    new_path: normalizeDiffPath(newPath),
    hunks: 0,
    additions: 0,
    deletions: 0,
    changed_lines: 0,
    binary: false,
    flags: [],
  };
}

function addFlag(file, flags, code, reason) {
  if (!file.flags.includes(code)) file.flags.push(code);
  if (!flags.some((item) => item.code === code && item.file_path === file.file_path)) {
    flags.push({ code, file_path: file.file_path, reason });
  }
}

function finalizeFile(file, flags) {
  if (!file) return;
  if (file.binary) addFlag(file, flags, 'binary_diff', 'Binary diff needs manual review.');
  if (isLockfile(file.file_path)) addFlag(file, flags, 'lockfile_diff', 'Lockfile changes can hide dependency drift.');
  if (isPackageManifest(file.file_path)) addFlag(file, flags, 'package_manifest_diff', 'Package manifest changes affect runtime dependencies.');
  if (isEnvPath(file.file_path)) addFlag(file, flags, 'sensitive_path', 'Sensitive or env-like path needs manual review.');
  if (isRuntimePath(file.file_path)) addFlag(file, flags, 'runtime_path', 'Runtime path changes affect behavior.');
  if (file.changed_lines >= LARGE_DIFF_LINE_THRESHOLD) {
    addFlag(file, flags, 'large_diff', `Changed lines exceed ${LARGE_DIFF_LINE_THRESHOLD}.`);
  }
}

function parseUnifiedDiff(diffText) {
  const files = [];
  const riskFlags = [];
  let current = null;
  let pendingOldPath = null;
  let pendingNewPath = null;

  const lines = String(diffText || '').split(/\r?\n/);
  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      finalizeFile(current, riskFlags);
      const match = line.match(/^diff --git\s+(.+?)\s+(.+)$/);
      pendingOldPath = match ? match[1] : null;
      pendingNewPath = match ? match[2] : null;
      current = createFileRecord(pendingOldPath, pendingNewPath);
      files.push(current);
      continue;
    }

    if (line.startsWith('--- ')) {
      pendingOldPath = line.slice(4).trim();
      if (!current) current = createFileRecord(pendingOldPath, pendingNewPath);
      current.old_path = normalizeDiffPath(pendingOldPath);
      if (!files.includes(current)) files.push(current);
      continue;
    }

    if (line.startsWith('+++ ')) {
      pendingNewPath = line.slice(4).trim();
      if (!current) {
        current = createFileRecord(pendingOldPath, pendingNewPath);
        files.push(current);
      }
      current.new_path = normalizeDiffPath(pendingNewPath);
      current.file_path = current.new_path || current.old_path || current.file_path;
      continue;
    }

    if (line.startsWith('Binary files ') || line === 'GIT binary patch') {
      if (!current) {
        current = createFileRecord(pendingOldPath, pendingNewPath);
        files.push(current);
      }
      current.binary = true;
      continue;
    }

    if (line.startsWith('@@')) {
      if (!current) {
        current = createFileRecord(pendingOldPath, pendingNewPath);
        files.push(current);
      }
      current.hunks += 1;
      continue;
    }

    if (!current) continue;
    if (line.startsWith('+++') || line.startsWith('---')) continue;

    if (line.startsWith('+')) {
      current.additions += 1;
      current.changed_lines += 1;
    } else if (line.startsWith('-')) {
      current.deletions += 1;
      current.changed_lines += 1;
    }
  }

  finalizeFile(current, riskFlags);

  const totals = files.reduce((acc, file) => {
    acc.additions += file.additions;
    acc.deletions += file.deletions;
    acc.hunks += file.hunks;
    if (file.binary) acc.binary_files += 1;
    return acc;
  }, { files: files.length, hunks: 0, additions: 0, deletions: 0, binary_files: 0 });

  return {
    tool: 'difflens',
    version: VERSION,
    summary: totals,
    files,
    risk_flags: riskFlags,
    human_gate_required: riskFlags.length > 0,
    visual_review_required: files.length > 0,
  };
}

function readStdin() {
  return fs.readFileSync(0, 'utf8');
}

function usage() {
  return [
    'Usage:',
    '  node tools/difflens.cjs --diff <path>',
    '  git diff | node tools/difflens.cjs',
  ].join('\n');
}

function runCli(argv) {
  const diffIndex = argv.indexOf('--diff');
  let input;

  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  if (diffIndex !== -1) {
    const filePath = argv[diffIndex + 1];
    if (!filePath) {
      process.stderr.write('Missing path after --diff.\n');
      process.stderr.write(`${usage()}\n`);
      return 1;
    }
    input = fs.readFileSync(path.resolve(filePath), 'utf8');
  } else {
    input = readStdin();
  }

  const result = parseUnifiedDiff(input);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return 0;
}

if (require.main === module) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  parseUnifiedDiff,
  normalizeDiffPath,
};
