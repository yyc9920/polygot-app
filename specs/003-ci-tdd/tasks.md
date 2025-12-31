# Tasks: Update GitHub Actions to run tests before deploy

**Input**: Design documents from `/specs/003-ci-tdd/`
**Prerequisites**: plan.md

## Phase 1: Setup

- [x] T001 Initialize feature branch (already done)

## Phase 2: User Story 1 - Safe Deployment (Priority: P1)

**Goal**: Add test step to workflows.

- [x] T002 [US1] Update `.github/workflows/deploy_master.yml` to include `npm run test:run`
- [x] T003 [US1] Update `.github/workflows/deploy.yml` to include `npm run test:run`
- [x] T004 [US1] Verify local build chain: `npm ci && npm run test:run && npm run build`

## Phase 3: Polish

- [x] T005 Final code review of YAML files
