# AgroBridge Issue Backlog

This file tracks the remaining work for the project and is intended as the source of truth before fixing items one by one.

## 1) Require explicit production auth configuration

### Summary
The app currently allows local-development auth fallbacks when environment variables are missing. This is useful for a demo, but it is unsafe for production.

### Problem
- fallback secret is used when `AUTH_SECRET` is not set
- default passwords like `seller123`, `buyer123`, and `admin123` are used in development mode
- there is no hard production guard for required auth configuration
- local dev credentials are documented without a clear separation from production setup

### Acceptance Criteria
- `AUTH_SECRET` is required in production
- `SELLER_PASSWORD`, `BUYER_PASSWORD`, and `ADMIN_PASSWORD` are required in production
- startup fails fast with a clear configuration error when required values are missing
- `.env.example` documents the required keys
- dev-only defaults are isolated from production behavior

---

## 2) Replace JSON storage with a production database

### Summary
The application stores state in a local JSON file by default. This is acceptable for a prototype, but not for concurrent real-world operations.

### Problem
- data is stored in a repository-local JSON file by default
- multiple app instances can clobber each other’s writes
- there is no transactional safety or validation layer
- the current setup is not scalable for real marketplace usage
- demo data is mixed with runtime state

### Acceptance Criteria
- app data is moved to a real database or persistence layer
- route contracts remain stable while implementation changes
- concurrency and write safety are handled correctly
- production startup does not initialize demo state automatically
- data layer documentation explains production setup

---

## 3) Add automated tests for auth and API flows

### Summary
The repo contains a smoke script, but there is no real automated suite to catch regressions.

### Problem
- only a basic smoke script exists
- auth flows are not covered by automated tests
- API route behavior is not validated in CI
- regressions can slip through without warning

### Acceptance Criteria
- auth helper tests exist
- API route tests cover major workflows
- invalid input and unauthorized cases are covered
- CI runs the automated test suite
- the smoke script remains an optional integration check

---

## 4) Separate demo data from production state

### Summary
Demo seed data is mixed with live runtime state, which makes the app harder to reason about and deploy safely.

### Problem
- demo identities and lots are embedded in app code or JSON files
- production startup can accidentally initialize demo content
- assumptions are tied to prototype behavior
- it is unclear which data is development-only and which is production-ready

### Acceptance Criteria
- demo seed data is isolated behind a dev or seed workflow
- production startup does not initialize demo content automatically
- seed data is documented and optional
- app behavior is clearly separated between demo and production modes

---

## 5) Add request validation for lots, requests, and shortlist operations

### Summary
The API accepts raw JSON and does minimal checks, which allows malformed data into the app state.

### Problem
- lots can be created with invalid values
- buyer requests may skip crop or quantity validation
- shortlist operations do not enforce strong input checks
- invalid payloads can create inconsistent application state

### Acceptance Criteria
- validation exists for lots, requests, and shortlists
- invalid payloads are rejected before write operations
- consistent errors are returned for malformed input
- validation logic is centralized or shared

---

## 6) Document production deployment and environment requirements

### Summary
The project has a basic setup section, but it does not fully document the production environment or required variables.

### Problem
- required environment variables are not fully documented
- production and local dev configuration are not clearly separated
- deployment assumptions are unclear for hosted environments
- there is no `.env.example` to guide configuration

### Acceptance Criteria
- required environment variables are documented
- production and local dev setup are clearly separated
- `.env.example` exists with required keys
- deployment instructions describe the supported hosting assumptions

---

## 7) Replace local buyer identity with real authenticated user accounts

### Summary
The buyer workspace creates a browser-local buyer ID instead of using a real authenticated identity.

### Problem
- buyer identity is tied to localStorage rather than a server-backed auth model
- there is no real buyer account model
- actions are not associated with a real authenticated user
- the app cannot support legitimate multi-user access or accountability

### Acceptance Criteria
- buyer account model exists outside localStorage
- signed-in buyers have persistent server-backed identity
- buyer actions are linked to authenticated user records
- prototype localStorage logic is removed from the main flow

---

## 8) Add CI and GitHub Actions workflow for automated checks

### Summary
The project currently has no automated CI workflow to verify the build and tests before merge.

### Problem
- there is no GitHub Actions workflow configured
- build errors can be merged without automated checks
- test coverage is limited and not enforced in CI
- regression risk is higher for future changes

### Acceptance Criteria
- GitHub Actions workflow exists
- build check runs automatically
- test command runs in CI
- pull requests show pass/fail status for the project

---

## 9) Add admin review workflow and escalation logic

