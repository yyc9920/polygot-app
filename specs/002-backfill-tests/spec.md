# Feature Specification: Backfill unit tests for utils and custom hooks

**Feature Branch**: `002-backfill-tests`
**Created**: 2025-12-31
**Status**: Draft
**Input**: User description: "Backfill unit tests for utils and custom hooks"

## User Scenarios & Testing

### User Story 1 - Verify Utility Functions (Priority: P1)

As a developer, I want to ensure that core utility functions (`generateId`, `checkAnswer`, `parseCSV`) work correctly so that data processing is reliable.

**Why this priority**: These functions are foundational for the app's data handling.

**Independent Test**:
1. Run `npm test src/lib/utils.test.ts`
2. Verify all test cases pass.

**Acceptance Scenarios**:

1. **Given** two sentences with same meaning/text, **When** `generateId` is called, **Then** it returns the same ID.
2. **Given** two different sentences, **When** `generateId` is called, **Then** it returns different IDs.
3. **Given** user input "Hello." and answer "hello", **When** `checkAnswer` is called, **Then** it returns `true`.
4. **Given** a CSV string with quoted commas, **When** `parseCSV` is called, **Then** it parses fields correctly.

---

### User Story 2 - Verify Local Storage Hook (Priority: P2)

As a developer, I want to verify that `useLocalStorage` correctly persists and retrieves data so that user progress is saved.

**Why this priority**: Essential for data persistence in a local-first app.

**Independent Test**:
1. Run `npm test src/hooks/useLocalStorage.test.ts`
2. Verify test cases pass using a mock localStorage.

**Acceptance Scenarios**:

1. **Given** a key and initial value, **When** hook is initialized, **Then** it returns the stored value if present, or initial value.
2. **Given** a new value, **When** setter is called, **Then** localStorage is updated.

## Requirements

### Functional Requirements

- **FR-001**: `generateId` MUST return consistent 32-bit FNV-1a hash values in hex.
- **FR-002**: `checkAnswer` MUST be case-insensitive and ignore punctuation/spaces.
- **FR-003**: `parseCSV` MUST handle standard CSV format, including quoted fields and newlines.
- **FR-004**: `useLocalStorage` MUST sync state with `window.localStorage`.
- **FR-005**: `useLocalStorage` MUST handle JSON serialization/deserialization.

### Technical Constraints & Assumptions
- Tests will be written using `vitest` and `@testing-library/react`.
- `jsdom` environment is already configured.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% test coverage for `src/lib/utils.ts` functions.
- **SC-002**: `useLocalStorage` tests pass reliably in the test environment.