#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.join(REPO_ROOT, 'builder', 'src');
const TEST_ROOT = path.join(REPO_ROOT, 'builder', 'tests');
const REPORT_PATH = path.join(REPO_ROOT, 'docs', 'ORPHAN-CENSUS-v0.1.md');
const USAGE = [
  'Usage: node tools/orphan-scan.cjs [--check|--write]',
  '',
  '  --check  Compute census in memory and compare docs/ORPHAN-CENSUS-v0.1.md without writing.',
  '  --write  Regenerate docs/ORPHAN-CENSUS-v0.1.md.',
  '',
  'Default with no arguments is --check.',
].join('\n');

const LIVE_ROOT = 'builder/src/server.ts';
const ORCHESTRATOR_DIAGNOSTIC_ROOT = 'builder/src/opusTaskOrchestrator.ts';
const SUMMARY_STATES = [
  'runtime_value_connected',
  'non_live_value_referenced',
  'type_only_referenced',
  'test_only_referenced',
  'unreferenced',
];
const CLASSIFICATIONS = ['CONNECT', 'COLLAPSE', 'ARCHIVE', 'KEEP_STAGED'];
const KEY_CONNECT_MODULES = new Set([
  'builder/src/cardConditionedDispatch.ts',
  'builder/src/workerPacketWlpAdapter.ts',
  'builder/src/preRegisteredClaims.ts',
]);

function normalizeRepoPath(filePath) {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
}

function toAbsoluteRepoPath(repoPath) {
  return path.join(REPO_ROOT, repoPath.replace(/\//g, path.sep));
}

function walkTsFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkTsFiles(fullPath));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.ts')) continue;
    if (entry.name.endsWith('.d.ts')) continue;
    files.push(fullPath);
  }
  return files.sort((left, right) => normalizeRepoPath(left).localeCompare(normalizeRepoPath(right)));
}

function isNonTestModule(filePath) {
  const basename = path.basename(filePath);
  return !basename.includes('.test.') && !basename.includes('.spec.');
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
}

function stripImportStatements(source) {
  return source
    .replace(/\bimport\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*;?/g, ' ')
    .replace(/\bimport\s+['"][^'"]+['"]\s*;?/g, ' ');
}

function splitCommaAware(text) {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function localNameFromSpecifier(specifier) {
  const cleaned = specifier.trim().replace(/^type\s+/, '').trim();
  const alias = cleaned.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
  if (alias) return alias[1];
  const name = cleaned.match(/^([A-Za-z_$][\w$]*)$/);
  return name ? name[1] : null;
}

function parseImportClause(clause, importKind) {
  const result = { valueBindings: [], typeBindings: [], sideEffectOnly: false };
  let remaining = clause.trim();
  if (!remaining) {
    result.sideEffectOnly = true;
    return result;
  }

  if (importKind === 'type' || remaining.startsWith('type ')) {
    remaining = remaining.replace(/^type\s+/, '').trim();
    const named = remaining.match(/^\{([\s\S]*)\}$/);
    if (named) {
      result.typeBindings.push(...splitCommaAware(named[1]).map(localNameFromSpecifier).filter(Boolean));
    } else {
      const name = localNameFromSpecifier(remaining);
      if (name) result.typeBindings.push(name);
    }
    return result;
  }

  const namedMatch = remaining.match(/\{([\s\S]*)\}/);
  const namedBlock = namedMatch ? namedMatch[1] : '';
  const beforeNamed = namedMatch ? remaining.slice(0, namedMatch.index).replace(/,\s*$/, '').trim() : remaining;

  if (beforeNamed.startsWith('* as ')) {
    const namespaceName = beforeNamed.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (namespaceName) result.valueBindings.push(namespaceName[1]);
  } else if (beforeNamed && !beforeNamed.includes('{')) {
    const defaultName = localNameFromSpecifier(beforeNamed.replace(/,$/, ''));
    if (defaultName) result.valueBindings.push(defaultName);
  }

  if (namedBlock) {
    for (const rawPart of splitCommaAware(namedBlock)) {
      const isType = rawPart.startsWith('type ');
      const localName = localNameFromSpecifier(rawPart);
      if (!localName) continue;
      if (isType) {
        result.typeBindings.push(localName);
      } else {
        result.valueBindings.push(localName);
      }
    }
  }

  return result;
}

function collectImportRecords(source) {
  const records = [];
  const importFromRe = /\bimport\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]\s*;?/g;
  let match;
  while ((match = importFromRe.exec(source)) !== null) {
    const parsed = parseImportClause(match[2], match[1] ? 'type' : 'value');
    records.push({
      specifier: match[3],
      valueBindings: parsed.valueBindings,
      typeBindings: parsed.typeBindings,
      sideEffectOnly: parsed.sideEffectOnly,
    });
  }

  const sideEffectRe = /\bimport\s+['"]([^'"]+)['"]\s*;?/g;
  while ((match = sideEffectRe.exec(source)) !== null) {
    records.push({
      specifier: match[1],
      valueBindings: [],
      typeBindings: [],
      sideEffectOnly: true,
    });
  }

  return records;
}

