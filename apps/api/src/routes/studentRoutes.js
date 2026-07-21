import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import pool from "../config/db.js";
import { assignApplicableStructuresToEnrollment } from "../utils/autoAssignFees.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads", "students");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },

  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname
      .replace(ext, "")
      .replace(/[^a-zA-Z0-9-_]/g, "_");

    cb(null, `${Date.now()}_${safeName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const nullIfEmpty = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return value;
};

const boolValue = (value) => {
  return value === true || value === "true" || value === 1 || value === "1";
};

const generateStudentNo = (institutionId) => {
  return `STU-${institutionId}-${Date.now()}`;
};

const fileUrl = (file) => {
  if (!file) return null;
  return `/uploads/students/${file.filename}`;
};

/*
|--------------------------------------------------------------------------
| REAL DROPDOWN DATA FROM DATABASE
|--------------------------------------------------------------------------
| GET /api/students/lookups/all?institution_id=1
|--------------------------------------------------------------------------
*/
router.get("/lookups/all", async (req, res) => {
  try {
    const { institution_id } = req.query;

    if (!institution_id) {
      return res.status(400).json({
        success: false,
        message: "institution_id is required",
      });
    }

    const [
      branches,
      academicYears,
      batches,
      classes,
      groups,
      sections,
      mediums,
      shifts,
    ] = await Promise.all([
      pool.query(
        `
        SELECT branch_id AS value, branch_name AS label
        FROM sms.branches
        WHERE institution_id = $1
        ORDER BY branch_name
        `,
        [institution_id]
      ),

      pool.query(
        `
        SELECT academic_year_id AS value, academic_year_name AS label
        FROM sms.academic_years
        WHERE institution_id = $1
        ORDER BY academic_year_id DESC
        `,
        [institution_id]
      ),

      pool.query(
        `
        SELECT batch_id AS value, batch_name AS label
        FROM sms.academic_batches
        WHERE institution_id = $1
        ORDER BY batch_name
        `,
        [institution_id]
      ),

      pool.query(
        `
        SELECT class_id AS value, class_name AS label
        FROM sms.class_levels
        WHERE institution_id = $1
        ORDER BY class_id
        `,
        [institution_id]
      ),

      pool.query(
        `
        SELECT group_id AS value, group_name AS label
        FROM sms.groups
        WHERE institution_id = $1
        ORDER BY group_name
        `,
        [institution_id]
      ),

      pool.query(
        `
        SELECT section_id AS value, section_name AS label
        FROM sms.sections
        WHERE institution_id = $1
        ORDER BY section_name
        `,
        [institution_id]
      ),

      pool.query(
        `
        SELECT medium_id AS value, medium_name AS label
        FROM sms.mediums
        WHERE institution_id = $1
        ORDER BY medium_name
        `,
        [institution_id]
      ),

      pool.query(
        `
        SELECT shift_id AS value, shift_name AS label
        FROM sms.shifts
        WHERE institution_id = $1
        ORDER BY shift_name
        `,
        [institution_id]
      ),
    ]);

    res.json({
      success: true,
      data: {
        branches: branches.rows,
        academicYears: academicYears.rows,
        batches: batches.rows,
        classes: classes.rows,
        groups: groups.rows,
        sections: sections.rows,
        mediums: mediums.rows,
        shifts: shifts.rows,
      },
    });
  } catch (error) {
    console.error("Student lookup error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load student lookup data",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| STUDENT LIST
|--------------------------------------------------------------------------
| GET /api/students?institution_id=1&search=rahim&page=1&limit=10
|--------------------------------------------------------------------------
*/
router.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const offset = (page - 1) * limit;

    const { institution_id, search, status } = req.query;

    const where = [];
    const params = [];

    if (institution_id) {
      params.push(institution_id);
      where.push(`s.institution_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      where.push(`s.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      where.push(`
        (
          s.student_no ILIKE $${params.length}
          OR s.admission_no ILIKE $${params.length}
          OR s.full_name ILIKE $${params.length}
          OR s.mobile ILIKE $${params.length}
          OR s.email ILIKE $${params.length}
        )
      `);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM sms.students s
      ${whereSql}
      `,
      params
    );

    const dataResult = await pool.query(
      `
      SELECT
        s.student_id,
        s.institution_id,
        s.student_no,
        s.admission_no,
        s.registration_no,
        s.first_name,
        s.last_name,
        s.full_name,
        s.gender,
        s.date_of_birth,
        s.blood_group,
        s.religion,
        s.nationality,
        s.photo_url,
        s.mobile,
        s.email,
        s.status,
        se.roll_no,
        se.class_id,
        se.section_id,
        se.batch_id,
        se.academic_year_id,
        se.branch_id
      FROM sms.students s
      LEFT JOIN (
        SELECT ranked.*
        FROM (
          SELECT
            se.*,
            ROW_NUMBER() OVER (
              PARTITION BY se.student_id
              ORDER BY se.created_at DESC, se.enrollment_id DESC
            ) AS row_no
          FROM sms.student_enrollments se
        ) ranked
        WHERE ranked.row_no = 1
      ) se ON se.student_id = s.student_id
      ${whereSql}
      ORDER BY s.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
      `,
      params
    );

    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
      },
    });
  } catch (error) {
    console.error("Student list error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load student list",
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| CREATE STUDENT ADMISSION WITH PHOTO AND DOCUMENT UPLOAD
|--------------------------------------------------------------------------
| POST /api/students/admission
|--------------------------------------------------------------------------
| multipart/form-data:
| payload = JSON string
| photo = single file
| documents = multiple files
|--------------------------------------------------------------------------
*/
router.post(
  "/admission",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "documents", maxCount: 20 },
  ]),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const payload = JSON.parse(req.body.payload || "{}");

      const student = payload.student || {};
      const admission = payload.admission || {};
      const enrollment = payload.enrollment || {};
      const guardians = payload.guardians || [];
      const addresses = payload.addresses || [];
      const documentMeta = payload.documents || [];

      const photoFile = req.files?.photo?.[0] || null;
      const documentFiles = req.files?.documents || [];

      if (!student.institution_id) {
        return res.status(400).json({
          success: false,
          message: "Institution is required",
        });
      }

      if (!student.first_name) {
        return res.status(400).json({
          success: false,
          message: "First name is required",
        });
      }

      if (!admission.branch_id) {
        return res.status(400).json({
          success: false,
          message: "Branch is required",
        });
      }

      if (!admission.academic_year_id) {
        return res.status(400).json({
          success: false,
          message: "Academic year is required",
        });
      }

      if (!enrollment.batch_id) {
        return res.status(400).json({
          success: false,
          message: "Batch is required",
        });
      }

      if (!enrollment.class_id) {
        return res.status(400).json({
          success: false,
          message: "Class is required",
        });
      }

      await client.query("BEGIN");

      const studentNo =
        student.student_no || generateStudentNo(student.institution_id);

      const photoPath = fileUrl(photoFile);

      const studentResult = await client.query(
        `
        INSERT INTO sms.students (
          institution_id,
          user_id,
          student_no,
          admission_no,
          registration_no,
          first_name,
          last_name,
          gender,
          date_of_birth,
          birth_certificate_no,
          nid_no,
          blood_group,
          religion,
          nationality,
          photo_url,
          mobile,
          email,
          status
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
          COALESCE($14, 'Bangladeshi'),
          $15,$16,$17,
          COALESCE($18, 'ACTIVE')
        )
        RETURNING *
        `,
        [
          student.institution_id,
          nullIfEmpty(student.user_id),
          studentNo,
          nullIfEmpty(student.admission_no),
          nullIfEmpty(student.registration_no),
          student.first_name,
          nullIfEmpty(student.last_name),
          nullIfEmpty(student.gender),
          nullIfEmpty(student.date_of_birth),
          nullIfEmpty(student.birth_certificate_no),
          nullIfEmpty(student.nid_no),
          nullIfEmpty(student.blood_group),
          nullIfEmpty(student.religion),
          nullIfEmpty(student.nationality),
          photoPath,
          nullIfEmpty(student.mobile),
          nullIfEmpty(student.email),
          nullIfEmpty(student.status),
        ]
      );

      const createdStudent = studentResult.rows[0];
      const studentId = createdStudent.student_id;

      const admissionResult = await client.query(
        `
        INSERT INTO sms.student_admissions (
          student_id,
          branch_id,
          academic_year_id,
          admission_date,
          admission_type,
          previous_institute,
          previous_class,
          approved_by,
          approval_status,
          remarks,
          created_by
        )
        VALUES (
          $1,$2,$3,
          COALESCE($4, CURRENT_DATE),
          COALESCE($5, 'NEW'),
          $6,$7,$8,
          COALESCE($9, 'PENDING'),
          $10,$11
        )
        RETURNING *
        `,
        [
          studentId,
          admission.branch_id,
          admission.academic_year_id,
          nullIfEmpty(admission.admission_date),
          nullIfEmpty(admission.admission_type),
          nullIfEmpty(admission.previous_institute),
          nullIfEmpty(admission.previous_class),
          nullIfEmpty(admission.approved_by),
          nullIfEmpty(admission.approval_status),
          nullIfEmpty(admission.remarks),
          nullIfEmpty(admission.created_by),
        ]
      );

      const enrollmentResult = await client.query(
        `
        INSERT INTO sms.student_enrollments (
          student_id,
          branch_id,
          academic_year_id,
          batch_id,
          roll_no,
          class_id,
          group_id,
          section_id,
          medium_id,
          shift_id,
          enrollment_status,
          start_date,
          end_date
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          COALESCE($11, 'ACTIVE'),
          COALESCE($12, CURRENT_DATE),
          $13
        )
        RETURNING *
        `,
        [
          studentId,
          enrollment.branch_id || admission.branch_id,
          enrollment.academic_year_id || admission.academic_year_id,
          enrollment.batch_id,
          nullIfEmpty(enrollment.roll_no),
          enrollment.class_id,
          nullIfEmpty(enrollment.group_id),
          nullIfEmpty(enrollment.section_id),
          nullIfEmpty(enrollment.medium_id),
          nullIfEmpty(enrollment.shift_id),
          nullIfEmpty(enrollment.enrollment_status),
          nullIfEmpty(enrollment.start_date || admission.admission_date),
          nullIfEmpty(enrollment.end_date),
        ]
      );

      await assignApplicableStructuresToEnrollment(client, {
        studentId,
        enrollmentId: enrollmentResult.rows[0].enrollment_id,
        assignedBy: req.user?.user_id || null,
      });

      const createdGuardians = [];

      for (const g of guardians) {
        if (!g.guardian_name) continue;

        const guardianResult = await client.query(
          `
          INSERT INTO sms.guardians (
            institution_id,
            user_id,
            guardian_name,
            relation_name,
            occupation,
            nid_no,
            mobile,
            alternate_mobile,
            email,
            monthly_income,
            address_line,
            photo_url,
            status
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
            COALESCE($13, 'ACTIVE')
          )
          RETURNING *
          `,
          [
            student.institution_id,
            nullIfEmpty(g.user_id),
            g.guardian_name,
            nullIfEmpty(g.relation_name),
            nullIfEmpty(g.occupation),
            nullIfEmpty(g.nid_no),
            nullIfEmpty(g.mobile),
            nullIfEmpty(g.alternate_mobile),
            nullIfEmpty(g.email),
            nullIfEmpty(g.monthly_income),
            nullIfEmpty(g.address_line),
            nullIfEmpty(g.photo_url),
            nullIfEmpty(g.status),
          ]
        );

        const createdGuardian = guardianResult.rows[0];
        createdGuardians.push(createdGuardian);

        if (boolValue(g.is_primary)) {
          await client.query(
            `
            UPDATE sms.student_guardians
            SET is_primary = FALSE
            WHERE student_id = $1
            `,
            [studentId]
          );
        }

        await client.query(
          `
          INSERT INTO sms.student_guardians (
            student_id,
            guardian_id,
            relation_type,
            is_primary,
            is_emergency_contact
          )
          VALUES ($1,$2,$3,$4,$5)
          `,
          [
            studentId,
            createdGuardian.guardian_id,
            g.relation_type || "GUARDIAN",
            boolValue(g.is_primary),
            boolValue(g.is_emergency_contact),
          ]
        );
      }

      const createdAddresses = [];

      for (const a of addresses) {
        if (!a.address_type) continue;

        const addressResult = await client.query(
          `
          INSERT INTO sms.student_addresses (
            student_id,
            address_type,
            village_road,
            post_office,
            thana_upazila,
            district,
            division,
            postal_code,
            country
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,
            COALESCE($9, 'Bangladesh')
          )
          ON CONFLICT (student_id, address_type)
          DO UPDATE SET
            village_road = EXCLUDED.village_road,
            post_office = EXCLUDED.post_office,
            thana_upazila = EXCLUDED.thana_upazila,
            district = EXCLUDED.district,
            division = EXCLUDED.division,
            postal_code = EXCLUDED.postal_code,
            country = EXCLUDED.country,
            updated_at = NOW()
          RETURNING *
          `,
          [
            studentId,
            a.address_type,
            nullIfEmpty(a.village_road),
            nullIfEmpty(a.post_office),
            nullIfEmpty(a.thana_upazila),
            nullIfEmpty(a.district),
            nullIfEmpty(a.division),
            nullIfEmpty(a.postal_code),
            nullIfEmpty(a.country),
          ]
        );

        createdAddresses.push(addressResult.rows[0]);
      }

      const createdDocuments = [];

      if (photoFile) {
        const photoDocResult = await client.query(
          `
          INSERT INTO sms.student_documents (
            student_id,
            document_type,
            document_title,
            file_url,
            uploaded_by,
            status
          )
          VALUES ($1,'Photo','Student Photo',$2,$3,'ACTIVE')
          RETURNING *
          `,
          [
            studentId,
            photoPath,
            nullIfEmpty(payload.uploaded_by || admission.created_by),
          ]
        );

        createdDocuments.push(photoDocResult.rows[0]);
      }

      for (let i = 0; i < documentFiles.length; i++) {
        const file = documentFiles[i];
        const meta = documentMeta[i] || {};

        const documentResult = await client.query(
          `
          INSERT INTO sms.student_documents (
            student_id,
            document_type,
            document_title,
            file_url,
            uploaded_by,
            status
          )
          VALUES (
            $1,$2,$3,$4,$5,
            COALESCE($6, 'ACTIVE')
          )
          RETURNING *
          `,
          [
            studentId,
            meta.document_type || meta.documentType || "Document",
            nullIfEmpty(meta.document_title || meta.documentTitle),
            fileUrl(file),
            nullIfEmpty(meta.uploaded_by || payload.uploaded_by || admission.created_by),
            nullIfEmpty(meta.status),
          ]
        );

        createdDocuments.push(documentResult.rows[0]);
      }

      await client.query("COMMIT");

      res.status(201).json({
        success: true,
        message: "Student admission saved successfully",
        data: {
          student: createdStudent,
          admission: admissionResult.rows[0],
          enrollment: enrollmentResult.rows[0],
          guardians: createdGuardians,
          addresses: createdAddresses,
          documents: createdDocuments,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Create admission error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Duplicate data found. Student no or roll no already exists.",
          detail: error.detail,
        });
      }

      if (error.code === "23503") {
        return res.status(400).json({
          success: false,
          message:
            "Invalid reference ID. Check institution, branch, academic year, batch, class, section, group, medium or shift.",
          detail: error.detail,
        });
      }

      if (error.code === "23514") {
        return res.status(400).json({
          success: false,
          message: "Invalid checked value. Example: gender must be MALE, FEMALE or OTHER.",
          detail: error.detail,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to save student admission",
        error: error.message,
      });
    } finally {
      client.release();
    }
  }
);

