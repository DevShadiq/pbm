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
import pool from "./config/db.js";
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

    return res.json({
      settings: buildPublicSettings(institution),
      institution,
      notices: [],
      teachers: [],
      source: institution ? "backend" : "generated",
    });
  } catch (error) {
    console.error("Public website data fallback:", error.message);

    return res.json({
      settings: generatedPublicSettings,
      institution: null,
      notices: [],
      teachers: [],
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
app.use("/api", masterRoutes);
app.use("/api/student-admissions", studentAdmissionRoutes);

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