function bindingUsed(sourceWithoutImports, bindingName) {
  const escaped = bindingName.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(sourceWithoutImports);
}

function resolveLocalModule(importerRepoPath, specifier, moduleSet) {
  if (!specifier.startsWith('.')) return null;
  const importerAbs = toAbsoluteRepoPath(importerRepoPath);
  const baseAbs = path.resolve(path.dirname(importerAbs), specifier);
  const candidates = [
    baseAbs,
    baseAbs.replace(/\.(js|mjs|cjs|jsx|tsx)$/, '.ts'),
    `${baseAbs}.ts`,
    path.join(baseAbs, 'index.ts'),
  ].map((candidate) => normalizeRepoPath(candidate));
  return candidates.find((candidate) => moduleSet.has(candidate)) ?? null;
}

function addUnique(map, key, value) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(value);
}

function analyzeImports(files, moduleSet, importerKind) {
  const usedValueImporters = new Map();
  const unusedValueImporters = new Map();
  const typeImporters = new Map();
  const testImporters = new Map();
  const usedValueEdges = new Map();

  for (const filePath of files) {
    const importer = normalizeRepoPath(filePath);
    const source = fs.readFileSync(filePath, 'utf8');
    const body = stripImportStatements(stripComments(source));
    const imports = collectImportRecords(source);

    for (const importRecord of imports) {
      const target = resolveLocalModule(importer, importRecord.specifier, moduleSet);
      if (!target) continue;

      if (importerKind === 'test') {
        addUnique(testImporters, target, importer);
        continue;
      }

      const usedValueBindings = importRecord.valueBindings.filter((binding) => bindingUsed(body, binding));
      const hasValueImport = importRecord.valueBindings.length > 0 || importRecord.sideEffectOnly;
      if (importRecord.typeBindings.length > 0) {
        addUnique(typeImporters, target, importer);
      }
      if (hasValueImport && usedValueBindings.length > 0) {
        addUnique(usedValueImporters, target, importer);
        addUnique(usedValueEdges, importer, target);
      } else if (hasValueImport) {
        addUnique(unusedValueImporters, target, importer);
      }
    }
  }

  return { usedValueImporters, unusedValueImporters, typeImporters, testImporters, usedValueEdges };
}

function setToSortedArray(value) {
  return [...(value ?? new Set())].sort();
}

function computeReachable(root, edges, moduleSet) {
  if (!moduleSet.has(root)) return new Set();
  const seen = new Set([root]);
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const next of setToSortedArray(edges.get(current))) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

function deriveSummaryState(moduleRecord) {
  if (moduleRecord.serverReachable) return 'runtime_value_connected';
  if (moduleRecord.usedValueImporters.length > 0 || moduleRecord.unusedValueImporters.length > 0) {
    return 'non_live_value_referenced';
  }
  if (moduleRecord.typeImporters.length > 0) return 'type_only_referenced';
  if (moduleRecord.testImporters.length > 0) return 'test_only_referenced';
  return 'unreferenced';
}

