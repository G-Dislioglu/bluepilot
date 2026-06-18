// Usage: node orphan-scan.cjs <repo-root> [--config <path>]
// Reines Node.js; nutzt das npm-Paket "typescript" für AST-Parsing. Kein Netzwerk, keine Schreibzugriffe auf das gescannte Repo.
// Ausgabe: JSON nach stdout.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
let ts = null;
try {
  ts = require('typescript');
} catch (e) {
  process.stderr.write('ERROR: npm package "typescript" is required. Install it in the directory you run this from.\n');
  process.exit(2);
}

// ---------- helpers ----------

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function normalizeAbs(p) {
  return toPosix(path.resolve(p));
}

function readJsonIfExists(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Simple glob -> RegExp. Supports * (no slash) and ** (any).
function globToRegex(glob) {
  let s = glob;
  // Escape regex metachars except * and ?
  s = s.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  // ** -> match anything including /
  s = s.replace(/\*\*/g, '\u0000DOUBLESTAR\u0000');
  // * -> match anything except /
  s = s.replace(/\*/g, '[^/]*');
  s = s.replace(/\u0000DOUBLESTAR\u0000/g, '.*');
  // ? -> single char except /
  s = s.replace(/\?/g, '[^/]');
  return new RegExp('^' + s + '$');
}

function matchesAnyGlob(relPosixPath, globList) {
  for (const g of globList) {
    const re = globToRegex(g);
    if (re.test(relPosixPath)) return true;
  }
  return false;
}

function resolveTsConfig(repoRoot) {
  const tsconfigPath = path.join(repoRoot, 'tsconfig.json');
  const raw = readJsonIfExists(tsconfigPath);
  if (!raw) return { baseUrl: null, paths: null };
  let cfg = raw;
  if (raw.extends) {
    const extPath = path.isAbsolute(raw.extends)
      ? raw.extends
      : path.join(repoRoot, raw.extends);
    const extRaw = readJsonIfExists(extPath);
    if (extRaw && extRaw.compilerOptions) {
      cfg = {
        ...extRaw,
        compilerOptions: { ...extRaw.compilerOptions, ...(raw.compilerOptions || {}) },
      };
    }
  }
  const co = cfg.compilerOptions || {};
  const baseUrl = co.baseUrl ? path.resolve(repoRoot, co.baseUrl) : repoRoot;
  const paths = co.paths || null;
  return { baseUrl, paths };
}

function isSourceFile(name) {
  return /\.(t|j)sx?$/.test(name);
}

function isTestFile(relPath) {
  return /(^|\/)__tests__\//.test(relPath) || /\.test\./.test(relPath) || /\.spec\./.test(relPath);
}

function isScriptFile(relPath) {
  return /^scripts\//.test(relPath);
}

// Default Next.js App-Router special files (used by "next-app" profile auto-derivation).
// Matches files directly under app/ or any app/<segment>/.../specialfile.tsx
const NEXT_APP_SPECIAL_FILES = [
  'loading.tsx',
  'error.tsx',
  'not-found.tsx',
  'template.tsx',
  'default.tsx',
  'global-error.tsx',
  'sitemap.ts', 'sitemap.tsx',
  'robots.ts', 'robots.tsx',
  'manifest.ts', 'manifest.tsx',
  'icon.tsx',
  'apple-icon.tsx',
  'opengraph-image.tsx',
  'twitter-image.tsx',
];

const NEXT_APP_BASE_LIVE = [
  // route/page/layout handled by regex (allow .ts/.tsx variants where Next allows)
  { kind: 'route', regex: /^app\/(.*\/)?route\.tsx?$/ },
  { kind: 'page', regex: /^app\/(.*\/)?page\.tsx$/ },
  { kind: 'layout', regex: /^app\/(.*\/)?layout\.tsx$/ },
];

function isNextAppLiveRoot(rel) {
  if (rel === 'middleware.ts') return true;
  if (rel === 'instrumentation.ts') return true;
  for (const b of NEXT_APP_BASE_LIVE) {
    if (b.regex.test(rel)) return true;
  }
  // Special files: match by basename under app/
  if (rel.startsWith('app/')) {
    const base = rel.split('/').pop();
    if (NEXT_APP_SPECIAL_FILES.includes(base)) return true;
  }
  return false;
}

// Collect all source files under repoRoot, excluding well-known non-source dirs and optional excludePaths.
function collectSourceFiles(repoRoot, scanPaths, excludePaths) {
  const results = [];
  const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', '.turbo', 'out']);
  function walk(dir, relPrefix) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = relPrefix ? (relPrefix + '/' + e.name) : e.name;
      const relPosix = toPosix(rel);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(full, rel);
      } else if (e.isFile() && isSourceFile(e.name)) {
        // Apply scanPaths/excludePaths (both globs against posix rel path)
        if (excludePaths && excludePaths.length > 0 && matchesAnyGlob(relPosix, excludePaths)) continue;
        if (scanPaths && scanPaths.length > 0 && !matchesAnyGlob(relPosix, scanPaths)) continue;
        results.push({ abs: full, rel: relPosix });
      }
    }
  }
  walk(repoRoot, '');
  return results;
}

