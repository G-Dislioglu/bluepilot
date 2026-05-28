#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const VERSION = '0.1.0';

const HTML_CHECKS = [
  ['doctype', /<!doctype html>/i, 'HTML document declares doctype.'],
  ['title', /Bluepilot DiffLens Preview/, 'Preview title is present.'],
  ['viewport', /<meta\s+name="viewport"/i, 'Viewport meta tag is present.'],
  ['review_gate', /Review Gate/, 'Review Gate section is present.'],
  ['changed_files', /Changed Files/, 'Changed Files section is present.'],
  ['risk_flags', /Risk Flags/, 'Risk Flags section is present.'],
  ['human_gate_required', /Human gate required/, 'Human gate status is visible.'],
  ['visual_review_required', /Visual review required/, 'Visual review status is visible.'],
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8').replace(/^\uFEFF/, ''));
}

function makeCheck(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

function smokePreviewHtml(html, manifest = null) {
  const checks = HTML_CHECKS.map(([name, pattern, detail]) => {
    return makeCheck(name, pattern.test(html), detail);
  });

  if (/<script\b/i.test(html)) {
    checks.push(makeCheck('script_tag_absent', false, 'Preview HTML must not contain script tags in BP-C4 DOM smoke.'));
  } else {
    checks.push(makeCheck('script_tag_absent', true, 'No script tags found.'));
  }

  if (manifest) {
    checks.push(makeCheck('manifest_tool', manifest.tool === 'browser-preview', 'Manifest tool is browser-preview.'));
    checks.push(makeCheck('manifest_summary', Boolean(manifest.summary && typeof manifest.summary === 'object'), 'Manifest summary exists.'));
    checks.push(makeCheck('manifest_human_gate_boolean', typeof manifest.human_gate_required === 'boolean', 'Manifest human_gate_required is boolean.'));
    checks.push(makeCheck('manifest_visual_review_boolean', typeof manifest.visual_review_required === 'boolean', 'Manifest visual_review_required is boolean.'));
  }

  return {
    tool: 'browser-preview-smoke',
    version: VERSION,
    passed: checks.every((check) => check.passed),
    checks,
    browser_automation: false,
    screenshot_check: false,
    human_ui_review: false,
  };
}

function usage() {
  return [
    'Usage:',
    '  node tools/browser-preview-smoke.cjs --html preview.html [--manifest preview.manifest.json]',
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

  const htmlPath = getArg(argv, '--html');
  const manifestPath = getArg(argv, '--manifest');
  if (!htmlPath) throw new Error('Missing required --html path.');
  if (argv.includes('--manifest') && !manifestPath) throw new Error('Missing path after --manifest.');

  const html = fs.readFileSync(path.resolve(htmlPath), 'utf8');
  const manifest = manifestPath ? readJson(manifestPath) : null;
  const result = smokePreviewHtml(html, manifest);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.passed ? 0 : 1;
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
  smokePreviewHtml,
};
