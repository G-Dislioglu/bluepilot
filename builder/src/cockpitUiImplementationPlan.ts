import type { CockpitProjectionAdoptionContract } from './cockpitProjectionAdoptionContract.js';

export type CockpitUiPlanStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitUiImplementationPlanInput {
  cockpit: CockpitProjectionAdoptionContract;
  targetSurface?: 'desktop' | 'responsive';
}

export interface CockpitUiImplementationPlan {
  status: CockpitUiPlanStatus;
  targetSurface: 'desktop' | 'responsive';
  implementationAllowed: boolean;
  blockers: string[];
  reviewItems: string[];
  screens: Array<{
    id: string;
    title: string;
    sourcePanelIds: string[];
  }>;
  controls: Array<{
    id: string;
    enabled: false;
    reason: string;
  }>;
  visualEvidenceGates: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function planCockpitUiImplementation(
  input: CockpitUiImplementationPlanInput,
): CockpitUiImplementationPlan {
  const targetSurface = input.targetSurface ?? 'responsive';
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (!input.cockpit.cockpitModelAllowed) {
    blockers.push('cockpit_ui.model_not_allowed');
  }
  if (input.cockpit.status === 'invalid') {
    blockers.push('cockpit_ui.invalid_projection');
  }
  if (input.cockpit.executableActionAllowed) {
    blockers.push('cockpit_ui.executable_action_must_remain_disabled');
  }
  if (input.cockpit.status === 'review') {
    reviewItems.push('cockpit_ui.review_state_requires_review_affordance');
  }
  if (input.cockpit.status === 'blocked') {
    reviewItems.push('cockpit_ui.blocked_state_requires_operator_explanation');
  }

  const status: CockpitUiPlanStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    targetSurface,
    implementationAllowed: status !== 'blocked',
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    screens: [
      {
        id: 'cockpit_overview',
        title: input.cockpit.headline,
        sourcePanelIds: input.cockpit.panels.map((panel) => panel.id),
      },
      {
        id: 'cockpit_gate_detail',
        title: 'Gate detail',
        sourcePanelIds: input.cockpit.panels.filter((panel) => panel.status !== 'ready').map((panel) => panel.id),
      },
    ],
    controls: input.cockpit.actions.map((action) => ({
      id: action.id,
      enabled: false,
      reason: action.reason,
    })),
    visualEvidenceGates: [
      'screenshot_desktop',
      'screenshot_mobile',
      'text_overlap_check',
      'disabled_action_state_check',
      'blocked_and_review_state_check',
    ],
    nextActions: status === 'ready'
      ? ['open_ui_contract_with_visual_evidence', 'implement_read_only_cockpit_first']
      : status === 'review_required'
        ? ['design_review_and_blocked_states_first', 'then_open_ui_contract_with_visual_evidence']
        : ['fix_cockpit_projection_before_ui_implementation'],
  };
}
