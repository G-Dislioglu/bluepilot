import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, extname, resolve, relative, sep } from 'node:path';

const DEFAULT_OUTPUT = resolve(process.cwd(), 'data/builder-repo-index.json');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);
const SKIP_DIRS = new Set([
  '.git',
  '.next',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
]);

function parseArgs(argv) {
  const options = {
    source: '',
    output: DEFAULT_OUTPUT,
    check: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--source') {
      options.source = argv[index + 1] ?? '';
      index += 1;
      continue;
    }
    if (arg === '--out') {
      options.output = resolve(process.cwd(), argv[index + 1] ?? '');
      index += 1;
      continue;
    }
    if (arg === '--check') {
      options.check = true;
      continue;
    }
    if (!arg.startsWith('--') && !options.source) {
      options.source = arg;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function toSlashPath(path) {
  return path.split(sep).join('/');
}

function listSourceFiles(root) {
  const files = [];

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          walk(resolve(dir, entry.name));
        }
        continue;
      }

      if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
        files.push(resolve(dir, entry.name));
      }
    }
  }

  walk(root);
  return files.sort((left, right) => toSlashPath(relative(root, left)).localeCompare(toSlashPath(relative(root, right))));
}

function countLines(content) {
  if (content.length === 0) {
    return 0;
  }
  return content.split(/\r?\n/).length;
}

function addNamedExports(exports, rawNames) {
  for (const rawName of rawNames.split(',')) {
    const cleaned = rawName
      .trim()
      .replace(/^type\s+/, '')
      .split(/\s+as\s+/i)
      .pop()
      ?.trim();

    if (cleaned && /^[A-Za-z_$][\w$]*$/.test(cleaned)) {
      exports.add(cleaned);
    }
  }
}

function extractExports(content) {
  const exports = new Set();
  const patterns = [
    /\bexport\s+(?:declare\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+(?:declare\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+(?:declare\s+)?interface\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+(?:declare\s+)?type\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+(?:declare\s+)?enum\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+(?:declare\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+default\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
    /\bexport\s+default\s+class\s+([A-Za-z_$][\w$]*)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      exports.add(match[1]);
    }
  }

  const namedExportPattern = /\bexport\s*{\s*([^}]+)\s*}(?:\s*from\s*['"][^'"]+['"])?/g;
  let namedMatch;
  while ((namedMatch = namedExportPattern.exec(content)) !== null) {
    addNamedExports(exports, namedMatch[1]);
  }

  return [...exports].sort((left, right) => left.localeCompare(right));
}

function normalizeRawIndex(raw) {
  const rawFiles = Array.isArray(raw.files)
    ? raw.files
    : Array.isArray(raw.f)
      ? raw.f
      : [];

  const files = rawFiles
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const path = String(entry.path ?? entry.p ?? '').replace(/\\/g, '/');
      if (!path) {
        return null;
      }
      const rawExports = entry.exports ?? entry.e;
      const exports = Array.isArray(rawExports)
        ? rawExports.map(String).sort((left, right) => left.localeCompare(right))
        : [];
      return {
        path,
        lines: Number(entry.lines ?? entry.l ?? 0),
        exports,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.path.localeCompare(right.path));

  return {
    totalFiles: files.length,
    files,
  };
}

function buildIndexFromSource(sourceRoot) {
  const root = resolve(process.cwd(), sourceRoot);
  if (!existsSync(root)) {
    throw new Error(`Source root not found: ${root}`);
  }

  const files = listSourceFiles(root).map((filePath) => {
    const content = readFileSync(filePath, 'utf8');
    return {
      path: toSlashPath(relative(root, filePath)),
      lines: countLines(content),
      exports: extractExports(content),
    };
  });

  return {
    totalFiles: files.length,
    files,
  };
}

function readExistingIndex(output) {
  if (!existsSync(output)) {
    throw new Error(`Index source is required when ${output} does not exist`);
  }
  return normalizeRawIndex(JSON.parse(readFileSync(output, 'utf8')));
}

function serializeIndex(index) {
  return `${JSON.stringify(index, null, 2)}\n`;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const index = options.source
    ? buildIndexFromSource(options.source)
    : readExistingIndex(options.output);
  const serialized = serializeIndex(index);

  if (options.check) {
    const current = existsSync(options.output) ? readFileSync(options.output, 'utf8') : '';
    if (current !== serialized) {
      throw new Error(`${options.output} is not up to date`);
    }
    console.log(`repo index ok: ${index.totalFiles} files`);
    return;
  }

  mkdirSync(dirname(options.output), { recursive: true });
  writeFileSync(options.output, serialized);
  console.log(`wrote ${options.output} (${index.totalFiles} files)`);
}

main();
