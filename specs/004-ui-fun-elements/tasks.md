# Tasks: UI Fun Elements

## Overview
- **Feature**: UI Fun Elements (Duolingo-like effects)
- **Status**: Planned
- **Priority**: P1

## Dependencies
- Phase 1 (Setup) -> Phase 2 (Foundation) -> Phase 3 (US1) -> Phase 4 (US2) -> Phase 5 (US3)
- US1 and US2 can theoretically be parallelized after Phase 2, but sequential is safer for `QuizView` changes.

## Phase 1: Setup
- [ ] T001 Install `canvas-confetti` and its types
      - Command: `npm install canvas-confetti && npm install -D @types/canvas-confetti`
      - File: `package.json`

## Phase 2: Foundational Components
- [ ] T002 Create `FunButton` component
      - Create `src/components/FunButton.tsx`
      - Implement a button with `border-b-4` (or similar) that translates Y on active to simulate depth.
      - Support variants: `primary` (blue), `success` (green), `danger` (red), `neutral` (gray).
- [ ] T003 Create confetti utility
      - Create `src/lib/fun-utils.ts` (or similar)
      - Export a function `triggerConfetti()` using `canvas-confetti`.

## Phase 3: [US1] Interactive Buttons
- [ ] T004 [US1] Replace buttons in `QuizView.tsx`
      - Import `FunButton`.
      - Replace "Check Answer" and "Next Question" buttons.
      - File: `src/views/QuizView.tsx`
- [ ] T005 [US1] Replace buttons in `BuilderView.tsx`
      - Replace main action buttons (e.g., "Add to Vocabulary").
      - File: `src/views/BuilderView.tsx`
- [ ] T006 [US1] Replace buttons in `LearnView.tsx`
      - Replace "Start Learning" or similar actions.
      - File: `src/views/LearnView.tsx`
- [ ] T007 [US1] Replace buttons in `SettingsView.tsx` (if applicable)
      - Replace "Reset" or "Save" buttons.
      - File: `src/views/SettingsView.tsx`

## Phase 4: [US2] Quiz Feedback & Celebration
- [ ] T008 [US2] Implement Confetti on Success
      - In `src/views/QuizView.tsx`, inside `submitAnswer`:
      - Call `triggerConfetti()` when `isCorrect` is true.
- [ ] T009 [US2] Implement Shake Animation for Error
      - In `src/views/QuizView.tsx`:
      - Add a CSS class or inline style to the input/card when `feedback === 'incorrect'`.
      - Define the shake keyframes in `src/index.css` (or use Tailwind arbitrary values/config).
      - Ensure animation triggers on every error (key change or reset).

## Phase 5: [US3] Polish & Micro-interactions
- [ ] T010 [US3] Add entry animations
      - Add `animate-in fade-in slide-in-from-bottom` (Tailwind built-ins or custom) to the Feedback card in `QuizView.tsx`.
- [ ] T011 [US3] Final Review & Consistency Check
      - Walk through all views to ensure `FunButton` usage is consistent (colors, sizes).
      - File: `src/App.tsx` (Manual verification task)

## Parallel Execution Examples
- Developer A handles **Phase 3** (replacing buttons) while Developer B handles **Phase 4** (Confetti/Shake logic) after `FunButton` is merged (or they can mock it).