// ---------- In-memory file set for resolution (no fs probing in hot path) ----------

function buildFileSet(files) {
  const set = new Set();
  for (const f of files) set.add(normalizeAbs(f.abs));
  return set;
}

// Build a map from "directory" -> Set of basenames present, for index.* resolution
// We don't strictly need it because resolveFileWithExtInSet checks candidate + ext + index.
// F1: JS specifier -> TS source mapping.
// Node-ESM TypeScript projects commonly write imports as './x.js' while the source is 'x.ts'.
// Resolution order: exact match first (a real .js file wins), then TS-rewrite candidates.
const JS_TO_TS_MAP = {
  '.js':  ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts', '.ts'],
  '.cjs': ['.cts', '.ts'],
};

function resolveFileWithExtInSet(candidate, fileSet) {
  // candidate is an absolute path WITHOUT extension, or WITH one already.
  const candNorm = normalizeAbs(candidate);

  // If candidate already ends with a known source/script extension, check exact first.
  if (/\.(t|j)sx?$/.test(candNorm) || /\.m(t|j)s$/.test(candNorm) || /\.c(t|j)s$/.test(candNorm)) {
    if (fileSet.has(candNorm)) return candNorm;
    // F1: if it ends with .js/.jsx/.mjs/.cjs and no exact match, try TS-rewrite candidates.
    const m = candNorm.match(/(\.(?:js|jsx|mjs|cjs))$/);
    if (m) {
      const ext = m[1];
      const baseNoExt = candNorm.slice(0, -ext.length);
      const tsCandidates = JS_TO_TS_MAP[ext] || [];
      for (const tsExt of tsCandidates) {
        const p = baseNoExt + tsExt;
        if (fileSet.has(p)) return p;
      }
    }
    return null;
  }

  // No extension: try common extensions.
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.d.ts'];
  for (const ext of exts) {
    const p = candNorm + ext;
    if (fileSet.has(p)) return p;
  }
  // index.* under the candidate directory
  for (const ext of exts) {
    const p = candNorm + '/index' + ext;
    if (fileSet.has(p)) return p;
  }
  return null;
}

// ---------- alias + relative resolution (memoized, no fs probing) ----------

function makeResolver(tsConfig, fileSet) {
  const { baseUrl, paths } = tsConfig;
  const cache = new Map(); // key: importerDir + '\0' + spec -> resolved abs or null

  function resolve(spec, importerAbs) {
    const importerDir = normalizeAbs(importerAbs).split('/').slice(0, -1).join('/');
    const cacheKey = importerDir + '\0' + spec;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    let result = null;

    if (paths) {
      for (const alias of Object.keys(paths)) {
        const m = alias.match(/^(.*)\*$/);
        if (m) {
          const prefix = m[1];
          if (spec.startsWith(prefix)) {
            const rest = spec.slice(prefix.length);
            const targets = paths[alias] || [];
            for (const t of targets) {
              const tm = t.match(/^(.*)\*$/);
              if (tm) {
                const candidate = path.resolve(baseUrl || process.cwd(), tm[1] + rest);
                const resolved = resolveFileWithExtInSet(candidate, fileSet);
                if (resolved) { result = resolved; break; }
              } else {
                const candidate = path.resolve(baseUrl || process.cwd(), t);
                const resolved = resolveFileWithExtInSet(candidate, fileSet);
                if (resolved) { result = resolved; break; }
              }
            }
          }
        } else if (spec === alias) {
          const targets = paths[alias] || [];
          for (const t of targets) {
            const candidate = path.resolve(baseUrl || process.cwd(), t);
            const resolved = resolveFileWithExtInSet(candidate, fileSet);
            if (resolved) { result = resolved; break; }
          }
        }
        if (result) break;
      }
    }

    if (!result && (spec.startsWith('./') || spec.startsWith('../') || spec.startsWith('/'))) {
      const baseDir = spec.startsWith('/')
        ? process.cwd()
        : importerDir;
      const candidate = path.resolve(baseDir, spec);
      result = resolveFileWithExtInSet(candidate, fileSet);
    }

    cache.set(cacheKey, result);
    return result;
  }

  return { resolve };
}

