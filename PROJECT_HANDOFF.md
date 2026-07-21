# PBM School Management — AI Project Handoff

> **Purpose:** Give a new developer, GPT, or AI coding agent enough context to work safely in this repository. Read this file, `README.md`, and the relevant application README before changing code.
>
> **Snapshot date:** 2026-07-20 (Asia/Dhaka)

## What this project is

PBM is a school/madrasa management system for **Paila Baniabari Fazil Madrasah**. It contains:

- a Bangla-first public website;
- an authenticated administration panel;
- an Express API backed by MySQL;
- role, menu, and permission-based access control;
- student admission, employee, notice, event, and fee-management capabilities.

The repository is an npm workspace. Use Node.js **20.19+** (the root declares `>=20.19.0`).

## Repository map

```text
apps/
  website/       Vue 3 + Vite public website; also hosts the shared dev server
  admin/         Vue 3 + Vue Router admin source, built under /admin
  api/           Express API, MySQL adapter, uploads, and production frontend builds
database/
  mysql-schema.sql       Primary full schema
  migrations/            Incremental database migrations, ordered by date in filename
deploy/windows-vps/      PM2, Nginx/Caddy, and Windows VPS notes
scripts/                 Development launcher and Font Awesome asset preparation
logs/                    Local diagnostic output (do not treat as source of truth)
instruction.txt          Earlier reusable RBAC design reference
```

## Architecture and runtime

| Concern | Implementation |
| --- | --- |
| Public site | Vue 3 / Vite in `apps/website`, normally `http://127.0.0.1:5173` |
| Admin UI | Vue 3 / Vue Router in `apps/admin`, development route `http://127.0.0.1:5173/admin/login` |
| API | Express in `apps/api/src/server.js`, normally port 5000 |
| Database | MySQL 8, typically database/schema `school_management` / `sms` |
| Production hosting | API serves `/`, `/admin`, `/api`, and `/uploads`; Nginx fronts the private API port |
| Upload storage | `apps/api/uploads/` (persistent operational data) |

### Important frontend detail

The website Vite config includes a small development middleware that routes `/admin/*` to `apps/website/admin/index.html`. This allows one Vite dev server for the public website and admin source. Production builds are separate:

```text
apps/api/dist/website
apps/api/dist/admin
```

### Important database detail

Most routes use PostgreSQL-style SQL (`$1` parameters and `RETURNING`) even though the deployed database is MySQL. `apps/api/src/config/db.js` is an adapter that translates the supported PostgreSQL-like syntax to MySQL. Preserve that convention unless intentionally refactoring the adapter. Test any new SQL against MySQL, especially complex `RETURNING`, upsert, and schema-qualified queries.

## Main source entry points

- API bootstrap and public endpoints: `apps/api/src/server.js`
- Database adapter: `apps/api/src/config/db.js`
- API routes: `apps/api/src/routes/`
- Backend auth / permission middleware: `apps/api/src/middleware/`
- Startup schema/catalog helpers: `apps/api/src/utils/ensure*.js`
- Admin routes and authorization guard: `apps/admin/src/router/index.js`
- Admin API client: `apps/admin/src/services/api.js`
- Admin permissions helper: `apps/admin/src/utils/permission.js`
- Public website shell: `apps/website/src/App.vue`
- Public website API client: `apps/website/src/api.js`

## Security and authorization model

The authorization system is data-driven. Users receive roles, roles receive permissions and menu access, and the frontend stores the login state in local storage (`sms_token`, `sms_menus`, and permissions data). Routes declare a `meta.permission` and `meta.action`; the router guard calls `can()` before navigation.

When adding a protected feature, update all relevant layers together:

1. Add the API route and apply authentication/permission middleware.
2. Add the admin route with the matching `meta.permission` and action.
3. Add or update the sidebar menu.
4. Add the permission/menu catalog entry in `ensureSecurityCatalog.js`.
5. Verify the intended roles receive access; only `ADMIN` is automatically given all newly seeded permissions.

Do not rely on a hidden frontend button as authorization; enforce permissions in the API as well.

## Implemented feature inventory

