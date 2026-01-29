import { type PhraseEntity } from '../../types/schema';

export interface FSRSMergeResult {
  merged: PhraseEntity;
  hasConflict: boolean;
}

export const FSRSSyncService = {
  mergeFSRSFields(local: PhraseEntity, cloud: PhraseEntity): FSRSMergeResult {
    let hasConflict = false;
    const merged = { ...local };

    // reps: use max (more reviews = more progress)
    if (cloud.reps !== undefined && local.reps !== undefined) {
      if (cloud.reps !== local.reps) hasConflict = true;
      merged.reps = Math.max(cloud.reps, local.reps);
    } else {
      merged.reps = cloud.reps ?? local.reps;
    }

    // lapses: use max (more lapses = more accurate difficulty tracking)
    if (cloud.lapses !== undefined && local.lapses !== undefined) {
      if (cloud.lapses !== local.lapses) hasConflict = true;
      merged.lapses = Math.max(cloud.lapses, local.lapses);
    } else {
      merged.lapses = cloud.lapses ?? local.lapses;
    }

    // For stability, difficulty, scheduledDays, elapsedDays: lastWriteWins (use updatedAt)
    const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
    const cloudTime = cloud.updatedAt ? new Date(cloud.updatedAt).getTime() : 0;

    if (cloudTime > localTime) {
      merged.stability = cloud.stability ?? local.stability;
      merged.difficulty = cloud.difficulty ?? local.difficulty;
      merged.scheduledDays = cloud.scheduledDays ?? local.scheduledDays;
      merged.elapsedDays = cloud.elapsedDays ?? local.elapsedDays;
      merged.state = cloud.state ?? local.state;
      merged.due = cloud.due ?? local.due;
      merged.lastReview = cloud.lastReview ?? local.lastReview;
    }

    return { merged, hasConflict };
  },

  mergePhraseLists(local: PhraseEntity[], cloud: PhraseEntity[]): PhraseEntity[] {
    const cloudMap = new Map(cloud.map(p => [p.id, p]));
    const merged: PhraseEntity[] = [];

    for (const localPhrase of local) {
      const cloudPhrase = cloudMap.get(localPhrase.id);
      
      if (!cloudPhrase) {
        merged.push(localPhrase);
        continue;
      }

      cloudMap.delete(localPhrase.id);

      // Content fields: lastWriteWins
      const localTime = localPhrase.updatedAt ? new Date(localPhrase.updatedAt).getTime() : 0;
      const cloudTime = cloudPhrase.updatedAt ? new Date(cloudPhrase.updatedAt).getTime() : 0;

      let basePhrase: PhraseEntity;
      if (cloudTime > localTime) {
        basePhrase = { ...cloudPhrase };
      } else {
        basePhrase = { ...localPhrase };
      }

      // Merge FSRS fields with special logic
      const { merged: withFSRS } = this.mergeFSRSFields(localPhrase, cloudPhrase);
      
      merged.push({
        ...basePhrase,
        reps: withFSRS.reps,
        lapses: withFSRS.lapses,
        stability: cloudTime > localTime ? cloudPhrase.stability : localPhrase.stability,
        difficulty: cloudTime > localTime ? cloudPhrase.difficulty : localPhrase.difficulty,
        scheduledDays: cloudTime > localTime ? cloudPhrase.scheduledDays : localPhrase.scheduledDays,
        elapsedDays: cloudTime > localTime ? cloudPhrase.elapsedDays : localPhrase.elapsedDays,
        state: cloudTime > localTime ? cloudPhrase.state : localPhrase.state,
        due: cloudTime > localTime ? cloudPhrase.due : localPhrase.due,
        lastReview: cloudTime > localTime ? cloudPhrase.lastReview : localPhrase.lastReview,
      });
    }

    // Add cloud-only phrases
    for (const cloudPhrase of cloudMap.values()) {
      merged.push(cloudPhrase);
    }

    return merged;
  },

  shouldThrottleSync(lastSyncTime: number | undefined, minIntervalMs: number = 5000): boolean {
    if (!lastSyncTime) return false;
    return Date.now() - lastSyncTime < minIntervalMs;
  },
};