// ---------- AST-based extraction of imports (setParentNodes = false) ----------

function extractImports(absPath) {
  const content = fs.readFileSync(absPath, 'utf8');
  const valueImports = new Set();
  const typeOnlyImports = new Set();
  const dynamicImports = new Set();
  const reexports = new Set();

  // setParentNodes = false (4th arg). The visitor uses only child traversal,
  // never node.parent. This is a measurable parse-time optimization.
  const sourceFile = ts.createSourceFile(
    absPath,
    content,
    ts.ScriptTarget.Latest,
    false, // setParentNodes = false
    absPath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      const spec = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : null;
      if (!spec) { ts.forEachChild(node, visit); return; }
      const isTypeOnlyImport = node.importClause && node.importClause.isTypeOnly === true;
      let hasValueBinding = false;
      if (node.importClause) {
        const ic = node.importClause;
        // If the WHOLE import clause is type-only (`import type {…}` or `import type X` or `import type * as X`),
        // there is no value binding at all, regardless of per-element isTypeOnly flags.
        if (ic.isTypeOnly) {
          hasValueBinding = false;
        } else {
          if (ic.name) {
            hasValueBinding = true;
          }
          if (ic.namedBindings) {
            if (ts.isNamespaceImport(ic.namedBindings)) {
              hasValueBinding = true;
            } else if (ts.isNamedImports(ic.namedBindings)) {
              for (const el of ic.namedBindings.elements) {
                // Per-element `type` qualifier (e.g. `import { type X, Y }`) — only non-type elements count.
                if (el.isTypeOnly) continue;
                hasValueBinding = true;
              }
            }
          }
        }
      }
      if (hasValueBinding) {
        valueImports.add(spec);
      } else {
        typeOnlyImports.add(spec);
      }
      return;
    }
    if (ts.isExportDeclaration(node)) {
      const spec = node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) ? node.moduleSpecifier.text : null;
      if (spec) {
        let isTypeOnlyReexport = false;
        if (node.exportClause) {
          if (ts.isNamedExports(node.exportClause)) {
            const elements = node.exportClause.elements;
            if (elements.length > 0 && elements.every(el => el.isTypeOnly === true)) {
              isTypeOnlyReexport = true;
            }
          }
        }
        if (!isTypeOnlyReexport) {
          reexports.add(spec);
        } else {
          typeOnlyImports.add(spec);
        }
      }
      return;
    }
    if (ts.isCallExpression(node) && node.expression && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments && node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        dynamicImports.add(arg.text);
      }
      return;
    }
    if (ts.isCallExpression(node) && node.expression && ts.isIdentifier(node.expression) && node.expression.text === 'require') {
      const arg = node.arguments && node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        valueImports.add(arg.text);
      }
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { valueImports, typeOnlyImports, dynamicImports, reexports };
}

// ---------- config loading ----------

function loadConfig(repoRoot, configFlag) {
  let cfgPath = null;
  if (configFlag) {
    cfgPath = path.isAbsolute(configFlag) ? configFlag : path.resolve(process.cwd(), configFlag);
  } else {
    const candidate = path.join(repoRoot, '.orphan-scan.json');
    if (fs.existsSync(candidate)) cfgPath = candidate;
  }
  if (!cfgPath) return null;
  return readJsonIfExists(cfgPath);
}

