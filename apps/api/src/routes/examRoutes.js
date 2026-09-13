import express from "express";
import crypto from "crypto";
import pool from "../config/db.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();
export const publicExamRoutes = express.Router();

const assignmentTypes = new Set(["MANDATORY", "OPTIONAL", "FOURTH_SUBJECT"]);
const paperModes = new Set(["SINGLE", "FLEXIBLE"]);
const componentCodes = ["WRITTEN", "MCQ", "PRACTICAL", "VIVA"];
const eligibilityStatuses = new Set(["ELIGIBLE", "INELIGIBLE", "HOLD"]);
const feeStatuses = new Set(["PAID", "DUE", "WAIVED"]);
const documentTypes = new Set(["MARKSHEET", "TESTIMONIAL"]);

const clean = (value) => value === "" || value === undefined ? null : value;
const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const asBoolean = (value) => value === true || value === 1 || value === "1" || value === "true";
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);
const isSuperAdmin = (req) => asBoolean(req.user?.is_super_admin);

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function fail(res, error, fallback) {
  const status = Number(error?.status || 500);
  if (status >= 500) console.error(fallback, error);
  return res.status(status).json({ success: false, message: error?.message || fallback });
}

async function institutionId(req) {
  if (req.user?.institution_id) return req.user.institution_id;
  const result = await pool.query(
    "SELECT institution_id FROM sms.institutions WHERE status='ACTIVE' ORDER BY institution_id LIMIT 1"
  );
  return result.rows[0]?.institution_id || null;
}

async function branchId(req, requested) {
  const inst = await institutionId(req);
  const preferred = clean(requested) || clean(req.user?.branch_id);
  const result = await pool.query(
    `SELECT branch_id
       FROM sms.branches
      WHERE institution_id=$1 AND status='ACTIVE'
        AND (branch_id=$2 OR $2 IS NULL)
      ORDER BY is_main_branch DESC, branch_id
      LIMIT 1`,
    [inst, preferred]
  );
  return result.rows[0]?.branch_id || null;
}

async function getExamForInstitution(executor, inst, examId) {
  const result = await executor.query(
    `SELECT e.*, b.institution_id, b.branch_name, cl.class_name
       FROM sms.exams e
       JOIN sms.branches b ON b.branch_id=e.branch_id
       LEFT JOIN sms.class_levels cl ON cl.class_id=e.class_id
      WHERE e.exam_id=$1 AND b.institution_id=$2`,
    [examId, inst]
  );
  return result.rows[0] || null;
}

async function getSubjectPolicy(executor, inst) {
  let result = await executor.query(
    `SELECT iss.*, i.institution_type
       FROM sms.institution_subject_settings iss
       JOIN sms.institutions i ON i.institution_id=iss.institution_id
      WHERE iss.institution_id=$1`,
    [inst]
  );
  if (!result.rowCount) {
    await executor.query(
      `INSERT INTO sms.institution_subject_settings (institution_id,is_locked)
       VALUES ($1,0)
       ON DUPLICATE KEY UPDATE institution_id=VALUES(institution_id)`,
      [inst]
    );
    result = await executor.query(
      `SELECT iss.*, i.institution_type
         FROM sms.institution_subject_settings iss
         JOIN sms.institutions i ON i.institution_id=iss.institution_id
        WHERE iss.institution_id=$1`,
      [inst]
    );
  }
  const row = result.rows[0] || { institution_id: inst, is_locked: 0 };
  return {
    ...row,
    is_locked: asBoolean(row.is_locked),
  };
}

async function assertSubjectMutationAllowed(req, executor = pool, classSubjectId = null) {
  if (isSuperAdmin(req)) return;
  const inst = await institutionId(req);
  const policy = await getSubjectPolicy(executor, inst);
  if (policy.is_locked) {
    throw httpError(423, "Subject setup is locked for this institution.");
  }
  if (classSubjectId) {
    const row = (
      await executor.query(
        `SELECT is_locked
           FROM sms.class_subjects
          WHERE class_subject_id=$1 AND institution_id=$2`,
        [classSubjectId, inst]
      )
    ).rows[0];
    if (asBoolean(row?.is_locked)) {
      throw httpError(423, "This class-subject setup is locked.");
    }
  }
}

function subjectFail(res, error, fallback) {
  if (error?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({
      success: false,
      message: "This subject code already exists for the institution. Use a different code.",
    });
  }
  return fail(res, error, fallback);
}

function readClassComponents(body, defaults = {}) {
  const value = (key, fallback = 0) => {
    const raw = hasOwn(body, key) ? body[key] : defaults[key];
    return raw === null || raw === undefined || raw === "" ? fallback : Number(raw);
  };
  const allocation = {
    written_marks: value("written_marks", 0),
    written_pass_marks: value("written_pass_marks", 0),
    mcq_marks: value("mcq_marks", 0),
    mcq_pass_marks: value("mcq_pass_marks", 0),
    practical_marks: value("practical_marks", 0),
    practical_pass_marks: value("practical_pass_marks", 0),
    viva_marks: value("viva_marks", 0),
    viva_pass_marks: value("viva_pass_marks", 0),
  };
  for (const code of componentCodes) {
    const prefix = code.toLowerCase();
    const full = allocation[`${prefix}_marks`];
    const pass = allocation[`${prefix}_pass_marks`];
    if (!Number.isFinite(full) || !Number.isFinite(pass) || full < 0 || pass < 0 || pass > full) {
      throw httpError(400, `${code} full/pass marks are invalid.`);
    }
  }
  allocation.component_total = componentCodes.reduce(
    (sum, code) => sum + allocation[`${code.toLowerCase()}_marks`],
    0
  );
  if (allocation.component_total <= 0) {
    throw httpError(400, "At least one assessment component must have marks.");
  }
  if (clean(body?.full_marks) !== null && Math.abs(allocation.component_total - asNumber(body.full_marks)) > 0.01) {
    throw httpError(400, "Written, MCQ, Practical and Viva marks must equal full marks.");
  }
  return allocation;
}

function defaultClassComponents(subject) {
  const written = asNumber(subject?.written_marks, asNumber(subject?.full_marks, 100));
  return {
    written_marks: written,
    written_pass_marks: written > 0 ? Math.min(asNumber(subject?.pass_marks), written) : 0,
    mcq_marks: asNumber(subject?.mcq_marks),
    mcq_pass_marks: 0,
    practical_marks: asNumber(subject?.practical_marks),
    practical_pass_marks: 0,
    viva_marks: asNumber(subject?.viva_marks),
    viva_pass_marks: 0,
  };
}

function normalizeAssignmentType(body, fallback = "MANDATORY") {
  let type = String(body?.assignment_type || "").trim().toUpperCase();
  if (!type && hasOwn(body, "is_mandatory")) type = body.is_mandatory === false ? "OPTIONAL" : "MANDATORY";
  if (!type) type = fallback;
  if (!assignmentTypes.has(type)) {
    throw httpError(400, "Assignment type must be MANDATORY, OPTIONAL or FOURTH_SUBJECT.");
  }
  return type;
}

function normalizePaperMode(value, fallback = "SINGLE") {
  const input = String(value || fallback).trim().toUpperCase();
  const mode = input === "TWO_PAPERS" ? "FLEXIBLE" : input;
  if (!paperModes.has(mode)) throw httpError(400, "Paper structure must be SINGLE or FLEXIBLE.");
  return mode;
}

function normalizePaperNo(value, paperMode = "SINGLE", fallback = null) {
  const mode = normalizePaperMode(paperMode);
  const parsed = value === "" || value === null || value === undefined ? fallback : Number(value);
  if (mode === "SINGLE") return 0;
  if (![0, 1, 2].includes(parsed)) throw httpError(400, "Select Single, 1st Paper or 2nd Paper for this subject.");
  return parsed;
}

function validateBaseSubject(name, code, nameBn = "") {
  if (/\b(1st|2nd|first|second)\s+paper\s*$/i.test(name) || /[১২][য়য়ম]?\s*পত্র\s*$/u.test(nameBn)) {
    throw httpError(400, "Keep the base subject name only; choose 1st/2nd Paper during class assignment.");
  }
  if (/^(SSC|HSC|ALIM|DAK|EBT|SCH)-/i.test(code) || /(?:ACC|BAN|ENG|PHY|CHEM|BIO|MATH|STAT|ECO|CIV|LOGIC|HIST|GEO|ARAB|URDU|FARSI|PALI|SANS)[12]$/i.test(code)) {
    throw httpError(400, "Use a neutral subject code such as ACC, BAN or ENG; class/level and paper do not belong in Subject Master.");
  }
}

function classSubjectSelect(whereClause) {
  return `SELECT cs.*,
      s.subject_code, s.subject_name, s.subject_name_bn, s.subject_type, s.curriculum_type, s.paper_mode,
      g.group_code, g.group_name, g.group_name_bn,
      s.full_marks AS full_marks, s.pass_marks AS pass_marks,
      (cs.written_marks + cs.mcq_marks + cs.practical_marks + cs.viva_marks) AS component_total
    FROM sms.class_subjects cs
    JOIN sms.subjects s ON s.subject_id=cs.subject_id
    LEFT JOIN sms.groups g ON g.group_id=cs.group_id
    WHERE ${whereClause}`;
}

function designJson(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    try {
      JSON.parse(value);
      return value;
    } catch {
      throw httpError(400, "design_json must be valid JSON.");
    }
  }
  return JSON.stringify(value);
}

function gradeForPercent(grades, percent) {
  return grades.find(
    (grade) => percent >= asNumber(grade.min_marks) && percent <= asNumber(grade.max_marks)
  ) || null;
}

publicExamRoutes.get("/results", async (req, res) => {
  try {
    const examId = Number(req.query.exam_id);
    const studentNo = String(req.query.student_no || "").trim();
    if (!examId || !studentNo) {
      throw httpError(400, "exam_id and student_no are required.");
    }
    const result = await pool.query(
      `SELECT sr.*, s.student_no, s.full_name, s.photo_url,
          e.exam_name, e.result_publish_date, et.exam_type_name,
          cl.class_name, ay.year_name, b.branch_name,
          i.institution_id, i.institution_name, i.institution_name_bn,
          i.logo_url, i.eiin_no
        FROM sms.student_results sr
        JOIN sms.students s ON s.student_id=sr.student_id
        JOIN sms.exams e ON e.exam_id=sr.exam_id
        JOIN sms.branches b ON b.branch_id=e.branch_id
        JOIN sms.institutions i ON i.institution_id=b.institution_id
        LEFT JOIN sms.exam_types et ON et.exam_type_id=e.exam_type_id
        LEFT JOIN sms.class_levels cl ON cl.class_id=e.class_id
        LEFT JOIN sms.academic_years ay ON ay.academic_year_id=e.academic_year_id
        WHERE sr.exam_id=$1 AND s.student_no=$2 AND sr.published_at IS NOT NULL`,
      [examId, studentNo]
    );
    if (!result.rowCount) throw httpError(404, "Published result not found.");
    const details = await pool.query(
      `SELECT srd.*, s.subject_code, s.subject_name, s.subject_name_bn,
          COALESCE((
            SELECT ssa.assignment_type FROM sms.student_subject_assignments ssa
            JOIN sms.student_results assigned_result ON assigned_result.enrollment_id=ssa.enrollment_id
            WHERE assigned_result.result_id=srd.result_id AND ssa.subject_id=srd.subject_id AND ssa.paper_no=srd.paper_no
            LIMIT 1
          ),(
            SELECT cs.assignment_type FROM sms.class_subjects cs
            JOIN sms.exams ex ON ex.exam_id=$2
            WHERE cs.class_id=ex.class_id AND cs.subject_id=srd.subject_id AND cs.paper_no=srd.paper_no AND cs.status='ACTIVE'
            ORDER BY cs.group_id IS NULL DESC, cs.class_subject_id LIMIT 1
          ), 'MANDATORY') AS assignment_type
        FROM sms.student_result_details srd
        JOIN sms.subjects s ON s.subject_id=srd.subject_id
        WHERE srd.result_id=$1
        ORDER BY s.subject_name,srd.paper_no`,
      [result.rows[0].result_id, examId]
    );
    return res.json({ success: true, data: { result: result.rows[0], details: details.rows } });
  } catch (error) {
    return fail(res, error, "Failed to load published result.");
  }
});

publicExamRoutes.get("/exams", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT e.exam_id,e.exam_name,e.exam_status,e.result_publish_date,
          cl.class_id,cl.class_name,ay.academic_year_id,ay.year_name,
          i.institution_id,i.institution_name,i.institution_name_bn
        FROM sms.exams e
        JOIN sms.branches b ON b.branch_id=e.branch_id
        JOIN sms.institutions i ON i.institution_id=b.institution_id
        LEFT JOIN sms.class_levels cl ON cl.class_id=e.class_id
        LEFT JOIN sms.academic_years ay ON ay.academic_year_id=e.academic_year_id
        LEFT JOIN sms.student_results sr ON sr.exam_id=e.exam_id AND sr.published_at IS NOT NULL
        WHERE e.exam_status IN ('PUBLISHED','PARTIALLY_PUBLISHED') OR sr.result_id IS NOT NULL
        ORDER BY e.result_publish_date DESC,e.exam_id DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load published exams.");
  }
});

router.use(authenticateUser);

