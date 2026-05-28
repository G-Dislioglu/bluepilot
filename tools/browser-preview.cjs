#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const VERSION = '0.1.0';

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ensureDiffLensShape(evidence) {
  if (!evidence || typeof evidence !== 'object') {
    throw new Error('DiffLens evidence must be a JSON object.');
  }
  if (evidence.tool !== 'difflens') {
    throw new Error('Input is not DiffLens evidence.');
  }
  if (!evidence.summary || typeof evidence.summary !== 'object') {
    throw new Error('DiffLens evidence is missing summary.');
  }
  if (!Array.isArray(evidence.files)) {
    throw new Error('DiffLens evidence is missing files array.');
  }
  if (!Array.isArray(evidence.risk_flags)) {
    throw new Error('DiffLens evidence is missing risk_flags array.');
  }
}

function parseJsonInput(input) {
  return JSON.parse(String(input || '').replace(/^\uFEFF/, ''));
}

function renderFileRows(files) {
  if (!files.length) {
    return '<tr><td colspan="6">No changed files.</td></tr>';
  }

  return files.map((file) => {
    const flags = Array.isArray(file.flags) ? file.flags.join(', ') : '';
    return [
      '<tr>',
      `<td>${escapeHtml(file.file_path)}</td>`,
      `<td>${Number(file.hunks || 0)}</td>`,
      `<td class="additions">+${Number(file.additions || 0)}</td>`,
      `<td class="deletions">-${Number(file.deletions || 0)}</td>`,
      `<td>${file.binary ? 'yes' : 'no'}</td>`,
      `<td>${escapeHtml(flags || '-')}</td>`,
      '</tr>',
    ].join('');
  }).join('\n');
}

function renderRiskItems(flags) {
  if (!flags.length) return '<li>No risk flags.</li>';
  return flags.map((flag) => {
    return `<li><strong>${escapeHtml(flag.code)}</strong> in <code>${escapeHtml(flag.file_path)}</code>: ${escapeHtml(flag.reason)}</li>`;
  }).join('\n');
}

function renderPreviewHtml(evidence, options = {}) {
  ensureDiffLensShape(evidence);

  const title = options.title || 'Bluepilot DiffLens Preview';
  const summary = evidence.summary || {};
  const humanGate = Boolean(evidence.human_gate_required);
  const visualReview = Boolean(evidence.visual_review_required);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f7f2;
      --panel: #ffffff;
      --ink: #1c2321;
      --muted: #66716d;
      --line: #d8ddd6;
      --accent: #146b68;
      --warn: #9a4d00;
      --add: #136f3d;
      --del: #9d2b2b;
    }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 24px auto;
    }
    header {
      border-bottom: 1px solid var(--line);
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    h1 {
      font-size: 28px;
      margin: 0 0 8px;
      letter-spacing: 0;
    }
    h2 {
      font-size: 18px;
      margin: 0 0 12px;
      letter-spacing: 0;
    }
    .meta {
      color: var(--muted);
      font-size: 14px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }
    .metric, section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
    }
    .metric strong {
      display: block;
      font-size: 24px;
      color: var(--accent);
    }
    .status {
      border-left: 4px solid ${humanGate ? 'var(--warn)' : 'var(--accent)'};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      border-bottom: 1px solid var(--line);
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-weight: 600;
    }
    code {
      font-family: Consolas, Monaco, monospace;
      font-size: 0.95em;
    }
    .additions { color: var(--add); }
    .deletions { color: var(--del); }
    section + section { margin-top: 14px; }
    ul { margin: 0; padding-left: 22px; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">Generated from DiffLens evidence. This is a local preview target, not a completed UI review.</div>
    </header>

    <div class="summary">
      <div class="metric"><span>Files</span><strong>${Number(summary.files || 0)}</strong></div>
      <div class="metric"><span>Hunks</span><strong>${Number(summary.hunks || 0)}</strong></div>
      <div class="metric"><span>Additions</span><strong>+${Number(summary.additions || 0)}</strong></div>
      <div class="metric"><span>Deletions</span><strong>-${Number(summary.deletions || 0)}</strong></div>
      <div class="metric"><span>Binary Files</span><strong>${Number(summary.binary_files || 0)}</strong></div>
    </div>

    <section class="status">
      <h2>Review Gate</h2>
      <p>Human gate required: <strong>${humanGate ? 'yes' : 'no'}</strong></p>
      <p>Visual review required: <strong>${visualReview ? 'yes' : 'no'}</strong></p>
    </section>

    <section>
      <h2>Changed Files</h2>
      <table>
        <thead>
          <tr><th>File</th><th>Hunks</th><th>Add</th><th>Delete</th><th>Binary</th><th>Flags</th></tr>
        </thead>
        <tbody>
          ${renderFileRows(evidence.files)}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Risk Flags</h2>
      <ul>
        ${renderRiskItems(evidence.risk_flags)}
      </ul>
    </section>
  </main>
</body>
</html>`;
}

function createManifest(evidence, options = {}) {
  ensureDiffLensShape(evidence);
  return {
    tool: 'browser-preview',
    version: VERSION,
    html_path: options.htmlPath || null,
    source: options.source || 'stdin',
    summary: evidence.summary,
    human_gate_required: Boolean(evidence.human_gate_required),
    visual_review_required: Boolean(evidence.visual_review_required),
  };
}

function readStdin() {
  return fs.readFileSync(0, 'utf8');
}

function usage() {
  return [
    'Usage:',
    '  node tools/browser-preview.cjs --input difflens.json --out preview.html',
    '  node tools/difflens.cjs --diff patch.diff | node tools/browser-preview.cjs --out preview.html',
    '',
    'Options:',
    '  --manifest <path>  Write preview manifest JSON.',
  ].join('\n');
}

function getArg(argv, name) {
  const index = argv.indexOf(name);
  if (index === -1) return null;
  return argv[index + 1] || null;
}

function runCli(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }

  const inputPath = getArg(argv, '--input');
  const outPath = getArg(argv, '--out');
  const manifestPath = getArg(argv, '--manifest');

  if (argv.includes('--input') && !inputPath) throw new Error('Missing path after --input.');
  if (argv.includes('--out') && !outPath) throw new Error('Missing path after --out.');
  if (argv.includes('--manifest') && !manifestPath) throw new Error('Missing path after --manifest.');

  const input = inputPath ? fs.readFileSync(path.resolve(inputPath), 'utf8') : readStdin();
  const evidence = parseJsonInput(input);
  const html = renderPreviewHtml(evidence);
  const resolvedOut = outPath ? path.resolve(outPath) : null;

  if (resolvedOut) {
    fs.mkdirSync(path.dirname(resolvedOut), { recursive: true });
    fs.writeFileSync(resolvedOut, html, 'utf8');
  } else {
    process.stdout.write(`${html}\n`);
  }

  if (manifestPath) {
    const resolvedManifest = path.resolve(manifestPath);
    fs.mkdirSync(path.dirname(resolvedManifest), { recursive: true });
    const manifest = createManifest(evidence, {
      htmlPath: resolvedOut,
      source: inputPath ? path.resolve(inputPath) : 'stdin',
    });
    fs.writeFileSync(resolvedManifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }

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
  VERSION,
  escapeHtml,
  parseJsonInput,
  renderPreviewHtml,
  createManifest,
};
