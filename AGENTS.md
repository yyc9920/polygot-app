# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-13
**Commit:** 7fec7cf
**Branch:** master

## OVERVIEW
**Polyglot** is a mobile-first language learning PWA built with **React 19 (Vite)**, **TypeScript**, and **Tailwind CSS**. It leverages **Firebase** for auth/persistence and **Google Gemini 2.5** for real-time AI content generation.

## STRUCTURE
```
./
├── .github/workflows/ # CI/CD (Main + Master)
├── src/
│   ├── components/    # UI (Atomic + Builder sub-feature)
│   ├── context/       # State (PhraseContext = Core Brain)
│   ├── hooks/         # Logic (useCloudStorage, useLanguage)
│   ├── lib/           # Business Logic (AI, Firebase, Utils)
│   │   └── locales/   # i18n JSON files (Non-standard location)
│   └── views/         # Page components (Routed via State, not Router)
└── vite.config.ts     # Build & Test Config
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Core State** | `src/context/PhraseContext.tsx` | Manages phrases, view routing, and user progress |
| **AI Logic** | `src/lib/gemini.ts` | Prompt engineering & structured JSON schemas |
| **Persistence** | `src/hooks/useCloudStorage.ts` | Syncs LocalStorage ↔ Firebase |
| **Translations** | `src/lib/locales/` | JSON resources for i18n |
| **Routing** | `src/App.tsx` | Conditional rendering based on `currentView` |

## CODE MAP
| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `PhraseContext` | Context | `src/context/PhraseContext.tsx` | Global state container |
| `useCloudStorage`| Hook | `src/hooks/useCloudStorage.ts` | Data sync strategy |
| `generatePhrase` | Function | `src/lib/gemini.ts` | Primary AI generation entry |
| `App` | Component | `src/App.tsx` | Layout shell & View router |

## CONVENTIONS
- **Routing**: NO `react-router-dom`. Use `currentView` state in `PhraseContext`.
- **Styling**: Tailwind utility classes. `max-w-md` + `fixed inset-0` used for mobile-app feel.
- **Testing**: Colocated `*.test.tsx` files. Use `vitest`.
- **State**: Prefer Context for global data; Local state for UI ephemera.

## ANTI-PATTERNS (THIS PROJECT)
- **AI Small Talk**: AI prompts MUST explicitly forbid greetings/chatter. Strict JSON only.
- **Bypassing LocalStorage**: NEVER write to Cloud without updating LocalStorage cache.
- **CSS-in-JS**: Avoid. Use Tailwind or `index.css`.
- **Hardcoded Strings**: Use `t()` hook for all UI text.

## COMMANDS
```bash
npm run dev      # Start dev server
npm run test     # Run Vitest in watch mode
npm run build    # Type-check and build
npm run lint     # ESLint (Flat Config)
```
