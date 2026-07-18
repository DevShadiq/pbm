import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import securityRoutes from "./routes/securityRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import institutionRoutes from "./routes/institutionRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import masterRoutes from "./routes/masterRoutes.js";
import studentAdmissionRoutes from "./routes/studentAdmissionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import pool from "./config/db.js";
import { ensureSecurityCatalog } from "./utils/ensureSecurityCatalog.js";
import { ensureEmployeeSchema } from "./utils/ensureEmployeeSchema.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const uploadRoot = path.resolve(__dirname, "../uploads");
const websiteDist = path.resolve(__dirname, "../dist/website");
const adminDist = path.resolve(__dirname, "../dist/admin");
const hasWebsiteBuild = fs.existsSync(path.join(websiteDist, "index.html"));
const hasAdminBuild = fs.existsSync(path.join(adminDist, "index.html"));

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(uploadRoot));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

const generatedPublicSettings = {
  name_bn: "পয়লা বানিয়াবাড়ী ফাজিল মাদরাসা",
  name_en: "PAILA BANIABARI FAZIL MADRASAH",
  eiin: "110124",
  phone: "০১৫১৮৩৬৬১৭৮",
  email: "pbm@yahoo.com",
  address: "বানিয়াবাড়ী, মাহমুদপুর, মেলান্দহ, জামালপুর",
  breaking_news: "ভর্তি, পরীক্ষা ও প্রতিষ্ঠানের সকল গুরুত্বপূর্ণ তথ্য এই ওয়েবসাইটে প্রকাশ করা হয়।",
};

function buildPublicSettings(institution) {
  if (!institution) {
    return generatedPublicSettings;
  }

  const addressParts = [
    institution.address_line_bn,
    institution.post_office_bn,
    institution.upazila_bn,
    institution.district_bn,
  ].filter(Boolean);
  const banglaAddress = addressParts.length ? addressParts.join(", ") : null;
  const banglaName = institution.institution_name_bn || institution.institution_name;

  return {
    name_bn: banglaName || generatedPublicSettings.name_bn,
    name_en: institution.institution_name || institution.institution_code || generatedPublicSettings.name_en,
    eiin: institution.eiin_no || generatedPublicSettings.eiin,
    phone: institution.phone_bn || institution.phone || generatedPublicSettings.phone,
    email: institution.email || generatedPublicSettings.email,
    address: banglaAddress || institution.address_line || generatedPublicSettings.address,
    breaking_news: `${banglaName || generatedPublicSettings.name_bn} এর সর্বশেষ তথ্য, নোটিশ ও ভর্তি আপডেট দেখুন।`,
  };
}

