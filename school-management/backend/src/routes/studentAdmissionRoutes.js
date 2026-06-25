import express from "express";
import pool from "../config/db.js";
import multer from "multer";
import fs from "fs";
import path from "path";


const router = express.Router();

const uploadRoot = path.join(process.cwd(), "src/uploads");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.params.type;

    let folder = "documents";

    if (type === "student-photo") {
      folder = "students";
    } else if (type === "guardian-photo") {
      folder = "guardians";
    } else if (type === "document") {
      folder = "documents";
    }

    const uploadPath = path.join(uploadRoot, folder);
    ensureDir(uploadPath);

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname
      .replace(ext, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40);

    cb(null, `${Date.now()}-${safeName}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only image, PDF, DOC and DOCX files are allowed"));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

/* =========================================================
   FILE UPLOAD
   POST /api/student-admissions/upload/:type
   type = student-photo | guardian-photo | document
========================================================= */
router.post("/upload/:type", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const type = req.params.type;

    let folder = "documents";

    if (type === "student-photo") {
      folder = "students";
    } else if (type === "guardian-photo") {
      folder = "guardians";
    } else if (type === "document") {
      folder = "documents";
    }

    const fileUrl = `/uploads/${folder}/${req.file.filename}`;

    return res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        file_url: fileUrl,
        original_name: req.file.originalname,
        file_name: req.file.filename,
        mime_type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error("File upload error:", error);

    return res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error.message
    });
  }
});

const toNull = (value) => {
  if (value === "" || value === undefined) return null;
  return value;
};

const toBool = (value) => value === true || value === "true";

const handleDbError = (error, res) => {
  console.error("Student admission API error:", error);

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Duplicate data found. Student no, roll no or unique data already exists.",
      detail: error.detail
    });
  }

  if (error.code === "23503") {
    return res.status(400).json({
      success: false,
      message: "Invalid reference data. Please check institution, branch, academic year, batch, class, section, group, medium or shift.",
      detail: error.detail
    });
  }

  if (error.code === "23514") {
    return res.status(400).json({
      success: false,
      message: "Invalid status, gender or enum value.",
      detail: error.detail
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message
  });
};

/* =========================================================
   CREATE FULL STUDENT ADMISSION
   POST /api/student-admissions/full
========================================================= */
router.post("/full", async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      student,
      admission,
      enrollment,
      guardians = [],
      addresses = [],
      documents = []
    } = req.body;

    if (!student?.institution_id) {
      return res.status(400).json({ success: false, message: "Institution is required" });
    }

    if (!student?.student_no) {
      return res.status(400).json({ success: false, message: "Student No is required" });
    }

    if (!student?.first_name) {
      return res.status(400).json({ success: false, message: "First Name is required" });
    }

    if (!admission?.branch_id || !admission?.academic_year_id) {
      return res.status(400).json({
        success: false,
        message: "Branch and academic year are required"
      });
    }

    if (!enrollment?.batch_id || !enrollment?.class_id) {
      return res.status(400).json({
        success: false,
        message: "Batch and class are required"
      });
    }

    await client.query("BEGIN");

    const createdBy = req.user?.user_id || null;

    /* ================= STUDENT INSERT ================= */
    const studentSql = `
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
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18
      )
      RETURNING student_id, full_name
    `;

    const studentResult = await client.query(studentSql, [
      toNull(student.institution_id),
      toNull(student.user_id),
      toNull(student.student_no),
      toNull(student.admission_no),
      toNull(student.registration_no),
      toNull(student.first_name),
      toNull(student.last_name),
      toNull(student.gender),
      toNull(student.date_of_birth),
      toNull(student.birth_certificate_no),
      toNull(student.nid_no),
      toNull(student.blood_group),
      toNull(student.religion),
      toNull(student.nationality) || "Bangladeshi",
      toNull(student.photo_url),
      toNull(student.mobile),
      toNull(student.email),
      toNull(student.status) || "ACTIVE"
    ]);

    const studentId = studentResult.rows[0].student_id;

    /* ================= ADMISSION INSERT ================= */
    const admissionSql = `
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING admission_id
    `;

    const admissionResult = await client.query(admissionSql, [
      studentId,
      toNull(admission.branch_id),
      toNull(admission.academic_year_id),
      toNull(admission.admission_date),
      toNull(admission.admission_type) || "NEW",
      toNull(admission.previous_institute),
      toNull(admission.previous_class),
      toNull(admission.approved_by),
      toNull(admission.approval_status) || "PENDING",
      toNull(admission.remarks),
      createdBy
    ]);

    /* ================= ENROLLMENT INSERT ================= */
    const enrollmentSql = `
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING enrollment_id
    `;

    const enrollmentResult = await client.query(enrollmentSql, [
      studentId,
      toNull(admission.branch_id),
      toNull(admission.academic_year_id),
      toNull(enrollment.batch_id),
      toNull(enrollment.roll_no),
      toNull(enrollment.class_id),
      toNull(enrollment.group_id),
      toNull(enrollment.section_id),
      toNull(enrollment.medium_id),
      toNull(enrollment.shift_id),
      toNull(enrollment.enrollment_status) || "ACTIVE",
      toNull(enrollment.start_date),
      toNull(enrollment.end_date)
    ]);

    /* ================= GUARDIANS INSERT ================= */
    for (const item of guardians) {
      if (!item?.guardian?.guardian_name) continue;

      const guardianSql = `
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
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING guardian_id
      `;

      const guardianResult = await client.query(guardianSql, [
        toNull(student.institution_id),
        toNull(item.guardian.user_id),
        toNull(item.guardian.guardian_name),
        toNull(item.guardian.relation_name),
        toNull(item.guardian.occupation),
        toNull(item.guardian.nid_no),
        toNull(item.guardian.mobile),
        toNull(item.guardian.alternate_mobile),
        toNull(item.guardian.email),
        toNull(item.guardian.monthly_income),
        toNull(item.guardian.address_line),
        toNull(item.guardian.photo_url),
        toNull(item.guardian.status) || "ACTIVE"
      ]);

      const guardianId = guardianResult.rows[0].guardian_id;

      const studentGuardianSql = `
        INSERT INTO sms.student_guardians (
          student_id,
          guardian_id,
          relation_type,
          is_primary,
          is_emergency_contact
        )
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (student_id, guardian_id, relation_type)
        DO UPDATE SET
          is_primary = EXCLUDED.is_primary,
          is_emergency_contact = EXCLUDED.is_emergency_contact
      `;

      await client.query(studentGuardianSql, [
        studentId,
        guardianId,
        toNull(item.relation_type),
        toBool(item.is_primary),
        toBool(item.is_emergency_contact)
      ]);
    }

    /* ================= ADDRESSES INSERT ================= */
    for (const address of addresses) {
      if (!address?.address_type) continue;

      const addressSql = `
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
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
      `;

      await client.query(addressSql, [
        studentId,
        toNull(address.address_type),
        toNull(address.village_road),
        toNull(address.post_office),
        toNull(address.thana_upazila),
        toNull(address.district),
        toNull(address.division),
        toNull(address.postal_code),
        toNull(address.country) || "Bangladesh"
      ]);
    }

    /* ================= DOCUMENTS INSERT ================= */
    for (const doc of documents) {
      if (!doc?.document_type || !doc?.file_url) continue;

      const documentSql = `
        INSERT INTO sms.student_documents (
          student_id,
          document_type,
          document_title,
          file_url,
          uploaded_by,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6)
      `;

      await client.query(documentSql, [
        studentId,
        toNull(doc.document_type),
        toNull(doc.document_title),
        toNull(doc.file_url),
        createdBy,
        toNull(doc.status) || "ACTIVE"
      ]);
    }

    /* ================= STATUS HISTORY INSERT ================= */
    await client.query(
      `
      INSERT INTO sms.student_status_history (
        student_id,
        old_status,
        new_status,
        effective_date,
        reason,
        changed_by
      )
      VALUES ($1,$2,$3,CURRENT_DATE,$4,$5)
      `,
      [
        studentId,
        null,
        toNull(student.status) || "ACTIVE",
        "Student admission created",
        createdBy
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Student admission saved successfully",
      data: {
        student_id: studentId,
        full_name: studentResult.rows[0].full_name,
        admission_id: admissionResult.rows[0].admission_id,
        enrollment_id: enrollmentResult.rows[0].enrollment_id
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return handleDbError(error, res);
  } finally {
    client.release();
  }
});

/* =========================================================
   GET FULL STUDENT ADMISSION FOR EDIT
   GET /api/student-admissions/full/:studentId
========================================================= */
router.get("/full/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const studentResult = await pool.query(
      `
      SELECT *
      FROM sms.students
      WHERE student_id = $1
      `,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const admissionResult = await pool.query(
      `
      SELECT *
      FROM sms.student_admissions
      WHERE student_id = $1
      ORDER BY admission_id DESC
      LIMIT 1
      `,
      [studentId]
    );

    const enrollmentResult = await pool.query(
      `
      SELECT *
      FROM sms.student_enrollments
      WHERE student_id = $1
      ORDER BY enrollment_id DESC
      LIMIT 1
      `,
      [studentId]
    );

    const guardiansResult = await pool.query(
      `
      SELECT
        sg.student_guardian_id,
        sg.relation_type,
        sg.is_primary,
        sg.is_emergency_contact,
        g.*
      FROM sms.student_guardians sg
      JOIN sms.guardians g
        ON g.guardian_id = sg.guardian_id
      WHERE sg.student_id = $1
      ORDER BY sg.student_guardian_id
      `,
      [studentId]
    );

    const addressesResult = await pool.query(
      `
      SELECT *
      FROM sms.student_addresses
      WHERE student_id = $1
      ORDER BY address_type
      `,
      [studentId]
    );

    const documentsResult = await pool.query(
      `
      SELECT *
      FROM sms.student_documents
      WHERE student_id = $1
      ORDER BY document_id
      `,
      [studentId]
    );

    return res.json({
      success: true,
      data: {
        student: studentResult.rows[0],
        admission: admissionResult.rows[0] || null,
        enrollment: enrollmentResult.rows[0] || null,
        guardians: guardiansResult.rows.map((row) => ({
          student_guardian_id: row.student_guardian_id,
          relation_type: row.relation_type,
          is_primary: row.is_primary,
          is_emergency_contact: row.is_emergency_contact,
          guardian: {
            guardian_id: row.guardian_id,
            institution_id: row.institution_id,
            user_id: row.user_id,
            guardian_name: row.guardian_name,
            relation_name: row.relation_name,
            occupation: row.occupation,
            nid_no: row.nid_no,
            mobile: row.mobile,
            alternate_mobile: row.alternate_mobile,
            email: row.email,
            monthly_income: row.monthly_income,
            address_line: row.address_line,
            photo_url: row.photo_url,
            status: row.status
          }
        })),
        addresses: addressesResult.rows,
        documents: documentsResult.rows
      }
    });
  } catch (error) {
    return handleDbError(error, res);
  }
});

/* =========================================================
   UPDATE FULL STUDENT ADMISSION
   PUT /api/student-admissions/full/:studentId
========================================================= */
router.put("/full/:studentId", async (req, res) => {
  const client = await pool.connect();

  try {
    const { studentId } = req.params;

    const {
      student,
      admission,
      enrollment,
      guardians = [],
      addresses = [],
      documents = []
    } = req.body;

    await client.query("BEGIN");

    const changedBy = req.user?.user_id || null;

    /* ================= STUDENT UPDATE ================= */
    const studentUpdateSql = `
      UPDATE sms.students
      SET
        institution_id = $1,
        user_id = $2,
        student_no = $3,
        admission_no = $4,
        registration_no = $5,
        first_name = $6,
        last_name = $7,
        gender = $8,
        date_of_birth = $9,
        birth_certificate_no = $10,
        nid_no = $11,
        blood_group = $12,
        religion = $13,
        nationality = $14,
        photo_url = $15,
        mobile = $16,
        email = $17,
        status = $18,
        updated_at = NOW()
      WHERE student_id = $19
      RETURNING student_id, full_name, status
    `;

    const studentUpdateResult = await client.query(studentUpdateSql, [
      toNull(student.institution_id),
      toNull(student.user_id),
      toNull(student.student_no),
      toNull(student.admission_no),
      toNull(student.registration_no),
      toNull(student.first_name),
      toNull(student.last_name),
      toNull(student.gender),
      toNull(student.date_of_birth),
      toNull(student.birth_certificate_no),
      toNull(student.nid_no),
      toNull(student.blood_group),
      toNull(student.religion),
      toNull(student.nationality) || "Bangladeshi",
      toNull(student.photo_url),
      toNull(student.mobile),
      toNull(student.email),
      toNull(student.status) || "ACTIVE",
      studentId
    ]);

    if (studentUpdateResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    /* ================= ADMISSION UPSERT MANUAL ================= */
    const existingAdmission = await client.query(
      `
      SELECT admission_id
      FROM sms.student_admissions
      WHERE student_id = $1
        AND academic_year_id = $2
      ORDER BY admission_id DESC
      LIMIT 1
      `,
      [studentId, toNull(admission.academic_year_id)]
    );

    let admissionId = admission.admission_id || null;

    if (admissionId || existingAdmission.rows.length > 0) {
      admissionId = admissionId || existingAdmission.rows[0].admission_id;

      await client.query(
        `
        UPDATE sms.student_admissions
        SET
          branch_id = $1,
          academic_year_id = $2,
          admission_date = $3,
          admission_type = $4,
          previous_institute = $5,
          previous_class = $6,
          approved_by = $7,
          approval_status = $8,
          remarks = $9,
          updated_at = NOW()
        WHERE admission_id = $10
        `,
        [
          toNull(admission.branch_id),
          toNull(admission.academic_year_id),
          toNull(admission.admission_date),
          toNull(admission.admission_type) || "NEW",
          toNull(admission.previous_institute),
          toNull(admission.previous_class),
          toNull(admission.approved_by),
          toNull(admission.approval_status) || "PENDING",
          toNull(admission.remarks),
          admissionId
        ]
      );
    } else {
      const admissionInsert = await client.query(
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
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING admission_id
        `,
        [
          studentId,
          toNull(admission.branch_id),
          toNull(admission.academic_year_id),
          toNull(admission.admission_date),
          toNull(admission.admission_type) || "NEW",
          toNull(admission.previous_institute),
          toNull(admission.previous_class),
          toNull(admission.approved_by),
          toNull(admission.approval_status) || "PENDING",
          toNull(admission.remarks),
          changedBy
        ]
      );

      admissionId = admissionInsert.rows[0].admission_id;
    }

    /* ================= ENROLLMENT UPSERT ================= */
    const enrollmentSql = `
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (student_id, academic_year_id)
      DO UPDATE SET
        branch_id = EXCLUDED.branch_id,
        batch_id = EXCLUDED.batch_id,
        roll_no = EXCLUDED.roll_no,
        class_id = EXCLUDED.class_id,
        group_id = EXCLUDED.group_id,
        section_id = EXCLUDED.section_id,
        medium_id = EXCLUDED.medium_id,
        shift_id = EXCLUDED.shift_id,
        enrollment_status = EXCLUDED.enrollment_status,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        updated_at = NOW()
      RETURNING enrollment_id
    `;

    const enrollmentResult = await client.query(enrollmentSql, [
      studentId,
      toNull(admission.branch_id),
      toNull(admission.academic_year_id),
      toNull(enrollment.batch_id),
      toNull(enrollment.roll_no),
      toNull(enrollment.class_id),
      toNull(enrollment.group_id),
      toNull(enrollment.section_id),
      toNull(enrollment.medium_id),
      toNull(enrollment.shift_id),
      toNull(enrollment.enrollment_status) || "ACTIVE",
      toNull(enrollment.start_date),
      toNull(enrollment.end_date)
    ]);

    /* ================= GUARDIAN UPDATE ================= */
    await client.query(
      `
      DELETE FROM sms.student_guardians
      WHERE student_id = $1
      `,
      [studentId]
    );

    for (const item of guardians) {
      if (!item?.guardian?.guardian_name) continue;

      let guardianId = item.guardian.guardian_id || null;

      if (guardianId) {
        await client.query(
          `
          UPDATE sms.guardians
          SET
            institution_id = $1,
            user_id = $2,
            guardian_name = $3,
            relation_name = $4,
            occupation = $5,
            nid_no = $6,
            mobile = $7,
            alternate_mobile = $8,
            email = $9,
            monthly_income = $10,
            address_line = $11,
            photo_url = $12,
            status = $13,
            updated_at = NOW()
          WHERE guardian_id = $14
          `,
          [
            toNull(student.institution_id),
            toNull(item.guardian.user_id),
            toNull(item.guardian.guardian_name),
            toNull(item.guardian.relation_name),
            toNull(item.guardian.occupation),
            toNull(item.guardian.nid_no),
            toNull(item.guardian.mobile),
            toNull(item.guardian.alternate_mobile),
            toNull(item.guardian.email),
            toNull(item.guardian.monthly_income),
            toNull(item.guardian.address_line),
            toNull(item.guardian.photo_url),
            toNull(item.guardian.status) || "ACTIVE",
            guardianId
          ]
        );
      } else {
        const guardianInsert = await client.query(
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
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          RETURNING guardian_id
          `,
          [
            toNull(student.institution_id),
            toNull(item.guardian.user_id),
            toNull(item.guardian.guardian_name),
            toNull(item.guardian.relation_name),
            toNull(item.guardian.occupation),
            toNull(item.guardian.nid_no),
            toNull(item.guardian.mobile),
            toNull(item.guardian.alternate_mobile),
            toNull(item.guardian.email),
            toNull(item.guardian.monthly_income),
            toNull(item.guardian.address_line),
            toNull(item.guardian.photo_url),
            toNull(item.guardian.status) || "ACTIVE"
          ]
        );

        guardianId = guardianInsert.rows[0].guardian_id;
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
        ON CONFLICT (student_id, guardian_id, relation_type)
        DO UPDATE SET
          is_primary = EXCLUDED.is_primary,
          is_emergency_contact = EXCLUDED.is_emergency_contact
        `,
        [
          studentId,
          guardianId,
          toNull(item.relation_type),
          toBool(item.is_primary),
          toBool(item.is_emergency_contact)
        ]
      );
    }

    /* ================= ADDRESS UPSERT ================= */
    for (const address of addresses) {
      if (!address?.address_type) continue;

      await client.query(
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
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
        `,
        [
          studentId,
          toNull(address.address_type),
          toNull(address.village_road),
          toNull(address.post_office),
          toNull(address.thana_upazila),
          toNull(address.district),
          toNull(address.division),
          toNull(address.postal_code),
          toNull(address.country) || "Bangladesh"
        ]
      );
    }

    /* ================= DOCUMENT REPLACE ================= */
    await client.query(
      `
      DELETE FROM sms.student_documents
      WHERE student_id = $1
      `,
      [studentId]
    );

    for (const doc of documents) {
      if (!doc?.document_type || !doc?.file_url) continue;

      await client.query(
        `
        INSERT INTO sms.student_documents (
          student_id,
          document_type,
          document_title,
          file_url,
          uploaded_by,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          studentId,
          toNull(doc.document_type),
          toNull(doc.document_title),
          toNull(doc.file_url),
          changedBy,
          toNull(doc.status) || "ACTIVE"
        ]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Student admission updated successfully",
      data: {
        student_id: Number(studentId),
        full_name: studentUpdateResult.rows[0].full_name,
        admission_id: admissionId,
        enrollment_id: enrollmentResult.rows[0].enrollment_id
      }
    });
  } catch (error) {
    await client.query("ROLLBACK");
    return handleDbError(error, res);
  } finally {
    client.release();
  }
});

