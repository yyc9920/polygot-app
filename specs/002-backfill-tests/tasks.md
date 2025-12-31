# Tasks: Backfill unit tests for utils and custom hooks

**Input**: Design documents from `/specs/002-backfill-tests/`
**Prerequisites**: plan.md

## Phase 1: Setup

- [x] T001 Initialize feature branch (already done)

## Phase 2: User Story 1 - Verify Utility Functions (Priority: P1)

**Goal**: Ensure `src/lib/utils.ts` is robust.

- [x] T002 [P] [US1] Create `src/lib/utils.test.ts` with tests for `generateId`
- [x] T003 [P] [US1] Add tests for `checkAnswer` to `src/lib/utils.test.ts`
- [x] T004 [P] [US1] Add tests for `parseCSV` to `src/lib/utils.test.ts`
- [x] T005 [US1] Run `npm test src/lib/utils.test.ts` and ensure all tests pass

## Phase 3: User Story 2 - Verify Local Storage Hook (Priority: P2)

**Goal**: Ensure `src/hooks/useLocalStorage.ts` persists data correctly.

- [x] T006 [US2] Create `src/hooks/useLocalStorage.test.ts` using `renderHook`
- [x] T007 [US2] Run `npm test src/hooks/useLocalStorage.test.ts` and ensure all tests pass

## Phase 4: Polish

- [x] T008 Run full `npm test` to ensure no regressions
