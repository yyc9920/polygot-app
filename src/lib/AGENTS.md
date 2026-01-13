# MODULE: LIBRARY & UTILITIES

## OVERVIEW
Contains the application's core business logic, external integrations (Firebase, Gemini), and shared utilities.

## STRUCTURE
- **`gemini.ts`**: AI generation logic. STRICT prompt engineering.
- **`firebase.ts`**: Auth & Firestore initialization.
- **`i18n.ts`**: Internationalization configuration.
- **`locales/`**: Multi-language JSON resources.
- **`utils.ts`**: General helpers.
- **`fun-utils.ts`**: Micro-interactions (confetti, etc).

## AI CONVENTIONS (Gemini)
- **Model**: `gemini-2.5-flash`.
- **Output**: MUST be valid JSON. Use `responseSchema` where possible.
- **Grounding**: Google Search grounding is enabled for specific queries.
- **Constraints**: 
  - Translated fields for lyrics MUST be in **Korean**.
  - No conversational filler in responses.

## PERSISTENCE
- **Strategy**: Optimistic UI updates.
- **Flow**: UI -> LocalStorage -> Background Sync to Firebase.
- **Files**: `firebase.ts` handles the connection; hooks handle the logic.

## GOTCHAS
- `locales/` is nested here, not in `public/`. Ensure imports in `i18n.ts` match.
- `firebase.ts` relies on Vite env vars (`VITE_FIREBASE_...`). App will crash if missing.
