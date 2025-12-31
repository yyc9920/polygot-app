# Polygot App Constitution

## Core Principles

### I. Component-Driven UI
All UI elements must be built as reusable React components. Place generic components in `src/components` and view-specific layouts in `src/views`. Use functional components with hooks.

### II. Strict Type Safety
TypeScript must be used strictly. Avoid `any` types. Define clear interfaces in `src/types` for data models (like `Sentence`, `VocabContextType`) and component props.

### III. Local-First Architecture
The application primarily runs client-side. Data persistence is handled via `localStorage` through `VocabContext`. AI generation (Gemini) is the only external dependency. Ensure offline capabilities where possible.

### IV. Tailwind Styling
Use Tailwind CSS for all styling. Avoid vanilla CSS files unless absolutely necessary (e.g., specific animations). Prioritize mobile-first responsive design classes.

### V. Feature Isolation
New features should be modular. Logic related to specific features (e.g., Quiz, Builder) should be encapsulated within their respective views or dedicated hooks, keeping `App.tsx` clean.

### VI. Test-Driven Development (TDD)
Tests must be written before implementation (Red-Green-Refactor cycle). Focus on unit tests for utility logic and integration tests for critical user flows. All features must have accompanying tests.

## Governance

1. **Testing**: All utility functions in `src/lib` must be testable. All new features must pass their specific tests before integration.
2. **State Management**: Use `VocabContext` for global state; local state for component-specific UI logic.
3. **No Backend Assumption**: Do not introduce backend requirements (databases, auth servers) unless explicitly requested; rely on local browser APIs and third-party APIs (Gemini).

**Version**: 1.0.0 | **Ratified**: 2025-12-31