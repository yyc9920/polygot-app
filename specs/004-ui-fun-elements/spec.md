# Feature Spec: UI Fun Elements

## Goal
Add small, simple, yet engaging "fun" elements to the application to mimic the engaging nature of apps like Duolingo. This includes tactile button responses, visual feedback for quiz answers, and a consistent playful tone.

## User Stories

### US1: Interactive "3D" Buttons (P1)
**As a** user,
**I want** buttons to feel tactile and responsive (pushing down when clicked),
**So that** interacting with the app feels satisfying and game-like.

**Acceptance Criteria:**
- Create a `BouncyButton` (or `FunButton`) component.
- Button has a "3D" style (bottom border simulating depth).
- On click/active, the button moves down and the bottom border shrinks, simulating a physical press.
- Replace primary actions in the app with this new button style.

### US2: Quiz Feedback & Celebration (P1)
**As a** learner,
**I want** clear and exciting feedback when I answer a question,
**So that** I feel rewarded for success and clearly understand mistakes.

**Acceptance Criteria:**
- **Correct Answer**: Trigger a confetti explosion (visual celebration).
- **Incorrect Answer**: The input field or card "shakes" visually to indicate error (no confetti).
- The transition between question and feedback states should be smooth.

### US3: Micro-interactions & Polish (P2)
**As a** user,
**I want** subtle animations when elements appear,
**So that** the app feels polished and not static.

**Acceptance Criteria:**
- Elements (like the feedback card) should slide/fade in.
- Progress bars should animate smoothly.
