import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOperatorDashboardModel } from '../src/eightPointIntegrationReadiness.js';
import { renderOperatorDashboardHtml } from '../src/operatorDashboardHtml.js';

test('operator dashboard renders read-only HTML for all panels', () => {
  const html = renderOperatorDashboardHtml(buildOperatorDashboardModel(new Date('2026-06-15T14:00:00.000Z')));

  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('<title>Bluepilot Operator Dashboard Readonly</title>'));
  assert.ok(html.includes('BPK Execution Ledger'));
  assert.ok(html.includes('GOAT Desktop Bridge'));
  assert.ok(html.includes('Maya-Core Gate Enforcement'));
  assert.ok(html.includes('Provider and Runtime Flows'));
  assert.ok(html.includes('Merge and Release Readiness'));
  assert.ok(html.includes('keine Writes'));
});

test('operator dashboard escapes panel text', () => {
  const model = buildOperatorDashboardModel(new Date('2026-06-15T14:00:00.000Z'));
  model.panels[0].title = '<script>alert("x")</script>';
  const html = renderOperatorDashboardHtml(model);

  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
});
