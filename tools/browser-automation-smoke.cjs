#!/usr/bin/env node

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawnSync } = require('child_process');

const VERSION = '0.1.0';

const REQUIRED_MARKERS = [
  'Bluepilot DiffLens Preview',
  'Review Gate',
  'Changed Files',
  'Risk Flags',
  'Human gate required',
  'Visual review required',
];

const WINDOWS_BROWSER_CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

const POSIX_BROWSER_CANDIDATES = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8').replace(/^\uFEFF/, ''));
}

function filePathToUrl(filePath) {
  return pathToFileURL(path.resolve(filePath)).href;
}

function discoverBrowser(extraCandidate = null) {
  const candidates = [];
  if (extraCandidate) candidates.push(extraCandidate);
  if (process.env.BLUEPILOT_BROWSER) candidates.push(process.env.BLUEPILOT_BROWSER);
  candidates.push(...(process.platform === 'win32' ? WINDOWS_BROWSER_CANDIDATES : POSIX_BROWSER_CANDIDATES));

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return path.resolve(candidate);
  }
  return null;
}

function makeCheck(name, passed, detail) {
  return { name, passed: Boolean(passed), detail };
}

function buildBrowserArgs(url, userDataDir) {
  return [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--dump-dom',
    url,
  ];
}

function checkDom(dom, manifest = null) {
  const checks = REQUIRED_MARKERS.map((marker) => {
    return makeCheck(`marker:${marker}`, dom.includes(marker), `Browser DOM contains "${marker}".`);
  });

  if (manifest) {
    checks.push(makeCheck('manifest_tool', manifest.tool === 'browser-preview', 'Manifest tool is browser-preview.'));
    checks.push(makeCheck('manifest_summary', Boolean(manifest.summary && typeof manifest.summary === 'object'), 'Manifest summary exists.'));
  }

  return checks;
}

function runBrowserSmoke(options) {
  const htmlPath = path.resolve(options.htmlPath);
  const browserPath = discoverBrowser(options.browserPath);
  const url = filePathToUrl(htmlPath);
  const manifest = options.manifestPath ? readJson(options.manifestPath) : null;

  if (!fs.existsSync(htmlPath)) {
    return {
      tool: 'browser-automation-smoke',
      version: VERSION,
      passed: false,
      reason: 'missing_html',
      browser: null,
      url,
      checks: [],
      browser_automation: false,
      screenshot_check: false,
      human_ui_review: false,
    };
  }

  if (!browserPath) {
    return {
      tool: 'browser-automation-smoke',
      version: VERSION,
      passed: false,
      reason: 'no_browser',
      browser: null,
      url,
      checks: [],
      browser_automation: false,
      screenshot_check: false,
      human_ui_review: false,
    };
  }

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bluepilot-browser-smoke-'));
  try {
    const result = spawnSync(browserPath, buildBrowserArgs(url, userDataDir), {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 20,
      timeout: options.timeoutMs || 15000,
    });

    if (result.error) {
      return {
        tool: 'browser-automation-smoke',
        version: VERSION,
        passed: false,
        reason: 'browser_launch_failed',
        error: result.error.message,
        browser: browserPath,
        url,
        checks: [],
        browser_automation: true,
        screenshot_check: false,
        human_ui_review: false,
      };
    }

    const dom = String(result.stdout || '');
    const checks = checkDom(dom, manifest);
    const passed = result.status === 0 && checks.every((check) => check.passed);
    return {
      tool: 'browser-automation-smoke',
      version: VERSION,
      passed,
      reason: passed ? null : 'browser_dom_check_failed',
      browser: browserPath,
      url,
      exit_status: result.status,
      checks,
      browser_automation: true,
      screenshot_check: false,
      human_ui_review: false,
    };
  } finally {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
}

function usage() {
  return [
    'Usage:',
    '  node tools/browser-automation-smoke.cjs --html preview.html [--manifest preview.manifest.json] [--browser browser.exe]',
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
  const browserPath = getArg(argv, '--browser');
  if (!htmlPath) throw new Error('Missing required --html path.');
  if (argv.includes('--manifest') && !manifestPath) throw new Error('Missing path after --manifest.');
  if (argv.includes('--browser') && !browserPath) throw new Error('Missing path after --browser.');

  const result = runBrowserSmoke({ htmlPath, manifestPath, browserPath });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.passed) return 0;
  if (result.reason === 'no_browser') return 2;
  return 1;
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
  REQUIRED_MARKERS,
  buildBrowserArgs,
  checkDom,
  discoverBrowser,
  filePathToUrl,
  runBrowserSmoke,
};
