# PROJECT KNOWLEDGE BASE

## OVERVIEW
**Polyglot** is a mobile-first language learning PWA built with **React 19 (Vite)**, **TypeScript**, and **Tailwind CSS**. It leverages **Firebase** for auth/persistence and **Google Gemini API** for real-time AI content generation.

## STRUCTURE
```
./
├── .github/workflows/ # CI/CD (Main + Master)
├── src/
│   ├── components/    # UI (Atomic + Builder sub-feature)
│   │   └── music/     # Music player & Lyrics view
│   ├── context/       # State (PhraseContext, MusicContext)
│   ├── hooks/         # Logic (useCloudStorage, useLanguage)
│   ├── lib/           # Business Logic (AI, Firebase, Utils)
│   ├── data/          # Starter phrase dictionaries (greetings, travel, etc.)
│   ├── constants/     # App constants and configuration
│   └── views/         # Page components (Routed via State, not Router)
├── public/locales/    # i18n JSON files
└── vite.config.ts     # Build & Test Config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Core State** | `src/context/PhraseContext.tsx` | Manages phrases, view routing, and user progress |
| **Music Logic** | `src/context/MusicContext.tsx` | Manages playlist, video state, and lyrics |
| **AI Logic** | `src/lib/gemini.ts` | Prompt engineering & structured JSON schemas |
| **Persistence** | `src/hooks/useCloudStorage.ts` | Syncs IndexedDB (idb-keyval) ↔ Firebase |
| **Translations** | `public/locales/` | JSON resources for i18n |
| **Routing** | `src/App.tsx` | Lazy loaded views via Suspense + `currentView` state |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `PhraseContext` | Context | `src/context/PhraseContext.tsx` | Global state container |
| `useCloudStorage`| Hook | `src/hooks/useCloudStorage.ts` | Data sync (IndexedDB + Firebase) |
| `generatePhrase` | Function | `src/lib/gemini.ts` | Primary AI generation entry |
| `App` | Component | `src/App.tsx` | Layout shell & View router |

## CONVENTIONS
- **Routing**: NO `react-router-dom`. Use `currentView` state in `PhraseContext`.
- **Styling**: Tailwind utility classes. `max-w-md` + `fixed inset-0` used for mobile-app feel.
- **Testing**: Colocated `*.test.tsx` files. Use `vitest`.
- **State**: Prefer Context for global data; Local state for UI ephemera.
- **Performance**: Views are lazy-loaded (`React.lazy`). i18n resources fetched via HTTP (`i18next-http-backend`).
- **Storage**: Client persistence uses `idb-keyval` (IndexedDB). Avoid synchronous `localStorage`.

## ANTI-PATTERNS (THIS PROJECT)
- **AI Small Talk**: AI prompts MUST explicitly forbid greetings/chatter. Strict JSON only.
- **Bypassing Client Storage**: NEVER write to Cloud without updating IndexedDB cache.
- **CSS-in-JS**: Avoid. Use Tailwind or `index.css`.
- **Hardcoded Strings**: Use `t()` hook for all UI text.

## COMMANDS
```bash
pnpm dev      # Start dev server
pnpm test     # Run Vitest in watch mode
pnpm build    # Type-check and build
pnpm lint     # ESLint (Flat Config)
```

---

# AI AGENT DEVELOPMENT GUIDELINES

## 1. Augmented Coding Principles

### Tidy First (Structural vs. Behavioral)
| Principle | Description |
|-----------|-------------|
| **Separation** | NEVER mix structural changes (refactoring) and behavioral changes (features) in a single response/commit. |
| **Tidying First** | If code structure hinders a feature, tidy it first. Small, atomic tidying steps preferred. |
| **Review** | Reflect on the design with the user after significant changes. |

### Test-Driven Development (TDD)
| Phase | Action |
|-------|--------|
| **Red** | Write a failing test BEFORE implementation. Define success criteria clearly. |
| **Green** | Write minimal code to pass the test. |
| **Refactor** | Clean up while keeping tests green. |

**Test Files**: Colocated as `*.test.tsx` / `*.test.ts`. Use Vitest patterns.

#### a. Global Infrastructure & Setup (`src/setupTests.ts`)
The project uses `src/setupTests.ts` to automatically mock core infrastructure, ensuring tests run in a controlled environment:
- **Firebase**: Mocks `firebase/app`, `firebase/auth`, and `firebase/firestore` to prevent real network calls and side effects.
- **IndexedDB**: Mocks `idb-keyval` since the `indexedDB` API is unavailable in the `jsdom` environment.
- **i18next**: Mocks the internationalization framework to avoid Suspense-related issues and ensure immediate access to translation keys in tests.

#### b. Mocking Gemini API Calls
To isolate business logic from AI generation, you must mock `src/lib/gemini.ts`. Use `vi.mock` to return predictable responses instead of calling the live Gemini API:

```typescript
import * as gemini from '@/lib/gemini';