router.get("/lookups", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const [types, scales, branches, years, classes, groups, subjects, students, components, policy] = await Promise.all([
      pool.query("SELECT * FROM sms.exam_types WHERE institution_id=$1 AND status='ACTIVE' ORDER BY exam_type_name", [inst]),
      pool.query("SELECT * FROM sms.grading_scales WHERE institution_id=$1 AND status='ACTIVE' ORDER BY scale_name", [inst]),
      pool.query("SELECT branch_id,branch_name FROM sms.branches WHERE institution_id=$1 AND status='ACTIVE' ORDER BY is_main_branch DESC,branch_name", [inst]),
      pool.query("SELECT academic_year_id,year_name FROM sms.academic_years WHERE institution_id=$1 AND status='ACTIVE' ORDER BY is_current DESC,academic_year_id DESC", [inst]),
      pool.query("SELECT class_id,class_name,class_name_bn,numeric_level FROM sms.class_levels WHERE institution_id=$1 AND status='ACTIVE' ORDER BY numeric_level,class_id", [inst]),
      pool.query("SELECT group_id,group_code,group_name,group_name_bn FROM sms.groups WHERE institution_id=$1 AND status='ACTIVE' ORDER BY CASE group_code WHEN 'SCI' THEN 1 WHEN 'HUM' THEN 2 WHEN 'BUS' THEN 3 ELSE 4 END,group_name", [inst]),
      pool.query(`SELECT subject_id,subject_code,subject_name,subject_name_bn,subject_type,curriculum_type,paper_mode,full_marks,pass_marks,written_marks,mcq_marks,practical_marks,viva_marks FROM sms.subjects WHERE institution_id=$1 AND canonical_subject_id IS NULL AND status='ACTIVE' ORDER BY subject_name`, [inst]),
      pool.query(`SELECT s.student_id,s.student_no,s.full_name,se.enrollment_id,se.branch_id,se.academic_year_id,se.class_id,se.group_id FROM sms.students s JOIN sms.student_enrollments se ON se.student_id=s.student_id AND se.enrollment_status='ACTIVE' WHERE s.institution_id=$1 AND s.status='ACTIVE' ORDER BY s.full_name`, [inst]),
      pool.query("SELECT * FROM sms.mark_components WHERE institution_id=$1 AND status='ACTIVE' ORDER BY component_id", [inst]),
      getSubjectPolicy(pool, inst),
    ]);
    return res.json({
      success: true,
      data: {
        types: types.rows,
        scales: scales.rows,
        branches: branches.rows,
        years: years.rows,
        classes: classes.rows,
        groups: groups.rows,
        subjects: subjects.rows,
        students: students.rows,
        components: components.rows,
        subject_policy: policy,
      },
    });
  } catch (error) {
    return fail(res, error, "Failed to load exam setup data.");
  }
});

router.get("/dashboard", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const [exams, marks, results] = await Promise.all([
      pool.query(`SELECT e.*,et.exam_type_name,cl.class_name FROM sms.exams e JOIN sms.branches b ON b.branch_id=e.branch_id LEFT JOIN sms.exam_types et ON et.exam_type_id=e.exam_type_id LEFT JOIN sms.class_levels cl ON cl.class_id=e.class_id WHERE b.institution_id=$1 ORDER BY e.exam_id DESC LIMIT 8`, [inst]),
      pool.query(`SELECT COUNT(*) total,SUM(entry_status='VERIFIED') verified FROM sms.exam_marks em JOIN sms.exam_subjects es ON es.exam_subject_id=em.exam_subject_id JOIN sms.exams e ON e.exam_id=es.exam_id JOIN sms.branches b ON b.branch_id=e.branch_id WHERE b.institution_id=$1`, [inst]),
      pool.query(`SELECT COUNT(*) total,SUM(result_status='PASSED') passed FROM sms.student_results sr JOIN sms.exams e ON e.exam_id=sr.exam_id JOIN sms.branches b ON b.branch_id=e.branch_id WHERE b.institution_id=$1`, [inst]),
    ]);
    return res.json({ success: true, data: { exams: exams.rows, marks: marks.rows[0], results: results.rows[0] } });
  } catch (error) {
    return fail(res, error, "Failed to load exam dashboard.");
  }
});

router.get("/dashboard/overview", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const [examStats, candidateStats, attendanceStats, resultStats, recentExams] = await Promise.all([
      pool.query(`SELECT COUNT(*) total_exams,SUM(e.exam_status='SCHEDULED') scheduled_exams,SUM(e.exam_status='DRAFT') draft_exams,SUM(e.exam_status='COMPLETED') completed_exams FROM sms.exams e JOIN sms.branches b ON b.branch_id=e.branch_id WHERE b.institution_id=$1`, [inst]),
      pool.query(`SELECT COUNT(*) total_candidates FROM sms.exam_candidates ec JOIN sms.exams e ON e.exam_id=ec.exam_id JOIN sms.branches b ON b.branch_id=e.branch_id WHERE b.institution_id=$1`, [inst]),
      pool.query(`SELECT COUNT(*) recorded_entries,SUM(em.is_absent=0) attended_entries,SUM(em.is_absent=1) absent_entries,COUNT(DISTINCT CASE WHEN em.is_absent=0 THEN CONCAT(es.exam_id,'-',em.student_id) END) attended_students FROM sms.exam_marks em JOIN sms.exam_subjects es ON es.exam_subject_id=em.exam_subject_id JOIN sms.exams e ON e.exam_id=es.exam_id JOIN sms.branches b ON b.branch_id=e.branch_id WHERE b.institution_id=$1`, [inst]),
      pool.query(`SELECT COUNT(*) total_results,SUM(sr.result_status='PASSED') passed,SUM(sr.result_status='FAILED') failed,SUM(sr.result_status='PENDING') pending FROM sms.student_results sr JOIN sms.exams e ON e.exam_id=sr.exam_id JOIN sms.branches b ON b.branch_id=e.branch_id WHERE b.institution_id=$1`, [inst]),
      pool.query(`SELECT e.exam_id,e.exam_name,e.exam_status,e.start_date,e.end_date,e.exam_fee_amount,e.fee_required,et.exam_type_name,cl.class_name,COUNT(DISTINCT ec.candidate_id) candidate_count,SUM(CASE WHEN sr.result_status='PASSED' THEN 1 ELSE 0 END) passed_count,SUM(CASE WHEN sr.result_status='FAILED' THEN 1 ELSE 0 END) failed_count FROM sms.exams e JOIN sms.branches b ON b.branch_id=e.branch_id LEFT JOIN sms.exam_types et ON et.exam_type_id=e.exam_type_id LEFT JOIN sms.class_levels cl ON cl.class_id=e.class_id LEFT JOIN sms.exam_candidates ec ON ec.exam_id=e.exam_id LEFT JOIN sms.student_results sr ON sr.exam_id=e.exam_id WHERE b.institution_id=$1 GROUP BY e.exam_id,e.exam_name,e.exam_status,e.start_date,e.end_date,e.exam_fee_amount,e.fee_required,et.exam_type_name,cl.class_name ORDER BY e.exam_id DESC LIMIT 7`, [inst]),
    ]);
    const summary = { ...(examStats.rows[0] || {}), ...(candidateStats.rows[0] || {}), ...(attendanceStats.rows[0] || {}), ...(resultStats.rows[0] || {}) };
    return res.json({ success: true, data: { summary, recent_exams: recentExams.rows } });
  } catch (error) {
    return fail(res, error, "Failed to load exam dashboard overview.");
  }
});

router.get("/subject-policy", requirePermission("subject.management", "view"), async (req, res) => {
  try {
    const policy = await getSubjectPolicy(pool, await institutionId(req));
    return res.json({ success: true, data: policy });
  } catch (error) {
    return fail(res, error, "Failed to load subject policy.");
  }
});

router.put("/subject-policy", requirePermission("subject.management", "update"), async (req, res) => {
  try {
    if (!isSuperAdmin(req)) throw httpError(403, "Only a super administrator can lock or unlock subject setup.");
    const inst = await institutionId(req);
    const locked = asBoolean(req.body.is_locked);
    await pool.query(
      `INSERT INTO sms.institution_subject_settings
        (institution_id,is_locked,locked_by,locked_at,updated_by)
       VALUES ($1,$2,$3,CASE WHEN $2=1 THEN NOW() ELSE NULL END,$3)
       ON DUPLICATE KEY UPDATE
         is_locked=VALUES(is_locked),
         locked_by=VALUES(locked_by),
         locked_at=VALUES(locked_at),
         updated_by=VALUES(updated_by)`,
      [inst, locked ? 1 : 0, req.user.user_id]
    );
    return res.json({ success: true, data: await getSubjectPolicy(pool, inst) });
  } catch (error) {
    return fail(res, error, "Failed to update subject policy.");
  }
});

router.get("/types", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sms.exam_types WHERE institution_id=$1 ORDER BY exam_type_name", [await institutionId(req)]);
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load exam types.");
  }
});

router.post("/types", requirePermission("exam.management", "create"), async (req, res) => {
  try {
    const code = String(req.body.exam_type_code || "").trim().toUpperCase();
    const name = String(req.body.exam_type_name || "").trim();
    if (!code || !name) throw httpError(400, "Exam type code and name are required.");
    const result = await pool.query(
      "INSERT INTO sms.exam_types (institution_id,exam_type_code,exam_type_name,status) VALUES ($1,$2,$3,'ACTIVE') RETURNING *",
      [await institutionId(req), code, name]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    return fail(res, error, "Failed to save exam type.");
  }
});

router.get("/subjects", requirePermission("subject.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    if (isSuperAdmin(req)) {
      const result = await pool.query("SELECT s.*,i.institution_name FROM sms.subjects s LEFT JOIN sms.institutions i ON i.institution_id=s.institution_id WHERE s.canonical_subject_id IS NULL ORDER BY i.institution_name,s.subject_name");
      return res.json({ success: true, data: result.rows, meta: { is_super_admin: true, subject_policy: await getSubjectPolicy(pool, inst) } });
    }
    const result = await pool.query("SELECT * FROM sms.subjects WHERE institution_id=$1 AND canonical_subject_id IS NULL ORDER BY subject_name", [inst]);
    return res.json({ success: true, data: result.rows, meta: { subject_policy: await getSubjectPolicy(pool, inst) } });
  } catch (error) {
    return fail(res, error, "Failed to load subjects.");
  }
});

router.put("/subjects/:id/curriculum", requirePermission("subject.management", "update"), async (req, res) => {
  try {
    await assertSubjectMutationAllowed(req);
    const inst = await institutionId(req);
    const sql = isSuperAdmin(req)
      ? "UPDATE sms.subjects SET curriculum_type=$1 WHERE subject_id=$2 RETURNING *"
      : "UPDATE sms.subjects SET curriculum_type=$1 WHERE subject_id=$2 AND institution_id=$3 RETURNING *";
    const result = await pool.query(sql, isSuperAdmin(req) ? ["ALL", req.params.id] : ["ALL", req.params.id, inst]);
    if (!result.rowCount) throw httpError(404, "Subject not found.");
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return fail(res, error, "Failed to update curriculum type.");
  }
});

router.put("/subjects/:id/status", requirePermission("subject.management", "update"), async (req, res) => {
  try {
    await assertSubjectMutationAllowed(req);
    const inst = await institutionId(req);
    const status = String(req.body.status || "").toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) throw httpError(400, "Status must be ACTIVE or INACTIVE.");
    const sql = isSuperAdmin(req)
      ? "UPDATE sms.subjects SET status=$1 WHERE subject_id=$2 RETURNING *"
      : "UPDATE sms.subjects SET status=$1 WHERE subject_id=$2 AND institution_id=$3 RETURNING *";
    const result = await pool.query(sql, isSuperAdmin(req) ? [status, req.params.id] : [status, req.params.id, inst]);
    if (!result.rowCount) throw httpError(404, "Subject not found.");
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return fail(res, error, "Failed to update subject status.");
  }
});

router.put("/subjects/:id/bangla-name", requirePermission("subject.management", "update"), async (req, res) => {
  try {
    await assertSubjectMutationAllowed(req);
    const inst = await institutionId(req);
    const name = String(req.body.subject_name_bn || "").trim();
    const sql = isSuperAdmin(req)
      ? "UPDATE sms.subjects SET subject_name_bn=$1 WHERE subject_id=$2 RETURNING *"
      : "UPDATE sms.subjects SET subject_name_bn=$1 WHERE subject_id=$2 AND institution_id=$3 RETURNING *";
    const result = await pool.query(sql, isSuperAdmin(req) ? [name || null, req.params.id] : [name || null, req.params.id, inst]);
    if (!result.rowCount) throw httpError(404, "Subject not found.");
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return fail(res, error, "Failed to update Bangla subject name.");
  }
});

