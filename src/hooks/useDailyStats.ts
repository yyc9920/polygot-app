import { useCallback } from 'react';
import useCloudStorage from './useCloudStorage';
import { getLocalDate } from '../lib/dateUtils';

export interface DailyStats {
  date: string;
  speakCount: number;
  quizCount: number;
  reviewCount: number;
  addCount: number;
  listenCount: number;
  reviewedIds: string[];
  updatedAt?: number;
}

const INITIAL_STATS_TEMPLATE: Omit<DailyStats, 'date'> = {
  speakCount: 0,
  quizCount: 0,
  reviewCount: 0,
  addCount: 0,
  listenCount: 0,
  reviewedIds: [],
};

const mergeStats = (local: Record<string, DailyStats>, cloud: Record<string, DailyStats>): Record<string, DailyStats> => {
    const merged = { ...local };
    for (const [key, cloudVal] of Object.entries(cloud)) {
        const localVal = merged[key];
        if (!localVal) {
             merged[key] = cloudVal;
        } else {
             const cloudTime = cloudVal.updatedAt || 0;
             const localTime = localVal.updatedAt || 0;
             if (cloudTime > localTime) {
                 merged[key] = cloudVal;
             }
        }
    }
    return merged;
};

export const useDailyStats = () => {
  const [statsHistory, setStatsHistory] = useCloudStorage<Record<string, DailyStats>>(
    'daily_stats_history',
    {},
    undefined,
    mergeStats
  );

  const today = getLocalDate();

  const getStatsForDate = useCallback((date: string): DailyStats => {
    return statsHistory[date] || { ...INITIAL_STATS_TEMPLATE, date };
  }, [statsHistory]);

  const increment = useCallback((key: keyof Omit<DailyStats, 'date' | 'reviewedIds' | 'updatedAt'>, amount = 1, itemId?: string) => {
    setStatsHistory(prev => {
      const date = getLocalDate();
      const current = prev[date] || { ...INITIAL_STATS_TEMPLATE, date };

      const safeCurrent = {
        ...INITIAL_STATS_TEMPLATE,
        ...current,
        date
      };

      let newStats: DailyStats;

      if (key === 'reviewCount' && itemId) {
          if (safeCurrent.reviewedIds?.includes(itemId)) {
              return prev;
          }
          newStats = {
              ...safeCurrent,
              reviewCount: (safeCurrent.reviewCount || 0) + 1,
              reviewedIds: [...(safeCurrent.reviewedIds || []), itemId],
              updatedAt: Date.now()
          };
      } else {
          newStats = {
            ...safeCurrent,
            [key]: (safeCurrent[key] as number) + amount,
            updatedAt: Date.now()
          };
      }

      return {
        ...prev,
        [date]: newStats
      };
    });
  }, [setStatsHistory]);

  return {
    stats: getStatsForDate(today),
    history: statsHistory,
    increment,
    getStatsForDate
  };
};
