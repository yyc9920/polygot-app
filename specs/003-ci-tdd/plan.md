# Implementation Plan - Update GitHub Actions to run tests before deploy

## User Review Required

> [!NOTE]
> This change affects the CI/CD pipeline.

## Proposed Changes

### CI/CD

#### [UPDATE] `.github/workflows/deploy_master.yml`

- Add step `Run tests` executing `npm run test:run` before the `Build` step.

#### [UPDATE] `.github/workflows/deploy.yml`

- Add step `Run tests` executing `npm run test:run` before the `Build` step.

## Verification Plan

### Automated Tests
- Verification is done by inspecting the YAML files and (optionally) by the user observing the next push to GitHub.
- Locally, we can simulate the order of commands: `npm ci && npm run test:run && npm run build`.