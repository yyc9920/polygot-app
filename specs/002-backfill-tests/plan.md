# Implementation Plan - Backfill unit tests for utils and custom hooks

## User Review Required

> [!NOTE]
> No critical architectural decisions. This is a pure testing task.

## Proposed Changes

### Testing

#### [NEW] `src/lib/utils.test.ts`

- **Test `generateId`**:
    - Verify consistent output for same input.
    - Verify different output for different input.
- **Test `checkAnswer`**:
    - Verify exact match.
    - Verify case insensitivity.
    - Verify punctuation/whitespace ignoring.
- **Test `parseCSV`**:
    - Verify simple CSV parsing.
    - Verify quoted fields with commas.
    - Verify multiline handling (if supported) or row parsing.

#### [NEW] `src/hooks/useLocalStorage.test.ts`

- **Test `useLocalStorage`**:
    - Render hook using `@testing-library/react`'s `renderHook`.
    - Verify initial read from localStorage.
    - Verify default value fallback.
    - Verify updating value updates localStorage.

## Verification Plan

### Automated Tests
- Run `npm test` and ensure all new test files pass.