vi.mock('@/lib/gemini', () => ({
  callGemini: vi.fn(),
  generatePhraseFromLyric: vi.fn().mockResolvedValue({
    meaning: "Apple",
    sentence: "I eat an apple",
    pronunciation: "Ap-ple",
    tags: ["music", "fruit"]
  }),
}));

```

#### c. Test Utilities & Data Seeding

Use shared utilities from `tests/e2e/test-utils.ts` to ensure consistent test states:

* **`seedData(page, items)`**: Injects specific phrase lists into browser storage before a test begins to set a known starting point. *(Note: E2E tests use `localStorage` for Playwright compatibility; unit tests should mock `idb-keyval` per Section 1a.)*
* **`clearData(page)`**: Resets browser storage after tests to prevent state leakage between different test cases.
* **`SAMPLE_PHRASE`**: Use this predefined constant for testing basic phrase-related functionalities.

#### d. Specificity Rule

Define success criteria clearly in your test code to prevent "vibe-based" logical errors.

* **Assertion**: Always assert specific properties (e.g., `expect(result.meaning).toBe('Apple')`) rather than just checking if an object exists.

## 2. Pedagogical (SLA) & AI Strategy

### Second Language Acquisition (SLA) Principles
| Principle | Implementation |
|-----------|----------------|
| **Comprehensible Input ($i+1)** | AI MUST generate content slightly above user's current level. |
| **Context-Centric** | Generate FULL SENTENCES, not isolated words. Natural acquisition requires context. |
| **Meaningful Repetition** | Spaced repetition with varied contexts, not rote memorization. |

### AI Prompt Engineering
| Rule | Rationale |
|------|-----------|
| **Chain-of-Thought (CoT)** | Explain reasoning steps before outputting code to ensure contextual accuracy. |
| **Strict JSON Output** | Use `responseMimeType: "application/json"` + `responseSchema`. No conversational filler. |
| **No Greetings/Chatter** | Prompts MUST explicitly forbid AI small talk. Output is data, not conversation. |
| **Schema Enforcement** | Always define `responseSchema` with `SchemaType` for type-safe AI outputs. |

**Current AI Config** (src/lib/gemini.ts):
- Model: `gemini-2.0-flash`
- Grounding: Google Search enabled for lyrics/content queries
- Output: Structured JSON with enforced schemas

---

## 3. Mobile & Compliance Standards

### Guideline 4.2 Compliance (App Store)
| Violation | Replacement |
|-----------|-------------|
| `alert()` | Custom Toast or Modal component |
| `confirm()` | Custom ConfirmDialog or BottomSheet |
| `prompt()` | Custom Input Modal |

### Capacitor Integration
| Principle | Description |
|-----------|-------------|
| **First-Class Native** | Treat iOS/Android projects as primary targets, not afterthoughts. |
| **Platform Detection** | Use `Capacitor.isNativePlatform()` for native-specific behavior. |
| **Native APIs** | Prefer Capacitor plugins over web APIs when available (Storage, Haptics, etc.). |

### Offline-First Architecture
| Layer | Strategy |
|-------|----------|
| **UI** | Optimistic updates. Show changes immediately. |
| **Local** | IndexedDB via `idb-keyval`. Source of truth for reads. |
| **Sync** | Background sync to Firebase. Conflict resolution: last-write-wins. |

**Flow**: UI -> IndexedDB -> Background Sync -> Firebase

**NEVER**: Write to Cloud without updating IndexedDB cache first.

---

## 4. Code Quality Checklist

Before submitting any change:

- [ ] **Tidy vs. Behavioral**: Is this PR purely structural OR purely behavioral? (Never both)
- [ ] **Tests**: Did you write failing tests FIRST? Do they pass now?
- [ ] **No Blocking APIs**: Zero `alert()`, `confirm()`, `prompt()` calls added?
- [ ] **Offline-First**: Does the feature work without network? IndexedDB updated first?
- [ ] **i18n**: All user-facing strings use `t()` hook?
- [ ] **Type Safety**: No `as any`, `@ts-ignore`, `@ts-expect-error`?
- [ ] **AI Output**: If AI-generated, uses structured JSON schema?

---

## 5. Common Patterns

### Standard Offline-First & Sync Pattern
All data mutations must follow the **Triple-Update Flow** with **Metadata Reconciliation**:

1. **State Definition**: Every record must include `updatedAt` (ISO string) and `isDeleted` (boolean).
2. **Local First**: Update IndexedDB immediately.
3. **Optimistic UI**: Reflect changes in the UI state without waiting for the network.
4. **Background Sync**: Trigger `syncToFirebase` with the following merge logic:
   - **Win Condition**: The record with the more recent `updatedAt` always wins.
   - **Tombstone Rule**: If `isDeleted` is true, do not restore the item even if it exists in the cloud, unless the cloud's `updatedAt` is strictly newer than the local deletion timestamp.

```typescript
// Example Implementation Logic
const updateData = async (key, newValue) => {
  const timestampedValue = { 
    ...newValue, 
    updatedAt: new Date().toISOString() 
  };
  
  // 1. Update Local (Primary Source of Truth)
  await localDB.set(key, timestampedValue);
  
  // 2. Background Sync (Fire and Forget)
  try {
    await cloudSync.push(key, timestampedValue);
  } catch (err) {
    queueForRetry(key, timestampedValue); // Handle offline edge cases
  }
};
```

#### Retry Queue Strategy (Required for Resiliency)
`queueForRetry` 호출 시 에이전트는 다음 설계 원칙을 준수해야 합니다.

1.  **Persistence (Where it lives)**:
    * **NEVER** use in-memory arrays for the retry queue.
    * **MUST** use **IndexedDB** (via `idb-keyval`) to store the queue. This ensures that even if the app process is killed or the user closes the tab, the pending changes are not lost.
    * Storage Key Example: `sync-retry-queue`.

2.  **Triggering Retries (When to retry)**:
    * **Network Event**: Listen for the `window.ononline` event to immediately attempt a flush of the queue when connectivity is restored.
    * **App Initialization**: The queue must be checked and processed once during the app's startup phase (in `App.tsx` or a dedicated `SyncProvider`).
    * **Exponential Backoff**: For server-side errors (not just offline), implement a simple backoff (e.g., 1s, 2s, 4s) to avoid spamming the Firebase API.

3.  **Lifecycle Grace Period**:
    * Since it is a PWA, use the `Service Worker` or `BeforeUnload` event as a last-resort hint, but rely primarily on the **startup-check** to handle cases where the app closed before a retry.

```typescript
// Proposed Internal Implementation for queueForRetry
const queueForRetry = async (key: string, value: any) => {
  const queue = await get('sync-retry-queue') || [];
  const updatedQueue = [...queue, { key, value, timestamp: Date.now() }];
  await set('sync-retry-queue', updatedQueue);
};

// Background Processor (Triggered on 'online' or Init)
const flushRetryQueue = async () => {
  const queue = await get('sync-retry-queue');
  if (!queue || queue.length === 0) return;

  for (const item of queue) {
    try {
      await cloudSync.push(item.key, item.value);
      // Remove successfully synced item from queue...
    } catch (e) {
      break; // Stop and wait for next online event if still failing
    }
  }
};
```

### Modal Pattern (instead of alert/confirm)
```typescript
// Bad
if (confirm('Delete?')) { ... }

// Good
const [showConfirm, setShowConfirm] = useState(false);
<ConfirmDialog 
  open={showConfirm}
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```
