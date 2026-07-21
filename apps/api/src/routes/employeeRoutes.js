import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const photoDirectory = path.resolve(__dirname, "../../uploads/employees");

const safeFilePart = (value, fallback = "file") => {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  return normalized || fallback;
};

if (!fs.existsSync(photoDirectory)) {
  fs.mkdirSync(photoDirectory, { recursive: true });
}

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (_, __, callback) => callback(null, photoDirectory),
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const employeeNo = safeFilePart(req.body?.employee_no, "");
      const baseName = safeFilePart(path.basename(file.originalname, extension));

      if (!employeeNo) {
        return callback(new Error("Employee number is required before uploading a photo"));
      }

      callback(null, `${employeeNo}-photo-${Date.now()}-${baseName}${extension}`);
    },
  }),
  fileFilter: (_, file, callback) => {
    callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

const localEmployeePhotoPath = (photoUrl) => {
  if (typeof photoUrl !== "string" || !photoUrl) return null;

  let pathname;
  try {
    pathname = new URL(photoUrl, "http://localhost").pathname;
  } catch {
    return null;
  }

  if (!pathname.startsWith("/uploads/employees/")) return null;

  const candidate = path.resolve(photoDirectory, path.basename(pathname));
  return path.dirname(candidate) === photoDirectory ? candidate : null;
};

async function deleteEmployeePhoto(photoUrl) {
  const photoPath = localEmployeePhotoPath(photoUrl);
  if (!photoPath) return;

  try {
    await fs.promises.unlink(photoPath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Failed to remove employee photo:", error);
    }
  }
}

const clean = (value) => (value === "" || value === undefined ? null : value);
const employeeColumns = [
  "institution_id", "branch_id", "user_id", "employee_no", "first_name", "first_name_bn", "last_name", "last_name_bn",
  "employee_type", "department_id", "designation_id", "joining_date", "date_of_birth",
  "gender", "blood_group", "religion", "nid_no", "mobile", "email", "photo_url",
  "employment_status",
];

async function saveEmployeeAddresses(employeeId, addresses) {
  if (!addresses || typeof addresses !== "object") return;

  for (const addressType of ["PRESENT", "PERMANENT"]) {
    const address = Array.isArray(addresses)
      ? addresses.find((item) => item?.address_type === addressType)
      : addresses[addressType.toLowerCase()];
    if (!address) continue;

    const values = [
      clean(address.address_line),
      clean(address.district),
      clean(address.division),
      clean(address.postal_code),
      clean(address.country) || "Bangladesh",
    ];
    const hasAddressData = values.slice(0, 4).some(Boolean);

    if (!hasAddressData) {
      await pool.query(
        `DELETE FROM sms.employee_addresses WHERE employee_id = $1 AND address_type = $2`,
        [employeeId, addressType]
      );
      continue;
    }

    await pool.query(
      `
      INSERT INTO sms.employee_addresses
        (employee_id, address_type, address_line, district, division, postal_code, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (employee_id, address_type) DO UPDATE SET
        address_line = EXCLUDED.address_line,
        district = EXCLUDED.district,
        division = EXCLUDED.division,
        postal_code = EXCLUDED.postal_code,
        country = EXCLUDED.country
      `,
      [employeeId, addressType, ...values]
    );
  }
}

function employeeScope(req, values, alias = "e") {
  if (req.user.is_super_admin) return "";
  values.push(req.user.institution_id);
  return ` AND ${alias ? `${alias}.` : ""}institution_id = $${values.length}`;
}

router.post("/upload-photo", authenticateUser, requirePermission("employee.management", "create"), (req, res) => {
  photoUpload.single("photo")(req, res, async (error) => {
    if (error) {
      return res.status(400).json({ success: false, message: "Photo upload failed. Use a JPG, PNG, or WebP image under 5 MB." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Select a JPG, PNG, or WebP employee photo." });
    }

    await deleteEmployeePhoto(req.body?.previous_photo_url);

    return res.status(201).json({
      success: true,
      message: "Employee photo uploaded successfully",
      data: { photo_url: `/uploads/employees/${req.file.filename}` },
    });
  });
});

router.get("/lookups", authenticateUser, requirePermission("employee.management", "view"), async (req, res) => {
  try {
    const values = [];
    const institutionId = req.user.is_super_admin ? clean(req.query.institution_id) : req.user.institution_id;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: "institution_id is required" });
    }

    values.push(institutionId);
    const [branches, departments, designations] = await Promise.all([
      pool.query("SELECT branch_id AS value, branch_name AS label FROM sms.branches WHERE institution_id = $1 AND status = 'ACTIVE' ORDER BY branch_name", values),
      pool.query("SELECT department_id AS value, department_name AS label FROM sms.departments WHERE institution_id = $1 AND status = 'ACTIVE' ORDER BY department_name", values),
      pool.query("SELECT designation_id AS value, designation_name AS label FROM sms.designations WHERE institution_id = $1 AND status = 'ACTIVE' ORDER BY designation_name", values),
    ]);

    res.json({ success: true, data: { branches: branches.rows, departments: departments.rows, designations: designations.rows } });
  } catch (error) {
    console.error("Employee lookups error:", error);
    res.status(500).json({ success: false, message: "Failed to load employee lookups" });
  }
});

