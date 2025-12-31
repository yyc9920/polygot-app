# Implementation Plan - Set up testing infrastructure

## User Review Required

> [!IMPORTANT]
> **Critical Decisions:**
> - We will use **Vitest** as the test runner (native Vite support).
> - We will use **React Testing Library** for component testing.
> - We will use **jsdom** as the testing environment.

## Proposed Changes

### Configuration

#### [NEW] `src/setupTests.ts`

- Create a setup file to import `@testing-library/jest-dom` for global test environment configuration.

#### [UPDATE] `vite.config.ts`

- Update configuration to add the `test` property (using `vitest/config` reference).
- Configure environment to `jsdom`.
- Register the setup file.

#### [UPDATE] `package.json`

- Add `test` script: `"test": "vitest"`.
- Add `test:ui` script: `"test:ui": "vitest --ui"` (optional but helpful).
- Add dependencies:
  - `vitest`
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `jsdom`

### Testing

#### [NEW] `src/App.test.tsx`

- Create a "Smoke Test" that renders the `<App />` component.
- Verify that the app renders without crashing (e.g., check for a known text like "Polygot").

## Verification Plan

### Automated Tests
- Run `npm test` and ensure the smoke test passes.
- Run `npm test` and ensure it watches for changes (default Vitest behavior in dev).

### Manual Verification
- N/A (Infrastructure task)