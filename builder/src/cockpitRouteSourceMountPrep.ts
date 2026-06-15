import type { CockpitLiveModelRouteSourceContract } from './cockpitLiveModelRouteSourceContract.js';

export type CockpitRouteSourceMountPrepStatus = 'ready' | 'review_required' | 'blocked';

export interface CockpitRouteSourceMountPrepInput {
  contract: CockpitLiveModelRouteSourceContract;
  envGateName: string;
  sourceSelectorRef?: string;
}

export interface CockpitRouteSourceMountPrep {
  status: CockpitRouteSourceMountPrepStatus;
  mountPrepAllowed: boolean;
  routeMutationAllowed: false;
  routePath: string;
  envGateName: string;
  sourceSelectorRef?: string;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

const ENV_RE = /^BLUEPILOT_[A-Z0-9_]+$/;

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function prepareCockpitRouteSourceMount(
  input: CockpitRouteSourceMountPrepInput,
): CockpitRouteSourceMountPrep {
  const envGateName = normalize(input.envGateName);
  const sourceSelectorRef = normalize(input.sourceSelectorRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.contract.status === 'blocked') {
    blockers.push(...input.contract.blockers.map((blocker) => `cockpit_route_mount_prep.contract_blocked:${blocker}`));
  }
  if (input.contract.status === 'review_required') {
    reviewItems.push(...input.contract.reviewItems.map((item) => `cockpit_route_mount_prep.contract_review_required:${item}`));
  }
  if (!input.contract.routeSourceAllowed) {
    blockers.push('cockpit_route_mount_prep.route_source_not_allowed');
  }
  if (input.contract.routeMutationAllowed !== false) {
    blockers.push('cockpit_route_mount_prep.route_mutation_must_stay_closed');
  }
  if (!ENV_RE.test(envGateName)) {
    blockers.push(`cockpit_route_mount_prep.invalid_env_gate:${envGateName || '(missing)'}`);
  }
  if (!sourceSelectorRef) {
    reviewItems.push('cockpit_route_mount_prep.source_selector_ref_required');
  }

  const status: CockpitRouteSourceMountPrepStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    mountPrepAllowed: status === 'ready',
    routeMutationAllowed: false,
    routePath: input.contract.routePath,
    envGateName,
    ...(sourceSelectorRef ? { sourceSelectorRef } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_separate_cockpit_route_source_mount_contract']
      : status === 'review_required'
        ? ['complete_cockpit_route_source_mount_review']
        : ['resolve_cockpit_route_source_mount_blockers'],
  };
}