**Status meaning:** “Build-verified” means the current source compiled successfully with `npm run build` on 2026-07-20. It does not replace functional testing against a configured MySQL database, authenticated user, SMS provider, or email provider. “In current worktree” means the implementation exists but is uncommitted and must be reviewed before release.

| Area | Current capabilities | Status / key locations |
| --- | --- | --- |
| Public website | Bangla-first institutional home page, institution profile, contact information, teacher listing, academic data, notices, notice archive, notice attachments, and upcoming events. The site reads public API data and safely uses generated/default content when the API/database is unavailable. | Build-verified. `apps/website/src/App.vue`, `NoticeArchiveView.vue`, `apps/api/src/server.js` public endpoints. |
| Authentication | Username/password login, JWT session, current-user lookup, logout through local token removal, and protected admin routes. | Build-verified. `apps/api/src/routes/authRoutes.js`, `apps/admin/src/views/auth/`, `router/index.js`. |
| Password recovery | Email reset via Brevo with one-time hashed tokens; mobile OTP reset through BulkSMSBD; Bangladesh phone normalization; five-minute OTP lifetime; failed-attempt protection; maximum two mobile reset messages per user/day. | Implemented; requires real provider credentials and the password-reset migrations. See `apps/api/README.md`. |
| Dashboard | Authorized summary endpoint and admin dashboard widgets for operational overview. | Build-verified. `dashboardRoutes.js`, `DashboardView.vue`. |
| Users | System-user list, create, edit, active/inactive management, and role assignment. | Build-verified. `userRoutes.js`, `views/users/`, `views/auth/UserFormView.vue`. |
| Roles, permissions, and menus | Role CRUD; permission matrix; role-to-permission mapping; role-to-menu mapping; per-user role assignment; menu tree CRUD and status management; login/access payload drives router and sidebar visibility. | Build-verified. `securityRoutes.js`, `roleRoutes.js`, `menuRoutes.js`, `securityController.js`, `ensureSecurityCatalog.js`. |
| Institution setup | Institution list, create, edit, and delete flows, with institution details used by the public site. | Build-verified. `institutionRoutes.js`, `views/institution/`. |
| Academic / master data | CRUD-style management for branches, academic years/sessions/levels, classes, groups, sections, mediums, shifts, classrooms, lookup types/values, and academic batches. Bangla names/codes are supported for relevant academic records. | Build-verified. `masterRoutes.js`, `views/master/MasterDataView.vue`. |
| Student records | Student list with pagination; profile; editing; lookup data; student status/history-related schema; guardian, address, enrollment, and document data. | Build-verified. `studentRoutes.js`, `views/student/`, `components/student/`. |
| Student admission | Full admission creation and update transaction; photo/document/guardian upload handling; document deletion; student detail retrieval; list endpoints; automatic fee-assignment hook for eligible students. | Build-verified. `studentAdmissionRoutes.js`, `StudentAdmissionView.vue`, `StudentEditView.vue`. Upload data is persistent. |
| Employee / HR | Employee list, profile/edit flow, employee photo upload, employee documents, departments, designations, teacher assignment, and employee addresses. Public teacher cards are sourced from active teaching employees. | Build-verified. `employeeRoutes.js`, `views/employee/`, `components/employee/`, `20260719_employee_addresses.sql`. |
| Notice management | Categorized notices; create, update, publish/archive status; rich/sanitized HTML content; attachment upload; public notice feed and archive; current-notice display on the public website. | Build-verified. `noticeRoutes.js`, `NoticeManagementView.vue`, `noticeContent.js`, `ensureNoticeSchema.js`. |
| Event management | Event CRUD with English/Bangla title, date, optional time, description, and draft/published/archived status. Published events are returned to the public site for its event/calendar area. | Implemented in current worktree and build-verified; apply `20260719_events.sql` and conduct database/UI verification before release. |
| Fee setup | Fee-head CRUD with code, type, recurring flag, and status; class/year/branch-oriented fee structures with line items, frequency, amount, due day, and effective dates. | Implemented in current worktree and build-verified; apply `20260719_fees.sql` and verify against MySQL before release. |
| Automatic fees | Existing and newly enrolled active students can receive the applicable class-wise fee structure automatically. Assignment list supports filtering by student, structure, class, and status. | Implemented in current worktree. `autoAssignFees.js`, `feeRoutes.js`. Functional database verification required. |
| Invoicing | Per-student invoice creation, class/bulk generation, invoice detail, updates, regeneration from the active structure, deletion of eligible invoices, status/due tracking, and invoice filtering. | Implemented in current worktree. Functional database verification required. |
| Collections | Payment collection/receipt creation, payment method/reference/fine/discount fields, receipt updates and deletion with invoice-balance restoration, dashboard recent collections, and due-invoice reporting. | Implemented in current worktree. Functional database verification required. |
| Waivers and fee reports | Percentage/fixed waivers with approval workflow; fee dashboard totals for billed, collected, outstanding, due invoices, and collections. | Implemented in current worktree. Functional database verification required. |
| File handling | Static serving of uploaded files at `/uploads`; student, guardian/document, employee, and notice attachment upload workflows. | Implemented. Back up `apps/api/uploads/` before deployment. |
| Deployment | Production builds are served by Express; Windows VPS PM2 ecosystem file and Nginx/Caddy configuration examples are included. | Documented in `deploy/windows-vps/README.md`; environment-specific validation still required. |

