import { useState, useEffect, useCallback } from 'react';
import { EntitlementService, type EntitlementTier, type FeatureId } from '../lib/services/EntitlementService';

interface UseEntitlementResult {
  tier: EntitlementTier;
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  canUseFeature: (featureId: FeatureId) => boolean;
  canUseAiTutor: boolean;
  canUseCloudSync: boolean;
  canUseSrsAnalytics: boolean;
}

export function useEntitlement(): UseEntitlementResult {
  const [state, setState] = useState(() => EntitlementService.getState());

  useEffect(() => {
    return EntitlementService.subscribe((newState) => {
      setState({ ...newState });
    });
  }, []);

  const canUseFeature = useCallback((featureId: FeatureId) => {
    return EntitlementService.canUseFeature(featureId);
  }, [state]);

  return {
    tier: EntitlementService.getTier(),
    isPremium: EntitlementService.isPremium(),
    isTrialActive: EntitlementService.isTrialActive(),
    trialDaysRemaining: EntitlementService.getTrialDaysRemaining(),
    canUseFeature,
    canUseAiTutor: EntitlementService.canUseAiTutor(),
    canUseCloudSync: EntitlementService.canUseCloudSync(),
    canUseSrsAnalytics: EntitlementService.canUseSrsAnalytics(),
  };
}
