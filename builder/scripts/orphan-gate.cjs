#!/usr/bin/env node
// Usage: node scripts/orphan-gate.cjs [--mode warn|enforce|off]
//   (default mode comes from .orphan-scan.json "gate" field; default "warn")
//
// The Orphan Gate: a thin layer over orphan-scan.cjs.
// - Calls the scanner, parses its JSON (does NOT reimplement reachability logic).
// - Watches TWO categories:
//   * orphan      — files with no importers at all
//   * test-only   — source files reached only from test files (NOT the test files themselves)
// - Loads the baseline (.orphan-baseline.json: {orphans: [...], testOnly: [...]}).
// - Accepts = baseline ∪ {typeOnlyReachable files} ∪ {files with `// @orphan-by-design:` or `// @test-only-by-design:` tag}.
// - New orphans = current orphans − accepted.
// - New test-only = current test-only source modules − accepted.
// - Reports per mode: off (count only), warn (list + exit 0), enforce (list + exit 1).
//
// cwd-portable: call from the directory you want to scan (e.g. maya-core/ or builder/).
// Scanner path comes from .orphan-scan.json "scannerPath" (default: scripts/orphan-scan.cjs).
//
// This is the disciplined version: NO dashboard, NO CI service, NO deploy webhooks,
// NO cross-repo orchestration. err-arch-001 forbids the wire-guardian platform.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// cwd is the scan root (maya-core/ or builder/).
const SCAN_ROOT = process.cwd();
const CONFIG_PATH = path.join(SCAN_ROOT, '.orphan-scan.json');
const BASELINE_PATH = path.join(SCAN_ROOT, '.orphan-baseline.json');

// Regex for test/spec files — these are NOT subjects of the gate.
const TEST_FILE_REGEX = /\.(test|spec)\.[cm]?[jt]sx?$/;

function readJsonIfExists(p) {
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function loadConfig() {
  return readJsonIfExists(CONFIG_PATH) || {};
}

function loadBaseline() {
  const raw = readJsonIfExists(BASELINE_PATH);
  if (!raw) return null;
  // Backwards-compatible: must have at least `orphans` array; `testOnly` is optional.
  if (!Array.isArray(raw.orphans)) return null;
  return {
    orphans: new Set(raw.orphans),
    testOnly: Array.isArray(raw.testOnly) ? new Set(raw.testOnly) : null
  };
}

function writeBaselineFromCurrent(currentOrphans, currentTestOnly) {
  const data = {
    orphans: currentOrphans.slice().sort(),
    testOnly: currentTestOnly.slice().sort(),
    generatedFrom: 'first-run-auto-generated',
    generatedAt: new Date().toISOString()
  };
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  process.stderr.write(
    `[orphan-gate] No baseline found. Wrote ${currentOrphans.length} orphans + ` +
    `${currentTestOnly.length} test-only to ${path.relative(SCAN_ROOT, BASELINE_PATH)} ` +
    `(non-blocking, first run).\n`
  );
}

// Read source file and check for the design-tag (in the first 30 lines).
// Accepts both `// @orphan-by-design:` and `// @test-only-by-design:`.
function hasDesignTag(filePathAbs) {
  try {
    const content = fs.readFileSync(filePathAbs, 'utf8');
    const lines = content.split('\n').slice(0, 30);
    return lines.some((line) =>
      /\/\/\s*@orphan-by-design\s*:/.test(line) ||
      /\/\/\s*@test-only-by-design\s*:/.test(line)
    );
  } catch {
    return false;
  }
}

function resolveScannerPath(config) {
  const rel = config.scannerPath || 'scripts/orphan-scan.cjs';
  return path.resolve(SCAN_ROOT, rel);
}

function runScanner(scannerPath) {
  // Set NODE_PATH to include the scan root's node_modules, so the scanner
  // can find its 'typescript' dependency without requiring the caller to
  // set NODE_PATH manually. This makes the gate self-contained.
  const existingNodePath = process.env.NODE_PATH || '';
  const localNodeModules = path.join(SCAN_ROOT, 'node_modules');
  const newNodePath = existingNodePath
    ? `${localNodeModules}:${existingNodePath}`
    : localNodeModules;
  const out = execSync(`node "${scannerPath}" . --json`, {
    cwd: SCAN_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, NODE_PATH: newNodePath }
  });
  return JSON.parse(out);
}

function isTestFile(relPath) {
  return TEST_FILE_REGEX.test(relPath);
}