router.get("/departments", authenticateUser, requirePermission("employee.management", "view"), async (req, res) => {
  try {
    const values = [];
    const where = req.user.is_super_admin && req.query.institution_id
      ? (values.push(req.query.institution_id), ` WHERE d.institution_id = $${values.length}`)
      : req.user.is_super_admin ? "" : (values.push(req.user.institution_id), ` WHERE d.institution_id = $${values.length}`);
    const result = await pool.query(`SELECT d.*, i.institution_name FROM sms.departments d LEFT JOIN sms.institutions i ON i.institution_id = d.institution_id${where} ORDER BY d.department_name`, values);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Department list error:", error);
    res.status(500).json({ success: false, message: "Failed to load departments" });
  }
});

router.post("/departments", authenticateUser, requirePermission("employee.management", "create"), async (req, res) => {
  try {
    const institutionId = req.user.is_super_admin ? clean(req.body.institution_id) : req.user.institution_id;
    const code = String(req.body.department_code || "").trim();
    const name = String(req.body.department_name || "").trim();
    if (!institutionId || !code || !name) return res.status(400).json({ success: false, message: "Institution, department code, and department name are required" });
    const result = await pool.query(`INSERT INTO sms.departments (institution_id, department_code, department_name, department_name_bn, status) VALUES ($1, $2, $3, $4, COALESCE($5, 'ACTIVE')) RETURNING *`, [institutionId, code, name, clean(req.body.department_name_bn), clean(req.body.status)]);
    res.status(201).json({ success: true, message: "Department created successfully", data: result.rows[0] });
  } catch (error) {
    res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ success: false, message: error.code === "ER_DUP_ENTRY" ? "Department code already exists" : "Failed to create department" });
  }
});

router.put("/departments/:id", authenticateUser, requirePermission("employee.management", "update"), async (req, res) => {
  try {
    const values = [String(req.body.department_code || "").trim(), String(req.body.department_name || "").trim(), clean(req.body.department_name_bn), clean(req.body.status) || "ACTIVE", req.params.id];
    if (!values[0] || !values[1]) return res.status(400).json({ success: false, message: "Department code and department name are required" });
    const scope = employeeScope(req, values, "");
    const result = await pool.query(`UPDATE sms.departments SET department_code = $1, department_name = $2, department_name_bn = $3, status = $4 WHERE department_id = $5${scope} RETURNING *`, values);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Department not found" });
    res.json({ success: true, message: "Department updated successfully", data: result.rows[0] });
  } catch (error) {
    res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ success: false, message: error.code === "ER_DUP_ENTRY" ? "Department code already exists" : "Failed to update department" });
  }
});

router.delete("/departments/:id", authenticateUser, requirePermission("employee.management", "delete"), async (req, res) => {
  try {
    const values = [req.params.id];
    const scope = employeeScope(req, values, "");
    const result = await pool.query(`DELETE FROM sms.departments WHERE department_id = $1${scope} RETURNING *`, values);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Department not found or still in use" });
    res.json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    res.status(error.code === "ER_ROW_IS_REFERENCED_2" ? 409 : 500).json({ success: false, message: error.code === "ER_ROW_IS_REFERENCED_2" ? "Department cannot be deleted while employees use it" : "Failed to delete department" });
  }
});

router.get("/designations", authenticateUser, requirePermission("employee.management", "view"), async (req, res) => {
  try {
    const values = [];
    const where = req.user.is_super_admin && req.query.institution_id
      ? (values.push(req.query.institution_id), ` WHERE d.institution_id = $${values.length}`)
      : req.user.is_super_admin ? "" : (values.push(req.user.institution_id), ` WHERE d.institution_id = $${values.length}`);
    const result = await pool.query(`SELECT d.*, i.institution_name FROM sms.designations d LEFT JOIN sms.institutions i ON i.institution_id = d.institution_id${where} ORDER BY d.designation_name`, values);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Designation list error:", error);
    res.status(500).json({ success: false, message: "Failed to load designations" });
  }
});