router.post("/subjects", requirePermission("subject.management", "create"), async (req, res) => {
  try {
    await assertSubjectMutationAllowed(req);
    const body = req.body;
    const inst = await institutionId(req);
    const code = String(body.subject_code || "").trim().toUpperCase();
    const name = String(body.subject_name || "").trim();
    const type = String(body.subject_type || "MAIN").toUpperCase();
    const paperMode = normalizePaperMode(body.paper_mode);
    const subjectCurriculum = "ALL";
    const full = asNumber(body.full_marks);
    const written = asNumber(body.written_marks);
    const mcq = asNumber(body.mcq_marks);
    const practical = asNumber(body.practical_marks);
    const viva = asNumber(body.viva_marks);
    if (!code || !name || !["MAIN", "OPTIONAL", "FOURTH_SUBJECT"].includes(type) || full <= 0) throw httpError(400, "Code, name, valid type and full marks are required.");
    validateBaseSubject(name, code, body.subject_name_bn);
    if ([written, mcq, practical, viva].some((value) => value < 0) || Math.abs(full - (written + mcq + practical + viva)) > 0.01) throw httpError(400, "Written, MCQ, Practical and Viva marks must equal full marks.");
    const result = await pool.query(
      `INSERT INTO sms.subjects (institution_id,subject_code,subject_name,subject_name_bn,curriculum_type,paper_mode,subject_type,full_marks,pass_marks,written_marks,mcq_marks,practical_marks,viva_marks,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'ACTIVE') RETURNING *`,
      [inst, code, name, clean(body.subject_name_bn), subjectCurriculum, paperMode, type, full, asNumber(body.pass_marks), written, mcq, practical, viva]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    return subjectFail(res, error, "Failed to save subject.");
  }
});

router.put("/subjects/:id", requirePermission("subject.management", "update"), async (req, res) => {
  try {
    await assertSubjectMutationAllowed(req);
    const body = req.body;
    const inst = await institutionId(req);
    const code = String(body.subject_code || "").trim().toUpperCase();
    const name = String(body.subject_name || "").trim();
    const type = String(body.subject_type || "MAIN").toUpperCase();
    const paperMode = normalizePaperMode(body.paper_mode);
    const subjectCurriculum = "ALL";
    const full = asNumber(body.full_marks);
    const written = asNumber(body.written_marks);
    const mcq = asNumber(body.mcq_marks);
    const practical = asNumber(body.practical_marks);
    const viva = asNumber(body.viva_marks);
    if (!code || !name || !["MAIN", "OPTIONAL", "FOURTH_SUBJECT"].includes(type) || full <= 0 || [written, mcq, practical, viva].some((value) => value < 0) || Math.abs(full - (written + mcq + practical + viva)) > 0.01) throw httpError(400, "Provide valid subject details; component total must equal full marks.");
    validateBaseSubject(name, code, body.subject_name_bn);
    if (paperMode === "SINGLE") {
      const paperUsage = await pool.query(
        `SELECT (SELECT COUNT(*) FROM sms.class_subjects WHERE subject_id=$1 AND paper_no IN (1,2)) +
                (SELECT COUNT(*) FROM sms.exam_subjects WHERE subject_id=$1 AND paper_no IN (1,2)) AS total`,
        [req.params.id]
      );
      if (asNumber(paperUsage.rows[0]?.total) > 0) throw httpError(409, "Remove existing 1st/2nd Paper assignments before changing this subject to single paper.");
    }
    const sql = isSuperAdmin(req)
      ? `UPDATE sms.subjects SET subject_code=$1,subject_name=$2,subject_name_bn=$3,curriculum_type=$4,paper_mode=$5,subject_type=$6,full_marks=$7,pass_marks=$8,written_marks=$9,mcq_marks=$10,practical_marks=$11,viva_marks=$12 WHERE subject_id=$13 RETURNING *`
      : `UPDATE sms.subjects SET subject_code=$1,subject_name=$2,subject_name_bn=$3,curriculum_type=$4,paper_mode=$5,subject_type=$6,full_marks=$7,pass_marks=$8,written_marks=$9,mcq_marks=$10,practical_marks=$11,viva_marks=$12 WHERE subject_id=$13 AND institution_id=$14 RETURNING *`;
    const values = [code, name, clean(body.subject_name_bn), subjectCurriculum, paperMode, type, full, asNumber(body.pass_marks), written, mcq, practical, viva, req.params.id];
    if (!isSuperAdmin(req)) values.push(inst);
    const result = await pool.query(sql, values);
    if (!result.rowCount) throw httpError(404, "Subject not found.");
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return subjectFail(res, error, "Failed to update subject.");
  }
});

router.delete("/subjects/:id", requirePermission("subject.management", "delete"), async (req, res) => {
  try {
    await assertSubjectMutationAllowed(req);
    const inst = await institutionId(req);
    const sql = isSuperAdmin(req)
      ? "DELETE FROM sms.subjects WHERE subject_id=$1 RETURNING subject_id"
      : "DELETE FROM sms.subjects WHERE subject_id=$1 AND institution_id=$2 RETURNING subject_id";
    const result = await pool.query(sql, isSuperAdmin(req) ? [req.params.id] : [req.params.id, inst]);
    if (!result.rowCount) throw httpError(404, "Subject not found.");
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error, "Failed to delete subject.");
  }
});

router.get("/classes/:classId/subjects", requirePermission("subject.management", "view"), async (req, res) => {
  try {
    const result = await pool.query(
      `${classSubjectSelect("cs.class_id=$1 AND cs.institution_id=$2 AND cs.status='ACTIVE'")}
       ORDER BY cs.sort_order,s.subject_name,cs.paper_no`,
      [req.params.classId, await institutionId(req)]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load class subjects.");
  }
});

router.post("/classes/:classId/subjects", requirePermission("subject.management", "update"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await assertSubjectMutationAllowed(req, client);
    const inst = await institutionId(req);
    const subjectId = req.body.subject_id;
    if (!subjectId) throw httpError(400, "Subject is required.");
    const subject = (
      await client.query("SELECT * FROM sms.subjects WHERE subject_id=$1 AND institution_id=$2 AND status='ACTIVE'", [subjectId, inst])
    ).rows[0];
    if (!subject) throw httpError(400, "Invalid subject.");
    const paperNo = normalizePaperNo(req.body.paper_no, subject.paper_mode);
    const classRow = (
      await client.query("SELECT class_id,numeric_level FROM sms.class_levels WHERE class_id=$1 AND institution_id=$2 AND status='ACTIVE'", [req.params.classId, inst])
    ).rows[0];
    if (!classRow) throw httpError(400, "Invalid class.");
    const group = clean(req.body.group_id);
    if (group && (asNumber(classRow.numeric_level) < 9 || asNumber(classRow.numeric_level) > 12)) {
      throw httpError(400, "Group-wise subjects are available only for classes 9 to 12.");
    }
    if (group) {
      const validGroup = await client.query("SELECT group_id FROM sms.groups WHERE group_id=$1 AND institution_id=$2 AND status='ACTIVE'", [group, inst]);
      if (!validGroup.rowCount) throw httpError(400, "Invalid group.");
    }
    if (subject.paper_mode === "FLEXIBLE" && [1, 2].includes(paperNo)) {
      const singleAssignment = await client.query(
        `SELECT class_subject_id FROM sms.class_subjects
          WHERE institution_id=$1 AND class_id=$2 AND subject_id=$3 AND paper_no=0 AND status='ACTIVE'
            AND (group_id=$4 OR (group_id IS NULL AND $4 IS NULL))
          ORDER BY class_subject_id LIMIT 1 FOR UPDATE`,
        [inst, req.params.classId, subjectId, group]
      );
      if (singleAssignment.rowCount) {
        const companionPaper = paperNo === 2 ? 1 : 2;
        const companion = await client.query(
          `SELECT class_subject_id FROM sms.class_subjects
            WHERE institution_id=$1 AND class_id=$2 AND subject_id=$3 AND paper_no=$4 AND status='ACTIVE'
              AND (group_id=$5 OR (group_id IS NULL AND $5 IS NULL))
            LIMIT 1`,
          [inst, req.params.classId, subjectId, companionPaper, group]
        );
        if (companion.rowCount) throw httpError(409, "The class already has this subject as Single paper and a separate paper assignment.");
        await assertSubjectMutationAllowed(req, client, singleAssignment.rows[0].class_subject_id);
        await client.query("UPDATE sms.class_subjects SET paper_no=$1 WHERE class_subject_id=$2", [companionPaper, singleAssignment.rows[0].class_subject_id]);
      }
    }
    const incompatiblePaper = await client.query(
      `SELECT class_subject_id FROM sms.class_subjects
        WHERE institution_id=$1 AND class_id=$2 AND subject_id=$3 AND status='ACTIVE'
          AND (group_id=$4 OR (group_id IS NULL AND $4 IS NULL))
          AND (($5=0 AND paper_no IN (1,2)) OR ($5 IN (1,2) AND paper_no=0))
        LIMIT 1`,
      [inst, req.params.classId, subjectId, group, paperNo]
    );
    if (incompatiblePaper.rowCount) throw httpError(409, "Use either Single paper or separate 1st/2nd Papers for a class; they cannot be mixed.");
    const assignmentType = normalizeAssignmentType(req.body, subject.subject_type === "FOURTH_SUBJECT" ? "FOURTH_SUBJECT" : subject.subject_type === "OPTIONAL" ? "OPTIONAL" : "MANDATORY");
    const allocation = readClassComponents(req.body, defaultClassComponents(subject));
    if (Math.abs(allocation.component_total - asNumber(subject.full_marks)) > 0.01) {
      throw httpError(400, "Written, MCQ, Practical and Viva marks must equal the subject full marks.");
    }
    const locked = isSuperAdmin(req) && asBoolean(req.body.is_locked) ? 1 : 0;
    const existing = await client.query(
      `SELECT class_subject_id FROM sms.class_subjects
        WHERE institution_id=$1 AND class_id=$2 AND subject_id=$3 AND paper_no=$4
          AND (group_id=$5 OR (group_id IS NULL AND $5 IS NULL))
        ORDER BY class_subject_id LIMIT 1`,
      [inst, req.params.classId, subjectId, paperNo, group]
    );
    if (existing.rowCount) {
      await assertSubjectMutationAllowed(req, client, existing.rows[0].class_subject_id);
    }
    let classSubjectId;
    const values = [
      assignmentType,
      assignmentType === "MANDATORY" ? 1 : 0,
      allocation.written_marks,
      allocation.written_pass_marks,
      allocation.mcq_marks,
      allocation.mcq_pass_marks,
      allocation.practical_marks,
      allocation.practical_pass_marks,
      allocation.viva_marks,
      allocation.viva_pass_marks,
      locked,
      asNumber(req.body.sort_order),
    ];
    if (existing.rowCount) {
      classSubjectId = existing.rows[0].class_subject_id;
      await client.query(
        `UPDATE sms.class_subjects SET assignment_type=$1,is_mandatory=$2,written_marks=$3,written_pass_marks=$4,
          mcq_marks=$5,mcq_pass_marks=$6,practical_marks=$7,practical_pass_marks=$8,
          viva_marks=$9,viva_pass_marks=$10,is_locked=$11,sort_order=$12,status='ACTIVE'
          WHERE class_subject_id=$13`,
        [...values, classSubjectId]
      );
    } else {
      const created = await client.query(
        `INSERT INTO sms.class_subjects
          (institution_id,class_id,group_id,subject_id,paper_no,assignment_type,is_mandatory,written_marks,written_pass_marks,
           mcq_marks,mcq_pass_marks,practical_marks,practical_pass_marks,viva_marks,viva_pass_marks,is_locked,sort_order,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'ACTIVE') RETURNING *`,
        [inst, req.params.classId, group, subjectId, paperNo, ...values]
      );
      classSubjectId = created.rows[0]?.class_subject_id;
    }
    const result = await client.query(`${classSubjectSelect("cs.class_subject_id=$1 AND cs.institution_id=$2")}`, [classSubjectId, inst]);
    await client.query("COMMIT");
    return res.status(existing.rowCount ? 200 : 201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error, "Failed to assign class subject.");
  } finally {
    client.release();
  }
});

router.put("/class-subjects/:id", requirePermission("subject.management", "update"), async (req, res) => {
  try {
    await assertSubjectMutationAllowed(req, pool, req.params.id);
    const inst = await institutionId(req);
    const current = (
      await pool.query(`${classSubjectSelect("cs.class_subject_id=$1 AND cs.institution_id=$2")}`, [req.params.id, inst])
    ).rows[0];
    if (!current) throw httpError(404, "Class subject not found.");
    const paperNo = normalizePaperNo(req.body.paper_no, current.paper_mode, Number(current.paper_no));
    const conflictingPaper = await pool.query(
      `SELECT class_subject_id FROM sms.class_subjects
        WHERE institution_id=$1 AND class_id=$2 AND subject_id=$3 AND status='ACTIVE'
          AND class_subject_id<>$4
          AND (group_id=$5 OR (group_id IS NULL AND $5 IS NULL))
          AND (paper_no=$6 OR ($6=0 AND paper_no IN (1,2)) OR ($6 IN (1,2) AND paper_no=0))
        LIMIT 1`,
      [inst, current.class_id, current.subject_id, req.params.id, current.group_id, paperNo]
    );
    if (conflictingPaper.rowCount) {
      throw httpError(409, "This paper is already assigned, or Single paper conflicts with separate 1st/2nd Papers.");
    }
    const assignmentType = normalizeAssignmentType(req.body, current.assignment_type);
    const allocation = readClassComponents(req.body, current);
    if (Math.abs(allocation.component_total - asNumber(current.full_marks)) > 0.01) {
      throw httpError(400, "Written, MCQ, Practical and Viva marks must equal the subject full marks.");
    }
    const locked = isSuperAdmin(req) && hasOwn(req.body, "is_locked") ? (asBoolean(req.body.is_locked) ? 1 : 0) : (asBoolean(current.is_locked) ? 1 : 0);
    const status = ["ACTIVE", "INACTIVE"].includes(String(req.body.status || current.status).toUpperCase()) ? String(req.body.status || current.status).toUpperCase() : current.status;
    const result = await pool.query(
      `UPDATE sms.class_subjects SET paper_no=$1,assignment_type=$2,is_mandatory=$3,written_marks=$4,written_pass_marks=$5,
        mcq_marks=$6,mcq_pass_marks=$7,practical_marks=$8,practical_pass_marks=$9,
        viva_marks=$10,viva_pass_marks=$11,is_locked=$12,sort_order=$13,status=$14
        WHERE class_subject_id=$15 AND institution_id=$16 RETURNING *`,
      [paperNo, assignmentType, assignmentType === "MANDATORY" ? 1 : 0,
        allocation.written_marks, allocation.written_pass_marks,
        allocation.mcq_marks, allocation.mcq_pass_marks,
        allocation.practical_marks, allocation.practical_pass_marks,
        allocation.viva_marks, allocation.viva_pass_marks,
        locked, asNumber(hasOwn(req.body, "sort_order") ? req.body.sort_order : current.sort_order), status,
        req.params.id, inst]
    );
    if (!result.rowCount) throw httpError(404, "Class subject not found.");
    const joined = await pool.query(`${classSubjectSelect("cs.class_subject_id=$1 AND cs.institution_id=$2")}`, [req.params.id, inst]);
    return res.json({ success: true, data: joined.rows[0] });
  } catch (error) {
    return fail(res, error, "Failed to update class subject.");
  }
});

router.delete("/class-subjects/:id", requirePermission("subject.management", "delete"), async (req, res) => {
  try {
    await assertSubjectMutationAllowed(req, pool, req.params.id);
    const result = await pool.query(
      "DELETE FROM sms.class_subjects WHERE class_subject_id=$1 AND institution_id=$2",
      [req.params.id, await institutionId(req)]
    );
    if (!result.rowCount) throw httpError(404, "Class subject not found.");
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error, "Failed to remove class subject.");
  }
});