/* =========================================================
   SIMPLE STUDENT LIST
   GET /api/student-admissions
========================================================= */
router.get("/", async (req, res) => {
  try {
    const {
      institution_id,
      branch_id,
      academic_year_id,
      class_id,
      section_id,
      search
    } = req.query;

    const params = [];
    let where = `WHERE 1 = 1`;

    if (institution_id) {
      params.push(institution_id);
      where += ` AND s.institution_id = $${params.length}`;
    }

    if (branch_id) {
      params.push(branch_id);
      where += ` AND e.branch_id = $${params.length}`;
    }

    if (academic_year_id) {
      params.push(academic_year_id);
      where += ` AND e.academic_year_id = $${params.length}`;
    }

    if (class_id) {
      params.push(class_id);
      where += ` AND e.class_id = $${params.length}`;
    }

    if (section_id) {
      params.push(section_id);
      where += ` AND e.section_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      where += `
        AND (
          s.student_no ILIKE $${params.length}
          OR s.full_name ILIKE $${params.length}
          OR s.mobile ILIKE $${params.length}
          OR s.admission_no ILIKE $${params.length}
        )
      `;
    }

    const result = await pool.query(
      `
      SELECT
        s.student_id,
        s.student_no,
        s.admission_no,
        s.full_name,
        s.gender,
        s.mobile,
        s.status,
        e.roll_no,
        e.enrollment_status,
        b.branch_name,
        ay.academic_year_name,
        cl.class_name,
        sec.section_name,
        g.group_name,
        m.medium_name,
        sh.shift_name
      FROM sms.students s
      LEFT JOIN sms.student_enrollments e
        ON e.student_id = s.student_id
      LEFT JOIN sms.branches b
        ON b.branch_id = e.branch_id
      LEFT JOIN sms.academic_years ay
        ON ay.academic_year_id = e.academic_year_id
      LEFT JOIN sms.class_levels cl
        ON cl.class_id = e.class_id
      LEFT JOIN sms.sections sec
        ON sec.section_id = e.section_id
      LEFT JOIN sms.groups g
        ON g.group_id = e.group_id
      LEFT JOIN sms.mediums m
        ON m.medium_id = e.medium_id
      LEFT JOIN sms.shifts sh
        ON sh.shift_id = e.shift_id
      ${where}
      ORDER BY s.student_id DESC
      LIMIT 100
      `,
      params
    );

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    return handleDbError(error, res);
  }
});

router.get("/list", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        s.student_id,
        s.student_no,
        s.admission_no,
        s.first_name,
        s.last_name,
        s.full_name,
        s.mobile,
        s.photo_url,
        s.status,

        e.roll_no,
        e.class_id,
        e.section_id,
        e.group_id,
        e.medium_id,
        e.shift_id,
        e.batch_id,

        cl.class_name,
        sec.section_name,
        g.group_name,
        m.medium_name,
        sh.shift_name,
        b.batch_name,

        sg.relation_type,
        gd.guardian_name,
        gd.mobile AS guardian_mobile

      FROM sms.students s

      LEFT JOIN sms.student_enrollments e
        ON e.student_id = s.student_id
       AND e.enrollment_status = 'ACTIVE'

      LEFT JOIN sms.class_levels cl
        ON cl.class_id = e.class_id

      LEFT JOIN sms.sections sec
        ON sec.section_id = e.section_id

      LEFT JOIN sms.groups g
        ON g.group_id = e.group_id

      LEFT JOIN sms.mediums m
        ON m.medium_id = e.medium_id

      LEFT JOIN sms.shifts sh
        ON sh.shift_id = e.shift_id

      LEFT JOIN sms.academic_batches b
        ON b.batch_id = e.batch_id

      LEFT JOIN sms.student_guardians sg
        ON sg.student_id = s.student_id
       AND sg.is_primary = TRUE

      LEFT JOIN sms.guardians gd
        ON gd.guardian_id = sg.guardian_id

      ORDER BY s.student_id DESC
      LIMIT 200
    `);

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("Student list error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load student list",
      error: error.message
    });
  }
});

export default router;