### Feature dependencies and data flow

```text
Institution + master data
        ↓
Student admission / employee setup
        ↓
Roles, menus, permissions ──→ Admin access and visible navigation
        ↓
Notices + published events ──→ Public website API and public display
        ↓
Fee structures ──→ Student fee assignments ──→ Invoices ──→ Collections / waivers / reports
```

### What is not yet represented as a finished end-to-end module

The repository contains reusable components for attendance, examinations/results, reports/exports, and class routines, but the current admin router/API route inventory does not show corresponding complete end-to-end modules. Treat these as **future implementation candidates**, not released functionality, until their routes, database design, permissions, UI integration, and verification are completed.

Likely next feature areas based on existing components:

- Student and teacher attendance with daily entry and monthly reports.
- Examination setup, marks entry, result processing, transcript, and tabulation sheets.
- Academic subject/routine management and teacher assignment workflows.
- Formal printable/exportable reports and receipts.
- Parent/student-facing portal, notifications, and online payment integration (not currently implemented).

## Database workflow

- Use `database/mysql-schema.sql` as the complete schema reference for a fresh environment.
- For deployed databases, add dated, focused migrations in `database/migrations/` rather than editing historical migrations.
- Document and run new migrations before depending on their columns in production.
- Several newer modules also call startup helpers (`ensureFeeSchema`, `ensureEventSchema`, `ensureNoticeSchema`, `ensureEmployeeSchema`, and `ensureSecurityCatalog`). These help older installations catch up, but migrations remain the auditable deployment record.
- Never place production credentials, database exports, or personal data in Git.

### Required environment configuration

Create `apps/api/.env` from `apps/api/.env.example`. It contains database credentials, the JWT secret, Brevo email configuration, and BulkSMSBD OTP configuration. Keep all secrets server-side and never add them to either frontend.

Current password-reset capabilities:

- Email reset through Brevo, using a hashed single-use reset token.
- Mobile OTP reset through BulkSMSBD, normalized for Bangladesh mobile formats.
- OTP expires after five minutes, permits five attempts, and is limited to two reset messages per user per calendar day.

Read `apps/api/README.md` before changing these flows or applying their migrations.

## Local development

```powershell
Set-Location D:\pbm
npm install
Copy-Item apps\api\.env.example apps\api\.env
# Edit apps\api\.env with local MySQL and JWT values.

# Terminal 1: public site + admin development host
npm run dev

# Terminal 2: API
npm run dev:api
```

Useful endpoints:

- Public site: `http://127.0.0.1:5173`
- Admin login: `http://127.0.0.1:5173/admin/login`
- API health: `http://127.0.0.1:5000/api/health`

