import assert from 'node:assert/strict';

import { materializeCockpitLiveModel } from '../src/cockpitLiveModelAdapter.js';
import type { CockpitLiveModelAdapterPlan } from '../src/cockpitLiveModelAdapterPlan.js';

const plan: CockpitLiveModelAdapterPlan = {
  status: 'ready',
  adapterAllowed: true,
  routeWiringAllowed: false,
  executableActionAllowed: false,
  adapterRef: 'adapter:cockpit-live-aicos-read-only',
  contractTaskId: 'BPK-cockpit-live',
  plannedModel: {
    status: 'ready',
    cockpitModelAllowed: true,
    executableActionAllowed: false,
    audience: 'operator',
    contractTaskId: 'BPK-cockpit-live',
    reasons: [],
    headline: 'Ready for live AICOS inspection',
    panels: [{
      id: 'live_aicos.cards',
      title: 'Live AICOS cards',
      status: 'ready',
      lines: ['accepted_cards:1'],
    }],
    actions: [{
      id: 'open_runtime_dispatch',
      enabled: false,
      reason: '',
    }],
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testMaterializesReadOnlyModel(): void {
  const result = materializeCockpitLiveModel(plan);

  assert.equal(result.status, 'ready');
  assert.equal(result.routeWiringAllowed, false);
  assert.equal(result.executableActionAllowed, false);
  assert.equal(result.model?.actions[0].enabled, false);
  assert.equal(result.model?.actions[0].reason, 'cockpit_live_model_adapter.read_only_action');
}

function testBlockedPlanBlocksMaterialization(): void {
  const result = materializeCockpitLiveModel({
    ...plan,
    status: 'blocked',
    adapterAllowed: false,
    plannedModel: undefined,
    blockers: ['cockpit_live_adapter.network_result_required'],
  });

  assert.equal(result.status, 'blocked');
  assert.ok(result.blockers.includes('cockpit_live_model_adapter.adapter_not_allowed'));
  assert.ok(result.blockers.includes('cockpit_live_model_adapter.planned_model_required'));
}

testMaterializesReadOnlyModel();
testBlockedPlanBlocksMaterialization();

console.log('cockpitLiveModelAdapter tests passed');
