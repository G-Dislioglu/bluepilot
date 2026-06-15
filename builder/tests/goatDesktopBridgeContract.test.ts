import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGoatBuilderCuePreflight,
  buildGoatDesktopBridgeContract,
} from '../src/goatDesktopBridgeContract.js';

test('goat desktop bridge contract describes proposal-only local boundary', () => {
  const contract = buildGoatDesktopBridgeContract(new Date('2026-06-15T15:00:00.000Z'));

  assert.equal(contract.version, 'bluepilot-goat-desktop-bridge-contract-v0.1');
  assert.equal(contract.bridge.localBaseUrl, 'http://127.0.0.1:8765');
  assert.equal(contract.bridge.proposalEndpoint, '/builder-cue');
  assert.deepEqual(contract.payloadContract.acceptedLocalGeometrySources, ['uia', 'ocr', 'active_window', 'test_cue']);
  assert.deepEqual(contract.payloadContract.rejectedSources, ['vision']);
  assert.equal(contract.activationBoundary.callsGoatDesktop, false);
  assert.equal(contract.activationBoundary.emitsPopupProposal, false);
  assert.equal(contract.activationBoundary.requiresPopupApproval, true);
  assert.equal(contract.activationBoundary.mayExecute, false);
  assert.equal(contract.sideEffects.desktopActions, false);
  assert.equal(contract.sideEffects.screenshotCapture, false);
});

test('goat builder cue preflight accepts local geometry proposal shape without execution', () => {
  const preflight = buildGoatBuilderCuePreflight({
    source: 'test_cue',
    action_type: 'type',
    label: 'Testfeld',
    bbox: [20, 20, 120, 50],
    safe_text_context: true,
    text: 'dry proposal only',
  }, new Date('2026-06-15T15:00:00.000Z'));

  assert.equal(preflight.status, 'ready_for_local_goat_review');
  assert.deepEqual(preflight.blockers, []);
  assert.equal(preflight.normalizedCue?.source, 'test_cue');
  assert.equal(preflight.normalizedCue?.safe_text_context, true);
  assert.equal(preflight.sideEffects.desktopActions, false);
  assert.equal(preflight.contract.activationBoundary.callsGoatDesktop, false);
});

test('goat builder cue preflight blocks vision-only and invalid bbox payloads', () => {
  const preflight = buildGoatBuilderCuePreflight({
    source: 'vision',
    action_type: 'hover',
    label: 'Ziel',
    bbox: [120, 20, 20, 50],
  }, new Date('2026-06-15T15:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('goat_builder_cue.vision_source_rejected'));
  assert.ok(preflight.blockers.includes('goat_builder_cue.bbox_must_have_positive_size'));
  assert.equal(preflight.normalizedCue, undefined);
  assert.equal(preflight.sideEffects.mouseActions, false);
});

test('goat builder cue preflight blocks zero scroll amount for scroll actions', () => {
  const preflight = buildGoatBuilderCuePreflight({
    source: 'uia',
    action_type: 'scroll',
    label: 'Seite',
    bbox: [20, 20, 120, 50],
    scroll_amount: 0,
  }, new Date('2026-06-15T15:00:00.000Z'));

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('goat_builder_cue.scroll_amount_must_not_be_zero'));
});
