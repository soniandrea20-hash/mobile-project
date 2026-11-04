# R2 platform and performance (RF-035, RNF-017, RNF-003, RNF-002, RNF-018)

## Objective
Implement five R2 requirements: Root tenant administration (RF-035), structured logging (RNF-017), API response time (RNF-003), self-order load time (RNF-002) and multiplatform backoffice (RNF-018).

## Problem
- RF-035: Root can already list/create/patch tenants (task 76), but a suspended tenant returns 404, login is not blocked, there are no `/suspend` `/reactivate` routes and there is no Root panel.
- RNF-017: backend has no logger setup, no requestId, no redaction.
- RNF-003 / RNF-002: no compression, no catalog cache headers, no k6 or Lighthouse tooling.
- RNF-018: no CI for the mobile app (web export, APK) and no shared-code measurement.

## Scope
- In: backend, mobile (Root panel, maintenance screen), tooling (k6, Lighthouse config, CI workflow, measurement script), docs (`docs/api.md`, `docs/no-funcional.md`, `docs/testing.md`).
- Out: staging/production infrastructure. Measured targets that need it (p95 < 500 ms, LCP ≤ 2.5 s, Lighthouse ≥ 80, builds ≤ 30 min in CI) stay **pending infra**: tooling is delivered, the measurement is not checked off.

## Constraints
- TDD: on (source: global CLAUDE.md). Runners: `npm test` in `backend/` and in `mobile/`; typecheck `npx tsc --noEmit -p tsconfig.json` in `backend/`.
- RDD: off (global). Per commit: `gentle-ai review assess` tier decides verification.
- DB changes only via a new idempotent `database/scripts/002_*.sql` (never edit `001`); comment important columns and every index.
- Uncommitted user edits to `mobile/app.json` and `mobile/package.json` stay out of commits unless the user decides otherwise. Stage explicit paths only.
- Planning heuristic ~400 authored lines per task; advisory only.

## Delivery
One branch per requirement from `develop`, squash merged into `develop` by user decision.

## Tasks
- [x] T1 RNF-017 structured logging: JSON logger (Nest + TypeORM), requestId via AsyncLocalStorage + response header, tenantId (`null` when unresolved), redaction of password/token/authorization/cookie. Branch `feat/r2-logging`. Route: delegated (writer trigger).
- [ ] T2 RF-035 tenant suspension: 503 `TENANT_SUSPENDED` for known inactive tenant (login included), `/tenants/:id/suspend` and `/reactivate`, maintenance screen in self-order, Root panel on admin host. Branch `feat/r2-tenants-root`. Route: delegated.
- [ ] T3 RNF-003 API response time: compression, k6 scripts (TC-112 and stress), index review. Target measurement pending infra. Branch `feat/r2-api-rendimiento`. Route: delegated.
- [ ] T4 RNF-002 self-order load: catalog cache headers, image resizing, Lighthouse CI config with budget (TC-184). Target measurement pending infra. Branch `feat/r2-selforder-carga`. Route: delegated.
- [ ] T5 RNF-018 multiplatform backoffice: shared-code measurement script, CI workflow for web export and debug APK (TC-128). Build-time target pending CI run. Branch `feat/r2-backoffice-multiplataforma`. Route: delegated.

## Progress
- Feature document created.
- T1 done (commit c24fba7 on `feat/r2-logging`): RED = 3 suites failed with "Cannot find module src/logging/*"; GREEN = 4 logging suites, 12 tests; full `npm test` 36 suites / 309 tests pass; `tsc --noEmit` clean. `backend/.env.example` not updated (edit blocked by permissions): add `LOG_MODE`, `SERVICE_NAME`, `SERVICE_VERSION`, `APP_ENV`; set `LOG_MODE=json` in the Container App.

- T1 assessed: risk high (RDD off) → independent verifier. Found: error filter turned http-errors (413 body too large) into 500 and changed the default 500 body; aborted requests logged as 200. One correction `ff60cf8`: RED 3 tests, GREEN 36 suites / 313 tests, tsc clean; parent re-ran logging suites (16 green). Known limits: error messages/stacks are not redacted (pg duplicate-key may carry an email); lines outside a request have `request_id: null`.

## Next step
T2 RF-035.
