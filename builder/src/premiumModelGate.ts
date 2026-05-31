import { getActivePools } from './poolState.js';

export type PremiumModelApprovalSource =
  | 'active-ui-pool'
  | 'patrol-ui-selection'
  | 'director-ui-selection'
  | 'explicit-ui-request';

export function getPremiumModelIds(provider: string, model: string): string[] {
  const normalizedProvider = provider.toLowerCase();
  const normalizedModel = model.toLowerCase();

  if (normalizedProvider === 'anthropic' && normalizedModel.includes('opus')) {
    return ['opus'];
  }

  if (normalizedProvider === 'anthropic' && normalizedModel.includes('sonnet')) {
    return ['sonnet', 'sonnet-4.6'];
  }

  if (normalizedProvider === 'openai' && normalizedModel === 'gpt-5.5') {
    return ['gpt-5.5', 'gpt', 'gpt5.5'];
  }

  return [];
}

export function isPremiumProviderModel(provider: string, model: string): boolean {
  return getPremiumModelIds(provider, model).length > 0;
}

export function isPremiumModelSelectedInUi(provider: string, model: string): boolean {
  const premiumIds = new Set(getPremiumModelIds(provider, model));
  if (premiumIds.size === 0) return true;

  const activePools = getActivePools();
  return (Object.values(activePools) as string[][]).some((ids: string[]) => ids.some((id: string) => premiumIds.has(id)));
}

export function assertPremiumModelAllowed(
  provider: string,
  model: string,
  approvalSource?: PremiumModelApprovalSource,
): void {
  if (!isPremiumProviderModel(provider, model)) return;
  if (approvalSource) return;
  if (isPremiumModelSelectedInUi(provider, model)) return;

  throw new Error(
    `premium model ${provider}/${model} is not active in the Builder UI selection. Select it in the UI before running this call.`,
  );
}
