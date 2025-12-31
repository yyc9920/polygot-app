# Tasks: Set up testing infrastructure

**Input**: Design documents from `/specs/001-setup-testing-infra/`
**Prerequisites**: plan.md, spec.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize feature branch (already done)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure setup

- [x] T002 Add dependencies to `package.json` (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@types/node`)
- [x] T003 [P] Create `src/setupTests.ts` to import `@testing-library/jest-dom`
- [x] T004 Update `vite.config.ts` to include Vitest configuration and reference the setup file
- [x] T005 Add `test` script to `package.json`

---

## Phase 3: User Story 1 - Run Unit Tests (Priority: P1)

**Goal**: Verify that the test runner executes correctly

**Independent Test**: Run `npm test` and see a sample test fail/pass

### Tests for User Story 1

- [x] T006 [P] [US1] Create a dummy test `src/dummy.test.ts` that asserts `1 + 1 = 2`
- [x] T007 [US1] Run `npm test` and verify the dummy test passes

---

## Phase 4: User Story 2 - Component Testing (Priority: P1)

**Goal**: Verify that React components can be tested

**Independent Test**: Run `npm test` and see the App component smoke test pass

### Tests for User Story 2

- [x] T008 [P] [US2] Create `src/App.test.tsx` that renders `<App />` and expects a failure initially (Red)
- [x] T009 [US2] Run `npm test` and verify `src/App.test.tsx` fails because of configuration/rendering issues

### Implementation for User Story 2

- [x] T010 [US2] Fix any issues in `App.test.tsx` to make it pass (Green)
- [x] T011 [US2] Verify `App.test.tsx` passes

---

## Phase 5: Polish & Cleanup

- [x] T012 [P] Remove `src/dummy.test.ts`
- [x] T013 [P] Verify all tests pass one last time
- [x] T014 [P] Run `npm run build` to ensure no regression in build process