function repetitiveGovernanceName(modulePath) {
  const basename = path.basename(modulePath, '.ts');
  const markers = ['Permit', 'Consume', 'Execution', 'Receipt', 'Record', 'Audit', 'Authority', 'Preflight'];
  return markers.filter((marker) => basename.includes(marker)).length >= 5;
}

function classifyFamily(modulePath) {
  const lower = path.basename(modulePath, '.ts').toLowerCase();
  if (lower.includes('cockpit') || lower.includes('operator') || lower.includes('dashboard')) return 'cockpit';
  if (lower.includes('aicos') || lower.includes('memory') || lower.includes('cache')) return 'memory';
  if (lower.includes('release') || lower.includes('branch') || lower.includes('receipt') || lower.includes('governance') || lower.includes('pr')) return 'release';
  if (lower.includes('runtime') || lower.includes('activation') || lower.includes('provider') || lower.includes('write') || lower.includes('permit') || lower.includes('sandbox')) return 'runtime';
  if (lower.includes('opus') || lower.includes('builder') || lower.includes('architect') || lower.includes('judge') || lower.includes('scope')) return 'opus';
  return 'other';
}

function classifyModule(moduleRecord) {
  if (moduleRecord.summaryState === 'runtime_value_connected') {
    return { classification: null, rationale: 'Already reachable from the single live root.' };
  }
  if (KEY_CONNECT_MODULES.has(moduleRecord.module)) {
    return {
      classification: 'CONNECT',
      rationale: 'Key dispatch chain module named in WIRE-CENSUS-001; schedule for explicit consumer wiring.',
    };
  }
  if (moduleRecord.summaryState === 'non_live_value_referenced' || moduleRecord.orchestratorReachable) {
    return {
      classification: 'CONNECT',
      rationale: 'Has a value reference outside the live server path; next slice should decide and wire the real consumer.',
    };
  }
  if (repetitiveGovernanceName(moduleRecord.module)) {
    return {
      classification: 'COLLAPSE',
      rationale: 'Unconnected generated governance chain shape; review for consolidation before wiring more surface area.',
    };
  }
  if (moduleRecord.summaryState === 'type_only_referenced') {
    return {
      classification: 'KEEP_STAGED',
      rationale: 'Only type-referenced; keep staged until a runtime or dry-run consumer is explicitly planned.',
    };
  }
  if (moduleRecord.summaryState === 'test_only_referenced') {
    return {
      classification: 'KEEP_STAGED',
      rationale: 'Only covered by tests; keep staged until product routing or archival is decided.',
    };
  }
  return {
    classification: 'ARCHIVE',
    rationale: 'No measured runtime, value, type or test consumer; archive unless a future task supplies a consumer.',
  };
}

function buildConnectivityGraph() {
  const sourceFiles = walkTsFiles(SRC_ROOT).filter(isNonTestModule);
  const testFiles = walkTsFiles(TEST_ROOT);
  const modules = sourceFiles.map(normalizeRepoPath);
  const moduleSet = new Set(modules);
  const srcAnalysis = analyzeImports(sourceFiles, moduleSet, 'src');
  const testAnalysis = analyzeImports(testFiles, moduleSet, 'test');

  for (const [target, importers] of testAnalysis.testImporters.entries()) {
    for (const importer of importers) addUnique(srcAnalysis.testImporters, target, importer);
  }

  return {
    modules,
    moduleSet,
    edges: srcAnalysis.usedValueEdges,
    usedValueImporters: srcAnalysis.usedValueImporters,
    unusedValueImporters: srcAnalysis.unusedValueImporters,
    typeImporters: srcAnalysis.typeImporters,
    testImporters: srcAnalysis.testImporters,
  };
}

