BEGIN;

CREATE SCHEMA IF NOT EXISTS sms;
SET search_path TO sms, public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

/* ============================================================
   0. COMMON FUNCTIONS
   ============================================================ */

CREATE OR REPLACE FUNCTION sms.fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* ============================================================
   1. CORE ORGANIZATION / MULTI-BRANCH
   ============================================================ */

CREATE TABLE sms.institutions (
  institution_id      BIGSERIAL PRIMARY KEY,
  institution_code    VARCHAR(30) UNIQUE NOT NULL,
  institution_name    VARCHAR(200) NOT NULL,
  institution_type    VARCHAR(50) NOT NULL, -- School, College, Madrasa, Coaching, etc.
  eiin_no             VARCHAR(50),
  registration_no     VARCHAR(80),
  phone               VARCHAR(30),
  email               VARCHAR(150),
  website             VARCHAR(150),
  logo_url            TEXT,
  address_line        TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_institutions_status CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE sms.branches (
  branch_id           BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  branch_code         VARCHAR(30) NOT NULL,
  branch_name         VARCHAR(150) NOT NULL,
  branch_type         VARCHAR(50), -- Main, Sub Branch, Campus
  phone               VARCHAR(30),
  email               VARCHAR(150),
  address_line        TEXT,
  is_main_branch      BOOLEAN NOT NULL DEFAULT FALSE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_branches_code UNIQUE (institution_id, branch_code),
  CONSTRAINT chk_branches_status CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE sms.academic_years (
  academic_year_id    BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  year_name           VARCHAR(30) NOT NULL, -- 2026
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  is_current          BOOLEAN NOT NULL DEFAULT FALSE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_academic_years UNIQUE (institution_id, year_name),
  CONSTRAINT chk_academic_year_dates CHECK (end_date >= start_date)
);

CREATE TABLE sms.academic_sessions (
  session_id          BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  academic_year_id    BIGINT REFERENCES sms.academic_years(academic_year_id),
  session_name        VARCHAR(80) NOT NULL, -- 2026, 2025-26, Spring, Board Exam Year etc.
  session_type        VARCHAR(50) DEFAULT 'ACADEMIC',
  start_date          DATE,
  end_date            DATE,
  is_current          BOOLEAN NOT NULL DEFAULT FALSE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_academic_sessions UNIQUE (institution_id, session_name, session_type)
);

CREATE TABLE sms.lookup_types (
  lookup_type_id      BIGSERIAL PRIMARY KEY,
  type_code           VARCHAR(50) UNIQUE NOT NULL,
  type_name           VARCHAR(100) NOT NULL,
  description         TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE sms.lookup_values (
  lookup_value_id     BIGSERIAL PRIMARY KEY,
  lookup_type_id      BIGINT NOT NULL REFERENCES sms.lookup_types(lookup_type_id) ON DELETE CASCADE,
  value_code          VARCHAR(50) NOT NULL,
  value_name          VARCHAR(150) NOT NULL,
  sort_order          INT DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_lookup_values UNIQUE (lookup_type_id, value_code)
);

/* ============================================================
   2. AUTHENTICATION, USER, ROLE, MENU PERMISSION
   ============================================================ */

CREATE TABLE sms.app_users (
  user_id             BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  branch_id           BIGINT REFERENCES sms.branches(branch_id) ON DELETE SET NULL,
  username            VARCHAR(80) UNIQUE NOT NULL,
  email               VARCHAR(150) UNIQUE,
  mobile              VARCHAR(30),
  password_hash       TEXT NOT NULL,
  full_name           VARCHAR(150) NOT NULL,
  user_type           VARCHAR(30) NOT NULL DEFAULT 'STAFF', -- ADMIN, TEACHER, STAFF, STUDENT, GUARDIAN
  avatar_url          TEXT,
  is_super_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at       TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_app_users_type CHECK (user_type IN ('SUPER_ADMIN','ADMIN','TEACHER','STAFF','STUDENT','GUARDIAN'))
);

CREATE TABLE sms.roles (
  role_id             BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  role_code           VARCHAR(50) NOT NULL,
  role_name           VARCHAR(100) NOT NULL,
  description         TEXT,
  is_system_role      BOOLEAN NOT NULL DEFAULT FALSE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_roles UNIQUE (institution_id, role_code)
);

CREATE TABLE sms.permissions (
  permission_id       BIGSERIAL PRIMARY KEY,
  permission_code     VARCHAR(100) UNIQUE NOT NULL, -- student.create, fee.collect
  permission_name     VARCHAR(150) NOT NULL,
  module_name         VARCHAR(80) NOT NULL,
  description         TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE sms.role_permissions (
  role_id             BIGINT NOT NULL REFERENCES sms.roles(role_id) ON DELETE CASCADE,
  permission_id       BIGINT NOT NULL REFERENCES sms.permissions(permission_id) ON DELETE CASCADE,
  can_view            BOOLEAN NOT NULL DEFAULT TRUE,
  can_create          BOOLEAN NOT NULL DEFAULT FALSE,
  can_update          BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete          BOOLEAN NOT NULL DEFAULT FALSE,
  can_approve         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE sms.user_roles (
  user_id             BIGINT NOT NULL REFERENCES sms.app_users(user_id) ON DELETE CASCADE,
  role_id             BIGINT NOT NULL REFERENCES sms.roles(role_id) ON DELETE CASCADE,
  branch_id           BIGINT REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id, branch_id)
);

CREATE TABLE sms.menus (
  menu_id             BIGSERIAL PRIMARY KEY,
  parent_menu_id      BIGINT REFERENCES sms.menus(menu_id) ON DELETE SET NULL,
  menu_code           VARCHAR(80) UNIQUE NOT NULL,
  menu_title          VARCHAR(120) NOT NULL,
  route_path          VARCHAR(200),
  icon_name           VARCHAR(80),
  sort_order          INT NOT NULL DEFAULT 0,
  is_visible          BOOLEAN NOT NULL DEFAULT TRUE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE sms.role_menus (
  role_id             BIGINT NOT NULL REFERENCES sms.roles(role_id) ON DELETE CASCADE,
  menu_id             BIGINT NOT NULL REFERENCES sms.menus(menu_id) ON DELETE CASCADE,
  can_access          BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (role_id, menu_id)
);

CREATE TABLE sms.user_sessions (
  session_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             BIGINT NOT NULL REFERENCES sms.app_users(user_id) ON DELETE CASCADE,
  refresh_token_hash  TEXT,
  ip_address          INET,
  user_agent          TEXT,
  expires_at          TIMESTAMPTZ NOT NULL,
  revoked_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sms.password_reset_tokens (
  token_id            BIGSERIAL PRIMARY KEY,
  user_id             BIGINT NOT NULL REFERENCES sms.app_users(user_id) ON DELETE CASCADE,
  token_hash          TEXT NOT NULL,
  expires_at          TIMESTAMPTZ NOT NULL,
  used_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sms.login_audit (
  login_audit_id      BIGSERIAL PRIMARY KEY,
  user_id             BIGINT REFERENCES sms.app_users(user_id) ON DELETE SET NULL,
  username            VARCHAR(100),
  login_status        VARCHAR(20) NOT NULL, -- SUCCESS, FAILED
  failure_reason      TEXT,
  ip_address          INET,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* ============================================================
   3. ACADEMIC MASTER SETUP
   ============================================================ */

CREATE TABLE sms.education_boards (
  board_id            BIGSERIAL PRIMARY KEY,
  board_code          VARCHAR(30) UNIQUE NOT NULL,
  board_name          VARCHAR(120) NOT NULL,
  country_name        VARCHAR(80) DEFAULT 'Bangladesh',
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE sms.mediums (
  medium_id           BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  medium_code         VARCHAR(30) NOT NULL,
  medium_name         VARCHAR(80) NOT NULL, -- Bangla, English Version, English Medium
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_mediums UNIQUE (institution_id, medium_name),
  CONSTRAINT uk_mediums_code UNIQUE (institution_id, medium_code)
);

CREATE TABLE sms.shifts (
  shift_id            BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  shift_name          VARCHAR(80) NOT NULL, -- Morning, Day, Evening
  start_time          TIME,
  end_time            TIME,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_shifts UNIQUE (institution_id, shift_name)
);

CREATE TABLE sms.class_levels (
  class_id            BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  class_code          VARCHAR(30) NOT NULL,
  class_name          VARCHAR(100) NOT NULL, -- Play, One, Ten, HSC 1st Year
  numeric_level       INT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_class_levels UNIQUE (institution_id, class_code)
);

CREATE TABLE sms.groups (
  group_id            BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  group_code          VARCHAR(30) NOT NULL,
  group_name          VARCHAR(100) NOT NULL, -- Science, Business Studies, Humanities, General
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_groups UNIQUE (institution_id, group_name),
  CONSTRAINT uk_groups_code UNIQUE (institution_id, group_code)
);

CREATE TABLE sms.sections (
  section_id          BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  section_code        VARCHAR(30) NOT NULL,
  section_name        VARCHAR(50) NOT NULL, -- A, B, C
  capacity            INT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_sections UNIQUE (institution_id, section_name),
  CONSTRAINT uk_sections_code UNIQUE (institution_id, section_code)
);

CREATE TABLE sms.classrooms (
  classroom_id        BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  room_no             VARCHAR(50) NOT NULL,
  building_name       VARCHAR(100),
  floor_no            VARCHAR(30),
  capacity            INT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_classrooms UNIQUE (branch_id, room_no)
);

CREATE TABLE sms.subjects (
  subject_id          BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  subject_code        VARCHAR(30) NOT NULL,
  subject_name        VARCHAR(150) NOT NULL,
  subject_type        VARCHAR(30) DEFAULT 'REGULAR', -- REGULAR, OPTIONAL, FOURTH_SUBJECT
  full_marks          NUMERIC(8,2) DEFAULT 100,
  pass_marks          NUMERIC(8,2) DEFAULT 33,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_subjects UNIQUE (institution_id, subject_code)
);

CREATE TABLE sms.class_subjects (
  class_subject_id    BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  class_id            BIGINT NOT NULL REFERENCES sms.class_levels(class_id) ON DELETE CASCADE,
  group_id            BIGINT REFERENCES sms.groups(group_id) ON DELETE SET NULL,
  subject_id          BIGINT NOT NULL REFERENCES sms.subjects(subject_id) ON DELETE CASCADE,
  is_mandatory        BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order          INT DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_class_subjects UNIQUE (class_id, group_id, subject_id)
);

CREATE TABLE sms.academic_batches (
  batch_id            BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  academic_year_id    BIGINT NOT NULL REFERENCES sms.academic_years(academic_year_id) ON DELETE CASCADE,
  class_id            BIGINT NOT NULL REFERENCES sms.class_levels(class_id),
  group_id            BIGINT REFERENCES sms.groups(group_id),
  section_id          BIGINT REFERENCES sms.sections(section_id),
  medium_id           BIGINT REFERENCES sms.mediums(medium_id),
  shift_id            BIGINT REFERENCES sms.shifts(shift_id),
  classroom_id        BIGINT REFERENCES sms.classrooms(classroom_id),
  batch_name          VARCHAR(150) NOT NULL,
  capacity            INT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_academic_batches UNIQUE (branch_id, academic_year_id, class_id, group_id, section_id, medium_id, shift_id)
);

/* ============================================================
   4. STUDENT ADMISSION / PROFILE / GUARDIAN
   ============================================================ */

CREATE TABLE sms.students (
  student_id          BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  user_id             BIGINT UNIQUE REFERENCES sms.app_users(user_id) ON DELETE SET NULL,
  student_no          VARCHAR(50) NOT NULL,
  admission_no        VARCHAR(50),
  registration_no     VARCHAR(80),
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100),
  full_name           VARCHAR(180) GENERATED ALWAYS AS (trim(coalesce(first_name,'') || ' ' || coalesce(last_name,''))) STORED,
  gender              VARCHAR(20),
  date_of_birth       DATE,
  birth_certificate_no VARCHAR(80),
  nid_no              VARCHAR(80),
  blood_group         VARCHAR(10),
  religion            VARCHAR(50),
  nationality         VARCHAR(80) DEFAULT 'Bangladeshi',
  photo_url           TEXT,
  mobile              VARCHAR(30),
  email               VARCHAR(150),
  status              VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, TC, GRADUATED, DROPOUT
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_students_no UNIQUE (institution_id, student_no),
  CONSTRAINT chk_students_gender CHECK (gender IS NULL OR gender IN ('MALE','FEMALE','OTHER'))
);

CREATE TABLE sms.student_admissions (
  admission_id        BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id),
  academic_year_id    BIGINT NOT NULL REFERENCES sms.academic_years(academic_year_id),
  admission_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  admission_type      VARCHAR(30) DEFAULT 'NEW', -- NEW, TRANSFER, RE_ADMISSION
  previous_institute  VARCHAR(200),
  previous_class      VARCHAR(100),
  approved_by         BIGINT REFERENCES sms.app_users(user_id),
  approval_status     VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  remarks             TEXT,
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sms.guardians (
  guardian_id         BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  user_id             BIGINT UNIQUE REFERENCES sms.app_users(user_id) ON DELETE SET NULL,
  guardian_name       VARCHAR(150) NOT NULL,
  relation_name       VARCHAR(50), -- Father, Mother, Uncle etc.
  occupation          VARCHAR(100),
  nid_no              VARCHAR(80),
  mobile              VARCHAR(30),
  alternate_mobile    VARCHAR(30),
  email               VARCHAR(150),
  monthly_income      NUMERIC(12,2),
  address_line        TEXT,
  photo_url           TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sms.student_guardians (
  student_guardian_id BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  guardian_id         BIGINT NOT NULL REFERENCES sms.guardians(guardian_id) ON DELETE CASCADE,
  relation_type       VARCHAR(50) NOT NULL, -- FATHER, MOTHER, LOCAL_GUARDIAN
  is_primary          BOOLEAN NOT NULL DEFAULT FALSE,
  is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_student_guardians UNIQUE (student_id, guardian_id, relation_type)
);

CREATE TABLE sms.student_addresses (
  address_id          BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  address_type        VARCHAR(30) NOT NULL, -- PRESENT, PERMANENT
  village_road        VARCHAR(200),
  post_office         VARCHAR(120),
  thana_upazila       VARCHAR(120),
  district            VARCHAR(120),
  division            VARCHAR(120),
  postal_code         VARCHAR(20),
  country             VARCHAR(80) DEFAULT 'Bangladesh',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_student_addresses UNIQUE (student_id, address_type)
);

CREATE TABLE sms.student_enrollments (
  enrollment_id       BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id),
  academic_year_id    BIGINT NOT NULL REFERENCES sms.academic_years(academic_year_id),
  batch_id            BIGINT NOT NULL REFERENCES sms.academic_batches(batch_id),
  roll_no             VARCHAR(30),
  class_id            BIGINT NOT NULL REFERENCES sms.class_levels(class_id),
  group_id            BIGINT REFERENCES sms.groups(group_id),
  section_id          BIGINT REFERENCES sms.sections(section_id),
  medium_id           BIGINT REFERENCES sms.mediums(medium_id),
  shift_id            BIGINT REFERENCES sms.shifts(shift_id),
  enrollment_status   VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PROMOTED, TRANSFERRED, DROPPED
  start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date            DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_student_year UNIQUE (student_id, academic_year_id),
  CONSTRAINT uk_batch_roll UNIQUE (batch_id, roll_no)
);

CREATE TABLE sms.student_documents (
  document_id         BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  document_type       VARCHAR(80) NOT NULL, -- Birth Certificate, Photo, TC, Marksheet
  document_title      VARCHAR(150),
  file_url            TEXT NOT NULL,
  uploaded_by         BIGINT REFERENCES sms.app_users(user_id),
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE sms.student_status_history (
  status_history_id   BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  old_status          VARCHAR(30),
  new_status          VARCHAR(30) NOT NULL,
  effective_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  reason              TEXT,
  changed_by          BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sms.promotions (
  promotion_id        BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  from_academic_year_id BIGINT NOT NULL REFERENCES sms.academic_years(academic_year_id),
  to_academic_year_id BIGINT NOT NULL REFERENCES sms.academic_years(academic_year_id),
  promotion_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  promotion_status    VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, CANCELLED
  remarks             TEXT,
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  approved_by         BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sms.promotion_details (
  promotion_detail_id BIGSERIAL PRIMARY KEY,
  promotion_id        BIGINT NOT NULL REFERENCES sms.promotions(promotion_id) ON DELETE CASCADE,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id),
  from_enrollment_id  BIGINT REFERENCES sms.student_enrollments(enrollment_id),
  to_batch_id         BIGINT REFERENCES sms.academic_batches(batch_id),
  to_roll_no          VARCHAR(30),
  result_status       VARCHAR(30), -- PASSED, FAILED, PROMOTED
  remarks             TEXT,
  CONSTRAINT uk_promotion_student UNIQUE (promotion_id, student_id)
);

/* ============================================================
   5. HR / TEACHER / STAFF
   ============================================================ */

CREATE TABLE sms.departments (
  department_id       BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  department_code     VARCHAR(30) NOT NULL,
  department_name     VARCHAR(120) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_departments UNIQUE (institution_id, department_code)
);

CREATE TABLE sms.designations (
  designation_id      BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  designation_code    VARCHAR(30) NOT NULL,
  designation_name    VARCHAR(120) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_designations UNIQUE (institution_id, designation_code)
);

CREATE TABLE sms.employees (
  employee_id         BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  branch_id           BIGINT REFERENCES sms.branches(branch_id),
  user_id             BIGINT UNIQUE REFERENCES sms.app_users(user_id) ON DELETE SET NULL,
  employee_no         VARCHAR(50) NOT NULL,
  first_name          VARCHAR(100) NOT NULL,
  last_name           VARCHAR(100),
  full_name           VARCHAR(180) GENERATED ALWAYS AS (trim(coalesce(first_name,'') || ' ' || coalesce(last_name,''))) STORED,
  employee_type       VARCHAR(30) NOT NULL DEFAULT 'STAFF', -- TEACHER, STAFF, ADMIN
  department_id       BIGINT REFERENCES sms.departments(department_id),
  designation_id      BIGINT REFERENCES sms.designations(designation_id),
  joining_date        DATE,
  date_of_birth       DATE,
  gender              VARCHAR(20),
  blood_group         VARCHAR(10),
  religion            VARCHAR(50),
  nid_no              VARCHAR(80),
  mobile              VARCHAR(30),
  email               VARCHAR(150),
  photo_url           TEXT,
  employment_status   VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RESIGNED, TERMINATED
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_employees_no UNIQUE (institution_id, employee_no),
  CONSTRAINT chk_employees_type CHECK (employee_type IN ('TEACHER','STAFF','ADMIN'))
);

CREATE TABLE sms.employee_addresses (
  address_id          BIGSERIAL PRIMARY KEY,
  employee_id         BIGINT NOT NULL REFERENCES sms.employees(employee_id) ON DELETE CASCADE,
  address_type        VARCHAR(30) NOT NULL, -- PRESENT, PERMANENT
  address_line        TEXT,
  district            VARCHAR(120),
  division            VARCHAR(120),
  postal_code         VARCHAR(20),
  country             VARCHAR(80) DEFAULT 'Bangladesh',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_employee_addresses UNIQUE (employee_id, address_type)
);

CREATE TABLE sms.teacher_subject_assignments (
  assignment_id       BIGSERIAL PRIMARY KEY,
  employee_id         BIGINT NOT NULL REFERENCES sms.employees(employee_id) ON DELETE CASCADE,
  academic_year_id    BIGINT NOT NULL REFERENCES sms.academic_years(academic_year_id),
  batch_id            BIGINT NOT NULL REFERENCES sms.academic_batches(batch_id),
  subject_id          BIGINT NOT NULL REFERENCES sms.subjects(subject_id),
  is_class_teacher    BOOLEAN NOT NULL DEFAULT FALSE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_teacher_subject UNIQUE (employee_id, academic_year_id, batch_id, subject_id)
);

CREATE TABLE sms.leave_types (
  leave_type_id       BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  leave_code          VARCHAR(30) NOT NULL,
  leave_name          VARCHAR(100) NOT NULL,
  yearly_limit_days   NUMERIC(6,2),
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_leave_types UNIQUE (institution_id, leave_code)
);

CREATE TABLE sms.employee_leave_applications (
  leave_application_id BIGSERIAL PRIMARY KEY,
  employee_id         BIGINT NOT NULL REFERENCES sms.employees(employee_id) ON DELETE CASCADE,
  leave_type_id       BIGINT NOT NULL REFERENCES sms.leave_types(leave_type_id),
  from_date           DATE NOT NULL,
  to_date             DATE NOT NULL,
  total_days          NUMERIC(6,2) NOT NULL,
  reason              TEXT,
  approval_status     VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  approved_by         BIGINT REFERENCES sms.app_users(user_id),
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_leave_dates CHECK (to_date >= from_date)
);

/* ============================================================
   6. ATTENDANCE
   ============================================================ */

CREATE TABLE sms.attendance_devices (
  device_id           BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  device_code         VARCHAR(50) NOT NULL,
  device_name         VARCHAR(120) NOT NULL,
  device_type         VARCHAR(50), -- BIOMETRIC, RFID, MOBILE_APP
  ip_address          INET,
  location_name       VARCHAR(120),
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_attendance_devices UNIQUE (branch_id, device_code)
);

CREATE TABLE sms.student_attendance (
  attendance_id       BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  enrollment_id       BIGINT REFERENCES sms.student_enrollments(enrollment_id) ON DELETE SET NULL,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id),
  attendance_date     DATE NOT NULL,
  in_time             TIME,
  out_time            TIME,
  attendance_status   VARCHAR(30) NOT NULL DEFAULT 'PRESENT', -- PRESENT, ABSENT, LATE, LEAVE, HOLIDAY
  device_id           BIGINT REFERENCES sms.attendance_devices(device_id),
  remarks             TEXT,
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_student_attendance UNIQUE (student_id, attendance_date)
);

CREATE TABLE sms.employee_attendance (
  attendance_id       BIGSERIAL PRIMARY KEY,
  employee_id         BIGINT NOT NULL REFERENCES sms.employees(employee_id) ON DELETE CASCADE,
  branch_id           BIGINT REFERENCES sms.branches(branch_id),
  attendance_date     DATE NOT NULL,
  in_time             TIME,
  out_time            TIME,
  attendance_status   VARCHAR(30) NOT NULL DEFAULT 'PRESENT',
  device_id           BIGINT REFERENCES sms.attendance_devices(device_id),
  remarks             TEXT,
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_employee_attendance UNIQUE (employee_id, attendance_date)
);

CREATE TABLE sms.holidays (
  holiday_id          BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  branch_id           BIGINT REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  holiday_title       VARCHAR(150) NOT NULL,
  from_date           DATE NOT NULL,
  to_date             DATE NOT NULL,
  holiday_type        VARCHAR(50), -- Govt, Weekly, Institute
  description         TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_holiday_dates CHECK (to_date >= from_date)
);

/* ============================================================
   7. ROUTINE / NOTICE / COMMUNICATION
   ============================================================ */

CREATE TABLE sms.class_routines (
  routine_id          BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  academic_year_id    BIGINT NOT NULL REFERENCES sms.academic_years(academic_year_id),
  batch_id            BIGINT NOT NULL REFERENCES sms.academic_batches(batch_id),
  day_name            VARCHAR(15) NOT NULL, -- SATURDAY, SUNDAY
  period_no           INT NOT NULL,
  start_time          TIME NOT NULL,
  end_time            TIME NOT NULL,
  subject_id          BIGINT REFERENCES sms.subjects(subject_id),
  teacher_id          BIGINT REFERENCES sms.employees(employee_id),
  classroom_id        BIGINT REFERENCES sms.classrooms(classroom_id),
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_class_routine UNIQUE (batch_id, day_name, period_no)
);

CREATE TABLE sms.notices (
  notice_id           BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  branch_id           BIGINT REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  notice_title        VARCHAR(200) NOT NULL,
  notice_body         TEXT NOT NULL,
  audience_type       VARCHAR(50) NOT NULL DEFAULT 'ALL', -- ALL, STUDENT, GUARDIAN, TEACHER, STAFF
  publish_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  expire_date         DATE,
  attachment_url      TEXT,
  is_published        BOOLEAN NOT NULL DEFAULT FALSE,
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sms.notification_templates (
  template_id         BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  template_code       VARCHAR(80) NOT NULL,
  template_name       VARCHAR(150) NOT NULL,
  channel             VARCHAR(30) NOT NULL, -- SMS, EMAIL, WHATSAPP, APP
  subject_template    VARCHAR(250),
  body_template       TEXT NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_notification_templates UNIQUE (institution_id, template_code, channel)
);

CREATE TABLE sms.notification_logs (
  notification_log_id BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  template_id         BIGINT REFERENCES sms.notification_templates(template_id),
  channel             VARCHAR(30) NOT NULL,
  recipient_type      VARCHAR(30),
  recipient_id        BIGINT,
  recipient_address   VARCHAR(200),
  subject_text        VARCHAR(250),
  body_text           TEXT,
  send_status         VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, FAILED
  error_message       TEXT,
  sent_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* ============================================================
   8. FEES MANAGEMENT
   ============================================================ */

CREATE TABLE sms.fee_heads (
  fee_head_id         BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  fee_code            VARCHAR(30) NOT NULL,
  fee_name            VARCHAR(120) NOT NULL,
  fee_type            VARCHAR(30) NOT NULL DEFAULT 'REGULAR', -- ADMISSION, TUITION, EXAM, TRANSPORT, OTHER
  is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_fee_heads UNIQUE (institution_id, fee_code)
);

CREATE TABLE sms.fee_structures (
  fee_structure_id    BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  academic_year_id    BIGINT NOT NULL REFERENCES sms.academic_years(academic_year_id),
  class_id            BIGINT NOT NULL REFERENCES sms.class_levels(class_id),
  group_id            BIGINT REFERENCES sms.groups(group_id),
  medium_id           BIGINT REFERENCES sms.mediums(medium_id),
  structure_name      VARCHAR(150) NOT NULL,
  effective_from      DATE NOT NULL,
  effective_to        DATE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_fee_structures UNIQUE (branch_id, academic_year_id, class_id, group_id, medium_id, structure_name)
);

CREATE TABLE sms.fee_structure_details (
  fee_structure_detail_id BIGSERIAL PRIMARY KEY,
  fee_structure_id    BIGINT NOT NULL REFERENCES sms.fee_structures(fee_structure_id) ON DELETE CASCADE,
  fee_head_id         BIGINT NOT NULL REFERENCES sms.fee_heads(fee_head_id),
  amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
  frequency           VARCHAR(30) NOT NULL DEFAULT 'ONE_TIME', -- ONE_TIME, MONTHLY, QUARTERLY, YEARLY
  due_day             INT,
  is_optional         BOOLEAN NOT NULL DEFAULT FALSE,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_fee_structure_details UNIQUE (fee_structure_id, fee_head_id),
  CONSTRAINT chk_fee_amount CHECK (amount >= 0)
);

CREATE TABLE sms.student_fee_assignments (
  assignment_id       BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  enrollment_id       BIGINT NOT NULL REFERENCES sms.student_enrollments(enrollment_id) ON DELETE CASCADE,
  fee_structure_id    BIGINT NOT NULL REFERENCES sms.fee_structures(fee_structure_id),
  discount_percent    NUMERIC(5,2) DEFAULT 0,
  discount_amount     NUMERIC(12,2) DEFAULT 0,
  reason              TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  assigned_by         BIGINT REFERENCES sms.app_users(user_id),
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_student_fee_assignment UNIQUE (student_id, enrollment_id, fee_structure_id)
);

CREATE TABLE sms.fee_invoices (
  invoice_id          BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id),
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id),
  enrollment_id       BIGINT REFERENCES sms.student_enrollments(enrollment_id),
  invoice_no          VARCHAR(50) NOT NULL,
  invoice_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date            DATE,
  billing_month       INT,
  billing_year        INT,
  gross_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  fine_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  invoice_status      VARCHAR(30) NOT NULL DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID, CANCELLED
  remarks             TEXT,
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_fee_invoices_no UNIQUE (branch_id, invoice_no)
);

CREATE TABLE sms.fee_invoice_lines (
  invoice_line_id     BIGSERIAL PRIMARY KEY,
  invoice_id          BIGINT NOT NULL REFERENCES sms.fee_invoices(invoice_id) ON DELETE CASCADE,
  fee_head_id         BIGINT NOT NULL REFERENCES sms.fee_heads(fee_head_id),
  description         VARCHAR(200),
  amount              NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  fine_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_status         VARCHAR(30) NOT NULL DEFAULT 'UNPAID'
);

CREATE TABLE sms.fee_collections (
  collection_id       BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id),
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id),
  receipt_no          VARCHAR(50) NOT NULL,
  collection_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method      VARCHAR(30) NOT NULL DEFAULT 'CASH', -- CASH, BANK, BKASH, NAGAD, CARD
  reference_no        VARCHAR(100),
  total_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  remarks             TEXT,
  collected_by        BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_fee_receipt_no UNIQUE (branch_id, receipt_no)
);

CREATE TABLE sms.fee_collection_lines (
  collection_line_id  BIGSERIAL PRIMARY KEY,
  collection_id       BIGINT NOT NULL REFERENCES sms.fee_collections(collection_id) ON DELETE CASCADE,
  invoice_id          BIGINT NOT NULL REFERENCES sms.fee_invoices(invoice_id),
  invoice_line_id     BIGINT REFERENCES sms.fee_invoice_lines(invoice_line_id),
  paid_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,
  fine_amount         NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE sms.fee_waivers (
  waiver_id           BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  fee_head_id         BIGINT REFERENCES sms.fee_heads(fee_head_id),
  waiver_type         VARCHAR(30) NOT NULL, -- PERCENT, FIXED
  waiver_value        NUMERIC(12,2) NOT NULL,
  effective_from      DATE NOT NULL,
  effective_to        DATE,
  approval_status     VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  approved_by         BIGINT REFERENCES sms.app_users(user_id),
  remarks             TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* ============================================================
   9. ACCOUNTING CORE
   ============================================================ */

CREATE TABLE sms.fiscal_years (
  fiscal_year_id      BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  year_name           VARCHAR(30) NOT NULL,
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  is_current          BOOLEAN NOT NULL DEFAULT FALSE,
  status              VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED
  CONSTRAINT uk_fiscal_years UNIQUE (institution_id, year_name),
  CONSTRAINT chk_fiscal_year_dates CHECK (end_date >= start_date)
);

CREATE TABLE sms.chart_of_accounts (
  account_id          BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  parent_account_id   BIGINT REFERENCES sms.chart_of_accounts(account_id) ON DELETE SET NULL,
  account_code        VARCHAR(50) NOT NULL,
  account_name        VARCHAR(150) NOT NULL,
  account_type        VARCHAR(30) NOT NULL, -- ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
  is_postable         BOOLEAN NOT NULL DEFAULT TRUE,
  opening_balance     NUMERIC(14,2) NOT NULL DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_chart_accounts UNIQUE (institution_id, account_code)
);

CREATE TABLE sms.bank_accounts (
  bank_account_id     BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  branch_id           BIGINT REFERENCES sms.branches(branch_id),
  account_id          BIGINT REFERENCES sms.chart_of_accounts(account_id),
  bank_name           VARCHAR(120) NOT NULL,
  branch_name         VARCHAR(120),
  account_name        VARCHAR(150) NOT NULL,
  account_no          VARCHAR(80) NOT NULL,
  routing_no          VARCHAR(50),
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_bank_accounts UNIQUE (institution_id, account_no)
);

CREATE TABLE sms.journal_vouchers (
  voucher_id          BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  branch_id           BIGINT REFERENCES sms.branches(branch_id),
  fiscal_year_id      BIGINT REFERENCES sms.fiscal_years(fiscal_year_id),
  voucher_no          VARCHAR(50) NOT NULL,
  voucher_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  voucher_type        VARCHAR(30) NOT NULL DEFAULT 'JOURNAL', -- JOURNAL, RECEIPT, PAYMENT, CONTRA
  source_module       VARCHAR(50), -- FEES, PAYROLL, INVENTORY
  source_id           BIGINT,
  narration           TEXT,
  total_debit         NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_credit        NUMERIC(14,2) NOT NULL DEFAULT 0,
  approval_status     VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  approved_by         BIGINT REFERENCES sms.app_users(user_id),
  approved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_journal_vouchers UNIQUE (institution_id, voucher_no),
  CONSTRAINT chk_journal_balance CHECK (total_debit = total_credit)
);

CREATE TABLE sms.journal_lines (
  journal_line_id     BIGSERIAL PRIMARY KEY,
  voucher_id          BIGINT NOT NULL REFERENCES sms.journal_vouchers(voucher_id) ON DELETE CASCADE,
  account_id          BIGINT NOT NULL REFERENCES sms.chart_of_accounts(account_id),
  debit_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  credit_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  line_description    TEXT,
  cost_center         VARCHAR(80),
  CONSTRAINT chk_journal_line_amount CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0)
  )
);

/* ============================================================
   10. EXAM / MARKS / RESULT
   ============================================================ */

CREATE TABLE sms.exam_types (
  exam_type_id        BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  exam_type_code      VARCHAR(30) NOT NULL,
  exam_type_name      VARCHAR(120) NOT NULL, -- Half Yearly, Annual, Class Test
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_exam_types UNIQUE (institution_id, exam_type_code)
);

CREATE TABLE sms.exams (
  exam_id             BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  academic_year_id    BIGINT NOT NULL REFERENCES sms.academic_years(academic_year_id),
  exam_type_id        BIGINT NOT NULL REFERENCES sms.exam_types(exam_type_id),
  exam_name           VARCHAR(150) NOT NULL,
  class_id            BIGINT REFERENCES sms.class_levels(class_id),
  start_date          DATE,
  end_date            DATE,
  result_publish_date DATE,
  exam_status         VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, RUNNING, COMPLETED, PUBLISHED
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_exams UNIQUE (branch_id, academic_year_id, exam_type_id, exam_name, class_id)
);

CREATE TABLE sms.exam_subjects (
  exam_subject_id     BIGSERIAL PRIMARY KEY,
  exam_id             BIGINT NOT NULL REFERENCES sms.exams(exam_id) ON DELETE CASCADE,
  subject_id          BIGINT NOT NULL REFERENCES sms.subjects(subject_id),
  full_marks          NUMERIC(8,2) NOT NULL DEFAULT 100,
  pass_marks          NUMERIC(8,2) NOT NULL DEFAULT 33,
  exam_date           DATE,
  start_time          TIME,
  end_time            TIME,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_exam_subjects UNIQUE (exam_id, subject_id)
);

CREATE TABLE sms.mark_components (
  component_id        BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  component_code      VARCHAR(30) NOT NULL,
  component_name      VARCHAR(100) NOT NULL, -- Written, MCQ, Practical, Viva
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_mark_components UNIQUE (institution_id, component_code)
);

CREATE TABLE sms.exam_subject_components (
  exam_subject_component_id BIGSERIAL PRIMARY KEY,
  exam_subject_id     BIGINT NOT NULL REFERENCES sms.exam_subjects(exam_subject_id) ON DELETE CASCADE,
  component_id        BIGINT NOT NULL REFERENCES sms.mark_components(component_id),
  full_marks          NUMERIC(8,2) NOT NULL,
  pass_marks          NUMERIC(8,2) DEFAULT 0,
  sort_order          INT DEFAULT 0,
  CONSTRAINT uk_exam_subject_components UNIQUE (exam_subject_id, component_id)
);

CREATE TABLE sms.exam_marks (
  mark_id             BIGSERIAL PRIMARY KEY,
  exam_id             BIGINT NOT NULL REFERENCES sms.exams(exam_id) ON DELETE CASCADE,
  exam_subject_id     BIGINT NOT NULL REFERENCES sms.exam_subjects(exam_subject_id) ON DELETE CASCADE,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  component_id        BIGINT REFERENCES sms.mark_components(component_id),
  marks_obtained      NUMERIC(8,2) NOT NULL DEFAULT 0,
  is_absent           BOOLEAN NOT NULL DEFAULT FALSE,
  remarks             TEXT,
  entered_by          BIGINT REFERENCES sms.app_users(user_id),
  entered_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_exam_marks UNIQUE (exam_subject_id, student_id, component_id)
);

CREATE TABLE sms.grading_scales (
  grading_scale_id    BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  scale_name          VARCHAR(100) NOT NULL, -- GPA 5, GPA 4
  max_gpa             NUMERIC(4,2) NOT NULL DEFAULT 5,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_grading_scales UNIQUE (institution_id, scale_name)
);

CREATE TABLE sms.grading_scale_details (
  grade_detail_id     BIGSERIAL PRIMARY KEY,
  grading_scale_id    BIGINT NOT NULL REFERENCES sms.grading_scales(grading_scale_id) ON DELETE CASCADE,
  min_marks           NUMERIC(8,2) NOT NULL,
  max_marks           NUMERIC(8,2) NOT NULL,
  letter_grade        VARCHAR(10) NOT NULL,
  grade_point         NUMERIC(4,2) NOT NULL,
  remarks             VARCHAR(100),
  CONSTRAINT chk_grade_marks CHECK (max_marks >= min_marks)
);

CREATE TABLE sms.student_results (
  result_id           BIGSERIAL PRIMARY KEY,
  exam_id             BIGINT NOT NULL REFERENCES sms.exams(exam_id) ON DELETE CASCADE,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  enrollment_id       BIGINT REFERENCES sms.student_enrollments(enrollment_id),
  total_marks         NUMERIC(10,2) NOT NULL DEFAULT 0,
  obtained_marks      NUMERIC(10,2) NOT NULL DEFAULT 0,
  gpa                 NUMERIC(4,2),
  letter_grade        VARCHAR(10),
  merit_position      INT,
  result_status       VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PASSED, FAILED, ABSENT, PENDING
  failed_subject_count INT NOT NULL DEFAULT 0,
  published_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_student_results UNIQUE (exam_id, student_id)
);

CREATE TABLE sms.student_result_details (
  result_detail_id    BIGSERIAL PRIMARY KEY,
  result_id           BIGINT NOT NULL REFERENCES sms.student_results(result_id) ON DELETE CASCADE,
  subject_id          BIGINT NOT NULL REFERENCES sms.subjects(subject_id),
  full_marks          NUMERIC(8,2) NOT NULL DEFAULT 100,
  pass_marks          NUMERIC(8,2) NOT NULL DEFAULT 33,
  obtained_marks      NUMERIC(8,2) NOT NULL DEFAULT 0,
  letter_grade        VARCHAR(10),
  grade_point         NUMERIC(4,2),
  subject_status      VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PASSED, FAILED, ABSENT
  remarks             TEXT,
  CONSTRAINT uk_student_result_details UNIQUE (result_id, subject_id)
);

/* ============================================================
   11. LIBRARY MANAGEMENT
   ============================================================ */

CREATE TABLE sms.book_categories (
  book_category_id    BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  category_name       VARCHAR(120) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_book_categories UNIQUE (institution_id, category_name)
);

CREATE TABLE sms.books (
  book_id             BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  book_category_id    BIGINT REFERENCES sms.book_categories(book_category_id),
  isbn                VARCHAR(80),
  book_title          VARCHAR(250) NOT NULL,
  author_name         VARCHAR(200),
  publisher_name      VARCHAR(200),
  edition             VARCHAR(80),
  publish_year        INT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sms.book_copies (
  book_copy_id        BIGSERIAL PRIMARY KEY,
  book_id             BIGINT NOT NULL REFERENCES sms.books(book_id) ON DELETE CASCADE,
  branch_id           BIGINT REFERENCES sms.branches(branch_id),
  accession_no        VARCHAR(80) NOT NULL,
  shelf_no            VARCHAR(50),
  purchase_date       DATE,
  purchase_price      NUMERIC(10,2),
  copy_status         VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, ISSUED, LOST, DAMAGED
  CONSTRAINT uk_book_copies UNIQUE (accession_no)
);

CREATE TABLE sms.library_issues (
  issue_id            BIGSERIAL PRIMARY KEY,
  book_copy_id        BIGINT NOT NULL REFERENCES sms.book_copies(book_copy_id),
  member_type         VARCHAR(30) NOT NULL, -- STUDENT, EMPLOYEE
  student_id          BIGINT REFERENCES sms.students(student_id),
  employee_id         BIGINT REFERENCES sms.employees(employee_id),
  issue_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date            DATE NOT NULL,
  return_date         DATE,
  issue_status        VARCHAR(30) NOT NULL DEFAULT 'ISSUED', -- ISSUED, RETURNED, LOST
  fine_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  issued_by           BIGINT REFERENCES sms.app_users(user_id),
  returned_by         BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* ============================================================
   12. TRANSPORT MANAGEMENT
   ============================================================ */

CREATE TABLE sms.vehicles (
  vehicle_id          BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  vehicle_no          VARCHAR(50) NOT NULL,
  vehicle_type        VARCHAR(50),
  capacity            INT,
  driver_name         VARCHAR(150),
  driver_mobile       VARCHAR(30),
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_vehicles UNIQUE (institution_id, vehicle_no)
);

CREATE TABLE sms.transport_routes (
  route_id            BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  route_code          VARCHAR(30) NOT NULL,
  route_name          VARCHAR(150) NOT NULL,
  vehicle_id          BIGINT REFERENCES sms.vehicles(vehicle_id),
  monthly_fee         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_transport_routes UNIQUE (branch_id, route_code)
);

CREATE TABLE sms.transport_stops (
  stop_id             BIGSERIAL PRIMARY KEY,
  route_id            BIGINT NOT NULL REFERENCES sms.transport_routes(route_id) ON DELETE CASCADE,
  stop_name           VARCHAR(150) NOT NULL,
  stop_order          INT DEFAULT 0,
  pickup_time         TIME,
  drop_time           TIME,
  stop_fee            NUMERIC(12,2) DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE sms.student_transport_assignments (
  transport_assignment_id BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  route_id            BIGINT NOT NULL REFERENCES sms.transport_routes(route_id),
  stop_id             BIGINT REFERENCES sms.transport_stops(stop_id),
  start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date            DATE,
  monthly_fee         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* ============================================================
   13. INVENTORY / PROCUREMENT BASIC
   ============================================================ */

CREATE TABLE sms.vendors (
  vendor_id           BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  vendor_code         VARCHAR(30) NOT NULL,
  vendor_name         VARCHAR(150) NOT NULL,
  contact_person      VARCHAR(150),
  mobile              VARCHAR(30),
  email               VARCHAR(150),
  address_line        TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_vendors UNIQUE (institution_id, vendor_code)
);

CREATE TABLE sms.item_categories (
  item_category_id    BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  category_name       VARCHAR(120) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_item_categories UNIQUE (institution_id, category_name)
);

CREATE TABLE sms.items (
  item_id             BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT NOT NULL REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  item_category_id    BIGINT REFERENCES sms.item_categories(item_category_id),
  item_code           VARCHAR(50) NOT NULL,
  item_name           VARCHAR(150) NOT NULL,
  unit_name           VARCHAR(30) NOT NULL DEFAULT 'PCS',
  reorder_level       NUMERIC(12,2) DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_items UNIQUE (institution_id, item_code)
);

CREATE TABLE sms.stock_locations (
  location_id         BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  location_code       VARCHAR(30) NOT NULL,
  location_name       VARCHAR(120) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_stock_locations UNIQUE (branch_id, location_code)
);

CREATE TABLE sms.purchase_orders (
  po_id               BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id),
  vendor_id           BIGINT REFERENCES sms.vendors(vendor_id),
  po_no               VARCHAR(50) NOT NULL,
  po_date             DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date       DATE,
  total_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  po_status           VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, RECEIVED, CANCELLED
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  approved_by         BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_purchase_orders UNIQUE (branch_id, po_no)
);

CREATE TABLE sms.purchase_order_lines (
  po_line_id          BIGSERIAL PRIMARY KEY,
  po_id               BIGINT NOT NULL REFERENCES sms.purchase_orders(po_id) ON DELETE CASCADE,
  item_id             BIGINT NOT NULL REFERENCES sms.items(item_id),
  quantity            NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate                NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount              NUMERIC(14,2) NOT NULL DEFAULT 0,
  remarks             TEXT
);

CREATE TABLE sms.stock_transactions (
  stock_transaction_id BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id),
  location_id         BIGINT REFERENCES sms.stock_locations(location_id),
  item_id             BIGINT NOT NULL REFERENCES sms.items(item_id),
  transaction_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type    VARCHAR(30) NOT NULL, -- IN, OUT, ADJUSTMENT
  source_module       VARCHAR(50),
  source_id           BIGINT,
  quantity            NUMERIC(12,2) NOT NULL,
  rate                NUMERIC(12,2) DEFAULT 0,
  amount              NUMERIC(14,2) DEFAULT 0,
  remarks             TEXT,
  created_by          BIGINT REFERENCES sms.app_users(user_id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* ============================================================
   14. HOSTEL BASIC
   ============================================================ */

CREATE TABLE sms.hostels (
  hostel_id           BIGSERIAL PRIMARY KEY,
  branch_id           BIGINT NOT NULL REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  hostel_name         VARCHAR(150) NOT NULL,
  hostel_type         VARCHAR(30), -- BOYS, GIRLS
  address_line        TEXT,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_hostels UNIQUE (branch_id, hostel_name)
);

CREATE TABLE sms.hostel_rooms (
  hostel_room_id      BIGSERIAL PRIMARY KEY,
  hostel_id           BIGINT NOT NULL REFERENCES sms.hostels(hostel_id) ON DELETE CASCADE,
  room_no             VARCHAR(50) NOT NULL,
  capacity            INT NOT NULL DEFAULT 1,
  monthly_fee         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uk_hostel_rooms UNIQUE (hostel_id, room_no)
);

CREATE TABLE sms.student_hostel_assignments (
  hostel_assignment_id BIGSERIAL PRIMARY KEY,
  student_id          BIGINT NOT NULL REFERENCES sms.students(student_id) ON DELETE CASCADE,
  hostel_room_id      BIGINT NOT NULL REFERENCES sms.hostel_rooms(hostel_room_id),
  start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date            DATE,
  monthly_fee         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* ============================================================
   15. SYSTEM SETTINGS / FILES / AUDIT
   ============================================================ */

CREATE TABLE sms.system_settings (
  setting_id          BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  branch_id           BIGINT REFERENCES sms.branches(branch_id) ON DELETE CASCADE,
  setting_key         VARCHAR(100) NOT NULL,
  setting_value       TEXT,
  setting_group       VARCHAR(80),
  is_encrypted        BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by          BIGINT REFERENCES sms.app_users(user_id),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_system_settings UNIQUE (institution_id, branch_id, setting_key)
);

CREATE TABLE sms.file_attachments (
  attachment_id       BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  module_name         VARCHAR(80) NOT NULL,
  record_id           BIGINT NOT NULL,
  file_name           VARCHAR(250) NOT NULL,
  file_url            TEXT NOT NULL,
  file_type           VARCHAR(80),
  file_size_bytes     BIGINT,
  uploaded_by         BIGINT REFERENCES sms.app_users(user_id),
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE sms.audit_logs (
  audit_log_id        BIGSERIAL PRIMARY KEY,
  institution_id      BIGINT REFERENCES sms.institutions(institution_id) ON DELETE CASCADE,
  user_id             BIGINT REFERENCES sms.app_users(user_id) ON DELETE SET NULL,
  table_name          VARCHAR(120) NOT NULL,
  record_id           BIGINT,
  action_type         VARCHAR(30) NOT NULL, -- INSERT, UPDATE, DELETE, LOGIN, APPROVE
  old_data            JSONB,
  new_data            JSONB,
  ip_address          INET,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

/* ============================================================
   16. INDEXES FOR PERFORMANCE
   ============================================================ */

CREATE INDEX idx_branches_institution ON sms.branches(institution_id);
CREATE INDEX idx_users_inst_branch ON sms.app_users(institution_id, branch_id);
CREATE INDEX idx_students_inst_status ON sms.students(institution_id, status);
CREATE INDEX idx_students_name ON sms.students USING gin (to_tsvector('simple', coalesce(first_name,'') || ' ' || coalesce(last_name,'')));
CREATE INDEX idx_student_enrollments_student ON sms.student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_batch ON sms.student_enrollments(batch_id);
CREATE INDEX idx_student_attendance_date ON sms.student_attendance(branch_id, attendance_date);
CREATE INDEX idx_employee_attendance_date ON sms.employee_attendance(branch_id, attendance_date);
CREATE INDEX idx_fee_invoices_student ON sms.fee_invoices(student_id, invoice_status);
CREATE INDEX idx_fee_invoices_date ON sms.fee_invoices(branch_id, invoice_date);
CREATE INDEX idx_fee_collections_student ON sms.fee_collections(student_id, collection_date);
CREATE INDEX idx_exam_marks_student ON sms.exam_marks(student_id, exam_id);
CREATE INDEX idx_journal_voucher_date ON sms.journal_vouchers(institution_id, voucher_date);
CREATE INDEX idx_audit_logs_table_record ON sms.audit_logs(table_name, record_id);
CREATE INDEX idx_notification_logs_status ON sms.notification_logs(send_status, created_at);

/* ============================================================
   17. UPDATED_AT TRIGGERS
   ============================================================ */

CREATE TRIGGER trg_institutions_updated_at BEFORE UPDATE ON sms.institutions FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON sms.branches FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_academic_years_updated_at BEFORE UPDATE ON sms.academic_years FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_academic_sessions_updated_at BEFORE UPDATE ON sms.academic_sessions FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_app_users_updated_at BEFORE UPDATE ON sms.app_users FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON sms.roles FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_class_levels_updated_at BEFORE UPDATE ON sms.class_levels FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_academic_batches_updated_at BEFORE UPDATE ON sms.academic_batches FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON sms.students FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_student_admissions_updated_at BEFORE UPDATE ON sms.student_admissions FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_guardians_updated_at BEFORE UPDATE ON sms.guardians FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_student_addresses_updated_at BEFORE UPDATE ON sms.student_addresses FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_student_enrollments_updated_at BEFORE UPDATE ON sms.student_enrollments FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_promotions_updated_at BEFORE UPDATE ON sms.promotions FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON sms.employees FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_employee_addresses_updated_at BEFORE UPDATE ON sms.employee_addresses FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_employee_leave_updated_at BEFORE UPDATE ON sms.employee_leave_applications FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_student_attendance_updated_at BEFORE UPDATE ON sms.student_attendance FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_employee_attendance_updated_at BEFORE UPDATE ON sms.employee_attendance FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_class_routines_updated_at BEFORE UPDATE ON sms.class_routines FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_notices_updated_at BEFORE UPDATE ON sms.notices FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_fee_structures_updated_at BEFORE UPDATE ON sms.fee_structures FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_fee_invoices_updated_at BEFORE UPDATE ON sms.fee_invoices FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_fee_collections_updated_at BEFORE UPDATE ON sms.fee_collections FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_fee_waivers_updated_at BEFORE UPDATE ON sms.fee_waivers FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_chart_accounts_updated_at BEFORE UPDATE ON sms.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_journal_vouchers_updated_at BEFORE UPDATE ON sms.journal_vouchers FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_exams_updated_at BEFORE UPDATE ON sms.exams FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_exam_marks_updated_at BEFORE UPDATE ON sms.exam_marks FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_student_results_updated_at BEFORE UPDATE ON sms.student_results FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_books_updated_at BEFORE UPDATE ON sms.books FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_library_issues_updated_at BEFORE UPDATE ON sms.library_issues FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON sms.vehicles FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_vendors_updated_at BEFORE UPDATE ON sms.vendors FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_items_updated_at BEFORE UPDATE ON sms.items FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();
CREATE TRIGGER trg_purchase_orders_updated_at BEFORE UPDATE ON sms.purchase_orders FOR EACH ROW EXECUTE FUNCTION sms.fn_set_updated_at();

COMMIT;

/* ============================================================
   BASIC CHECK QUERY
   ============================================================ */

-- SELECT table_schema, table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'sms'
-- ORDER BY table_name;
