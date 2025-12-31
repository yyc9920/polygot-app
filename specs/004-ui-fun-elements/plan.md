# Implementation Plan: UI Fun Elements

## Tech Stack
- **Framework**: React + Vite
- **Styling**: Tailwind CSS (using standard classes and arbitrary values for 3D effects).
- **Libraries**: 
  - `canvas-confetti`: For the celebration effect on correct answers.
  - `clsx` / `tailwind-merge`: For robust class composition (if not already available).

## Architecture

### 1. New Components
- **`src/components/FunButton.tsx`**: 
  - A reusable button component replacing standard `<button>`.
  - Props: `variant` (primary, secondary, danger), `fullWidth`, `icon`, etc.
  - Implementation: Uses `border-b-4` or similar to create depth. Active state removes border width and translates Y.

- **`src/hooks/useConfetti.ts`** (or utils):
  - A simple hook or utility function to trigger the `canvas-confetti` effect.

### 2. Updates to Existing Views
- **`src/views/QuizView.tsx`**:
  - Replace standard "Check Answer" and "Next" buttons with `FunButton`.
  - Integrate `confetti` on correct answer logic.
  - Add "shake" animation class to the input or container on `feedback === 'incorrect'`.

- **`src/views/LearnView.tsx`, `src/views/BuilderView.tsx`**:
  - Replace primary Call-to-Actions with `FunButton` for consistency.

- **`src/components/ui.tsx`**:
  - Update `NavButton` if needed, or leave as is (navigation often differs from action buttons).

## Dependencies
- `npm install canvas-confetti`
- `npm install -D @types/canvas-confetti`

## Execution Strategy
1. **Setup**: Install dependencies.
2. **Components**: Build `FunButton` and verify its "feel".
3. **Integration (Quiz)**: Apply to QuizView (highest impact). Add confetti and shake.
4. **Integration (Global)**: Apply to other views.