router.post("/designations", authenticateUser, requirePermission("employee.management", "create"), async (req, res) => {
  try {
    const institutionId = req.user.is_super_admin ? clean(req.body.institution_id) : req.user.institution_id;
    const code = String(req.body.designation_code || "").trim();
    const name = String(req.body.designation_name || "").trim();
    if (!institutionId || !code || !name) return res.status(400).json({ success: false, message: "Institution, designation code, and designation name are required" });
    const result = await pool.query(`INSERT INTO sms.designations (institution_id, designation_code, designation_name, designation_name_bn, status) VALUES ($1, $2, $3, $4, COALESCE($5, 'ACTIVE')) RETURNING *`, [institutionId, code, name, clean(req.body.designation_name_bn), clean(req.body.status)]);
    res.status(201).json({ success: true, message: "Designation created successfully", data: result.rows[0] });
  } catch (error) {
    res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ success: false, message: error.code === "ER_DUP_ENTRY" ? "Designation code already exists" : "Failed to create designation" });
  }
});

router.put("/designations/:id", authenticateUser, requirePermission("employee.management", "update"), async (req, res) => {
  try {
    const values = [String(req.body.designation_code || "").trim(), String(req.body.designation_name || "").trim(), clean(req.body.designation_name_bn), clean(req.body.status) || "ACTIVE", req.params.id];
    if (!values[0] || !values[1]) return res.status(400).json({ success: false, message: "Designation code and designation name are required" });
    const scope = employeeScope(req, values, "");
    const result = await pool.query(`UPDATE sms.designations SET designation_code = $1, designation_name = $2, designation_name_bn = $3, status = $4 WHERE designation_id = $5${scope} RETURNING *`, values);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Designation not found" });
    res.json({ success: true, message: "Designation updated successfully", data: result.rows[0] });
  } catch (error) {
    res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({ success: false, message: error.code === "ER_DUP_ENTRY" ? "Designation code already exists" : "Failed to update designation" });
  }
});

router.delete("/designations/:id", authenticateUser, requirePermission("employee.management", "delete"), async (req, res) => {
  try {
    const values = [req.params.id];
    const scope = employeeScope(req, values, "");
    const result = await pool.query(`DELETE FROM sms.designations WHERE designation_id = $1${scope} RETURNING *`, values);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Designation not found or still in use" });
    res.json({ success: true, message: "Designation deleted successfully" });
  } catch (error) {
    res.status(error.code === "ER_ROW_IS_REFERENCED_2" ? 409 : 500).json({ success: false, message: error.code === "ER_ROW_IS_REFERENCED_2" ? "Designation cannot be deleted while employees use it" : "Failed to delete designation" });
  }
});

router.get("/", authenticateUser, requirePermission("employee.management", "view"), async (req, res) => {
  try {
    const values = [];
    const filters = [];
    if (req.user.is_super_admin && req.query.institution_id) { values.push(req.query.institution_id); filters.push(`e.institution_id = $${values.length}`); }
    if (!req.user.is_super_admin) { values.push(req.user.institution_id); filters.push(`e.institution_id = $${values.length}`); }
    if (req.query.employee_type) { values.push(req.query.employee_type); filters.push(`e.employee_type = $${values.length}`); }
    if (req.query.status) { values.push(req.query.status); filters.push(`e.employment_status = $${values.length}`); }
    if (req.query.search) { values.push(`%${req.query.search}%`); filters.push(`(e.employee_no LIKE $${values.length} OR e.first_name LIKE $${values.length} OR e.first_name_bn LIKE $${values.length} OR e.last_name LIKE $${values.length} OR e.last_name_bn LIKE $${values.length} OR e.mobile LIKE $${values.length})`); }
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await pool.query(`SELECT e.*, b.branch_name, d.department_name, d.department_name_bn, dg.designation_name, dg.designation_name_bn FROM sms.employees e LEFT JOIN sms.branches b ON b.branch_id = e.branch_id LEFT JOIN sms.departments d ON d.department_id = e.department_id LEFT JOIN sms.designations dg ON dg.designation_id = e.designation_id ${where} ORDER BY e.created_at DESC`, values);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Employee list error:", error);
    res.status(500).json({ success: false, message: "Failed to load employees" });
  }
});

