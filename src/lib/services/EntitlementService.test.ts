import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntitlementService } from './EntitlementService';

describe('EntitlementService', () => {
  beforeEach(() => {
    EntitlementService.reset();
  });

  describe('tier management', () => {
    it('should default to free tier', () => {
      expect(EntitlementService.getTier()).toBe('free');
      expect(EntitlementService.isPremium()).toBe(false);
    });

    it('should set premium tier', () => {
      EntitlementService.setEntitlement('premium');
      expect(EntitlementService.getTier()).toBe('premium');
      expect(EntitlementService.isPremium()).toBe(true);
    });

    it('should handle expired premium', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      EntitlementService.setEntitlement('premium', pastDate.toISOString());
      expect(EntitlementService.getTier()).toBe('free');
    });

    it('should maintain valid premium', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      EntitlementService.setEntitlement('premium', futureDate.toISOString());
      expect(EntitlementService.getTier()).toBe('premium');
    });
  });

  describe('feature access', () => {
    it('should allow free features for all users', () => {
      expect(EntitlementService.canUseFeature('export_data')).toBe(true);
    });

    it('should block premium features for free users', () => {
      expect(EntitlementService.canUseAiTutor()).toBe(false);
      expect(EntitlementService.canUseCloudSync()).toBe(false);
      expect(EntitlementService.canUseSrsAnalytics()).toBe(false);
    });

    it('should allow premium features for premium users', () => {
      EntitlementService.setEntitlement('premium');
      expect(EntitlementService.canUseAiTutor()).toBe(true);
      expect(EntitlementService.canUseCloudSync()).toBe(true);
      expect(EntitlementService.canUseSrsAnalytics()).toBe(true);
    });
  });

  describe('trial management', () => {
    it('should start trial', () => {
      EntitlementService.startTrial(7);
      expect(EntitlementService.isTrialActive()).toBe(true);
      expect(EntitlementService.getTrialDaysRemaining()).toBeGreaterThan(0);
    });

    it('should allow premium features during trial', () => {
      EntitlementService.startTrial(7);
      expect(EntitlementService.canUseAiTutor()).toBe(true);
    });

    it('should end trial', () => {
      EntitlementService.startTrial(7);
      EntitlementService.endTrial();
      expect(EntitlementService.isTrialActive()).toBe(false);
      expect(EntitlementService.canUseAiTutor()).toBe(false);
    });

    it('should auto-expire trial', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      EntitlementService.startTrial(7);
      const state = EntitlementService.getState();
      state.trialEndsAt = pastDate.toISOString();
      EntitlementService.setEntitlement(state.tier);
      
      EntitlementService.startTrial(-1);
      expect(EntitlementService.isTrialActive()).toBe(false);
    });
  });

  describe('subscriptions', () => {
    it('should notify on state change', () => {
      const callback = vi.fn();
      const unsubscribe = EntitlementService.subscribe(callback);
      
      EntitlementService.setEntitlement('premium');
      expect(callback).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      EntitlementService.setEntitlement('free');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllFeatures', () => {
    it('should return feature lists', () => {
      const features = EntitlementService.getAllFeatures();
      expect(features.free).toContain('export_data');
      expect(features.premium).toContain('ai_tutor');
      expect(features.premium).toContain('cloud_sync');
    });
  });
});