router.get("/exams", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*,et.exam_type_name,ay.year_name,cl.class_name,gs.scale_name
        FROM sms.exams e
        JOIN sms.branches b ON b.branch_id=e.branch_id
        LEFT JOIN sms.exam_types et ON et.exam_type_id=e.exam_type_id
        LEFT JOIN sms.academic_years ay ON ay.academic_year_id=e.academic_year_id
        LEFT JOIN sms.class_levels cl ON cl.class_id=e.class_id
        LEFT JOIN sms.grading_scales gs ON gs.grading_scale_id=e.grading_scale_id
        WHERE b.institution_id=$1 ORDER BY e.exam_id DESC`,
      [await institutionId(req)]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load exams.");
  }
});

router.post("/exams", requirePermission("exam.management", "create"), async (req, res) => {
  try {
    const branch = await branchId(req, req.body.branch_id);
    if (!branch || !req.body.academic_year_id || !req.body.exam_type_id || !String(req.body.exam_name || "").trim()) {
      throw httpError(400, "Branch, academic year, type and exam name are required.");
    }
    const feeAmount = asNumber(req.body.exam_fee_amount);
    if (feeAmount < 0) throw httpError(400, "Exam fee cannot be negative.");
    const result = await pool.query(
      `INSERT INTO sms.exams
        (branch_id,academic_year_id,exam_type_id,grading_scale_id,exam_name,class_id,start_date,end_date,
         result_publish_date,exam_fee_amount,fee_required,exam_status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'DRAFT',$12) RETURNING *`,
      [branch, req.body.academic_year_id, req.body.exam_type_id, clean(req.body.grading_scale_id),
        String(req.body.exam_name).trim(), clean(req.body.class_id), clean(req.body.start_date), clean(req.body.end_date),
        clean(req.body.result_publish_date), feeAmount, asBoolean(req.body.fee_required) ? 1 : 0, req.user.user_id]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    return fail(res, error, "Failed to create exam.");
  }
});

router.put("/exams/:id", requirePermission("exam.management", "update"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    if (!(await getExamForInstitution(pool, inst, req.params.id))) throw httpError(404, "Exam not found.");
    const branch = await branchId(req, req.body.branch_id);
    const feeAmount = asNumber(req.body.exam_fee_amount);
    if (!branch || feeAmount < 0) throw httpError(400, "A valid branch and non-negative exam fee are required.");
    const result = await pool.query(
      `UPDATE sms.exams SET branch_id=$1,academic_year_id=$2,exam_type_id=$3,grading_scale_id=$4,
        exam_name=$5,class_id=$6,start_date=$7,end_date=$8,result_publish_date=$9,
        exam_fee_amount=$10,fee_required=$11 WHERE exam_id=$12 RETURNING *`,
      [branch, req.body.academic_year_id, req.body.exam_type_id, clean(req.body.grading_scale_id),
        String(req.body.exam_name || "").trim(), clean(req.body.class_id), clean(req.body.start_date), clean(req.body.end_date),
        clean(req.body.result_publish_date), feeAmount, asBoolean(req.body.fee_required) ? 1 : 0, req.params.id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return fail(res, error, "Failed to update exam.");
  }
});

router.get("/exams/:id/subjects", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    if (!(await getExamForInstitution(pool, inst, req.params.id))) throw httpError(404, "Exam not found.");
    const result = await pool.query(
      `SELECT es.*,UPPER(DATE_FORMAT(es.exam_date,'%d-%b-%Y')) AS exam_date,
          s.subject_code,s.subject_name,s.subject_name_bn,s.paper_mode,
          COUNT(esc.exam_subject_component_id) AS component_count
        FROM sms.exam_subjects es
        JOIN sms.subjects s ON s.subject_id=es.subject_id
        LEFT JOIN sms.exam_subject_components esc ON esc.exam_subject_id=es.exam_subject_id
        WHERE es.exam_id=$1
        GROUP BY es.exam_subject_id,s.subject_code,s.subject_name,s.subject_name_bn,s.paper_mode
        ORDER BY s.subject_name,es.paper_no`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load exam subjects.");
  }
});

async function componentRowsFromConfiguration(executor, inst, classSubject, subject) {
  const components = await executor.query(
    "SELECT component_id,component_code,component_name FROM sms.mark_components WHERE institution_id=$1 AND status='ACTIVE'",
    [inst]
  );
  const byCode = new Map(components.rows.map((row) => [row.component_code, row]));
  const defaults = classSubject || defaultClassComponents(subject);
  const rows = [];
  componentCodes.forEach((code, index) => {
    const prefix = code.toLowerCase();
    const full = asNumber(defaults[`${prefix}_marks`]);
    const pass = asNumber(defaults[`${prefix}_pass_marks`]);
    const component = byCode.get(code);
    if (component && full > 0) rows.push({ ...component, full_marks: full, pass_marks: pass, sort_order: index + 1 });
  });
  return rows;
}

router.post("/exams/:id/subjects", requirePermission("exam.management", "update"), async (req, res) => {
  const client = await pool.connect();
  try {
    const inst = await institutionId(req);
    await client.query("BEGIN");
    const exam = await getExamForInstitution(client, inst, req.params.id);
    if (!exam) throw httpError(404, "Exam not found.");
    const subject = (
      await client.query("SELECT * FROM sms.subjects WHERE subject_id=$1 AND institution_id=$2 AND status='ACTIVE'", [req.body.subject_id, inst])
    ).rows[0];
    if (!subject) throw httpError(400, "Only an active institution subject can be added.");
    const paperNo = normalizePaperNo(req.body.paper_no, subject.paper_mode);
    const incompatiblePaper = await client.query(
      `SELECT exam_subject_id FROM sms.exam_subjects
        WHERE exam_id=$1 AND subject_id=$2 AND status='ACTIVE'
          AND (($3=0 AND paper_no IN (1,2)) OR ($3 IN (1,2) AND paper_no=0))
        LIMIT 1`,
      [exam.exam_id, subject.subject_id, paperNo]
    );
    if (incompatiblePaper.rowCount) throw httpError(409, "Use either Single paper or separate 1st/2nd Papers for an exam; they cannot be mixed.");
    let classSubject = null;
    if (exam.class_id) {
      classSubject = (
        await client.query(
          `SELECT * FROM sms.class_subjects
            WHERE institution_id=$1 AND class_id=$2 AND subject_id=$3 AND paper_no=$4 AND status='ACTIVE'
            ORDER BY group_id IS NULL DESC,class_subject_id LIMIT 1`,
          [inst, exam.class_id, subject.subject_id, paperNo]
        )
      ).rows[0];
      // Student-specific subjects use the master assessment scheme when no class default exists.
    }
    const components = await componentRowsFromConfiguration(client, inst, classSubject, subject);
    const configuredFull = components.reduce((sum, row) => sum + asNumber(row.full_marks), 0);
    const requestedFull = clean(req.body.full_marks) === null ? configuredFull || asNumber(subject.full_marks, 100) : asNumber(req.body.full_marks);
    if (requestedFull <= 0) throw httpError(400, "Full marks must be greater than zero.");
    if (components.length && Math.abs(configuredFull - requestedFull) > 0.01) {
      throw httpError(400, "Exam subject full marks must equal its assessment component total.");
    }
    const passMarks = clean(req.body.pass_marks) === null ? asNumber(subject.pass_marks, 0) : asNumber(req.body.pass_marks);
    if (passMarks < 0 || passMarks > requestedFull) throw httpError(400, "Pass marks are invalid.");
    const created = await client.query(
      `INSERT INTO sms.exam_subjects
        (exam_id,subject_id,paper_no,full_marks,pass_marks,exam_date,start_time,end_time,room_no)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [exam.exam_id, subject.subject_id, paperNo, requestedFull, passMarks, clean(req.body.exam_date),
        clean(req.body.start_time), clean(req.body.end_time), clean(req.body.room_no)]
    );
    const examSubject = created.rows[0];
    for (const component of components) {
      await client.query(
        `INSERT INTO sms.exam_subject_components
          (exam_subject_id,component_id,full_marks,pass_marks,sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [examSubject.exam_subject_id, component.component_id, component.full_marks, component.pass_marks, component.sort_order]
      );
    }
    await client.query("COMMIT");
    const componentResult = await pool.query(
      `SELECT esc.*,mc.component_code,mc.component_name FROM sms.exam_subject_components esc
       JOIN sms.mark_components mc ON mc.component_id=esc.component_id
       WHERE esc.exam_subject_id=$1 ORDER BY esc.sort_order,esc.exam_subject_component_id`,
      [examSubject.exam_subject_id]
    );
    return res.status(201).json({ success: true, data: { ...examSubject, components: componentResult.rows } });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error, "Failed to add exam subject.");
  } finally {
    client.release();
  }
});

router.put("/exam-subjects/:id", requirePermission("exam.management", "update"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const current = (
      await pool.query(
        `SELECT es.*,e.class_id,s.paper_mode FROM sms.exam_subjects es JOIN sms.exams e ON e.exam_id=es.exam_id JOIN sms.branches b ON b.branch_id=e.branch_id
         JOIN sms.subjects s ON s.subject_id=es.subject_id
         WHERE es.exam_subject_id=$1 AND b.institution_id=$2`,
        [req.params.id, inst]
      )
    ).rows[0];
    if (!current) throw httpError(404, "Exam subject not found.");
    const paperNo = normalizePaperNo(req.body.paper_no, current.paper_mode, Number(current.paper_no));
    const paperChanged = paperNo !== Number(current.paper_no || 0);
    if (paperChanged) {
      const marks = await pool.query("SELECT mark_id FROM sms.exam_marks WHERE exam_subject_id=$1 LIMIT 1", [req.params.id]);
      if (marks.rowCount) throw httpError(409, "Paper cannot be changed after marks entry has started.");
      const conflict = await pool.query(
        `SELECT exam_subject_id FROM sms.exam_subjects
          WHERE exam_id=$1 AND subject_id=$2 AND exam_subject_id<>$3 AND status='ACTIVE'
            AND (paper_no=$4 OR ($4=0 AND paper_no IN (1,2)) OR ($4 IN (1,2) AND paper_no=0))
          LIMIT 1`,
        [current.exam_id, current.subject_id, req.params.id, paperNo]
      );
      if (conflict.rowCount) throw httpError(409, "This paper is already in the exam, or Single paper conflicts with separate 1st/2nd Papers.");

    }
    const full = asNumber(req.body.full_marks);
    const pass = asNumber(req.body.pass_marks);
    if (full <= 0 || pass < 0 || pass > full) throw httpError(400, "Full/pass marks are invalid.");
    const configured = await pool.query("SELECT COALESCE(SUM(full_marks),0) total FROM sms.exam_subject_components WHERE exam_subject_id=$1", [req.params.id]);
    const componentTotal = asNumber(configured.rows[0]?.total);
    if (componentTotal > 0 && Math.abs(componentTotal - full) > 0.01) throw httpError(400, "Full marks must equal the configured component total.");
    const result = await pool.query(
      `UPDATE sms.exam_subjects SET paper_no=$1,full_marks=$2,pass_marks=$3,exam_date=$4,start_time=$5,end_time=$6,room_no=$7
       WHERE exam_subject_id=$8 RETURNING *`,
      [paperNo, full, pass, clean(req.body.exam_date), clean(req.body.start_time), clean(req.body.end_time), clean(req.body.room_no), req.params.id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return fail(res, error, "Failed to update exam subject.");
  }
});

router.delete("/exam-subjects/:id", requirePermission("exam.management", "delete"), async (req, res) => {
  const client = await pool.connect();
  try {
    const inst = await institutionId(req);
    await client.query("BEGIN");
    const current = await client.query(
      `SELECT es.exam_subject_id FROM sms.exam_subjects es JOIN sms.exams e ON e.exam_id=es.exam_id JOIN sms.branches b ON b.branch_id=e.branch_id
       WHERE es.exam_subject_id=$1 AND b.institution_id=$2`,
      [req.params.id, inst]
    );
    if (!current.rowCount) throw httpError(404, "Exam subject not found.");
    await client.query("DELETE FROM sms.exam_marks WHERE exam_subject_id=$1", [req.params.id]);
    await client.query("DELETE FROM sms.exam_subject_components WHERE exam_subject_id=$1", [req.params.id]);
    await client.query("DELETE FROM sms.exam_subjects WHERE exam_subject_id=$1", [req.params.id]);
    await client.query("COMMIT");
    return res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error, "Failed to delete exam subject.");
  } finally {
    client.release();
  }
});

router.get("/exam-subjects/:id/components", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const result = await pool.query(
      `SELECT esc.*,mc.component_code,mc.component_name,es.full_marks AS subject_full_marks,es.pass_marks AS subject_pass_marks
        FROM sms.exam_subject_components esc
        JOIN sms.mark_components mc ON mc.component_id=esc.component_id
        JOIN sms.exam_subjects es ON es.exam_subject_id=esc.exam_subject_id
        JOIN sms.exams e ON e.exam_id=es.exam_id
        JOIN sms.branches b ON b.branch_id=e.branch_id
        WHERE esc.exam_subject_id=$1 AND b.institution_id=$2
        ORDER BY esc.sort_order,esc.exam_subject_component_id`,
      [req.params.id, inst]
    );
    const subject = await pool.query(
      `SELECT es.full_marks,es.pass_marks FROM sms.exam_subjects es JOIN sms.exams e ON e.exam_id=es.exam_id JOIN sms.branches b ON b.branch_id=e.branch_id WHERE es.exam_subject_id=$1 AND b.institution_id=$2`,
      [req.params.id, inst]
    );
    if (!subject.rowCount) throw httpError(404, "Exam subject not found.");
    return res.json({ success: true, data: result.rows, meta: subject.rows[0] });
  } catch (error) {
    return fail(res, error, "Failed to load exam subject components.");
  }
});

router.put("/exam-subjects/:id/components", requirePermission("exam.management", "update"), async (req, res) => {
  const client = await pool.connect();
  try {
    const inst = await institutionId(req);
    const items = Array.isArray(req.body.components) ? req.body.components : [];
    await client.query("BEGIN");
    const subject = (
      await client.query(
        `SELECT es.* FROM sms.exam_subjects es JOIN sms.exams e ON e.exam_id=es.exam_id JOIN sms.branches b ON b.branch_id=e.branch_id
         WHERE es.exam_subject_id=$1 AND b.institution_id=$2`,
        [req.params.id, inst]
      )
    ).rows[0];
    if (!subject) throw httpError(404, "Exam subject not found.");
    const existingMarks = await client.query("SELECT mark_id FROM sms.exam_marks WHERE exam_subject_id=$1 AND component_id IS NOT NULL LIMIT 1", [req.params.id]);
    if (existingMarks.rowCount) throw httpError(409, "Component setup cannot be changed after component marks have been entered.");
    const normalized = [];
    const seen = new Set();
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      let component = null;
      if (item.component_id) {
        component = (
          await client.query("SELECT * FROM sms.mark_components WHERE component_id=$1 AND institution_id=$2 AND status='ACTIVE'", [item.component_id, inst])
        ).rows[0];
      } else if (item.component_code) {
        component = (
          await client.query("SELECT * FROM sms.mark_components WHERE component_code=$1 AND institution_id=$2 AND status='ACTIVE'", [String(item.component_code).toUpperCase(), inst])
        ).rows[0];
      }
      if (!component || seen.has(String(component.component_id))) throw httpError(400, "Each component must be valid and unique.");
      const full = asNumber(item.full_marks);
      const pass = asNumber(item.pass_marks);
      if (full <= 0 || pass < 0 || pass > full) throw httpError(400, `${component.component_name} full/pass marks are invalid.`);
      seen.add(String(component.component_id));
      normalized.push({ component_id: component.component_id, full_marks: full, pass_marks: pass, sort_order: asNumber(item.sort_order, index + 1) });
    }
    const total = normalized.reduce((sum, item) => sum + item.full_marks, 0);
    if (normalized.length && Math.abs(total - asNumber(subject.full_marks)) > 0.01) throw httpError(400, "Component full marks must equal exam subject full marks.");
    await client.query("DELETE FROM sms.exam_subject_components WHERE exam_subject_id=$1", [req.params.id]);
    for (const item of normalized) {
      await client.query(
        "INSERT INTO sms.exam_subject_components (exam_subject_id,component_id,full_marks,pass_marks,sort_order) VALUES ($1,$2,$3,$4,$5)",
        [req.params.id, item.component_id, item.full_marks, item.pass_marks, item.sort_order]
      );
    }
    await client.query("COMMIT");
    const result = await pool.query(
      `SELECT esc.*,mc.component_code,mc.component_name FROM sms.exam_subject_components esc JOIN sms.mark_components mc ON mc.component_id=esc.component_id WHERE esc.exam_subject_id=$1 ORDER BY esc.sort_order,esc.exam_subject_component_id`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error, "Failed to update exam subject components.");
  } finally {
    client.release();
  }
});

router.post("/exams/:id/routine/generate", requirePermission("exam.management", "update"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    if (!(await getExamForInstitution(pool, inst, req.params.id))) throw httpError(404, "Exam not found.");
    const start = String(req.body.start_date || "");
    const time = String(req.body.start_time || "10:00");
    const duration = Math.max(15, asNumber(req.body.duration_minutes, 180));
    const skipFriday = req.body.skip_friday !== false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw httpError(400, "A valid routine start date is required.");
    const subjects = (await pool.query("SELECT exam_subject_id FROM sms.exam_subjects WHERE exam_id=$1 AND status='ACTIVE' ORDER BY exam_subject_id", [req.params.id])).rows;
    if (!subjects.length) throw httpError(400, "Add exam subjects before generating a routine.");
    let current = new Date(`${start}T00:00:00`);
    const [hour, minute] = time.split(":").map(Number);
    const endMinutes = hour * 60 + minute + duration;
    const end = `${String(Math.floor(endMinutes / 60) % 24).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}:00`;
    for (const subject of subjects) {
      while (skipFriday && current.getDay() === 5) current.setDate(current.getDate() + 1);
      const day = current.toISOString().slice(0, 10);
      await pool.query("UPDATE sms.exam_subjects SET exam_date=$1,start_time=$2,end_time=$3 WHERE exam_subject_id=$4", [day, `${time}:00`, end, subject.exam_subject_id]);
      current.setDate(current.getDate() + 1);
    }
    const range = await pool.query("SELECT MIN(exam_date) start_date,MAX(exam_date) end_date FROM sms.exam_subjects WHERE exam_id=$1", [req.params.id]);
    await pool.query("UPDATE sms.exams SET start_date=$1,end_date=$2,exam_status='SCHEDULED' WHERE exam_id=$3", [range.rows[0]?.start_date, range.rows[0]?.end_date, req.params.id]);
    return res.json({ success: true, data: { scheduled: subjects.length } });
  } catch (error) {
    return fail(res, error, "Failed to generate routine.");
  }
});

router.post("/exams/:id/routine/reschedule", requirePermission("exam.management", "update"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    if (!(await getExamForInstitution(pool, inst, req.params.id))) throw httpError(404, "Exam not found.");
    const from = String(req.body.from_date || "");
    const days = Number(req.body.shift_days || 0);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !Number.isInteger(days) || days === 0) throw httpError(400, "Select a date and a non-zero number of shift days.");
    const result = await pool.query("UPDATE sms.exam_subjects SET exam_date=DATE_ADD(exam_date, INTERVAL $1 DAY) WHERE exam_id=$2 AND exam_date >= $3", [days, req.params.id, from]);
    const range = await pool.query("SELECT MIN(exam_date) start_date,MAX(exam_date) end_date FROM sms.exam_subjects WHERE exam_id=$1", [req.params.id]);
    await pool.query("UPDATE sms.exams SET start_date=$1,end_date=$2,exam_status='SCHEDULED' WHERE exam_id=$3", [range.rows[0]?.start_date, range.rows[0]?.end_date, req.params.id]);
    return res.json({ success: true, data: { rescheduled: result.rowCount } });
  } catch (error) {
    return fail(res, error, "Failed to reschedule routine.");
  }
});

router.post("/exams/:id/candidates/generate", requirePermission("exam.management", "update"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const exam = await getExamForInstitution(pool, inst, req.params.id);
    if (!exam) throw httpError(404, "Exam not found.");
    const enrollments = await pool.query(
      `SELECT se.student_id,se.enrollment_id FROM sms.student_enrollments se
        JOIN sms.students s ON s.student_id=se.student_id
        WHERE se.branch_id=$1 AND se.academic_year_id=$2 AND (se.class_id=$3 OR $3 IS NULL)
          AND se.enrollment_status='ACTIVE' AND s.status='ACTIVE' AND s.institution_id=$4
        ORDER BY se.enrollment_id`,
      [exam.branch_id, exam.academic_year_id, exam.class_id, inst]
    );
    let sequence = 0;
    for (const row of enrollments.rows) {
      sequence += 1;
      const feeStatus = asBoolean(exam.fee_required) ? "DUE" : "WAIVED";
      await pool.query(
        `INSERT INTO sms.exam_candidates
          (exam_id,student_id,enrollment_id,candidate_no,fee_status,fee_waived)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON DUPLICATE KEY UPDATE enrollment_id=VALUES(enrollment_id),candidate_no=COALESCE(candidate_no,VALUES(candidate_no))`,
        [exam.exam_id, row.student_id, row.enrollment_id, `${exam.exam_id}-${String(sequence).padStart(4, "0")}`, feeStatus, feeStatus === "WAIVED" ? 1 : 0]
      );
    }
    return res.json({ success: true, data: { generated: enrollments.rows.length } });
  } catch (error) {
    return fail(res, error, "Failed to generate candidates.");
  }
});

router.get("/exams/:id/candidates", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    if (!(await getExamForInstitution(pool, inst, req.params.id))) throw httpError(404, "Exam not found.");
    const result = await pool.query(
      `SELECT ec.*,s.student_no,s.full_name,e.exam_fee_amount,e.fee_required
        FROM sms.exam_candidates ec
        JOIN sms.exams e ON e.exam_id=ec.exam_id
        JOIN sms.students s ON s.student_id=ec.student_id
        WHERE ec.exam_id=$1 ORDER BY ec.candidate_no`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load candidates.");
  }
});

async function updateCandidate(req, res) {
  try {
    const inst = await institutionId(req);
    const current = (
      await pool.query(
        `SELECT ec.* FROM sms.exam_candidates ec JOIN sms.exams e ON e.exam_id=ec.exam_id JOIN sms.branches b ON b.branch_id=e.branch_id
         WHERE ec.candidate_id=$1 AND b.institution_id=$2`,
        [req.params.candidateId, inst]
      )
    ).rows[0];
    if (!current) throw httpError(404, "Candidate not found.");
    const eligibility = String(req.body.eligibility_status || current.eligibility_status).toUpperCase();
    let feeStatus = String(req.body.fee_status || current.fee_status).toUpperCase();
    if (!eligibilityStatuses.has(eligibility)) throw httpError(400, "Invalid eligibility status.");
    if (asBoolean(req.body.fee_waived)) feeStatus = "WAIVED";
    if (!feeStatuses.has(feeStatus)) throw httpError(400, "Invalid fee status.");
    const holdReason = clean(req.body.hold_reason);
    if (eligibility === "HOLD" && !holdReason) throw httpError(400, "A hold reason is required.");
    const result = await pool.query(
      `UPDATE sms.exam_candidates SET eligibility_status=$1,hold_reason=$2,fee_status=$3,fee_waived=$4
       WHERE candidate_id=$5 RETURNING *`,
      [eligibility, eligibility === "HOLD" || eligibility === "INELIGIBLE" ? holdReason : null,
        feeStatus, feeStatus === "WAIVED" ? 1 : 0, req.params.candidateId]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    return fail(res, error, "Failed to update candidate.");
  }
}

router.put("/candidates/:candidateId", requirePermission("exam.management", "update"), updateCandidate);
router.patch("/candidates/:candidateId", requirePermission("exam.management", "update"), updateCandidate);

router.post("/exams/:id/seating/generate", requirePermission("exam.management", "update"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const exam = await getExamForInstitution(pool, inst, req.params.id);
    if (!exam) throw httpError(404, "Exam not found.");
    const rooms = (await pool.query("SELECT classroom_id,room_no,GREATEST(COALESCE(capacity,0),0) capacity FROM sms.classrooms WHERE branch_id=$1 AND status='ACTIVE' ORDER BY room_no", [exam.branch_id])).rows;
    const candidates = (
      await pool.query(
        `SELECT candidate_id FROM sms.exam_candidates
          WHERE exam_id=$1 AND eligibility_status='ELIGIBLE'
            AND ($2=0 OR fee_status IN ('PAID','WAIVED'))
          ORDER BY candidate_no`,
        [exam.exam_id, asBoolean(exam.fee_required) ? 1 : 0]
      )
    ).rows;
    const capacity = rooms.reduce((sum, row) => sum + asNumber(row.capacity), 0);
    if (!candidates.length) {
      throw httpError(400, asBoolean(exam.fee_required)
        ? "No fee-cleared eligible candidates are available for seating."
        : "Generate eligible exam candidates first.");
    }
    if (capacity < candidates.length) throw httpError(400, `Classroom capacity (${capacity}) is lower than candidates (${candidates.length}).`);
    await pool.query("DELETE FROM sms.exam_seating_assignments WHERE exam_id=$1", [exam.exam_id]);
    let index = 0;
    for (const room of rooms) {
      for (let seat = 1; seat <= asNumber(room.capacity) && index < candidates.length; seat += 1, index += 1) {
        await pool.query("INSERT INTO sms.exam_seating_assignments (exam_id,candidate_id,classroom_id,seat_no) VALUES ($1,$2,$3,$4)", [exam.exam_id, candidates[index].candidate_id, room.classroom_id, `${room.room_no}-${seat}`]);
      }
    }
    return res.json({ success: true, data: { assigned: index } });
  } catch (error) {
    return fail(res, error, "Failed to generate seating plan.");
  }
});

router.get("/exams/:id/seating", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    if (!(await getExamForInstitution(pool, inst, req.params.id))) throw httpError(404, "Exam not found.");
    const result = await pool.query(
      `SELECT esa.*,ec.candidate_no,s.full_name,s.student_no,cr.room_no
        FROM sms.exam_seating_assignments esa
        JOIN sms.exam_candidates ec ON ec.candidate_id=esa.candidate_id
        JOIN sms.students s ON s.student_id=ec.student_id
        JOIN sms.classrooms cr ON cr.classroom_id=esa.classroom_id
        WHERE esa.exam_id=$1 ORDER BY cr.room_no,esa.seat_no`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load seating plan.");
  }
});

router.get("/exams/:id/marks", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    if (!(await getExamForInstitution(pool, inst, req.params.id))) throw httpError(404, "Exam not found.");
    const examSubjectId = clean(req.query.exam_subject_id);
    const result = await pool.query(
      `SELECT es.exam_subject_id,es.subject_id,es.paper_no,s.subject_code,s.subject_name,s.subject_name_bn,
          es.full_marks AS subject_full_marks,es.pass_marks AS subject_pass_marks,
          ec.candidate_id,ec.student_id,ec.candidate_no,ec.eligibility_status,ec.fee_status,
          st.student_no,st.full_name,
          esc.component_id,
          COALESCE(mc.component_code,'AGGREGATE') AS component_code,
          COALESCE(mc.component_name,'Aggregate') AS component_name,
          COALESCE(esc.full_marks,es.full_marks) AS component_full_marks,
          COALESCE(esc.pass_marks,es.pass_marks) AS component_pass_marks,
          em.mark_id,em.marks_obtained,em.is_absent,em.remarks,COALESCE(em.entry_status,'DRAFT') AS entry_status
        FROM sms.exam_subjects es
        JOIN sms.exams e ON e.exam_id=es.exam_id
        JOIN sms.exam_candidates ec ON ec.exam_id=e.exam_id
        LEFT JOIN sms.student_enrollments se ON se.enrollment_id=ec.enrollment_id
        JOIN sms.students st ON st.student_id=ec.student_id
        JOIN sms.subjects s ON s.subject_id=es.subject_id
        LEFT JOIN sms.exam_subject_components esc ON esc.exam_subject_id=es.exam_subject_id
        LEFT JOIN sms.mark_components mc ON mc.component_id=esc.component_id
        LEFT JOIN sms.exam_marks em ON em.exam_subject_id=es.exam_subject_id
          AND em.student_id=ec.student_id AND em.component_id <=> esc.component_id
        WHERE es.exam_id=$1 AND ($2 IS NULL OR es.exam_subject_id=$2)
          AND (COALESCE(se.subjects_assigned,0)=0 OR EXISTS (
            SELECT 1 FROM sms.student_subject_assignments ssa
             WHERE ssa.enrollment_id=ec.enrollment_id AND ssa.subject_id=es.subject_id AND ssa.paper_no=es.paper_no
          ))
          AND (COALESCE(se.subjects_assigned,0)=1 OR e.class_id IS NULL OR EXISTS (
            SELECT 1 FROM sms.class_subjects cs
             WHERE cs.institution_id=$3 AND cs.class_id=e.class_id
               AND cs.subject_id=es.subject_id AND cs.paper_no=es.paper_no AND cs.status='ACTIVE'
               AND (cs.group_id IS NULL OR cs.group_id=se.group_id)
          ))
        ORDER BY s.subject_name,es.paper_no,ec.candidate_no,COALESCE(esc.sort_order,0),esc.exam_subject_component_id`,
      [req.params.id, examSubjectId, inst]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load marks.");
  }
});

router.put("/marks", requirePermission("exam.management", "update"), async (req, res) => {
  const client = await pool.connect();
  try {
    const incoming = Array.isArray(req.body.marks) ? req.body.marks : [];
    if (!incoming.length) throw httpError(400, "At least one mark row is required.");
    const inst = await institutionId(req);
    await client.query("BEGIN");
    const subjectIds = [...new Set(incoming.map((row) => Number(row.exam_subject_id)).filter(Boolean))];
    if (!subjectIds.length) throw httpError(400, "Every mark row requires an exam subject.");
    const subjectPlaceholders = subjectIds.map((_, index) => `$${index + 2}`).join(",");
    const configurations = await client.query(
      `SELECT es.exam_subject_id,es.exam_id,es.full_marks,es.pass_marks,
          esc.component_id,esc.full_marks AS component_full_marks,esc.pass_marks AS component_pass_marks
        FROM sms.exam_subjects es
        JOIN sms.exams e ON e.exam_id=es.exam_id
        JOIN sms.branches b ON b.branch_id=e.branch_id
        LEFT JOIN sms.exam_subject_components esc ON esc.exam_subject_id=es.exam_subject_id
        WHERE b.institution_id=$1 AND es.exam_subject_id IN (${subjectPlaceholders})`,
      [inst, ...subjectIds]
    );
    const subjects = new Map();
    for (const row of configurations.rows) {
      const key = String(row.exam_subject_id);
      if (!subjects.has(key)) subjects.set(key, { ...row, components: new Map(), hasComponents: false });
      if (row.component_id !== null && row.component_id !== undefined) {
        subjects.get(key).hasComponents = true;
        subjects.get(key).components.set(String(row.component_id), row);
      }
    }
    if (subjects.size !== subjectIds.length) throw httpError(400, "One or more exam subjects are invalid for this institution.");
    const examIds = [...new Set([...subjects.values()].map((row) => Number(row.exam_id)))];
    const studentIds = [...new Set(incoming.map((row) => Number(row.student_id)).filter(Boolean))];
    if (!studentIds.length) throw httpError(400, "Every mark row requires a student.");
    const examPlaceholders = examIds.map((_, index) => `$${index + 1}`).join(",");
    const studentPlaceholders = studentIds.map((_, index) => `$${examIds.length + index + 1}`).join(",");
    const candidates = await client.query(
      `SELECT ec.exam_id,ec.student_id,es.exam_subject_id FROM sms.exam_candidates ec
        JOIN sms.exam_subjects es ON es.exam_id=ec.exam_id
        LEFT JOIN sms.student_enrollments se ON se.enrollment_id=ec.enrollment_id
        WHERE ec.exam_id IN (${examPlaceholders}) AND ec.student_id IN (${studentPlaceholders})
          AND (COALESCE(se.subjects_assigned,0)=0 OR EXISTS (
            SELECT 1 FROM sms.student_subject_assignments ssa
             WHERE ssa.enrollment_id=ec.enrollment_id AND ssa.subject_id=es.subject_id AND ssa.paper_no=es.paper_no
          ))`,
      [...examIds, ...studentIds]
    );
    const candidateKeys = new Set(candidates.rows.map((row) => `${row.exam_subject_id}:${row.student_id}`));
    const normalized = new Map();
    for (const mark of incoming) {
      const subject = subjects.get(String(Number(mark.exam_subject_id)));
      const studentId = Number(mark.student_id);
      if (!subject || !studentId || !candidateKeys.has(`${subject.exam_subject_id}:${studentId}`)) throw httpError(400, "Each mark must belong to a valid exam candidate and an assigned subject.");
      const componentId = clean(mark.component_id) === null ? null : Number(mark.component_id);
      let fullMarks;
      if (subject.hasComponents) {
        if (!componentId || !subject.components.has(String(componentId))) throw httpError(400, "A valid component is required for this exam subject.");
        fullMarks = asNumber(subject.components.get(String(componentId)).component_full_marks);
      } else {
        if (componentId) throw httpError(400, "This legacy exam subject accepts only aggregate marks.");
        fullMarks = asNumber(subject.full_marks);
      }
      const absent = asBoolean(mark.is_absent);
      const score = absent ? 0 : Number(mark.marks_obtained ?? 0);
      if (!Number.isFinite(score) || score < 0 || score > fullMarks) throw httpError(400, `Marks must be between 0 and ${fullMarks}.`);
      const key = `${subject.exam_subject_id}:${studentId}:${componentId ?? "aggregate"}`;
      normalized.set(key, {
        exam_id: subject.exam_id,
        exam_subject_id: subject.exam_subject_id,
        student_id: studentId,
        component_id: componentId,
        marks_obtained: score,
        is_absent: absent ? 1 : 0,
        remarks: clean(mark.remarks),
        entry_status: String(mark.entry_status || "DRAFT").toUpperCase() === "VERIFIED" ? "VERIFIED" : "DRAFT",
      });
    }
    const rows = [...normalized.values()];
    for (const row of rows.filter((item) => item.component_id === null)) {
      await client.query("DELETE FROM sms.exam_marks WHERE exam_subject_id=$1 AND student_id=$2 AND component_id IS NULL", [row.exam_subject_id, row.student_id]);
    }
    const values = [];
    const tuples = rows.map((row) => {
      const start = values.length + 1;
      values.push(row.exam_id, row.exam_subject_id, row.student_id, row.component_id, row.marks_obtained,
        row.is_absent, row.remarks, row.entry_status, req.user.user_id);
      return `(${Array.from({ length: 9 }, (_, index) => `$${start + index}`).join(",")})`;
    });
    await client.query(
      `INSERT INTO sms.exam_marks
        (exam_id,exam_subject_id,student_id,component_id,marks_obtained,is_absent,remarks,entry_status,entered_by)
       VALUES ${tuples.join(",")}
       ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained),is_absent=VALUES(is_absent),
         remarks=VALUES(remarks),entry_status=VALUES(entry_status),entered_by=VALUES(entered_by),updated_at=NOW()`,
      values
    );
    await client.query("COMMIT");
    return res.json({ success: true, data: { saved: rows.length, requested: incoming.length } });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error, "Failed to save marks.");
  } finally {
    client.release();
  }
});

router.post("/exams/:id/results/generate", requirePermission("exam.management", "approve"), async (req, res) => {
  const client = await pool.connect();
  try {
    const inst = await institutionId(req);
    await client.query("BEGIN");
    const exam = await getExamForInstitution(client, inst, req.params.id);
    if (!exam) throw httpError(404, "Exam not found.");
    const subjects = (
      await client.query("SELECT * FROM sms.exam_subjects WHERE exam_id=$1 AND status='ACTIVE' ORDER BY exam_subject_id", [exam.exam_id])
    ).rows;
    if (!subjects.length) throw httpError(400, "Add exam subjects before generating results.");
    const candidates = (
      await client.query(
        `SELECT ec.*,se.group_id,se.subjects_assigned
          FROM sms.exam_candidates ec
          JOIN sms.exams e ON e.exam_id=ec.exam_id
          LEFT JOIN sms.student_enrollments se ON se.enrollment_id=ec.enrollment_id
          WHERE ec.exam_id=$1 AND ec.eligibility_status='ELIGIBLE'
            AND (e.fee_required=0 OR ec.fee_status IN ('PAID','WAIVED'))
          ORDER BY ec.candidate_no`,
        [exam.exam_id]
      )
    ).rows;
    const candidateSummary = (
      await client.query(
        `SELECT COUNT(*) total_eligible,
            SUM(CASE WHEN e.fee_required=1 AND ec.fee_status='DUE' THEN 1 ELSE 0 END) fee_due
          FROM sms.exam_candidates ec JOIN sms.exams e ON e.exam_id=ec.exam_id
          WHERE ec.exam_id=$1 AND ec.eligibility_status='ELIGIBLE'`,
        [exam.exam_id]
      )
    ).rows[0] || {};
    if (!candidates.length) {
      throw httpError(400, asNumber(candidateSummary.fee_due) > 0
        ? `No fee-cleared eligible candidates are available; ${asNumber(candidateSummary.fee_due)} candidate(s) still have fees due.`
        : "No eligible candidates are available for result generation.");
    }
    let gradingScaleId = exam.grading_scale_id;
    if (!gradingScaleId) {
      gradingScaleId = (
        await client.query("SELECT grading_scale_id FROM sms.grading_scales WHERE institution_id=$1 AND status='ACTIVE' ORDER BY grading_scale_id LIMIT 1", [inst])
      ).rows[0]?.grading_scale_id;
    }
    const grades = gradingScaleId
      ? (await client.query("SELECT * FROM sms.grading_scale_details WHERE grading_scale_id=$1 ORDER BY min_marks DESC", [gradingScaleId])).rows
      : [];
    if (!grades.length) throw httpError(400, "Configure a grading scale before generating results.");
    const componentRows = (
      await client.query(
        `SELECT esc.*,mc.component_code,mc.component_name
          FROM sms.exam_subject_components esc
          JOIN sms.mark_components mc ON mc.component_id=esc.component_id
          JOIN sms.exam_subjects es ON es.exam_subject_id=esc.exam_subject_id
          WHERE es.exam_id=$1 ORDER BY esc.sort_order,esc.exam_subject_component_id`,
        [exam.exam_id]
      )
    ).rows;
    const componentsBySubject = new Map();
    for (const row of componentRows) {
      const key = String(row.exam_subject_id);
      if (!componentsBySubject.has(key)) componentsBySubject.set(key, []);
      componentsBySubject.get(key).push(row);
    }
    const markRows = (
      await client.query("SELECT * FROM sms.exam_marks WHERE exam_id=$1 ORDER BY mark_id", [exam.exam_id])
    ).rows;
    const marksByKey = new Map();
    for (const row of markRows) {
      marksByKey.set(`${row.exam_subject_id}:${row.student_id}:${row.component_id ?? "aggregate"}`, row);
    }
    const classAssignments = exam.class_id
      ? (await client.query("SELECT * FROM sms.class_subjects WHERE institution_id=$1 AND class_id=$2 AND status='ACTIVE' ORDER BY group_id IS NULL DESC,class_subject_id", [inst, exam.class_id])).rows
      : [];
    const assignmentsBySubject = new Map();
    for (const row of classAssignments) {
      const key = `${row.subject_id}:${Number(row.paper_no || 0)}`;
      if (!assignmentsBySubject.has(key)) assignmentsBySubject.set(key, []);
      assignmentsBySubject.get(key).push(row);
    }
    const assignmentFor = (subjectId, paperNo, groupId) => {
      const options = assignmentsBySubject.get(`${subjectId}:${Number(paperNo || 0)}`) || [];
      return options.find((row) => row.group_id !== null && String(row.group_id) === String(groupId))
        || options.find((row) => row.group_id === null)
        || null;
    };
    const studentAssignments = (await client.query(
      `SELECT ssa.* FROM sms.student_subject_assignments ssa
        JOIN sms.exam_candidates ec ON ec.enrollment_id=ssa.enrollment_id WHERE ec.exam_id=$1`, [exam.exam_id]
    )).rows;
    const studentAssignmentMap = new Map(studentAssignments.map(row => [`${row.enrollment_id}:${row.subject_id}:${Number(row.paper_no || 0)}`, row]));
    const candidateAssignment = (subject, candidate) => Number(candidate.subjects_assigned)
      ? studentAssignmentMap.get(`${candidate.enrollment_id}:${subject.subject_id}:${Number(subject.paper_no || 0)}`)
      : assignmentFor(subject.subject_id, subject.paper_no, candidate.group_id);
    let missingMarkCount = 0;
    let unverifiedMarkCount = 0;
    const affectedStudents = new Set();
    for (const candidate of candidates) {
      if (Number(candidate.subjects_assigned) && !subjects.some(subject => candidateAssignment(subject, candidate))) {
        throw httpError(400, `Student ${candidate.student_id} has no assigned subjects in this exam. Select subjects on the student profile and add them to the exam first.`);
      }
      for (const subject of subjects) {
        if ((exam.class_id || Number(candidate.subjects_assigned)) && !candidateAssignment(subject, candidate)) continue;
        const components = componentsBySubject.get(String(subject.exam_subject_id)) || [];
        const componentIds = components.length ? components.map((component) => component.component_id) : ["aggregate"];
        for (const componentId of componentIds) {
          const key = `${subject.exam_subject_id}:${candidate.student_id}:${componentId}`;
          const mark = marksByKey.get(key);
          if (!mark) {
            missingMarkCount += 1;
            affectedStudents.add(String(candidate.student_id));
          } else if (String(mark.entry_status || "DRAFT").toUpperCase() !== "VERIFIED") {
            unverifiedMarkCount += 1;
            affectedStudents.add(String(candidate.student_id));
          }
        }
      }
    }
    if (missingMarkCount || unverifiedMarkCount) {
      throw httpError(
        400,
        `Result generation blocked: ${missingMarkCount} required mark entr${missingMarkCount === 1 ? "y is" : "ies are"} missing and ${unverifiedMarkCount} entr${unverifiedMarkCount === 1 ? "y is" : "ies are"} not verified across ${affectedStudents.size} student${affectedStudents.size === 1 ? "" : "s"}.`
      );
    }
    for (const candidate of candidates) {
      let totalMarks = 0;
      let obtainedMarks = 0;
      let mandatoryFailures = 0;
      const mandatoryPoints = [];
      const allPoints = [];
      const details = [];
      for (const subject of subjects) {
        const assignment = candidateAssignment(subject, candidate);
        if ((exam.class_id || Number(candidate.subjects_assigned)) && !assignment) continue;
        const components = componentsBySubject.get(String(subject.exam_subject_id)) || [];
        let score = 0;
        let absent = false;
        let componentPassed = true;
        if (components.length) {
          for (const component of components) {
            const mark = marksByKey.get(`${subject.exam_subject_id}:${candidate.student_id}:${component.component_id}`);
            const componentScore = asNumber(mark?.marks_obtained);
            const componentAbsent = asBoolean(mark?.is_absent);
            score += componentScore;
            absent = absent || componentAbsent;
            if (componentAbsent || componentScore < asNumber(component.pass_marks)) componentPassed = false;
          }
        } else {
          const mark = marksByKey.get(`${subject.exam_subject_id}:${candidate.student_id}:aggregate`);
          score = asNumber(mark?.marks_obtained);
          absent = asBoolean(mark?.is_absent);
          componentPassed = !absent;
        }
        const percentage = asNumber(subject.full_marks) > 0 ? score * 100 / asNumber(subject.full_marks) : 0;
        const grade = gradeForPercent(grades, percentage);
        const subjectPassed = !absent && componentPassed && score >= asNumber(subject.pass_marks);
        const subjectStatus = absent ? "ABSENT" : subjectPassed ? "PASSED" : "FAILED";
        const assignmentType = assignmentTypes.has(String(assignment?.assignment_type)) ? assignment.assignment_type : "MANDATORY";
        if (!subjectPassed && assignmentType === "MANDATORY") mandatoryFailures += 1;
        if (assignmentType === "MANDATORY") mandatoryPoints.push(asNumber(grade?.grade_point));
        allPoints.push(asNumber(grade?.grade_point));
        totalMarks += asNumber(subject.full_marks);
        obtainedMarks += score;
        details.push({ subject, score, grade, subjectStatus, assignmentType });
      }
      const resultStatus = mandatoryFailures > 0 ? "FAILED" : "PASSED";
      const gpaPoints = mandatoryPoints.length ? mandatoryPoints : allPoints;
      const gpa = resultStatus === "PASSED" && gpaPoints.length
        ? Number((gpaPoints.reduce((sum, point) => sum + point, 0) / gpaPoints.length).toFixed(2))
        : 0;
      const overallPercent = totalMarks > 0 ? obtainedMarks * 100 / totalMarks : 0;
      const overallGrade = gradeForPercent(grades, overallPercent);
      await client.query(
        `INSERT INTO sms.student_results
          (exam_id,student_id,enrollment_id,total_marks,obtained_marks,gpa,letter_grade,result_status,failed_subject_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON DUPLICATE KEY UPDATE total_marks=VALUES(total_marks),obtained_marks=VALUES(obtained_marks),
           enrollment_id=VALUES(enrollment_id),gpa=VALUES(gpa),letter_grade=VALUES(letter_grade),
           result_status=VALUES(result_status),failed_subject_count=VALUES(failed_subject_count)`,
        [exam.exam_id, candidate.student_id, candidate.enrollment_id, totalMarks, obtainedMarks, gpa,
          resultStatus === "PASSED" ? (overallGrade?.letter_grade || "") : "F", resultStatus, mandatoryFailures]
      );
      const savedResult = (
        await client.query("SELECT result_id FROM sms.student_results WHERE exam_id=$1 AND student_id=$2", [exam.exam_id, candidate.student_id])
      ).rows[0];
      await client.query("DELETE FROM sms.student_result_details WHERE result_id=$1", [savedResult.result_id]);
      for (const detail of details) {
        await client.query(
          `INSERT INTO sms.student_result_details
            (result_id,subject_id,paper_no,full_marks,pass_marks,obtained_marks,letter_grade,grade_point,subject_status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [savedResult.result_id, detail.subject.subject_id, Number(detail.subject.paper_no || 0), detail.subject.full_marks, detail.subject.pass_marks,
            detail.score, detail.grade?.letter_grade || "", detail.grade?.grade_point || 0, detail.subjectStatus]
        );
      }
    }
    await client.query("UPDATE sms.student_results SET merit_position=NULL WHERE exam_id=$1", [exam.exam_id]);
    const ranked = (
      await client.query("SELECT result_id FROM sms.student_results WHERE exam_id=$1 AND result_status='PASSED' ORDER BY gpa DESC,obtained_marks DESC,result_id", [exam.exam_id])
    ).rows;
    for (let index = 0; index < ranked.length; index += 1) {
      await client.query("UPDATE sms.student_results SET merit_position=$1 WHERE result_id=$2", [index + 1, ranked[index].result_id]);
    }
    await client.query(
      `UPDATE sms.exams SET exam_status=CASE
        WHEN exam_status IN ('PUBLISHED','PARTIALLY_PUBLISHED') THEN exam_status ELSE 'COMPLETED' END
       WHERE exam_id=$1`,
      [exam.exam_id]
    );
    await client.query("COMMIT");
    return res.json({
      success: true,
      data: {
        processed: candidates.length,
        total_eligible: asNumber(candidateSummary.total_eligible),
        skipped_fee_due: asNumber(candidateSummary.fee_due),
        ranked: ranked.length,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error, "Result generation failed.");
  } finally {
    client.release();
  }
});

