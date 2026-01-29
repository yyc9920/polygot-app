# Polyglot Development Plan

**Focus:** Data Integrity, Schema Migration, & Scalability

## 🌳 Roadmap Tree

### ✅ Phase 1: Critical Data Integrity & Migration (The Foundation) — COMPLETE

*Objective: Stabilize the data layer to support synchronization and complex relationships without data loss.*

**Prerequisites:** None (this is the foundation)

**Implementation Summary:**
- `src/types/schema.ts` - Zod schemas for PhraseEntity (v2) and LegacyPhrase (v1)
- `src/lib/migration.ts` - Migration engine with backup/rollback support
- `src/lib/sync.ts` - Sync utilities (lastWriteWins, tombstone GC, retry queue)
- `src/context/MigrationContext.tsx` - One-time-run migration on app mount
- `src/hooks/useSyncRetry.ts` - Retry queue processing hook

* [x] **Data Schema Definition & Validation**
    * [x] Define strict TypeScript interfaces for `PhraseEntity` (v2) vs `Phrase` (Legacy).
    * [x] Create Zod schemas for runtime validation of import/export data.
    * [x] **Add `schemaVersion` key** in IndexedDB to track migration state (start at `1`, target `2`).
* [x] **Legacy Data Migration Engine**
    * [x] **Step 0: Backup Before Migration**
        * [x] Before any migration, copy existing data to `phraseList_backup_v1` key in IndexedDB.
        * [x] Only delete backup after successful migration completion.
        * [x] Implement rollback function to restore from backup if migration fails midway.
    * [x] **Step 1: Idempotent ID Migration**
        * [x] Create a utility to convert content-based IDs (e.g., "hello world") to UUIDs.
        * [x] **Crucial:** Generate a `MigrationMap` (Old ID -> New UUID) to preserve playlist relationships.
    * [x] **Step 2: Metadata Injection** *(Must complete before Step 3 and Sync Logic)*
        * [x] Script to iterate all existing phrases and inject `createdAt` (default: now), `updatedAt` (default: now), and `isDeleted: false`.
    * [x] **Step 3: Playlist Reconciliation**
        * [x] Update `favorites` and custom playlists using the `MigrationMap` to ensure users don't lose their curated lists.
        * [x] Update `LearningStatus.completedIds` and `incorrectIds` arrays with new UUIDs.
    * [x] **Step 4: Persistence Upgrade**
        * [x] Write a "One-Time-Run" component that executes on app mount, detects `schemaVersion < 2`, runs migration, saves to `v2`, and updates `schemaVersion` to `2`.
* [x] **Tombstone Policy**
    * [x] Define `isDeleted` tombstone behavior:
        * [x] Tombstones sync to cloud (required for cross-device deletion propagation).
        * [x] Implement garbage collection: purge tombstones older than 30 days on app startup.
        * [x] TTL constant defined in `src/lib/sync.ts` (TOMBSTONE_TTL_DAYS = 30).
* [x] **Sync Logic Hardening**
    * [x] Implement `lastWriteWins` strategy using the new `updatedAt` timestamps.
    * [x] Replace full JSON equality checks with timestamp comparison to reduce computation.
    * [x] **Retry Queue Implementation** (per AGENTS.md guidelines):
        * [x] Store failed sync operations in IndexedDB under `sync-retry-queue` key.
        * [x] Trigger retry on `window.ononline` event and app initialization.
        * [x] Implement exponential backoff for server errors (1s, 2s, 4s).
* [x] **Migration Testing**
    * [x] Write comprehensive migration tests with fixture data (v1 schema samples).
    * [x] Test rollback scenario (migration failure recovery).
    * [x] Test edge cases: empty data, corrupted data, partial migration state.

### 🧹 Phase 2: Architecture & Service Extraction — UI/UX COMPLETE

*Objective: Decouple business logic from UI components to enable TDD and cleaner Native integration.*

**Prerequisites:** Phase 1 complete (schema v2 deployed, sync logic hardened)

**Implementation Summary (UI/UX):**
- `src/components/ConfirmDialog.tsx` - Generic yes/no confirmation modal
- `src/context/DialogContext.tsx` - useDialog() hook with async confirm()
- `src/components/Toast.tsx` - Non-blocking toast notifications
- `src/context/ToastContext.tsx` - useToast() hook with success/error/warning/info methods

* [ ] **Service Layer Implementation**
    * [x] **StorageService:** Refactor `useCloudStorage` hook into a standalone service class.
        * [x] Keep the hook as a thin React wrapper around the service.
        * [x] Service handles: IndexedDB operations, Firebase sync, retry queue processing.
        * [x] This enables testing business logic without React rendering.
    * [x] **MigrationService:** Extract migration logic from Phase 1 into testable service.
    * [x] **GeminiService:** Centralize AI calls. Update prompts to accept the *new* JSON schema structure.