app.get("/api/public", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        institution_id,
        institution_code,
        institution_name,
        institution_name_bn,
        short_name_bn,
        institution_type,
        eiin_no,
        phone,
        phone_bn,
        email,
        website,
        logo_url,
        address_line,
        address_line_bn,
        district_bn,
        upazila_bn,
        post_office_bn
      FROM sms.institutions
      WHERE status = 'ACTIVE'
      ORDER BY institution_id ASC
      LIMIT 1
    `);

    const institution = result.rows[0] || null;
    let teachers = [];
    let academic = {
      levels: [],
      classes: [],
      sections: [],
      shifts: [],
    };

    if (institution) {
      const [teacherResult, academicLevelsResult, classLevelsResult, sectionsResult, shiftsResult] = await Promise.all([
        pool.query(
        `
        SELECT
          e.employee_id,
          e.employee_no,
          e.first_name,
          e.first_name_bn,
          e.last_name,
          e.last_name_bn,
          e.full_name,
          e.mobile,
          e.email,
          e.photo_url,
          COALESCE(NULLIF(TRIM(CONCAT_WS(' ', NULLIF(e.first_name_bn, ''), NULLIF(e.last_name_bn, ''))), ''), e.full_name) AS teacher_name,
          COALESCE(NULLIF(dg.designation_name_bn, ''), dg.designation_name, '') AS designation_name,
          COALESCE(NULLIF(d.department_name_bn, ''), d.department_name, '') AS department_name
        FROM sms.employees e
        LEFT JOIN sms.designations dg ON dg.designation_id = e.designation_id
        LEFT JOIN sms.departments d ON d.department_id = e.department_id
        WHERE e.institution_id = $1
          AND e.employee_type = 'TEACHER'
          AND e.employment_status = 'ACTIVE'
        ORDER BY dg.designation_name, e.first_name, e.last_name
        `,
        [institution.institution_id]
        ),
        pool.query(
          `
          SELECT level_id, level_code, level_name, level_name_bn, sort_order
          FROM sms.academic_levels
          WHERE institution_id = $1 AND status = 'ACTIVE'
          ORDER BY sort_order IS NULL, sort_order, level_id
          `,
          [institution.institution_id]
        ),
        pool.query(
          `
          SELECT
            cl.class_id,
            cl.level_id,
            cl.class_code,
            cl.class_code_bn,
            cl.class_name,
            cl.class_name_bn,
            cl.numeric_level,
            al.level_name,
            al.level_name_bn
          FROM sms.class_levels cl
          LEFT JOIN sms.academic_levels al ON al.level_id = cl.level_id
          WHERE cl.institution_id = $1 AND cl.status = 'ACTIVE'
          ORDER BY cl.numeric_level IS NULL, cl.numeric_level, cl.class_id
          `,
          [institution.institution_id]
        ),
        pool.query(
          `
          SELECT section_id, section_code, section_name, section_name_bn, capacity
          FROM sms.sections
          WHERE institution_id = $1 AND status = 'ACTIVE'
          ORDER BY section_name, section_id
          `,
          [institution.institution_id]
        ),
        pool.query(
          `
          SELECT shift_id, shift_name, shift_name_bn, start_time, end_time
          FROM sms.shifts
          WHERE institution_id = $1 AND status = 'ACTIVE'
          ORDER BY start_time IS NULL, start_time, shift_id
          `,
          [institution.institution_id]
        ),
      ]);

      teachers = teacherResult.rows.map((teacher) => ({
        id: teacher.employee_id,
        employee_no: teacher.employee_no,
        name: teacher.teacher_name || teacher.full_name,
        designation: teacher.designation_name || "শিক্ষক",
        subject: teacher.department_name || "",
        category: teacher.department_name || "সকল",
        photo: teacher.photo_url || "",
        phone: teacher.mobile || "",
        email: teacher.email || "",
      }));

      academic = {
        levels: academicLevelsResult.rows,
        classes: classLevelsResult.rows,
        sections: sectionsResult.rows,
        shifts: shiftsResult.rows,
      };
    }

    return res.json({
      settings: buildPublicSettings(institution),
      institution,
      notices: [],
      teachers,
      academic,
      source: institution ? "backend" : "generated",
    });
  } catch (error) {
    console.error("Public website data fallback:", error.message);

    return res.json({
      settings: generatedPublicSettings,
      institution: null,
      notices: [],
      teachers: [],
      academic: {
        levels: [],
        classes: [],
        sections: [],
        shifts: [],
      },
      source: "generated",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/student-admissions", studentAdmissionRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api", masterRoutes);

if (hasAdminBuild) {
  app.use("/admin", express.static(adminDist));
  app.get(["/admin", "/admin/*"], (req, res) => {
    res.sendFile(path.join(adminDist, "index.html"));
  });
}

if (hasWebsiteBuild) {
  app.use(express.static(websiteDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(websiteDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("School Management API is running");
  });
}

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await ensureEmployeeSchema();
    console.log("Employee schema synchronized");
  } catch (error) {
    console.error("Employee schema synchronization failed:", error.message);
  }

  try {
    await ensureSecurityCatalog();
    console.log("Security catalog synchronized");
  } catch (error) {
    console.error("Security catalog synchronization failed:", error.message);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