router.get("/exams/:id/results", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    if (!(await getExamForInstitution(pool, inst, req.params.id))) throw httpError(404, "Exam not found.");
    const result = await pool.query(
      `SELECT sr.*,s.student_no,s.full_name,ec.candidate_no,
          CASE WHEN sr.published_at IS NULL THEN 'UNPUBLISHED' ELSE 'PUBLISHED' END AS publish_status
        FROM sms.student_results sr
        JOIN sms.students s ON s.student_id=sr.student_id
        LEFT JOIN sms.exam_candidates ec ON ec.exam_id=sr.exam_id AND ec.student_id=sr.student_id
        WHERE sr.exam_id=$1 ORDER BY sr.merit_position IS NULL,sr.merit_position,sr.gpa DESC,sr.obtained_marks DESC`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load results.");
  }
});

router.get("/exams/:id/result-sheet", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const exam = await getExamForInstitution(pool, inst, req.params.id);
    if (!exam) throw httpError(404, "Exam not found.");

    const [subjectResult, resultResult, detailResult] = await Promise.all([
      pool.query(
        `SELECT es.exam_subject_id,es.subject_id,es.paper_no,es.full_marks,es.pass_marks,
            s.subject_code,s.subject_name,s.subject_name_bn
          FROM sms.exam_subjects es
          JOIN sms.subjects s ON s.subject_id=es.subject_id
          WHERE es.exam_id=$1 AND es.status='ACTIVE'
          ORDER BY s.subject_name,es.paper_no,es.exam_subject_id`,
        [exam.exam_id]
      ),
      pool.query(
        `SELECT sr.*,s.student_no,s.full_name,s.photo_url,ec.candidate_no,
            se.roll_no,se.group_id,se.section_id,g.group_name,sec.section_name,
            CASE WHEN sr.published_at IS NULL THEN 'UNPUBLISHED' ELSE 'PUBLISHED' END AS publish_status
          FROM sms.student_results sr
          JOIN sms.students s ON s.student_id=sr.student_id
          LEFT JOIN sms.exam_candidates ec ON ec.exam_id=sr.exam_id AND ec.student_id=sr.student_id
          LEFT JOIN sms.student_enrollments se ON se.enrollment_id=sr.enrollment_id
          LEFT JOIN sms.groups g ON g.group_id=se.group_id
          LEFT JOIN sms.sections sec ON sec.section_id=se.section_id
          WHERE sr.exam_id=$1
          ORDER BY sr.merit_position IS NULL,sr.merit_position,sr.gpa DESC,sr.obtained_marks DESC,s.full_name`,
        [exam.exam_id]
      ),
      pool.query(
        `SELECT sr.student_id,srd.*,es.exam_subject_id,
            s.subject_code,s.subject_name,s.subject_name_bn,
            COALESCE(ssa.assignment_type,cs.assignment_type,'MANDATORY') AS assignment_type
          FROM sms.student_result_details srd
          JOIN sms.student_results sr ON sr.result_id=srd.result_id
          JOIN sms.subjects s ON s.subject_id=srd.subject_id
          LEFT JOIN sms.exam_subjects es ON es.exam_id=sr.exam_id
            AND es.subject_id=srd.subject_id AND es.paper_no=srd.paper_no
          LEFT JOIN sms.student_subject_assignments ssa ON ssa.enrollment_id=sr.enrollment_id
            AND ssa.subject_id=srd.subject_id AND ssa.paper_no=srd.paper_no
          LEFT JOIN sms.class_subjects cs ON cs.class_subject_id=(
            SELECT matching_cs.class_subject_id
            FROM sms.class_subjects matching_cs
            JOIN sms.exams matching_exam ON matching_exam.exam_id=sr.exam_id
            LEFT JOIN sms.student_enrollments matching_enrollment ON matching_enrollment.enrollment_id=sr.enrollment_id
            WHERE matching_cs.class_id=matching_exam.class_id
              AND matching_cs.subject_id=srd.subject_id
              AND matching_cs.paper_no=srd.paper_no
              AND matching_cs.status='ACTIVE'
              AND (matching_cs.group_id=matching_enrollment.group_id OR matching_cs.group_id IS NULL)
            ORDER BY matching_cs.group_id=matching_enrollment.group_id DESC,
              matching_cs.group_id IS NULL DESC,matching_cs.class_subject_id
            LIMIT 1
          )
          WHERE sr.exam_id=$1
          ORDER BY sr.student_id,s.subject_name,srd.paper_no`,
        [exam.exam_id]
      ),
    ]);

    const detailsByStudent = new Map();
    for (const detail of detailResult.rows) {
      const key = String(detail.student_id);
      if (!detailsByStudent.has(key)) detailsByStudent.set(key, []);
      detailsByStudent.get(key).push(detail);
    }

    const students = resultResult.rows.map((result) => ({
      ...result,
      subjects: detailsByStudent.get(String(result.student_id)) || [],
    }));

    return res.json({
      success: true,
      data: {
        exam,
        subjects: subjectResult.rows,
        students,
      },
    });
  } catch (error) {
    return fail(res, error, "Failed to load the full result sheet.");
  }
});