router.get("/:id", authenticateUser, requirePermission("employee.management", "view"), async (req, res) => {
  try {
    const values = [req.params.id];
    const scope = employeeScope(req, values);
    const employee = await pool.query(`SELECT e.*, b.branch_name, d.department_name, dg.designation_name FROM sms.employees e LEFT JOIN sms.branches b ON b.branch_id = e.branch_id LEFT JOIN sms.departments d ON d.department_id = e.department_id LEFT JOIN sms.designations dg ON dg.designation_id = e.designation_id WHERE e.employee_id = $1${scope}`, values);
    if (!employee.rowCount) return res.status(404).json({ success: false, message: "Employee not found" });
    const addresses = await pool.query("SELECT * FROM sms.employee_addresses WHERE employee_id = $1 ORDER BY address_type", [req.params.id]);
    res.json({ success: true, data: { employee: employee.rows[0], addresses: addresses.rows } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load employee" });
  }
});

async function saveEmployee(req, res, isUpdate = false) {
  const payload = req.body || {};
  const institutionId = req.user.is_super_admin ? clean(payload.institution_id) : req.user.institution_id;
  if (!institutionId || !String(payload.employee_no || "").trim() || !String(payload.first_name || "").trim()) {
    return res.status(400).json({ success: false, message: "Institution, employee number, and first name are required" });
  }
  if (!["TEACHER", "STAFF", "ADMIN"].includes(String(payload.employee_type || "STAFF").toUpperCase())) return res.status(400).json({ success: false, message: "Employee type must be TEACHER, STAFF, or ADMIN" });

  const data = { ...payload, institution_id: institutionId, employee_no: String(payload.employee_no).trim(), first_name: String(payload.first_name).trim(), employee_type: String(payload.employee_type || "STAFF").toUpperCase(), employment_status: String(payload.employment_status || "ACTIVE").toUpperCase() };
  const columns = employeeColumns.filter((column) => Object.prototype.hasOwnProperty.call(data, column));
  const values = columns.map((column) => clean(data[column]));
  let result;
  if (isUpdate) {
    const existingValues = [req.params.id];
    const existingScope = employeeScope(req, existingValues, "");
    const existingEmployee = await pool.query(
      `SELECT photo_url FROM sms.employees WHERE employee_id = $1${existingScope}`,
      existingValues
    );

    if (!existingEmployee.rowCount) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const assignments = columns.map((column, index) => `${column} = $${index + 1}`).join(", ");
    values.push(req.params.id);
    const scope = employeeScope(req, values, "");
    result = await pool.query(`UPDATE sms.employees SET ${assignments} WHERE employee_id = $${values.length - (scope ? 1 : 0)}${scope} RETURNING *`, values);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Employee not found" });

    if (Object.prototype.hasOwnProperty.call(data, "photo_url") && existingEmployee.rows[0].photo_url !== clean(data.photo_url)) {
      await deleteEmployeePhoto(existingEmployee.rows[0].photo_url);
    }
  } else {
    result = await pool.query(`INSERT INTO sms.employees (${columns.join(", ")}) VALUES (${columns.map((_, index) => `$${index + 1}`).join(", ")}) RETURNING *`, values);
  }
  await saveEmployeeAddresses(result.rows[0].employee_id, data.addresses);
  return res.status(isUpdate ? 200 : 201).json({ success: true, message: `Employee ${isUpdate ? "updated" : "created"} successfully`, data: result.rows[0] });
}

router.post("/", authenticateUser, requirePermission("employee.management", "create"), (req, res) => saveEmployee(req, res));
router.put("/:id", authenticateUser, requirePermission("employee.management", "update"), (req, res) => saveEmployee(req, res, true));

router.delete("/:id", authenticateUser, requirePermission("employee.management", "delete"), async (req, res) => {
  try {
    const existingValues = [req.params.id];
    const existingScope = employeeScope(req, existingValues, "");
    const existingEmployee = await pool.query(
      `SELECT photo_url FROM sms.employees WHERE employee_id = $1${existingScope}`,
      existingValues
    );

    if (!existingEmployee.rowCount) return res.status(404).json({ success: false, message: "Employee not found" });

    const values = [req.params.id];
    const scope = employeeScope(req, values, "");
    const result = await pool.query(`DELETE FROM sms.employees WHERE employee_id = $1${scope} RETURNING *`, values);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Employee not found" });
    await deleteEmployeePhoto(existingEmployee.rows[0].photo_url);
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete employee" });
  }
});

export default router;