/*
|--------------------------------------------------------------------------
| STUDENT PROFILE
|--------------------------------------------------------------------------
| GET /api/students/:id
|--------------------------------------------------------------------------
*/
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const studentResult = await pool.query(
      `
      SELECT *
      FROM sms.students
      WHERE student_id = $1
      `,
      [id]
    );

    if (studentResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const [
      admissions,
      enrollments,
      guardians,
      addresses,
      documents,
      statusHistory,
    ] = await Promise.all([
      pool.query(
        `
        SELECT *
        FROM sms.student_admissions
        WHERE student_id = $1
        ORDER BY created_at DESC
        `,
        [id]
      ),

      pool.query(
        `
        SELECT *
        FROM sms.student_enrollments
        WHERE student_id = $1
        ORDER BY created_at DESC
        `,
        [id]
      ),

      pool.query(
        `
        SELECT
          sg.student_guardian_id,
          sg.relation_type,
          sg.is_primary,
          sg.is_emergency_contact,
          g.*
        FROM sms.student_guardians sg
        JOIN sms.guardians g ON g.guardian_id = sg.guardian_id
        WHERE sg.student_id = $1
        ORDER BY sg.is_primary DESC, sg.student_guardian_id
        `,
        [id]
      ),

      pool.query(
        `
        SELECT *
        FROM sms.student_addresses
        WHERE student_id = $1
        ORDER BY address_type
        `,
        [id]
      ),

      pool.query(
        `
        SELECT *
        FROM sms.student_documents
        WHERE student_id = $1
        ORDER BY uploaded_at DESC
        `,
        [id]
      ),

      pool.query(
        `
        SELECT *
        FROM sms.student_status_history
        WHERE student_id = $1
        ORDER BY created_at DESC
        `,
        [id]
      ),
    ]);

    res.json({
      success: true,
      data: {
        student: studentResult.rows[0],
        admissions: admissions.rows,
        enrollments: enrollments.rows,
        guardians: guardians.rows,
        addresses: addresses.rows,
        documents: documents.rows,
        status_history: statusHistory.rows,
      },
    });
  } catch (error) {
    console.error("Student profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load student profile",
      error: error.message,
    });
  }
});

export default router;