router.get("/exams/:id/results/:studentId", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const exam = await getExamForInstitution(pool, inst, req.params.id);
    if (!exam) throw httpError(404, "Exam not found.");
    const result = await pool.query(
      `SELECT sr.*,s.student_no,s.full_name,s.photo_url,s.gender,s.date_of_birth,
          ec.candidate_no,se.group_id,cl.class_name,ay.year_name,
          e.exam_name,e.result_publish_date,et.exam_type_name,b.branch_name,
          i.institution_id,i.institution_name,i.institution_name_bn,i.logo_url,i.eiin_no
        FROM sms.student_results sr
        JOIN sms.students s ON s.student_id=sr.student_id
        JOIN sms.exams e ON e.exam_id=sr.exam_id
        JOIN sms.branches b ON b.branch_id=e.branch_id
        JOIN sms.institutions i ON i.institution_id=b.institution_id
        LEFT JOIN sms.exam_candidates ec ON ec.exam_id=sr.exam_id AND ec.student_id=sr.student_id
        LEFT JOIN sms.student_enrollments se ON se.enrollment_id=sr.enrollment_id
        LEFT JOIN sms.class_levels cl ON cl.class_id=e.class_id
        LEFT JOIN sms.academic_years ay ON ay.academic_year_id=e.academic_year_id
        LEFT JOIN sms.exam_types et ON et.exam_type_id=e.exam_type_id
        WHERE sr.exam_id=$1 AND sr.student_id=$2 AND b.institution_id=$3`,
      [req.params.id, req.params.studentId, inst]
    );
    if (!result.rowCount) throw httpError(404, "Student result not found.");
    const details = await pool.query(
      `SELECT srd.*,s.subject_code,s.subject_name,s.subject_name_bn,
          COALESCE((
            SELECT ssa.assignment_type FROM sms.student_subject_assignments ssa
            JOIN sms.student_results assigned_result ON assigned_result.enrollment_id=ssa.enrollment_id
            WHERE assigned_result.result_id=srd.result_id AND ssa.subject_id=srd.subject_id AND ssa.paper_no=srd.paper_no
            LIMIT 1
          ),(
            SELECT cs.assignment_type FROM sms.class_subjects cs
            JOIN sms.exams ex ON ex.exam_id=$2
            LEFT JOIN sms.student_results inner_sr ON inner_sr.exam_id=ex.exam_id AND inner_sr.student_id=$3
            LEFT JOIN sms.student_enrollments inner_se ON inner_se.enrollment_id=inner_sr.enrollment_id
            WHERE cs.class_id=ex.class_id AND cs.subject_id=srd.subject_id AND cs.paper_no=srd.paper_no AND cs.status='ACTIVE'
              AND (cs.group_id=inner_se.group_id OR cs.group_id IS NULL)
            ORDER BY cs.group_id=inner_se.group_id DESC,cs.group_id IS NULL DESC,cs.class_subject_id LIMIT 1
          ),'MANDATORY') AS assignment_type
        FROM sms.student_result_details srd
        JOIN sms.subjects s ON s.subject_id=srd.subject_id
        WHERE srd.result_id=$1 ORDER BY s.subject_name,srd.paper_no`,
      [result.rows[0].result_id, exam.exam_id, req.params.studentId]
    );
    const components = await pool.query(
      `SELECT es.exam_subject_id,es.subject_id,es.paper_no,s.subject_code,s.subject_name,
          esc.component_id,COALESCE(mc.component_code,'AGGREGATE') component_code,
          COALESCE(mc.component_name,'Aggregate') component_name,
          COALESCE(esc.full_marks,es.full_marks) component_full_marks,
          COALESCE(esc.pass_marks,es.pass_marks) component_pass_marks,
          em.marks_obtained,em.is_absent,em.entry_status,em.remarks
        FROM sms.exam_subjects es
        JOIN sms.subjects s ON s.subject_id=es.subject_id
        LEFT JOIN sms.exam_subject_components esc ON esc.exam_subject_id=es.exam_subject_id
        LEFT JOIN sms.mark_components mc ON mc.component_id=esc.component_id
        LEFT JOIN sms.exam_marks em ON em.exam_subject_id=es.exam_subject_id
          AND em.student_id=$2 AND em.component_id <=> esc.component_id
        WHERE es.exam_id=$1 ORDER BY s.subject_name,es.paper_no,COALESCE(esc.sort_order,0)`,
      [exam.exam_id, req.params.studentId]
    );
    return res.json({ success: true, data: { result: result.rows[0], details: details.rows, components: components.rows } });
  } catch (error) {
    return fail(res, error, "Failed to load student result details.");
  }
});

