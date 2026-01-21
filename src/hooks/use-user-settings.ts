import useSWR from 'swr';

import type { SupportedCurrency } from '@/lib/fx';

export interface UserSettings {
  onboardingComplete: boolean;
  useDemoData: boolean;
  primaryGoal: string;
  goalTarget: number | null;
  proTrialRequested: boolean;
  aiProactive: boolean;
  baseCurrency: SupportedCurrency;
  plan: 'free' | 'pro' | 'elite';
  proActive: boolean;
  proExpiresAt: string | null;
  trialUsed?: boolean;
  trialEndsAt?: string | null;
}

const defaultSettings: UserSettings = {
  onboardingComplete: false,
  useDemoData: false,
  primaryGoal: '',
  goalTarget: null,
  proTrialRequested: false,
  aiProactive: true,
  baseCurrency: 'USD',
  plan: 'free',
  proActive: false,
  proExpiresAt: null,
  trialUsed: false,
  trialEndsAt: null,
};

const fetcher = async (url: string): Promise<UserSettings> => {
  const res = await fetch(url);
  if (!res.ok) return defaultSettings;
  const data = await res.json();
  return {
    ...defaultSettings,
    ...data,
  };
};

export function useUserSettings(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? '/api/user/settings' : null,
    fetcher,
    {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
    }
  );

  return {
    settings: data ?? defaultSettings,
    loading: isLoading,
    error,
    refresh: mutate,
  };
}
