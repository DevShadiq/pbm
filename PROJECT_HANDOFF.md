# Project Handoff — School ERP Exam Module

Last updated: 29-Jul-2026

## Run the project

```powershell
npm run dev:all
```

- Website: `http://localhost:5173`
- API: `http://localhost:5000`
- Admin production build: `http://localhost:5000/admin`

## Completed Exam & Results work

### Navigation and access

- The **Exam & Results** submenu is seeded in this order:
  1. Subject Entry
  2. Class-wise Subjects
  3. Exam Setup
  4. Exam Dashboard
  5. Routine & Seating
  6. Candidates & Admit Cards
  7. Marks Entry & Verification
  8. Results & Merit List
  9. Marksheet & Transcript
  10. Exam Reports
- Sidebar is an accordion: a user click opens one parent menu and collapses the others. On reload, only the parent of the active page is expanded.
- Subject entry and class-subject changes use `subject.management` permissions. Super Admin bypasses normal permission checks; non-super users require the assigned role/manual permissions.

### Subject master and curriculum

- Subject Entry has modal Add/Edit forms, Search, curriculum filter, Edit/Delete actions, professional alternating table rows, and Status badges.
- Subjects support `MAIN`, `OPTIONAL`, `FOURTH_SUBJECT`, full/pass marks, Written, MCQ, Practical, and Viva components.
- Institution Type drives the available curriculum subjects:
  - School → `SCHOOL`
  - College → `COLLEGE`
  - School & College → `SCHOOL` and `COLLEGE`
  - Madrasa → `MADRASA`
  - Coaching Center → `COACHING_CENTER`
  - University → `UNIVERSITY`
  - Polytechnic → `POLYTECHNIC`
  - Vocational Institute → `VOCATIONAL_INSTITUTE`
  - No Institution Type → all curriculum categories are available.
- `ALL` / **All Institutions** is a curriculum option. Subjects with this value appear in every institution type.
- Subjects have `ACTIVE` / `INACTIVE` status. Inactive subjects stay visible in historical records but cannot be used in new class-subject assignments or exam-subject transactions.
- `subject_name_bn` was added to `sms.subjects`. The supplied Bangla mapping was applied to the current database and verified: all **175** existing subjects have Bangla names. The Subject List displays English plus Bangla name, and modal Add/Edit supports Bangla name entry.

### Class-wise Subjects

- Class-wise Subject LOV only shows **active** subjects applicable to the institution type, including `ALL` subjects.
- LOV displays the curriculum label and is searchable.
- Assign Subject opens in a modal; existing assignments have **Edit** and Remove actions.
- Edit changes sort order and Mandatory/Optional status without changing the assigned subject.

### Exam setup, routine and seating

- Exam Setup has modal Add/Edit Exam and Add/Edit Exam Subject forms.
- Routine Generator can generate a consecutive routine from a selected date/time, skip Friday, manually edit individual schedules, reschedule from a date, and generate classroom-capacity-based seating.
- Candidate generation, marks entry/verification, result generation/publish, document issue registration, and related routes exist in the API.
- The API blocks inactive subjects from being added to a new exam transaction.

### Dashboard

- `/exams` is the Exam Dashboard and `/exams/setup` is the Exam Setup page.
- Dashboard API: `GET /api/exams/dashboard/overview`.
- Dashboard shows total/scheduled/draft/completed exams, candidates, attendance/absent marks entries, pass/fail/pending result counts, rates, and recent exam progress.

### UI and modal behavior

- Admin entry modals close through Save, Cancel, or close buttons; they do not close by clicking the backdrop.
- Website home-page notice/admission/gallery modals close from the outside overlay.
- Shared `BaseSelect` is now a professional searchable dropdown: search input, selected checkmark, keyboard Escape close, click-outside close, hover/focus styles, and option filtering.
- Class-wise Subject Class and Subject LOVs use this searchable component. Existing forms that already use `BaseSelect` receive the new UI automatically.

## Data and date rules

- Database driver uses `dateStrings: true` so a SQL date remains a date-only value and cannot shift through UTC.
- User-facing date standard is **`DD-MON-YYYY`**, for example `09-AUG-2026`.
- Do not use `new Date(sqlDate).toISOString()` for a calendar-only date. Convert dates carefully for native date inputs.
- The live database has the Bangla-subject mapping applied. If a fresh database is created, rerun the supplied subject-name SQL mapping or convert it into a permanent seed migration first.

## Important files

- `apps/admin/src/views/exam/ExamManagementView.vue` — dashboard and exam setup
- `apps/admin/src/views/exam/SubjectEntryView.vue` — curriculum, status and Bangla subject names
- `apps/admin/src/views/exam/ClassSubjectSetupView.vue` — class-wise assignment and searchable LOV
- `apps/admin/src/views/exam/RoutineGeneratorView.vue` — routine, reschedule and seating UI
- `apps/admin/src/components/common/BaseSelect.vue` — shared searchable dropdown
- `apps/admin/src/components/layout/SidebarMenu.vue` — sidebar accordion/active parent behavior
- `apps/api/src/routes/examRoutes.js` — Exam API, permissions and dashboard aggregates
- `apps/api/src/utils/ensureExamSchema.js` — non-destructive Exam/Subject schema upgrades
- `apps/api/src/utils/ensureSecurityCatalog.js` — Exam submenu seed order
- `apps/api/src/config/db.js` — date-only database configuration

## Suggested future development

1. Turn the provided Bangla subject SQL mapping into a versioned API seed/migration for new databases.
2. Show Bangla names consistently in routine, marks entry, result, marksheet, transcript, and print views.
3. Add component-level marks entry for Written, MCQ, Practical, and Viva instead of only the aggregate subject mark.
4. Add audit logs and approval history for subject modifications, marks verification, result generation, and publication.
5. Convert remaining large native `<select>` LOVs (especially Fees, Student, and Exam workflow screens) to `BaseSelect` where search is useful.
6. Add dashboard date/year/exam filters and drill-down links to candidate attendance and result lists.