async function setPublication(req, res, publish) {
  try {
    const inst = await institutionId(req);
    const exam = await getExamForInstitution(pool, inst, req.params.id);
    if (!exam) throw httpError(404, "Exam not found.");
    const scope = String(req.body.scope || "ALL").toUpperCase();
    if (!["ALL", "STUDENTS"].includes(scope)) throw httpError(400, "scope must be ALL or STUDENTS.");
    const studentIds = [...new Set((Array.isArray(req.body.student_ids) ? req.body.student_ids : []).map(Number).filter(Boolean))];
    if (scope === "STUDENTS" && !studentIds.length) throw httpError(400, "student_ids are required for STUDENTS scope.");
    const values = [exam.exam_id];
    let filter = "exam_id=$1";
    if (scope === "STUDENTS") {
      const placeholders = studentIds.map((_, index) => `$${index + 2}`).join(",");
      filter += ` AND student_id IN (${placeholders})`;
      values.push(...studentIds);
    }
    const update = await pool.query(
      `UPDATE sms.student_results SET published_at=${publish ? "NOW()" : "NULL"} WHERE ${filter}`,
      values
    );
    const counts = (
      await pool.query(
        `SELECT COUNT(*) total,SUM(published_at IS NOT NULL) published
          FROM sms.student_results WHERE exam_id=$1`,
        [exam.exam_id]
      )
    ).rows[0] || {};
    const total = asNumber(counts.total);
    const published = asNumber(counts.published);
    const status = total > 0 && published === total ? "PUBLISHED" : published > 0 ? "PARTIALLY_PUBLISHED" : "COMPLETED";
    await pool.query(
      `UPDATE sms.exams SET exam_status=$1,
        result_publish_date=CASE WHEN $2>0 THEN COALESCE(result_publish_date,CURDATE()) ELSE result_publish_date END
       WHERE exam_id=$3`,
      [status, published, exam.exam_id]
    );
    return res.json({ success: true, data: { scope, affected: update.rowCount, total, published, exam_status: status } });
  } catch (error) {
    return fail(res, error, publish ? "Failed to publish result." : "Failed to unpublish result.");
  }
}