function deriveLiveRoots(repoRoot, config, allFilesRel) {
  // Returns Set<posix rel> of live roots among allFilesRel.
  const liveRoots = new Set();

  const framework = config ? config.framework : 'next-app';
  const explicitGlobs = (config && Array.isArray(config.liveRoots)) ? config.liveRoots : [];

  if (framework === 'next-app') {
    for (const rel of allFilesRel) {
      if (isNextAppLiveRoot(rel)) liveRoots.add(rel);
    }
  } else if (framework === 'node-server') {
    if (explicitGlobs.length === 0) {
      throw new Error('node-server profile requires "liveRoots" globs in config; none provided.');
    }
    for (const rel of allFilesRel) {
      if (matchesAnyGlob(rel, explicitGlobs)) liveRoots.add(rel);
    }
  } else {
    throw new Error('Unknown framework profile: ' + framework + '. Expected "next-app" or "node-server".');
  }

  // Always also honor explicit liveRoots (additive)
  for (const rel of allFilesRel) {
    if (matchesAnyGlob(rel, explicitGlobs)) liveRoots.add(rel);
  }

  return liveRoots;
}

// ---------- main ----------

function main() {
  const args = process.argv.slice(2);
  let repoRoot = null;
  let configFlag = null;
  let jsonFlag = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config') {
      configFlag = args[++i];
    } else if (args[i] === '--json') {
      // Already the default output format; flag is accepted for explicit invocation.
      jsonFlag = true;
    } else if (!repoRoot) {
      repoRoot = args[i];
    }
  }
  if (!repoRoot) {
    process.stderr.write('Usage: node orphan-scan.cjs <repo-root> [--config <path>] [--json]\n');
    process.exit(2);
  }
  void jsonFlag; // acknowledged
  const absRoot = path.resolve(repoRoot);
  if (!fs.existsSync(absRoot) || !fs.statSync(absRoot).isDirectory()) {
    process.stderr.write('ERROR: repo-root does not exist or is not a directory: ' + absRoot + '\n');
    process.exit(2);
  }

  const config = loadConfig(absRoot, configFlag);
  const scanPaths = (config && Array.isArray(config.scanPaths)) ? config.scanPaths : null;
  const excludePaths = (config && Array.isArray(config.excludePaths)) ? config.excludePaths : null;

  const tsConfig = resolveTsConfig(absRoot);
  const collected = collectSourceFiles(absRoot, scanPaths, excludePaths);

  // Build file index by absolute normalized path AND by posix rel
  const fileIndex = new Map(); // absNorm -> { rel, isTest, isScript, isLiveRoot }
  const allFilesRel = [];
  const fileSet = new Set(); // absNorm set, used for resolution
  for (const f of collected) {
    const absNorm = normalizeAbs(f.abs);
    fileIndex.set(absNorm, {
      rel: f.rel,
      isTest: isTestFile(f.rel),
      isScript: isScriptFile(f.rel),
      isLiveRoot: false, // set below
    });
    fileSet.add(absNorm);
    allFilesRel.push(f.rel);
  }

  // Derive live roots
  const liveRootsRel = deriveLiveRoots(absRoot, config, allFilesRel);
  for (const [absNorm, info] of fileIndex.entries()) {
    if (liveRootsRel.has(info.rel)) info.isLiveRoot = true;
  }

  // Build resolver
  const resolver = makeResolver(tsConfig, fileSet);

  // Build graph
  const graph = new Map(); // absNorm -> { valueResolved, typeResolved, dynamicResolved, dynamicSpecs }
  const errors = [];
  for (const [importerAbsNorm, info] of fileIndex.entries()) {
    try {
      const { valueImports, typeOnlyImports, dynamicImports, reexports } = extractImports(importerAbsNorm);
      const entry = {
        valueResolved: new Set(),
        typeResolved: new Set(),
        dynamicResolved: new Set(),
        dynamicSpecs: new Set(),
        reexportResolved: new Set(),
      };
      for (const spec of valueImports) {
        const resolved = resolver.resolve(spec, importerAbsNorm);
        if (resolved && fileIndex.has(resolved)) entry.valueResolved.add(resolved);
      }
      for (const spec of typeOnlyImports) {
        const resolved = resolver.resolve(spec, importerAbsNorm);
        if (resolved && fileIndex.has(resolved)) entry.typeResolved.add(resolved);
      }
      for (const spec of reexports) {
        const resolved = resolver.resolve(spec, importerAbsNorm);
        if (resolved && fileIndex.has(resolved)) entry.reexportResolved.add(resolved);
      }
      for (const spec of dynamicImports) {
        const resolved = resolver.resolve(spec, importerAbsNorm);
        entry.dynamicSpecs.add(spec);
        if (resolved && fileIndex.has(resolved)) entry.dynamicResolved.add(resolved);
      }
      graph.set(importerAbsNorm, entry);
    } catch (e) {
      errors.push({ file: info.rel, error: String(e && e.message || e) });
    }
  }

  // F2: Two BFS fronts.
  //   liveSet      = BFS from liveRoots over STATIC edges (value + reexport) only.
  //   allReachable = BFS from liveRoots over STATIC AND DYNAMIC edges.
  //   dynamicTouched = allReachable minus liveSet  (i.e. reachable only via at least one import() hop)
  const liveSet = new Set();
  const allReachable = new Set();
  const shortestChain = new Map();
  const shortestChainAll = new Map(); // tracks path including dynamic edges for diagnostic

  function getStaticEdges(absNorm) {
    const entry = graph.get(absNorm);
    if (!entry) return [];
    const out = new Set();
    for (const t of entry.valueResolved) out.add(t);
    for (const t of entry.reexportResolved) out.add(t);
    return Array.from(out);
  }
  function getAllEdges(absNorm) {
    const entry = graph.get(absNorm);
    if (!entry) return [];
    const out = new Set();
    for (const t of entry.valueResolved) out.add(t);
    for (const t of entry.reexportResolved) out.add(t);
    for (const t of entry.dynamicResolved) out.add(t);
    return Array.from(out);
  }

  // 1) Static BFS for liveSet
  const queue1 = [];
  for (const [absNorm, info] of fileIndex.entries()) {
    if (info.isLiveRoot) {
      liveSet.add(absNorm);
      shortestChain.set(absNorm, [info.rel]);
      queue1.push(absNorm);
    }
  }
  while (queue1.length > 0) {
    const cur = queue1.shift();
    const curChain = shortestChain.get(cur) || [];
    const edges = getStaticEdges(cur);
    for (const next of edges) {
      if (!liveSet.has(next)) {
        liveSet.add(next);
        shortestChain.set(next, [...curChain, fileIndex.get(next).rel]);
        queue1.push(next);
      } else {
        const existing = shortestChain.get(next) || [];
        const candidate = [...curChain, fileIndex.get(next).rel];
        if (candidate.length < existing.length) {
          shortestChain.set(next, candidate);
        }
      }
    }
  }

  // 2) Combined static+dynamic BFS for allReachable
  const queue2 = [];
  for (const [absNorm, info] of fileIndex.entries()) {
    if (info.isLiveRoot) {
      allReachable.add(absNorm);
      shortestChainAll.set(absNorm, [info.rel]);
      queue2.push(absNorm);
    }
  }
  while (queue2.length > 0) {
    const cur = queue2.shift();
    const curChain = shortestChainAll.get(cur) || [];
    const edges = getAllEdges(cur);
    for (const next of edges) {
      if (!allReachable.has(next)) {
        allReachable.add(next);
        shortestChainAll.set(next, [...curChain, fileIndex.get(next).rel]);
        queue2.push(next);
      } else {
        const existing = shortestChainAll.get(next) || [];
        const candidate = [...curChain, fileIndex.get(next).rel];
        if (candidate.length < existing.length) {
          shortestChainAll.set(next, candidate);
        }
      }
    }
  }

  // dynamicTouched = allReachable minus liveSet
  const dynamicTouched = new Set();
  for (const p of allReachable) {
    if (!liveSet.has(p)) dynamicTouched.add(p);
  }

  // For classification we also need: "direct dynamic-target of a file in allReachable"
  // i.e. files reached via import() directly from an allReachable file.
  const directDynamicTargets = new Set();
  for (const [importerAbsNorm, entry] of graph.entries()) {
    if (!allReachable.has(importerAbsNorm)) continue;
    for (const target of entry.dynamicResolved) {
      directDynamicTargets.add(target);
    }
  }

  // Backwards-compat alias for downstream code (v2 used `liveReachable`).
  // For v3, the live classification uses liveSet; dynamic-only/dynamic-reachable use the new sets.
  const liveReachable = liveSet;

  // Reverse graph for static importers (value + reexport)
  const staticImporters = new Map(); // targetAbsNorm -> Set<importerAbsNorm>
  // Type-only reverse graph
  const typeOnlyImporters = new Map(); // targetAbsNorm -> Set<importerAbsNorm>
  // Dynamic reverse graph (only from live files — used for dynamic-only classification)
  const dynamicImportersFromLive = new Map(); // targetAbsNorm -> Array<{ from: rel, spec }>

  for (const [importerAbsNorm, entry] of graph.entries()) {
    const combined = new Set([...entry.valueResolved, ...entry.reexportResolved]);
    for (const target of combined) {
      if (!staticImporters.has(target)) staticImporters.set(target, new Set());
      staticImporters.get(target).add(importerAbsNorm);
    }
    for (const target of entry.typeResolved) {
      if (!typeOnlyImporters.has(target)) typeOnlyImporters.set(target, new Set());
      typeOnlyImporters.get(target).add(importerAbsNorm);
    }
    // Dynamic edges — recorded from any importer; we will filter to live importers at classification time
    for (const target of entry.dynamicResolved) {
      if (!dynamicImportersFromLive.has(target)) dynamicImportersFromLive.set(target, []);
      dynamicImportersFromLive.get(target).push({
        from: fileIndex.get(importerAbsNorm).rel,
        fromAbs: importerAbsNorm,
        spec: null, // we don't track which spec resolved here; could be added if needed
      });
    }
  }

  // Build subject list: exclude live-roots, tests, scripts, and known config files
  const subjects = [];
  for (const [absNorm, info] of fileIndex.entries()) {
    if (info.isLiveRoot) continue;
    if (info.isTest) continue;
    if (info.isScript) continue;
    if (/^next-env\.d\.ts$/.test(info.rel)) continue;
    if (/^vitest\.config\.ts$/.test(info.rel)) continue;
    if (/^playwright\.config\.ts$/.test(info.rel)) continue;
    if (/^postcss\.config\.m?js$/.test(info.rel)) continue;
    if (/^tailwind\.config\./.test(info.rel)) continue;
    if (/^eslint\.config\./.test(info.rel)) continue;
    subjects.push({ absNorm, info });
  }

  const output = {
    live: [],
    'test-only': [],
    'script-only': [],
    'orphan': [],
    'dynamic-only': [],
    'dynamic-reachable': [],
    uncertain: [],
  };

  for (const { absNorm, info } of subjects) {
    const importerSet = staticImporters.get(absNorm) || new Set();
    const importersArr = Array.from(importerSet).map(p => fileIndex.get(p).rel);

    // F2 classification order (Claude v3 spec):
    //   live: in liveSet
    //   dynamic-only: in dynamicTouched AND direct dynamic-target of a file in allReachable
    //   dynamic-reachable: in dynamicTouched but NOT a direct dynamic-target
    //   test-only / script-only / orphan: only for files OUTSIDE allReachable
    // The previous-v2 "dynamic-only: live file imports this via import()" definition is
    // subsumed: a direct dynamic-target is by construction reachable via import() from an
    // allReachable file (live or dynamic-touched).

    if (liveReachable.has(absNorm)) {
      const chain = shortestChain.get(absNorm) || [];
      output.live.push({
        file: info.rel,
        chain,
        chainLength: chain.length,
        importers: importersArr,
      });
      continue;
    }

    // F2: files inside dynamicTouched are "lazy-live" (not orphan).
    if (dynamicTouched.has(absNorm)) {
      // Is it a direct import() target of an allReachable file?
      const dynamicRefs = (dynamicImportersFromLive.get(absNorm) || [])
        .filter(r => allReachable.has(r.fromAbs));
      if (dynamicRefs.length > 0 && directDynamicTargets.has(absNorm)) {
        output['dynamic-only'].push({
          file: info.rel,
          dynamicReferenced: dynamicRefs.map(r => ({ from: r.from, spec: r.spec })),
          importers: importersArr,
          chainAll: shortestChainAll.get(absNorm) || [],
        });
      } else {
        // Reachable only statically behind a dynamically-imported module.
        output['dynamic-reachable'].push({
          file: info.rel,
          importers: importersArr,
          chainAll: shortestChainAll.get(absNorm) || [],
        });
      }
      continue;
    }

    // Outside allReachable -> fall through to test-only / script-only / orphan.
    if (importerSet.size === 0) {
      const tOnlyImporters = typeOnlyImporters.get(absNorm) || new Set();
      const liveTypeOnlyImporters = Array.from(tOnlyImporters).filter(p => liveReachable.has(p));
      const entry = {
        file: info.rel,
        importers: [],
        confirmedZeroImporters: true,
      };
      if (liveTypeOnlyImporters.length > 0) {
        entry.typeOnlyReachable = true;
        entry.typeOnlyHint = 'compile-needed, not runtime-wired';
        entry.typeOnlyImporters = liveTypeOnlyImporters.map(p => fileIndex.get(p).rel);
      }
      output.orphan.push(entry);
      continue;
    }

    const importerInfos = Array.from(importerSet).map(p => fileIndex.get(p));
    const allTestImporters = importerInfos.length > 0 && importerInfos.every(i => i.isTest);
    const allScriptImporters = importerInfos.length > 0 && importerInfos.every(i => i.isScript);

    if (allTestImporters) {
      const entry = { file: info.rel, importers: importersArr };
      const tOnlyImporters = typeOnlyImporters.get(absNorm) || new Set();
      const liveTypeOnlyImporters = Array.from(tOnlyImporters).filter(p => liveReachable.has(p));
      if (liveTypeOnlyImporters.length > 0) {
        entry.typeOnlyReachable = true;
        entry.typeOnlyHint = 'compile-needed, not runtime-wired';
        entry.typeOnlyImporters = liveTypeOnlyImporters.map(p => fileIndex.get(p).rel);
      }
      output['test-only'].push(entry);
      continue;
    }
    if (allScriptImporters) {
      const entry = { file: info.rel, importers: importersArr };
      const tOnlyImporters = typeOnlyImporters.get(absNorm) || new Set();
      const liveTypeOnlyImporters = Array.from(tOnlyImporters).filter(p => liveReachable.has(p));
      if (liveTypeOnlyImporters.length > 0) {
        entry.typeOnlyReachable = true;
        entry.typeOnlyHint = 'compile-needed, not runtime-wired';
        entry.typeOnlyImporters = liveTypeOnlyImporters.map(p => fileIndex.get(p).rel);
      }
      output['script-only'].push(entry);
      continue;
    }

    const tOnlyImporters = typeOnlyImporters.get(absNorm) || new Set();
    const liveTypeOnlyImporters = Array.from(tOnlyImporters).filter(p => liveReachable.has(p));
    const entry = {
      file: info.rel,
      importers: importersArr,
      confirmedZeroImporters: false,
      classificationNote: 'has importers but none are transitively live-reachable (all non-live: tests/scripts/other orphans)',
    };
    if (liveTypeOnlyImporters.length > 0) {
      entry.typeOnlyReachable = true;
      entry.typeOnlyHint = 'compile-needed, not runtime-wired';
      entry.typeOnlyImporters = liveTypeOnlyImporters.map(p => fileIndex.get(p).rel);
    }
    output.orphan.push(entry);
  }

  const summary = {
    repoRoot: absRoot,
    config: config ? {
      framework: config.framework || 'next-app',
      liveRoots: config.liveRoots || [],
      scanPaths: config.scanPaths || null,
      excludePaths: config.excludePaths || null,
    } : { framework: 'next-app (default)', liveRoots: [], scanPaths: null, excludePaths: null },
    tsConfig: {
      baseUrl: tsConfig.baseUrl,
      paths: tsConfig.paths,
    },
    totalSourceFiles: collected.length,
    scanSubjects: subjects.length,
    liveRoots: Array.from(fileIndex.entries()).filter(([_, i]) => i.isLiveRoot).map(([_, i]) => i.rel),
    counts: {
      live: output.live.length,
      'test-only': output['test-only'].length,
      'script-only': output['script-only'].length,
      orphan: output.orphan.length,
      'dynamic-only': output['dynamic-only'].length,
      'dynamic-reachable': output['dynamic-reachable'].length,
      uncertain: output.uncertain.length,
    },
    parseErrors: errors,
  };

  const finalOutput = { summary, results: output };
  process.stdout.write(JSON.stringify(finalOutput, null, 2) + '\n');
}

main();