* [x] **UI/UX Standardization** — COMPLETE
    * [x] **Create generic `ConfirmDialog` component** for yes/no confirmations.
        * [x] Component accepts: `title`, `message`, `onConfirm`, `onCancel`, `confirmText`, `cancelText`, `variant`.
        * [x] DialogContext provides async `confirm()` via useDialog() hook.
    * [x] **Migrate all `confirm()` calls** (17 occurrences across 8 files):
        * [x] `PhraseContext.tsx` (2): handleReset, handleDeleteAllData - moved confirm to calling components
        * [x] `CsvEditorModal.tsx` (2): empty content, no valid items
        * [x] `StarterPackageSelection.tsx` (1): purchase confirm
        * [x] `BuilderView.tsx` (1): delete by tags
        * [x] `QuizView.tsx` (1): quiz start confirm
        * [x] `PlaylistPanel.tsx` (1): remove from playlist
        * [x] `ContentSourcesSection.tsx` (1): remove URL
        * [x] `DataManagementSection.tsx` (3): reset, delete all, overwrite confirm
    * [x] **Implement `ToastContext`** for non-blocking notifications.
        * [x] Toast component with info/success/warning/error variants
        * [x] Auto-dismiss with configurable duration
        * [x] Stacked display (max 3 visible)
    * [x] **Migrate all `alert()` calls** (41 occurrences across 17 files) to Toast notifications.
        * [x] All component files migrated
        * [ ] PhraseContext.tsx has 4 remaining alerts (TODO: requires refactor to return results)
    * [ ] **Add Error Reporting** for sync failures (currently swallowed with `console.error`).

### 🧠 Phase 3: Pedagogical Engineering (SRS & AI)

*Objective: Transform the app from a "dictionary" to a "learning engine."*

**Prerequisites:** Phase 1 & 2 complete (stable schema, service layer for testability)

* [x] **SRS Data Integration**
    * [x] Extend `PhraseEntity` with FSRS fields: `stability`, `difficulty`, `elapsedDays`, `scheduledDays`, `reps`.
    * [x] **Schema Migration v2 → v3:** Add FSRS fields with defaults.
        * [x] Reuse migration infrastructure from Phase 1.
        * [x] Initialize existing words with "New Card" default states.
        * [x] Consider: Map "Favorite" status to higher initial stability.
    * [ ] **Sync Strategy for FSRS:** These fields update frequently—consider:
        * [ ] Separate sync cadence for SRS data vs content data.
        * [ ] Conflict resolution: SRS fields use `max(local, cloud)` for `reps`, `lastWriteWins` for others.
* [x] **Context-Aware AI Agents**
    * [x] **Design vocabulary summary system** (don't send raw DB to Gemini):
        * [x] Extract: known word count by category, grammar patterns used, proficiency estimate.
        * [x] Send compressed summary (~500 tokens) instead of full phrase list.
    * [x] Refine Gemini prompts to use Chain-of-Thought:
        1. Analyze user's vocabulary summary.
        2. Identify grammatical gaps.
        3. Generate sentences using *only* known words + 1 new target grammatical structure.
* [ ] **Audio/Visual Pipeline**
    * [ ] Cache TTS results locally **indexed by content hash** (not UUID).
        * [ ] Key format: `tts_${hashContent(sentence)}_${voiceId}`
        * [ ] Rationale: If user edits phrase text, old cache should be orphaned, not reused.
        * [ ] Implement cache eviction for entries not accessed in 30 days.

### 📱 Phase 4: Mobile Scaling & Growth

*Objective: Native deployment and monetization.*

**Prerequisites:** Phase 1-3 complete (stable data layer, clean architecture, learning features)

* [ ] **Capacitor Transition**
    * [ ] Initialize Capacitor project (`npx cap init`).
    * [ ] Configure strict Content Security Policy (CSP) for mobile compliance.
    * [ ] **Storage Migration Path:**
        * [ ] Note: `useCloudStorage` already migrates `localStorage` → IndexedDB (lines 30-45).
        * [ ] Verify IndexedDB works in Capacitor WebView (it should).
        * [ ] If issues arise, migrate IndexedDB → Capacitor Preferences as fallback.
        * [ ] Test migration sequence: localStorage → IDB → (optional) Capacitor Preferences.
* [ ] **Monetization & Compliance**
    * [ ] **Implement `EntitlementService`** - centralized feature gate:
        * [ ] Single source of truth for premium status.
        * [ ] All feature gates query this service (no scattered checks).
        * [ ] Methods: `canUseAiTutor()`, `canUseCloudSync()`, `canUseSrsAnalytics()`.
    * [ ] Implement "Freemium" logic:
        * Free: unlimited local cards.
        * Paid: AI Tutor, Cloud Sync, Advanced SRS analytics.
    * [ ] Integrate RevenueCat or similar for cross-platform subscription management (targeting 15% Small Business fee).

---

## 📋 Cross-Cutting Concerns

*These apply across all phases and should be tracked separately.*

* [ ] **Cloud Schema Versioning**
    * [ ] Define how multiple app versions interact with cloud data.
    * [ ] Older app reads newer schema → graceful degradation (ignore unknown fields).
    * [ ] Newer app reads older schema → auto-upgrade on next write.
* [ ] **Performance Baselines**
    * [ ] Establish metrics before Phase 1: app startup time, sync latency, phrase list render time.
    * [ ] Re-measure after each phase to catch regressions.

---

**Instruction:** Await my command to begin **Phase 1**. We will start by creating the `PhraseEntity` definition and the `MigrationService`.