### Summary
The admin side exposes review data, but the workflow is still prototype-like and lacks escalation or approval logic.

### Problem
- review items are present but not governed by a real workflow
- escalation rules are not defined or automated
- status transitions are limited to static demo states
- admins do not have a clear path for operational decision-making

### Acceptance Criteria
- review workflow includes approval and rejection states
- escalation path exists for quality and delivery exceptions
- status changes are traceable in admin records
- workflow is documented for admins and operators

---

## 10) Improve data model and schema consistency across app routes

### Summary
The app routes use overlapping but inconsistent data structures for lots, requests, documents, and review records.

### Problem
- route contracts are not fully standardized
- similar entities are represented with slightly different fields
- UI and API assumptions can drift over time
- adding features requires repeated schema adjustments

### Acceptance Criteria
- shared data model exists for core entities
- route payloads align with the same schema conventions
- inconsistent field names and statuses are cleaned up
- the app is easier to extend without schema drift

---

## 11) Improve error handling and user feedback across API routes

### Summary
API routes currently return inconsistent errors and limited feedback when requests fail.

### Problem
- some responses return generic errors while others fail silently
- there is no consistent error structure across routes
- users do not always see actionable feedback when requests fail
- debugging issues is harder because response metadata is inconsistent

### Acceptance Criteria
- API errors follow a consistent structure
- validation and runtime failures are surfaced with clear messages
- the UI displays actionable feedback based on server result codes
- debugging and support workflows are easier to manage

---

## 12) Add user role permissions and access guards for feature pages

### Summary
The app defines roles but does not enforce page-level access consistently.

### Problem
- role checks exist in auth but are not consistently enforced in UI and route protections
- pages may not guard access by role or session validity
- unauthorized entries are possible in prototype flows
- there is no clear permission model for role-specific actions

### Acceptance Criteria
- seller, buyer, and admin page access is guarded by role
- unauthorized users are rejected or redirected
- role permissions are explicit and documented
- access rules are covered by automated tests

---

## 13) Improve analytics and market signal accuracy for seller and buyer dashboards

### Summary
Seller and buyer dashboards depend on market signal summaries and match metrics, but the current values are still prototype-driven.

### Problem
- market signal values are static or demo-based
- match quality metrics may not be grounded in a trusted source
- dashboard analytics can drift from operational reality
- users may not trust the displayed signals without stronger data validation

### Acceptance Criteria
- market signal data source is clearly defined
- dashboard metrics are grounded in verified data
- freshness and accuracy checks are documented
- buyers and sellers can trust the displayed analytics

---

## 14) Add audit trail and history tracking for key marketplace events

### Summary
The project currently tracks some activity, but there is no comprehensive audit trail or history model for key marketplace actions.

### Problem
- operational actions are not fully traceable over time
- it is harder to understand who changed what and when
- disputes and reviews require stronger historical context
- core marketplace events are not captured in a structured way

### Acceptance Criteria
- key marketplace actions are recorded in an audit trail
- status changes and important events are timestamped and traceable
- history is accessible to admins and operators
- the audit trail supports accountability and dispute review

---

## Priority Order

1. Require explicit production auth configuration
2. Replace JSON storage with a production database
3. Add automated tests for auth and API flows
4. Separate demo data from production state
5. Add request validation for lots, requests, and shortlist operations
6. Document production deployment and environment requirements
7. Replace local buyer identity with real authenticated user accounts
8. Add CI and GitHub Actions workflow for automated checks
9. Add admin review workflow and escalation logic
10. Improve data model and schema consistency across app routes
11. Improve error handling and user feedback across API routes
12. Add user role permissions and access guards for feature pages
13. Improve analytics and market signal accuracy for seller and buyer dashboards
14. Add audit trail and history tracking for key marketplace events

## Status
Backlog implementation status:

- Buyer identity: localStorage identity removed; persisted account records now own signed session IDs and buyer actions. Individual registration and password management remain future work.
- API tests: helper, validation, persistence, analytics, and authenticated shortlist route tests added. More route coverage can be expanded as workflows grow.
- Admin workflow: approval, rejection, escalation, transition protection, reviewer metadata, and audit history endpoint added.
- Data models: persisted request ownership, review metadata, activity metadata, and shared analytics output are now standardized; a full schema package remains future work.
- Analytics: overview metrics derive from persisted verified marketplace records and expose a source and freshness timestamp. External market-data integration remains future work.
- Audit trail: structured actor, action, entity, timestamp, and metadata fields are recorded for core mutations, with admin-only filtered history access.
