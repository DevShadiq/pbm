# Project Handoff — School ERP Exam Module

## Run the project

```powershell
npm run dev:all
```

- Website: `http://localhost:5173`
- API: `http://localhost:5000`
- Admin (production build served by API): `http://localhost:5000/admin`

## Current Exam & Results work

- Sidebar menu: Exam & Results with Exam Setup, Class-wise Subjects, Subject Entry, Routine & Seating, Candidates, Marks, Results, Documents and Reports.
- Exam Setup uses modal forms for Add/Edit Exam and Add/Edit Subject. Subject list offers Edit/Delete.
- Subject Entry supports `MAIN`, `OPTIONAL`, and `FOURTH_SUBJECT`, plus Written, MCQ, Practical and Viva marks.
- Class-wise Subjects maps approved subjects to each class.
- Routine Generator schedules configured subjects consecutively from a chosen date/time and can skip Friday.
- Result workflow includes candidate generation, marks entry, result generation/publishing and document issue registration.

## Important files

- `apps/admin/src/views/exam/ExamManagementView.vue`
- `apps/admin/src/views/exam/SubjectEntryView.vue`
- `apps/admin/src/views/exam/ClassSubjectSetupView.vue`
- `apps/admin/src/views/exam/RoutineGeneratorView.vue`
- `apps/api/src/routes/examRoutes.js`
- `apps/api/src/utils/ensureExamSchema.js`
- `apps/api/src/utils/ensureSecurityCatalog.js`

## Date rule

- Database driver uses `dateStrings: true` so a SQL date remains a date-only value and cannot shift by timezone.
- User-facing date standard: `DD-MON-YYYY`, for example `09-AUG-2026`.
- Do not use `new Date(sqlDate).toISOString()` for a calendar date.

## Follow-up recommendations

1. Format every remaining public/print date using the date rule above.
2. Add component-level mark entry for Written, MCQ, Practical and Viva from the subject definition.
3. Add role-specific approval and audit screens for marks and result publication.
