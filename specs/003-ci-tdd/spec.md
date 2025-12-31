# Feature Specification: Update GitHub Actions to run tests before deploy

**Feature Branch**: `003-ci-tdd`
**Created**: 2025-12-31
**Status**: Draft
**Input**: User description: "Update GitHub Actions to run tests before deploy"

## User Scenarios & Testing

### User Story 1 - Safe Deployment (Priority: P1)

As a developer, I want my CI pipeline to run unit tests automatically before building and deploying, so that I don't accidentally deploy broken code.

**Why this priority**: Enforces TDD/Quality Gates in the release process.

**Independent Test**:
1. (Simulation) Run `npm ci`, `npm run test:run`, then `npm run build` locally.
2. Verify that if `test:run` fails, the process stops.

**Acceptance Scenarios**:

1. **Given** a pull request or push to master/main, **When** the workflow triggers, **Then** it MUST run `npm run test:run` before `npm run build`.
2. **Given** the tests fail, **When** the workflow runs, **Then** the `build` job MUST fail and deployment MUST NOT happen.

## Requirements

### Functional Requirements

- **FR-001**: The `deploy_master.yml` workflow MUST execute the test suite (`npm run test:run`) after installing dependencies and before building.
- **FR-002**: The `deploy.yml` workflow MUST execute the test suite (`npm run test:run`) after installing dependencies and before building.
- **FR-003**: If the test step fails, the workflow MUST stop immediately (fail the job).

### Technical Constraints & Assumptions
- The project uses `npm run test:run` for single-pass testing.
- Dependencies are installed via `npm ci`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Both workflows include the test step.
- **SC-002**: Workflows are syntactically valid (YAML).