function countBy(items, getKey, keys) {
  const counts = Object.fromEntries((keys ?? []).map((key) => [key, 0]));
  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function scanOrphans() {
  const graph = buildConnectivityGraph();
  const serverReachable = computeReachable(LIVE_ROOT, graph.edges, graph.moduleSet);
  const orchestratorReachable = computeReachable(ORCHESTRATOR_DIAGNOSTIC_ROOT, graph.edges, graph.moduleSet);

  const modules = graph.modules.map((modulePath) => {
    const record = {
      module: modulePath,
      serverReachable: serverReachable.has(modulePath),
      orchestratorReachable: orchestratorReachable.has(modulePath),
      usedValueImporters: setToSortedArray(graph.usedValueImporters.get(modulePath)),
      unusedValueImporters: setToSortedArray(graph.unusedValueImporters.get(modulePath)),
      typeImporters: setToSortedArray(graph.typeImporters.get(modulePath)),
      testImporters: setToSortedArray(graph.testImporters.get(modulePath)),
      family: classifyFamily(modulePath),
    };
    record.summaryState = deriveSummaryState(record);
    const triage = classifyModule(record);
    record.classification = triage.classification;
    record.rationale = triage.rationale;
    return record;
  });

  const nonLiveModules = modules.filter((moduleRecord) => moduleRecord.summaryState !== 'runtime_value_connected');
  const summaryTotals = countBy(modules, (moduleRecord) => moduleRecord.summaryState, SUMMARY_STATES);
  const classificationTotals = countBy(
    nonLiveModules,
    (moduleRecord) => moduleRecord.classification,
    CLASSIFICATIONS,
  );
  const familyTotals = countBy(modules, (moduleRecord) => moduleRecord.family, [
    'cockpit',
    'runtime',
    'memory',
    'release',
    'opus',
    'other',
  ]);
  const orchestratorOnlyCount = modules.filter(
    (moduleRecord) => moduleRecord.orchestratorReachable && !moduleRecord.serverReachable,
  ).length;

  return {
    liveRoot: LIVE_ROOT,
    orchestratorDiagnosticRoot: ORCHESTRATOR_DIAGNOSTIC_ROOT,
    modules,
    nonLiveModules,
    totals: {
      modules: modules.length,
      nonLive: nonLiveModules.length,
      summaryStates: summaryTotals,
      classifications: classificationTotals,
      families: familyTotals,
      orchestratorReachableNotServerReachable: orchestratorOnlyCount,
    },
  };
}

function shortList(values) {
  if (values.length === 0) return '-';
  const shown = values.slice(0, 4).map((value) => `\`${value.replace(/^builder\/(src|tests)\//, '')}\``);
  return values.length > shown.length ? `${shown.join(', ')} +${values.length - shown.length}` : shown.join(', ');
}

function markdownCountRows(counts) {
  return Object.keys(counts)
    .sort()
    .map((key) => `| ${key} | ${counts[key]} |`)
    .join('\n');
}

function moduleRow(moduleRecord) {
  return [
    `\`${moduleRecord.module}\``,
    moduleRecord.summaryState,
    moduleRecord.serverReachable ? 'yes' : 'no',
    moduleRecord.orchestratorReachable ? 'yes' : 'no',
    shortList(moduleRecord.usedValueImporters),
    shortList(moduleRecord.unusedValueImporters),
    shortList(moduleRecord.typeImporters),
    shortList(moduleRecord.testImporters),
    moduleRecord.classification,
    moduleRecord.rationale,
  ].join(' | ');
}

function renderReport(scan) {
  const keyModules = ['builder/src/cardConditionedDispatch.ts', 'builder/src/workerPacketWlpAdapter.ts', 'builder/src/preRegisteredClaims.ts']
    .map((modulePath) => scan.modules.find((moduleRecord) => moduleRecord.module === modulePath))
    .filter(Boolean);

  return `# ORPHAN-CENSUS v0.1

Generated by \`node tools/orphan-scan.cjs --write\`; introduced for \`WIRE-CENSUS-001\`.

## Rules

- Single live root: \`${scan.liveRoot}\`.
- Diagnostic-only orchestrator root: \`${scan.orchestratorDiagnosticRoot}\`.
- \`runtime_value_connected\` means transitive reachability from \`server.ts\` through used value imports.
- Type-only, test-only, unused value imports and side-effect-only imports do not create live reachability.
- This report classifies non-live modules only; it does not wire, archive, move or delete anything.

## Totals

| Metric | Count |
|---|---:|
| Scanned builder/src modules | ${scan.totals.modules} |
| Non-live modules | ${scan.totals.nonLive} |
| Orchestrator-reachable but not server-reachable | ${scan.totals.orchestratorReachableNotServerReachable} |

### Summary States

| State | Count |
|---|---:|
${markdownCountRows(scan.totals.summaryStates)}

### Classifications

| Classification | Count |
|---|---:|
${markdownCountRows(scan.totals.classifications)}

### Families

| Family | Count |
|---|---:|
${markdownCountRows(scan.totals.families)}

## Key Dispatch Chain

| Module | State | serverReachable | orchestratorReachable | Used value importers | Unused value importers | Type importers | Test importers | Classification | Rationale |
|---|---|---|---|---|---|---|---|---|---|
${keyModules.map(moduleRow).join('\n')}

## Non-Live Module Triage

| Module | State | serverReachable | orchestratorReachable | Used value importers | Unused value importers | Type importers | Test importers | Classification | Rationale |
|---|---|---|---|---|---|---|---|---|---|
${scan.nonLiveModules.map(moduleRow).join('\n')}

## Residual Blind Spots

- Import usage is a deterministic heuristic, not a TypeScript compiler graph.
- Re-exports and dynamic dispatch are not promoted to live reachability by this scanner.
- \`KEEP_STAGED\` is provisional triage, not acceptance. A later slice must attach a concrete
  consumer/follow-up block or reclassify the module as \`COLLAPSE\` or \`ARCHIVE\`.
- WIRE-GATE-001 should reuse \`scanOrphans()\` and keep this conservative root model.
`;
}

function normalizeReportText(value) {
  return value.replace(/\r\n/g, '\n');
}

function getRenderedReport() {
  const scan = scanOrphans();
  return {
    scan,
    report: renderReport(scan),
  };
}

function printScanSummary(scan) {
  process.stdout.write(`orphan-scan: ${scan.totals.modules} modules scanned\n`);
  process.stdout.write(`orphan-scan: ${scan.totals.nonLive} non-live modules\n`);
  process.stdout.write(`orphan-scan: ${scan.totals.orchestratorReachableNotServerReachable} orchestratorReachable but not serverReachable\n`);
}

function writeReport() {
  const { scan, report } = getRenderedReport();
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  printScanSummary(scan);
  process.stdout.write(`orphan-scan: wrote ${normalizeRepoPath(REPORT_PATH)}\n`);
}

function checkReport() {
  const { scan, report } = getRenderedReport();
  printScanSummary(scan);

  if (!fs.existsSync(REPORT_PATH)) {
    process.stderr.write(`orphan-scan: report missing: ${normalizeRepoPath(REPORT_PATH)}\n`);
    process.stderr.write('orphan-scan: run node tools/orphan-scan.cjs --write\n');
    return 1;
  }

  const currentReport = fs.readFileSync(REPORT_PATH, 'utf8');
  if (normalizeReportText(currentReport) !== normalizeReportText(report)) {
    process.stderr.write(`orphan-scan: report stale: ${normalizeRepoPath(REPORT_PATH)}\n`);
    process.stderr.write('orphan-scan: run node tools/orphan-scan.cjs --write\n');
    return 1;
  }

  process.stdout.write(`orphan-scan: report current ${normalizeRepoPath(REPORT_PATH)}\n`);
  return 0;
}

function main() {
  const mode = process.argv[2] ?? '--check';
  if (process.argv.length > 3 || (mode !== '--check' && mode !== '--write')) {
    process.stderr.write(`${USAGE}\n`);
    process.exit(1);
  }

  if (mode === '--write') {
    writeReport();
    return;
  }

  process.exit(checkReport());
}

if (require.main === module) {
  main();
}

module.exports = {
  LIVE_ROOT,
  ORCHESTRATOR_DIAGNOSTIC_ROOT,
  buildConnectivityGraph,
  checkReport,
  classifyModule,
  deriveSummaryState,
  renderReport,
  scanOrphans,
  writeReport,
};
