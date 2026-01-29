export type EntitlementTier = 'free' | 'premium';

export type FeatureId = 
  | 'ai_tutor'
  | 'cloud_sync'
  | 'srs_analytics'
  | 'unlimited_playlists'
  | 'export_data'
  | 'custom_themes';

interface EntitlementState {
  tier: EntitlementTier;
  expiresAt: string | null;
  isTrialActive: boolean;
  trialEndsAt: string | null;
}

const FREE_FEATURES: FeatureId[] = [
  'export_data',
];

const PREMIUM_FEATURES: FeatureId[] = [
  'ai_tutor',
  'cloud_sync',
  'srs_analytics',
  'unlimited_playlists',
  'custom_themes',
];

type StateChangeCallback = (state: EntitlementState) => void;

let currentState: EntitlementState = {
  tier: 'free',
  expiresAt: null,
  isTrialActive: false,
  trialEndsAt: null,
};

const subscribers = new Set<StateChangeCallback>();

function notifySubscribers(): void {
  subscribers.forEach(cb => cb(currentState));
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export const EntitlementService = {
  getState(): EntitlementState {
    return { ...currentState };
  },

  getTier(): EntitlementTier {
    if (currentState.tier === 'premium' && isExpired(currentState.expiresAt)) {
      currentState.tier = 'free';
      currentState.expiresAt = null;
      notifySubscribers();
    }
    return currentState.tier;
  },

  isPremium(): boolean {
    return this.getTier() === 'premium';
  },

  canUseFeature(featureId: FeatureId): boolean {
    if (FREE_FEATURES.includes(featureId)) {
      return true;
    }
    
    if (currentState.isTrialActive && !isExpired(currentState.trialEndsAt)) {
      return true;
    }
    
    return this.isPremium() && PREMIUM_FEATURES.includes(featureId);
  },

  canUseAiTutor(): boolean {
    return this.canUseFeature('ai_tutor');
  },

  canUseCloudSync(): boolean {
    return this.canUseFeature('cloud_sync');
  },

  canUseSrsAnalytics(): boolean {
    return this.canUseFeature('srs_analytics');
  },

  setEntitlement(tier: EntitlementTier, expiresAt?: string): void {
    currentState.tier = tier;
    currentState.expiresAt = expiresAt ?? null;
    notifySubscribers();
  },

  startTrial(durationDays: number = 7): void {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + durationDays);
    
    currentState.isTrialActive = true;
    currentState.trialEndsAt = trialEnd.toISOString();
    notifySubscribers();
  },

  endTrial(): void {
    currentState.isTrialActive = false;
    currentState.trialEndsAt = null;
    notifySubscribers();
  },

  isTrialActive(): boolean {
    if (!currentState.isTrialActive) return false;
    if (isExpired(currentState.trialEndsAt)) {
      this.endTrial();
      return false;
    }
    return true;
  },

  getTrialDaysRemaining(): number {
    if (!currentState.trialEndsAt || !currentState.isTrialActive) {
      return 0;
    }
    const now = new Date();
    const end = new Date(currentState.trialEndsAt);
    const diffMs = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  },

  subscribe(callback: StateChangeCallback): () => void {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  reset(): void {
    currentState = {
      tier: 'free',
      expiresAt: null,
      isTrialActive: false,
      trialEndsAt: null,
    };
    notifySubscribers();
  },

  getAllFeatures(): { free: FeatureId[]; premium: FeatureId[] } {
    return {
      free: [...FREE_FEATURES],
      premium: [...PREMIUM_FEATURES],
    };
  },
};