function main() {
  // Determine mode: CLI flag overrides config; config default "warn".
  const args = process.argv.slice(2);
  let modeArg = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode') {
      modeArg = args[++i];
    }
  }
  const config = loadConfig();
  const mode = modeArg || config.gate || 'warn';
  if (!['off', 'warn', 'enforce'].includes(mode)) {
    process.stderr.write(`[orphan-gate] Invalid mode: ${mode}. Expected off|warn|enforce.\n`);
    process.exit(2);
  }

  // Resolve scanner path from config.
  const scannerPath = resolveScannerPath(config);
  if (!fs.existsSync(scannerPath)) {
    process.stderr.write(`[orphan-gate] Scanner not found at: ${scannerPath}\n`);
    process.stderr.write(`[orphan-gate] Set "scannerPath" in .orphan-scan.json (relative to cwd).\n`);
    process.exit(2);
  }

  // Run scanner.
  let scanResult;
  try {
    scanResult = runScanner(scannerPath);
  } catch (e) {
    process.stderr.write(`[orphan-gate] Scanner failed: ${e.message}\n`);
    process.exit(2);
  }

  const currentOrphans = scanResult.results?.orphan || [];
  const currentOrphanFiles = currentOrphans.map((x) => x.file);

  // test-only SOURCE modules only (exclude test files themselves).
  const currentTestOnlyRaw = scanResult.results?.['test-only'] || [];
  const currentTestOnlySource = currentTestOnlyRaw
    .filter((x) => !isTestFile(x.file))
    .map((x) => x.file);
  const currentTestOnlyFiles = currentTestOnlySource;

  // First-run: if no baseline, generate it from current and exit 0.
  let baseline = loadBaseline();
  if (!baseline) {
    writeBaselineFromCurrent(currentOrphanFiles, currentTestOnlyFiles);
    process.stdout.write(
      `[orphan-gate] First run — baseline written with ${currentOrphanFiles.length} orphans + ` +
      `${currentTestOnlyFiles.length} test-only. No new-violations check.\n`
    );
    process.exit(0);
  }

  // Defensive: if baseline has no testOnly, SKIP the test-only check (don't fire 200 alarms).
  const skipTestOnlyCheck = baseline.testOnly === null;
  if (skipTestOnlyCheck) {
    process.stderr.write(
      `[orphan-gate] Baseline has no "testOnly" list — skipping test-only check. ` +
      `Please regenerate baseline to enable test-only guarding.\n`
    );
  }

  // Build accepted sets for orphans.
  const acceptedOrphans = new Set(baseline.orphans);
  for (const x of currentOrphans) {
    if (x.typeOnlyReachable === true) {
      acceptedOrphans.add(x.file);
    }
    const abs = path.join(SCAN_ROOT, x.file);
    if (hasDesignTag(abs)) {
      acceptedOrphans.add(x.file);
    }
  }

  // Build accepted sets for test-only (only if baseline has testOnly).
  const acceptedTestOnly = new Set(baseline.testOnly || []);
  if (!skipTestOnlyCheck) {
    for (const x of currentTestOnlyRaw) {
      if (isTestFile(x.file)) continue; // test files are not subjects
      if (x.typeOnlyReachable === true) {
        acceptedTestOnly.add(x.file);
      }
      const abs = path.join(SCAN_ROOT, x.file);
      if (hasDesignTag(abs)) {
        acceptedTestOnly.add(x.file);
      }
    }
  }

  // New orphans = current − accepted.
  const newOrphans = currentOrphanFiles.filter((f) => !acceptedOrphans.has(f));

  // New test-only = current source − accepted.
  const newTestOnly = skipTestOnlyCheck
    ? []
    : currentTestOnlyFiles.filter((f) => !acceptedTestOnly.has(f));

  const totalNew = newOrphans.length + newTestOnly.length;

  // Report.
  if (mode === 'off') {
    process.stdout.write(
      `[orphan-gate] mode=off, current orphans=${currentOrphanFiles.length}, ` +
      `current test-only=${currentTestOnlyFiles.length}, ` +
      `new orphans=${newOrphans.length}, new test-only=${newTestOnly.length}\n`
    );
    process.exit(0);
  }

  if (totalNew === 0) {
    process.stdout.write(
      `[orphan-gate] OK — 0 new orphans, 0 new test-only ` +
      `(current orphans=${currentOrphanFiles.length}, test-only=${currentTestOnlyFiles.length}).\n`
    );
    process.exit(0);
  }

  // New violations found.
  if (newOrphans.length > 0) {
    process.stdout.write(`[orphan-gate] ${newOrphans.length} neue, an nichts angeschlossene Dateien gefunden:\n`);
    for (const f of newOrphans) {
      process.stdout.write(`  - ${f}\n`);
    }
    process.stdout.write(
      `\nJede muss entweder verdrahtet werden (von Live-Code benutzt) oder bewusst mit ` +
      `\`// @orphan-by-design: <Grund>\` markiert werden (in den ersten 30 Zeilen der Datei).\n`
    );
  }

  if (newTestOnly.length > 0) {
    process.stdout.write(`\n[orphan-gate] ${newTestOnly.length} neue getestet-aber-unverdrahtete Module (test-only) gefunden:\n`);
    for (const f of newTestOnly) {
      process.stdout.write(`  - ${f}\n`);
    }
    process.stdout.write(
      `\nJedes muss entweder verdrahtet werden (von Live-Code benutzt) oder bewusst mit ` +
      `\`// @test-only-by-design: <Grund>\` (oder \`// @orphan-by-design: <Grund>\`) ` +
      `markiert werden (in den ersten 30 Zeilen der Datei).\n`
    );
  }

  if (mode === 'enforce') {
    process.stdout.write(`\n[orphan-gate] mode=enforce → block (exit 1).\n`);
    process.exit(1);
  }
  // warn
  process.stdout.write(`\n[orphan-gate] mode=warn → nicht blockiert (exit 0).\n`);
  process.exit(0);
}

main();