`npm run dev:all` starts the frontend and API together. Run `npm run build` before handoff or deployment to compile both Vue apps. There is currently no dedicated automated test or lint script in the root `package.json`; use a successful build plus focused manual API/UI checks as the baseline verification.

## Production deployment

The intended deployment target is Windows VPS. Follow `deploy/windows-vps/README.md`.

Typical deployment sequence:

```powershell
npm ci
# Apply required database migrations after backup.
npm run build
pm2 reload school-management-api --update-env
```

Back up the MySQL database and persistent upload folders before deployment. Treat `apps/api/uploads/` as operational data, not a build artifact. Keep port 5000 private and use Nginx (or the included Caddy example) for public TLS traffic.

## Current work state — do not overwrite

At this handoff snapshot, the Git worktree has **uncommitted work**. Review it with `git status --short` and `git diff` before editing or committing. The main active feature set is:

- **Fees management**: fee heads, structures, automatic student assignments, invoices, collections, waivers, reports, API routes, schema support, admin screens, routes, permissions, and nested fee menus.
- **Events management**: event schema, route, admin screen, public API output, and public website rendering.
- **Employee/student support updates**: employee addresses and updates to student/employee API flows.

Files newly added in this worktree at the snapshot include:

```text
apps/admin/src/views/event/EventManagementView.vue
apps/admin/src/views/fees/FeesManagementView.vue
apps/api/src/routes/eventRoutes.js
apps/api/src/routes/feeRoutes.js
apps/api/src/utils/autoAssignFees.js
apps/api/src/utils/ensureEventSchema.js
apps/api/src/utils/ensureFeeSchema.js
database/migrations/20260719_employee_addresses.sql
database/migrations/20260719_events.sql
database/migrations/20260719_fees.sql
```

Before committing this feature set, verify the actual diff, apply the three migrations to a disposable/local database, test admin login/permissions, create and publish an event, exercise each fee workflow, and confirm the public site can load notices/events when the API is available and show its fallback safely when it is not.

## Recent committed history

Recent commits indicate the development sequence:

```text
111d222  User role not assigned error return
529fd62  SMS daily limit 2 times
9ec5a22  User password reset by OTP
6f20e13  Localhost mail send okay
5d8d138  Password reset with Brevo
25770f9  Admin user edit and active-status update
3bdfa5e  SQL database backup
ac2d2e3  Notice module nearly complete
6ec15fe  Student-list pagination update
588d0a7  VPS deployment files
```

Use `git log --oneline -20` and `git show <commit>` for the authoritative details. Commit messages are brief, so inspect code rather than assuming behavior from the message alone.

## Working agreement for a future AI or developer

1. Start with `git status --short`; preserve unrelated user changes.
2. Read the relevant route, UI view, service, schema/migration, and permission catalog before making a change.
3. Make minimal, scoped edits. Use existing Vue component and API-service patterns rather than introducing a parallel architecture.
4. Add database changes through a dated migration and update schema/bootstrap helpers only when backward compatibility requires it.
5. When a feature is protected, make API middleware, admin route metadata, permissions, and menus consistent.
6. Run `npm run build` after frontend changes. For API changes, call `/api/health` and test the affected authenticated endpoint against a local database.
7. Do not commit `.env` files, credentials, generated production builds, or uploads. Avoid committing routine `logs/` changes unless they are intentionally requested diagnostics.
8. In the final handoff, state changed files, database migrations required, commands run, verification results, and any known limitations.

## Known cautions

- `apps/api/src/config/db.js` is powerful but custom; database-dialect changes can break many routes at once.
- Some schema/catalog synchronization runs automatically at API startup. Check server logs after a schema-related change.
- The router currently contains duplicate `students` route declarations. Do not casually reorder routes without checking navigation and permission behavior.
- Use the latest status/diff instead of this snapshot when work has continued after 2026-07-20.

## Suggested first prompt for another AI

```text
Read PROJECT_HANDOFF.md, README.md, and apps/api/README.md first. Inspect git status and do not overwrite uncommitted work. Then summarize the current state, identify all files relevant to my request, implement only the requested scope, run npm run build, and report migrations, tests/checks, and any remaining risks.
```