router.post("/exams/:id/publish", requirePermission("exam.management", "approve"), (req, res) => setPublication(req, res, true));
router.post("/exams/:id/unpublish", requirePermission("exam.management", "approve"), (req, res) => setPublication(req, res, false));

router.get("/document-templates", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const type = String(req.query.document_type || "").toUpperCase();
    if (type && !documentTypes.has(type)) throw httpError(400, "Invalid document type.");
    const result = await pool.query(
      `SELECT * FROM sms.document_templates
        WHERE institution_id=$1 AND ($2='' OR document_type=$2)
        ORDER BY document_type,is_default DESC,template_name`,
      [inst, type]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load document templates.");
  }
});

router.post("/document-templates", requirePermission("exam.management", "create"), async (req, res) => {
  const client = await pool.connect();
  try {
    const inst = await institutionId(req);
    const type = String(req.body.document_type || "").toUpperCase();
    const name = String(req.body.template_name || "").trim();
    const status = String(req.body.status || "ACTIVE").toUpperCase();
    if (!documentTypes.has(type) || !name || !["ACTIVE", "INACTIVE"].includes(status)) throw httpError(400, "Valid document type, template name and status are required.");
    const makeDefault = asBoolean(req.body.is_default);
    await client.query("BEGIN");
    if (makeDefault) await client.query("UPDATE sms.document_templates SET is_default=0 WHERE institution_id=$1 AND document_type=$2", [inst, type]);
    const created = await client.query(
      `INSERT INTO sms.document_templates
        (institution_id,document_type,template_name,design_json,is_default,status,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [inst, type, name, designJson(req.body.design_json), makeDefault ? 1 : 0, status, req.user.user_id]
    );
    await client.query("COMMIT");
    return res.status(201).json({ success: true, data: created.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error, "Failed to create document template.");
  } finally {
    client.release();
  }
});

router.put("/document-templates/:id", requirePermission("exam.management", "update"), async (req, res) => {
  const client = await pool.connect();
  try {
    const inst = await institutionId(req);
    const current = (
      await client.query("SELECT * FROM sms.document_templates WHERE template_id=$1 AND institution_id=$2", [req.params.id, inst])
    ).rows[0];
    if (!current) throw httpError(404, "Document template not found.");
    const type = String(req.body.document_type || current.document_type).toUpperCase();
    const name = String(req.body.template_name || current.template_name).trim();
    const status = String(req.body.status || current.status).toUpperCase();
    if (!documentTypes.has(type) || !name || !["ACTIVE", "INACTIVE"].includes(status)) throw httpError(400, "Valid document type, template name and status are required.");
    const makeDefault = hasOwn(req.body, "is_default") ? asBoolean(req.body.is_default) : asBoolean(current.is_default);
    const design = hasOwn(req.body, "design_json") ? designJson(req.body.design_json) : designJson(current.design_json);
    await client.query("BEGIN");
    if (makeDefault) await client.query("UPDATE sms.document_templates SET is_default=0 WHERE institution_id=$1 AND document_type=$2", [inst, type]);
    const updated = await client.query(
      `UPDATE sms.document_templates SET document_type=$1,template_name=$2,design_json=$3,is_default=$4,status=$5
       WHERE template_id=$6 AND institution_id=$7 RETURNING *`,
      [type, name, design, makeDefault ? 1 : 0, status, req.params.id, inst]
    );
    await client.query("COMMIT");
    return res.json({ success: true, data: updated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    return fail(res, error, "Failed to update document template.");
  } finally {
    client.release();
  }
});

router.delete("/document-templates/:id", requirePermission("exam.management", "delete"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const used = await pool.query(
      `SELECT idoc.issued_document_id FROM sms.issued_documents idoc
       JOIN sms.students s ON s.student_id=idoc.student_id
       WHERE idoc.template_id=$1 AND s.institution_id=$2 LIMIT 1`,
      [req.params.id, inst]
    );
    if (used.rowCount) throw httpError(409, "An issued document uses this template; set it inactive instead.");
    const result = await pool.query("DELETE FROM sms.document_templates WHERE template_id=$1 AND institution_id=$2", [req.params.id, inst]);
    if (!result.rowCount) throw httpError(404, "Document template not found.");
    return res.json({ success: true });
  } catch (error) {
    return fail(res, error, "Failed to delete document template.");
  }
});

async function issuedDocumentById(executor, inst, documentId) {
  const result = await executor.query(
    `SELECT idoc.*,dt.template_name,dt.design_json AS current_design_json,
        s.student_no,s.full_name,s.photo_url,s.gender,s.date_of_birth,
        e.exam_name,e.exam_status,e.result_publish_date,cl.class_name,ay.year_name,
        i.institution_id,i.institution_name,i.institution_name_bn,i.logo_url,i.eiin_no
      FROM sms.issued_documents idoc
      JOIN sms.students s ON s.student_id=idoc.student_id
      JOIN sms.institutions i ON i.institution_id=s.institution_id
      LEFT JOIN sms.document_templates dt ON dt.template_id=idoc.template_id
      LEFT JOIN sms.exams e ON e.exam_id=idoc.exam_id
      LEFT JOIN sms.class_levels cl ON cl.class_id=e.class_id
      LEFT JOIN sms.academic_years ay ON ay.academic_year_id=e.academic_year_id
      WHERE idoc.issued_document_id=$1 AND s.institution_id=$2`,
    [documentId, inst]
  );
  return result.rows[0] || null;
}

router.get("/documents", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const type = String(req.query.document_type || "").toUpperCase();
    if (type && !documentTypes.has(type)) throw httpError(400, "Invalid document type.");
    const result = await pool.query(
      `SELECT idoc.*,dt.template_name,s.student_no,s.full_name,e.exam_name,cl.class_name
        FROM sms.issued_documents idoc
        JOIN sms.students s ON s.student_id=idoc.student_id
        LEFT JOIN sms.document_templates dt ON dt.template_id=idoc.template_id
        LEFT JOIN sms.exams e ON e.exam_id=idoc.exam_id
        LEFT JOIN sms.class_levels cl ON cl.class_id=e.class_id
        WHERE s.institution_id=$1
          AND ($2 IS NULL OR idoc.student_id=$2)
          AND ($3 IS NULL OR idoc.exam_id=$3)
          AND ($4='' OR idoc.document_type=$4)
        ORDER BY idoc.issued_document_id DESC`,
      [inst, clean(req.query.student_id), clean(req.query.exam_id), type]
    );
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    return fail(res, error, "Failed to load issued documents.");
  }
});

router.get("/documents/:id", requirePermission("exam.management", "view"), async (req, res) => {
  try {
    const document = await issuedDocumentById(pool, await institutionId(req), req.params.id);
    if (!document) throw httpError(404, "Issued document not found.");
    let result = null;
    if (document.exam_id) {
      result = (
        await pool.query("SELECT * FROM sms.student_results WHERE exam_id=$1 AND student_id=$2", [document.exam_id, document.student_id])
      ).rows[0] || null;
    }
    return res.json({ success: true, data: { document, result } });
  } catch (error) {
    return fail(res, error, "Failed to load issued document.");
  }
});

router.post("/documents", requirePermission("exam.management", "create"), async (req, res) => {
  try {
    const inst = await institutionId(req);
    const type = String(req.body.document_type || "MARKSHEET").toUpperCase();
    if (!documentTypes.has(type)) throw httpError(400, "Document type must be MARKSHEET or TESTIMONIAL.");
    const student = (
      await pool.query("SELECT * FROM sms.students WHERE student_id=$1 AND institution_id=$2", [req.body.student_id, inst])
    ).rows[0];
    if (!student) throw httpError(400, "Invalid student.");
    const examId = clean(req.body.exam_id);
    if (type === "MARKSHEET" && !examId) throw httpError(400, "An exam is required for a marksheet.");
    if (examId) {
      const exam = await getExamForInstitution(pool, inst, examId);
      if (!exam) throw httpError(400, "Invalid exam.");
      if (type === "MARKSHEET") {
        const result = await pool.query("SELECT result_id FROM sms.student_results WHERE exam_id=$1 AND student_id=$2", [examId, student.student_id]);
        if (!result.rowCount) throw httpError(400, "Generate this student's result before issuing a marksheet.");
      }
    }
    let template;
    if (req.body.template_id) {
      template = (
        await pool.query("SELECT * FROM sms.document_templates WHERE template_id=$1 AND institution_id=$2 AND document_type=$3 AND status='ACTIVE'", [req.body.template_id, inst, type])
      ).rows[0];
    } else {
      template = (
        await pool.query("SELECT * FROM sms.document_templates WHERE institution_id=$1 AND document_type=$2 AND status='ACTIVE' ORDER BY is_default DESC,template_id LIMIT 1", [inst, type])
      ).rows[0];
    }
    if (!template) throw httpError(400, "Select or create an active document template first.");
    const number = `${type.slice(0, 3)}-${Date.now()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
    const code = crypto.randomBytes(8).toString("hex").toUpperCase();
    const created = await pool.query(
      `INSERT INTO sms.issued_documents
        (document_type,student_id,exam_id,template_id,design_snapshot,document_no,issue_date,verification_code,issued_by)
       VALUES ($1,$2,$3,$4,$5,$6,CURDATE(),$7,$8) RETURNING *`,
      [type, student.student_id, examId, template.template_id, designJson(template.design_json), number, code, req.user.user_id]
    );
    const document = await issuedDocumentById(pool, inst, created.rows[0].issued_document_id);
    return res.status(201).json({ success: true, data: document });
  } catch (error) {
    return fail(res, error, "Failed to issue document.");
  }
});

export default router;
