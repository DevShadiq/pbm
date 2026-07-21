import express from "express";
import pool from "../config/db.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { assignStructureToMatchingEnrollments } from "../utils/autoAssignFees.js";

const router = express.Router();
const activeStatuses = new Set(["ACTIVE", "INACTIVE"]);
const invoiceStatuses = new Set(["UNPAID", "PARTIAL", "PAID", "CANCELLED"]);
const feeTypes = new Set(["REGULAR", "ADMISSION", "TUITION", "EXAM", "TRANSPORT", "OTHER"]);
const frequencies = new Set(["ONE_TIME", "MONTHLY", "QUARTERLY", "YEARLY"]);
const paymentMethods = new Set(["CASH", "BANK", "BKASH", "NAGAD", "CARD"]);
const clean = (value) => value === "" || value === undefined ? null : value;
const amount = (value) => Math.max(Number(value || 0), 0);
const today = () => new Date().toISOString().slice(0, 10);

async function institutionId(req) {
  if (req.user.institution_id) return req.user.institution_id;
  const result = await pool.query("SELECT institution_id FROM sms.institutions WHERE status = 'ACTIVE' ORDER BY institution_id LIMIT 1");
  return result.rows[0]?.institution_id || null;
}

async function branchId(req, requested = null) {
  const instId = await institutionId(req);
  const preferred = requested || req.user.branch_id;
  const values = [instId];
  let where = "institution_id = $1 AND status = 'ACTIVE'";
  if (preferred) { values.push(preferred); where += ` AND branch_id = $${values.length}`; }
  const result = await pool.query(`SELECT branch_id FROM sms.branches WHERE ${where} ORDER BY is_main_branch DESC, branch_id LIMIT 1`, values);
  return result.rows[0]?.branch_id || null;
}

function failure(res, error, message = "Fee operation failed.") {
  console.error(message, error);
  return res.status(500).json({ success: false, message });
}

router.use(authenticateUser);

router.get("/lookups", async (req, res) => {
  try {
    const instId = await institutionId(req);
    const [heads, branches, years, classes, groups, mediums, students] = await Promise.all([
      pool.query("SELECT fee_head_id, fee_code, fee_name, fee_type, is_recurring FROM sms.fee_heads WHERE institution_id=$1 AND status='ACTIVE' ORDER BY fee_name", [instId]),
      pool.query("SELECT branch_id, branch_name FROM sms.branches WHERE institution_id=$1 AND status='ACTIVE' ORDER BY is_main_branch DESC, branch_name", [instId]),
      pool.query("SELECT academic_year_id, year_name FROM sms.academic_years WHERE institution_id=$1 AND status='ACTIVE' ORDER BY is_current DESC, academic_year_id DESC", [instId]),
      pool.query("SELECT class_id, class_name, class_name_bn FROM sms.class_levels WHERE institution_id=$1 AND status='ACTIVE' ORDER BY numeric_level, class_id", [instId]),
      pool.query("SELECT group_id, group_name FROM sms.groups WHERE institution_id=$1 AND status='ACTIVE' ORDER BY group_name", [instId]),
      pool.query("SELECT medium_id, medium_name FROM sms.mediums WHERE institution_id=$1 AND status='ACTIVE' ORDER BY medium_name", [instId]),
      pool.query(`SELECT s.student_id, s.student_no, s.full_name, se.enrollment_id, se.branch_id, se.class_id, se.academic_year_id
        FROM sms.students s JOIN sms.student_enrollments se ON se.student_id=s.student_id AND se.enrollment_status='ACTIVE'
        WHERE s.institution_id=$1 AND s.status='ACTIVE' ORDER BY s.full_name`, [instId]),
    ]);
    res.json({ success: true, data: { heads: heads.rows, branches: branches.rows, years: years.rows, classes: classes.rows, groups: groups.rows, mediums: mediums.rows, students: students.rows } });
  } catch (error) { failure(res, error, "Failed to load fee setup data."); }
});

router.get("/dashboard", requirePermission("fee.report", "view"), async (req, res) => {
  try {
    const instId = await institutionId(req);
    const [summary, dueInvoices, recentCollections] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS invoices, COALESCE(SUM(gross_amount),0) AS billed, COALESCE(SUM(paid_amount),0) AS collected, COALESCE(SUM(due_amount),0) AS due
        FROM sms.fee_invoices fi JOIN sms.students s ON s.student_id=fi.student_id WHERE s.institution_id=$1 AND fi.invoice_status <> 'CANCELLED'`, [instId]),
      pool.query(`SELECT fi.invoice_id, fi.invoice_no, fi.due_date, fi.due_amount, s.full_name, s.student_no
        FROM sms.fee_invoices fi JOIN sms.students s ON s.student_id=fi.student_id WHERE s.institution_id=$1 AND fi.due_amount>0 AND fi.invoice_status <> 'CANCELLED'
        ORDER BY fi.due_date IS NULL, fi.due_date LIMIT 12`, [instId]),
      pool.query(`SELECT fc.receipt_no, fc.collection_date, fc.total_amount, fc.payment_method, s.full_name
        FROM sms.fee_collections fc JOIN sms.students s ON s.student_id=fc.student_id WHERE s.institution_id=$1 ORDER BY fc.collection_id DESC LIMIT 10`, [instId]),
    ]);
    res.json({ success: true, data: { summary: summary.rows[0], dueInvoices: dueInvoices.rows, recentCollections: recentCollections.rows } });
  } catch (error) { failure(res, error, "Failed to load fee dashboard."); }
});

router.get("/heads", requirePermission("fee.management", "view"), async (req, res) => {
  try { const rows = await pool.query("SELECT * FROM sms.fee_heads WHERE institution_id=$1 ORDER BY fee_name", [await institutionId(req)]); res.json({ success: true, data: rows.rows }); } catch (error) { failure(res, error, "Failed to load fee heads."); }
});
router.post("/heads", requirePermission("fee.management", "create"), async (req, res) => {
  try {
    const code = String(req.body.fee_code || "").trim().toUpperCase(), name = String(req.body.fee_name || "").trim(), type = String(req.body.fee_type || "REGULAR").toUpperCase();
    if (!code || !name || !feeTypes.has(type)) return res.status(400).json({ success: false, message: "Fee code, name and valid type are required." });
    const result = await pool.query("INSERT INTO sms.fee_heads (institution_id,fee_code,fee_name,fee_type,is_recurring,status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *", [await institutionId(req), code, name, type, req.body.is_recurring ? 1 : 0, activeStatuses.has(req.body.status) ? req.body.status : "ACTIVE"]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { failure(res, error, "Failed to create fee head."); }
});
router.put("/heads/:id", requirePermission("fee.management", "update"), async (req, res) => {
  try {
    const code = String(req.body.fee_code || "").trim().toUpperCase(), name = String(req.body.fee_name || "").trim(), type = String(req.body.fee_type || "REGULAR").toUpperCase();
    if (!code || !name || !feeTypes.has(type)) return res.status(400).json({ success: false, message: "Fee code, name and valid type are required." });
    const result = await pool.query("UPDATE sms.fee_heads SET fee_code=$1,fee_name=$2,fee_type=$3,is_recurring=$4,status=$5 WHERE fee_head_id=$6 AND institution_id=$7 RETURNING *", [code, name, type, req.body.is_recurring ? 1 : 0, activeStatuses.has(req.body.status) ? req.body.status : "ACTIVE", req.params.id, await institutionId(req)]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Fee head not found." }); res.json({ success: true, data: result.rows[0] });
  } catch (error) { failure(res, error, "Failed to update fee head."); }
});

router.get("/structures", requirePermission("fee.structure", "view"), async (req, res) => {
  try {
    const instId = await institutionId(req);
    const result = await pool.query(`SELECT fs.*, b.branch_name, ay.year_name, cl.class_name, COUNT(fsd.fee_structure_detail_id) AS items, COALESCE(SUM(fsd.amount),0) AS total
      FROM sms.fee_structures fs JOIN sms.branches b ON b.branch_id=fs.branch_id JOIN sms.academic_years ay ON ay.academic_year_id=fs.academic_year_id
      JOIN sms.class_levels cl ON cl.class_id=fs.class_id LEFT JOIN sms.fee_structure_details fsd ON fsd.fee_structure_id=fs.fee_structure_id AND fsd.status='ACTIVE'
      WHERE b.institution_id=$1 GROUP BY fs.fee_structure_id ORDER BY fs.fee_structure_id DESC`, [instId]);
    res.json({ success: true, data: result.rows });
  } catch (error) { failure(res, error, "Failed to load fee structures."); }
});
router.post("/structures", requirePermission("fee.structure", "create"), async (req, res) => {
  const client = await pool.connect();
  try {
    const instId = await institutionId(req), branch = await branchId(req, req.body.branch_id), details = Array.isArray(req.body.details) ? req.body.details : [];
    if (!branch || !req.body.academic_year_id || !req.body.class_id || !String(req.body.structure_name || "").trim() || !req.body.effective_from || !details.length) return res.status(400).json({ success: false, message: "Branch, year, class, name, effective date and at least one fee item are required." });
    await client.query("BEGIN");
    const created = await client.query(`INSERT INTO sms.fee_structures (branch_id,academic_year_id,class_id,group_id,medium_id,structure_name,effective_from,effective_to,status,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`, [branch, req.body.academic_year_id, req.body.class_id, clean(req.body.group_id), clean(req.body.medium_id), String(req.body.structure_name).trim(), req.body.effective_from, clean(req.body.effective_to), activeStatuses.has(req.body.status) ? req.body.status : "ACTIVE", req.user.user_id]);
    for (const item of details) {
      if (!item.fee_head_id || !frequencies.has(String(item.frequency || "ONE_TIME").toUpperCase())) throw new Error("Each fee item requires a head and valid frequency.");
      const head = await client.query("SELECT fee_head_id FROM sms.fee_heads WHERE fee_head_id=$1 AND institution_id=$2", [item.fee_head_id, instId]); if (!head.rowCount) throw new Error("Invalid fee head.");
      await client.query("INSERT INTO sms.fee_structure_details (fee_structure_id,fee_head_id,amount,frequency,due_day,is_optional,status) VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE')", [created.rows[0].fee_structure_id, item.fee_head_id, amount(item.amount), String(item.frequency || "ONE_TIME").toUpperCase(), clean(item.due_day), item.is_optional ? 1 : 0]);
    }
    const autoAssignedStudents = await assignStructureToMatchingEnrollments(client, created.rows[0], req.user.user_id);
    await client.query("COMMIT");
    res.status(201).json({ success: true, data: { ...created.rows[0], auto_assigned_students: autoAssignedStudents } });
  } catch (error) { await client.query("ROLLBACK"); failure(res, error, error.message || "Failed to create fee structure."); } finally { client.release(); }
});
router.get("/structures/:id", requirePermission("fee.structure", "view"), async (req, res) => {
  try {
    const structure = await pool.query(`SELECT fs.* FROM sms.fee_structures fs JOIN sms.branches b ON b.branch_id=fs.branch_id
      WHERE fs.fee_structure_id=$1 AND b.institution_id=$2`, [req.params.id, await institutionId(req)]);
    if (!structure.rowCount) return res.status(404).json({ success: false, message: "Fee structure not found." });
    const details = await pool.query("SELECT fee_head_id, amount, frequency, due_day, is_optional FROM sms.fee_structure_details WHERE fee_structure_id=$1 AND status='ACTIVE' ORDER BY fee_structure_detail_id", [req.params.id]);
    res.json({ success: true, data: { ...structure.rows[0], details: details.rows } });
  } catch (error) { failure(res, error, "Failed to load fee structure."); }
});
router.put("/structures/:id", requirePermission("fee.structure", "update"), async (req, res) => {
  const client = await pool.connect();
  try {
    const instId = await institutionId(req), branch = await branchId(req, req.body.branch_id), details = Array.isArray(req.body.details) ? req.body.details : [];
    if (!branch || !req.body.academic_year_id || !req.body.class_id || !String(req.body.structure_name || "").trim() || !req.body.effective_from || !details.length) return res.status(400).json({ success: false, message: "Branch, year, class, name, effective date and at least one fee item are required." });
    await client.query("BEGIN");
    const updated = await client.query(`UPDATE sms.fee_structures fs JOIN sms.branches existing_branch ON existing_branch.branch_id=fs.branch_id
      SET fs.branch_id=$1, fs.academic_year_id=$2, fs.class_id=$3, fs.group_id=$4, fs.medium_id=$5, fs.structure_name=$6,
        fs.effective_from=$7, fs.effective_to=$8, fs.status=$9
      WHERE fs.fee_structure_id=$10 AND existing_branch.institution_id=$11`, [branch, req.body.academic_year_id, req.body.class_id, clean(req.body.group_id), clean(req.body.medium_id), String(req.body.structure_name).trim(), req.body.effective_from, clean(req.body.effective_to), activeStatuses.has(req.body.status) ? req.body.status : "ACTIVE", req.params.id, instId]);
    if (!updated.rowCount) throw new Error("Fee structure not found.");
    for (const item of details) {
      if (!item.fee_head_id || !frequencies.has(String(item.frequency || "ONE_TIME").toUpperCase())) throw new Error("Each fee item requires a head and valid frequency.");
      const head = await client.query("SELECT fee_head_id FROM sms.fee_heads WHERE fee_head_id=$1 AND institution_id=$2", [item.fee_head_id, instId]); if (!head.rowCount) throw new Error("Invalid fee head.");
    }
    await client.query("DELETE FROM sms.fee_structure_details WHERE fee_structure_id=$1", [req.params.id]);
    for (const item of details) await client.query("INSERT INTO sms.fee_structure_details (fee_structure_id,fee_head_id,amount,frequency,due_day,is_optional,status) VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE')", [req.params.id, item.fee_head_id, amount(item.amount), String(item.frequency || "ONE_TIME").toUpperCase(), clean(item.due_day), item.is_optional ? 1 : 0]);
    const structure = await client.query("SELECT * FROM sms.fee_structures WHERE fee_structure_id=$1", [req.params.id]);
    await client.query("UPDATE sms.student_fee_assignments SET status='INACTIVE' WHERE fee_structure_id=$1", [req.params.id]);
    const autoAssignedStudents = await assignStructureToMatchingEnrollments(client, structure.rows[0], req.user.user_id);
    await client.query("COMMIT"); res.json({ success: true, data: { ...structure.rows[0], auto_assigned_students: autoAssignedStudents } });
  } catch (error) { await client.query("ROLLBACK"); failure(res, error, error.message || "Failed to update fee structure."); } finally { client.release(); }
});
router.delete("/structures/:id", requirePermission("fee.structure", "delete"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const structure = await client.query(`SELECT fs.fee_structure_id FROM sms.fee_structures fs JOIN sms.branches b ON b.branch_id=fs.branch_id
      WHERE fs.fee_structure_id=$1 AND b.institution_id=$2 FOR UPDATE`, [req.params.id, await institutionId(req)]);
    if (!structure.rowCount) throw new Error("Fee structure not found.");
    await client.query("DELETE FROM sms.student_fee_assignments WHERE fee_structure_id=$1", [req.params.id]);
    await client.query("DELETE FROM sms.fee_structure_details WHERE fee_structure_id=$1", [req.params.id]);
    await client.query("DELETE FROM sms.fee_structures WHERE fee_structure_id=$1", [req.params.id]);
    await client.query("COMMIT"); res.json({ success: true });
  } catch (error) { await client.query("ROLLBACK"); failure(res, error, error.message || "Failed to delete fee structure."); } finally { client.release(); }
});

router.get("/assignments", requirePermission("fee.assignment", "view"), async (req, res) => {
  try {
    const result = await pool.query(`SELECT a.*, s.full_name, s.student_no, fs.structure_name, ay.year_name, cl.class_name
      FROM sms.student_fee_assignments a JOIN sms.students s ON s.student_id=a.student_id JOIN sms.student_enrollments se ON se.enrollment_id=a.enrollment_id
      JOIN sms.fee_structures fs ON fs.fee_structure_id=a.fee_structure_id JOIN sms.academic_years ay ON ay.academic_year_id=se.academic_year_id JOIN sms.class_levels cl ON cl.class_id=se.class_id
      WHERE s.institution_id=$1 ORDER BY a.assignment_id DESC`, [await institutionId(req)]);
    res.json({ success: true, data: result.rows });
  } catch (error) { failure(res, error, "Failed to load fee assignments."); }
});
router.post("/assignments", requirePermission("fee.assignment", "create"), async (req, res) => {
  try {
    const instId = await institutionId(req), studentId = req.body.student_id, enrollmentId = req.body.enrollment_id, structureId = req.body.fee_structure_id;
    const valid = await pool.query(`SELECT se.enrollment_id FROM sms.students s JOIN sms.student_enrollments se ON se.student_id=s.student_id JOIN sms.fee_structures fs ON fs.fee_structure_id=$3 AND fs.branch_id=se.branch_id AND fs.academic_year_id=se.academic_year_id AND fs.class_id=se.class_id
      WHERE s.student_id=$1 AND se.enrollment_id=$2 AND s.institution_id=$4`, [studentId, enrollmentId, structureId, instId]);
    if (!valid.rowCount) return res.status(400).json({ success: false, message: "The selected fee structure does not match this student's active enrollment." });
    const result = await pool.query("INSERT INTO sms.student_fee_assignments (student_id,enrollment_id,fee_structure_id,discount_percent,discount_amount,reason,status,assigned_by) VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7) RETURNING *", [studentId, enrollmentId, structureId, amount(req.body.discount_percent), amount(req.body.discount_amount), clean(req.body.reason), req.user.user_id]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { failure(res, error, "Failed to assign student fees."); }
});

async function createInvoice(client, { branch, studentId, enrollmentId, dueDate, billingMonth, billingYear, remarks, lines, discountAmount = 0 }, userId) {
  const gross = lines.reduce((sum, line) => sum + amount(line.amount), 0), discount = Math.min(amount(discountAmount), gross), net = gross - discount;
  if (!gross) throw new Error("Invoice must contain an amount greater than zero.");
  const invoiceNo = `INV-${today().replaceAll("-", "")}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const created = await client.query(`INSERT INTO sms.fee_invoices (branch_id,student_id,enrollment_id,invoice_no,invoice_date,due_date,billing_month,billing_year,gross_amount,discount_amount,net_amount,due_amount,remarks,created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,$12,$13) RETURNING *`, [branch, studentId, clean(enrollmentId), invoiceNo, today(), clean(dueDate), clean(billingMonth), clean(billingYear), gross, discount, net, clean(remarks), userId]);
  for (const line of lines) {
    const lineDiscount = gross ? Number((discount * amount(line.amount) / gross).toFixed(2)) : 0, lineNet = amount(line.amount) - lineDiscount;
    await client.query("INSERT INTO sms.fee_invoice_lines (invoice_id,fee_head_id,description,amount,discount_amount,net_amount,due_amount) VALUES ($1,$2,$3,$4,$5,$6,$6)", [created.rows[0].invoice_id, line.fee_head_id, clean(line.description), amount(line.amount), lineDiscount, lineNet]);
  }
  return created.rows[0];
}

router.get("/invoices", requirePermission("fee.invoice", "view"), async (req, res) => {
  try {
    const result = await pool.query(`SELECT fi.*, s.full_name, s.student_no FROM sms.fee_invoices fi JOIN sms.students s ON s.student_id=fi.student_id
      WHERE s.institution_id=$1 ORDER BY fi.invoice_id DESC LIMIT 100`, [await institutionId(req)]);
    res.json({ success: true, data: result.rows });
  } catch (error) { failure(res, error, "Failed to load invoices."); }
});
router.post("/invoices", requirePermission("fee.invoice", "create"), async (req, res) => {
  const client = await pool.connect();
  try {
    const branch = await branchId(req, req.body.branch_id), lines = Array.isArray(req.body.lines) ? req.body.lines : [];
    if (!branch || !req.body.student_id || !lines.length) return res.status(400).json({ success: false, message: "Student, branch and invoice items are required." });
    await client.query("BEGIN"); const invoice = await createInvoice(client, { branch, studentId: req.body.student_id, enrollmentId: req.body.enrollment_id, dueDate: req.body.due_date, billingMonth: req.body.billing_month, billingYear: req.body.billing_year, remarks: req.body.remarks, lines, discountAmount: req.body.discount_amount }, req.user.user_id); await client.query("COMMIT"); res.status(201).json({ success: true, data: invoice });
  } catch (error) { await client.query("ROLLBACK"); failure(res, error, error.message || "Failed to create invoice."); } finally { client.release(); }
});
router.post("/invoices/generate", requirePermission("fee.invoice", "create"), async (req, res) => {
  const client = await pool.connect();
  try {
    const assignment = await client.query(`SELECT a.*, se.branch_id, se.academic_year_id, fsd.fee_head_id, fsd.amount, fh.fee_name
      FROM sms.student_fee_assignments a JOIN sms.student_enrollments se ON se.enrollment_id=a.enrollment_id JOIN sms.fee_structure_details fsd ON fsd.fee_structure_id=a.fee_structure_id AND fsd.status='ACTIVE'
      JOIN sms.fee_heads fh ON fh.fee_head_id=fsd.fee_head_id WHERE a.assignment_id=$1 AND a.status='ACTIVE'`, [req.body.assignment_id]);
    if (!assignment.rowCount) return res.status(400).json({ success: false, message: "Active fee assignment not found." });
    const first = assignment.rows[0]; await client.query("BEGIN");
    const approvedWaivers = await client.query(`SELECT fee_head_id, waiver_type, waiver_value FROM sms.fee_waivers
      WHERE student_id=$1 AND approval_status='APPROVED' AND effective_from <= CURDATE() AND (effective_to IS NULL OR effective_to >= CURDATE())`, [first.student_id]);
    const waiverDiscount = assignment.rows.reduce((sum, row) => sum + approvedWaivers.rows
      .filter(waiver => !waiver.fee_head_id || Number(waiver.fee_head_id) === Number(row.fee_head_id))
      .reduce((lineDiscount, waiver) => lineDiscount + (waiver.waiver_type === 'PERCENT' ? amount(row.amount) * amount(waiver.waiver_value) / 100 : amount(waiver.waiver_value)), 0), 0);
    const gross = assignment.rows.reduce((sum, row) => sum + amount(row.amount), 0);
    const invoice = await createInvoice(client, { branch: first.branch_id, studentId: first.student_id, enrollmentId: first.enrollment_id, dueDate: req.body.due_date, billingMonth: req.body.billing_month, billingYear: req.body.billing_year, remarks: req.body.remarks, lines: assignment.rows.map(row => ({ fee_head_id: row.fee_head_id, amount: row.amount, description: row.fee_name })), discountAmount: Math.min(gross, Number(first.discount_amount || 0) + (gross * Number(first.discount_percent || 0) / 100) + waiverDiscount) }, req.user.user_id);
    await client.query("COMMIT"); res.status(201).json({ success: true, data: invoice });
  } catch (error) { await client.query("ROLLBACK"); failure(res, error, error.message || "Failed to generate invoice."); } finally { client.release(); }
});
router.post("/invoices/generate-bulk", requirePermission("fee.invoice", "create"), async (req, res) => {
  const client = await pool.connect();
  try {
    const branch = await branchId(req, req.body.branch_id);
    const billingMonth = Number(req.body.billing_month), billingYear = Number(req.body.billing_year);
    if (!branch || !req.body.academic_year_id || !req.body.class_id || billingMonth < 1 || billingMonth > 12 || billingYear < 2020 || billingYear > 2100) {
      return res.status(400).json({ success: false, message: "Branch, academic year, class, and a valid billing month and year are required." });
    }

    await client.query("BEGIN");
    const assignmentRows = await client.query(`SELECT a.assignment_id, a.student_id, a.enrollment_id, a.discount_percent, a.discount_amount,
        se.branch_id, fsd.fee_head_id, fsd.amount, fh.fee_name
      FROM sms.student_fee_assignments a
      JOIN sms.student_enrollments se ON se.enrollment_id=a.enrollment_id AND se.enrollment_status='ACTIVE'
      JOIN sms.students s ON s.student_id=a.student_id AND s.status='ACTIVE'
      JOIN sms.fee_structures fs ON fs.fee_structure_id=a.fee_structure_id AND fs.status='ACTIVE'
        AND fs.branch_id=se.branch_id AND fs.academic_year_id=se.academic_year_id AND fs.class_id=se.class_id
        AND (fs.group_id IS NULL OR fs.group_id=se.group_id) AND (fs.medium_id IS NULL OR fs.medium_id=se.medium_id)
      JOIN sms.fee_structure_details fsd ON fsd.fee_structure_id=a.fee_structure_id AND fsd.status='ACTIVE'
      JOIN sms.fee_heads fh ON fh.fee_head_id=fsd.fee_head_id
      WHERE a.status='ACTIVE' AND s.institution_id=$6 AND se.branch_id=$1 AND se.academic_year_id=$2 AND se.class_id=$3
        AND ($4 IS NULL OR se.group_id=$4) AND ($5 IS NULL OR se.medium_id=$5)
      ORDER BY a.enrollment_id, a.assignment_id, fsd.fee_structure_detail_id`, [branch, req.body.academic_year_id, req.body.class_id, clean(req.body.group_id), clean(req.body.medium_id), await institutionId(req)]);

    const students = new Map();
    for (const row of assignmentRows.rows) {
      if (!students.has(row.enrollment_id)) students.set(row.enrollment_id, { studentId: row.student_id, enrollmentId: row.enrollment_id, branch: row.branch_id, lines: [], assignments: new Map() });
      const student = students.get(row.enrollment_id);
      student.lines.push({ fee_head_id: row.fee_head_id, amount: row.amount, description: row.fee_name, assignment_id: row.assignment_id });
      if (!student.assignments.has(row.assignment_id)) student.assignments.set(row.assignment_id, { discount_percent: row.discount_percent, discount_amount: row.discount_amount, gross: 0 });
      student.assignments.get(row.assignment_id).gross += amount(row.amount);
    }

    let generated = 0, skipped = 0;
    for (const student of students.values()) {
      const existing = await client.query("SELECT invoice_id FROM sms.fee_invoices WHERE enrollment_id=$1 AND billing_month=$2 AND billing_year=$3 AND invoice_status <> 'CANCELLED' LIMIT 1", [student.enrollmentId, billingMonth, billingYear]);
      if (existing.rowCount) { skipped += 1; continue; }
      const approvedWaivers = await client.query(`SELECT fee_head_id, waiver_type, waiver_value FROM sms.fee_waivers
        WHERE student_id=$1 AND approval_status='APPROVED' AND effective_from <= CURDATE() AND (effective_to IS NULL OR effective_to >= CURDATE())`, [student.studentId]);
      const gross = student.lines.reduce((sum, line) => sum + amount(line.amount), 0);
      const assignmentDiscount = [...student.assignments.values()].reduce((sum, assignment) => sum + amount(assignment.discount_amount) + (assignment.gross * amount(assignment.discount_percent) / 100), 0);
      const waiverDiscount = student.lines.reduce((sum, line) => sum + approvedWaivers.rows
        .filter(waiver => !waiver.fee_head_id || Number(waiver.fee_head_id) === Number(line.fee_head_id))
        .reduce((lineDiscount, waiver) => lineDiscount + (waiver.waiver_type === 'PERCENT' ? amount(line.amount) * amount(waiver.waiver_value) / 100 : amount(waiver.waiver_value)), 0), 0);
      await createInvoice(client, { branch: student.branch, studentId: student.studentId, enrollmentId: student.enrollmentId, dueDate: req.body.due_date, billingMonth, billingYear, remarks: req.body.remarks, lines: student.lines, discountAmount: Math.min(gross, assignmentDiscount + waiverDiscount) }, req.user.user_id);
      generated += 1;
    }
    await client.query("COMMIT");
    res.status(201).json({ success: true, data: { generated, skipped, eligible: students.size }, message: `${generated} invoice(s) generated; ${skipped} skipped because an invoice already exists for this billing period.` });
  } catch (error) { await client.query("ROLLBACK"); failure(res, error, error.message || "Failed to generate class invoices."); } finally { client.release(); }
});
router.put("/invoices/:id", requirePermission("fee.invoice", "update"), async (req, res) => {
  try {
    const result = await pool.query(`UPDATE sms.fee_invoices fi JOIN sms.students s ON s.student_id=fi.student_id
      SET fi.due_date=$1, fi.remarks=$2 WHERE fi.invoice_id=$3 AND s.institution_id=$4`, [clean(req.body.due_date), clean(req.body.remarks), req.params.id, await institutionId(req)]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Invoice not found." });
    const updated = await pool.query("SELECT * FROM sms.fee_invoices WHERE invoice_id=$1", [req.params.id]);
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) { failure(res, error, "Failed to update invoice."); }
});
router.post("/invoices/:id/regenerate", requirePermission("fee.invoice", "update"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invoiceResult = await client.query(`SELECT fi.* FROM sms.fee_invoices fi JOIN sms.students s ON s.student_id=fi.student_id
      WHERE fi.invoice_id=$1 AND s.institution_id=$2 FOR UPDATE`, [req.params.id, await institutionId(req)]);
    const invoice = invoiceResult.rows[0];
    if (!invoice) throw new Error("Invoice not found.");
    if (amount(invoice.paid_amount) > 0) throw new Error("A paid or partially paid invoice cannot be regenerated.");
    const collectionLines = await client.query("SELECT collection_line_id FROM sms.fee_collection_lines WHERE invoice_id=$1 LIMIT 1", [invoice.invoice_id]);
    if (collectionLines.rowCount) throw new Error("Delete the related collection before regenerating this invoice.");
    const assignments = await client.query(`SELECT a.assignment_id, a.discount_percent, a.discount_amount, fsd.fee_head_id, fsd.amount, fh.fee_name
      FROM sms.student_fee_assignments a JOIN sms.student_enrollments se ON se.enrollment_id=a.enrollment_id AND se.enrollment_status='ACTIVE'
      JOIN sms.fee_structures fs ON fs.fee_structure_id=a.fee_structure_id AND fs.status='ACTIVE'
        AND fs.branch_id=se.branch_id AND fs.academic_year_id=se.academic_year_id AND fs.class_id=se.class_id
        AND (fs.group_id IS NULL OR fs.group_id=se.group_id) AND (fs.medium_id IS NULL OR fs.medium_id=se.medium_id)
      JOIN sms.fee_structure_details fsd ON fsd.fee_structure_id=a.fee_structure_id AND fsd.status='ACTIVE'
      JOIN sms.fee_heads fh ON fh.fee_head_id=fsd.fee_head_id
      WHERE a.enrollment_id=$1 AND a.student_id=$2 AND a.status='ACTIVE'`, [invoice.enrollment_id, invoice.student_id]);
    if (!assignments.rowCount) throw new Error("No active class-wise fee assignment is available for this invoice.");
    const approvedWaivers = await client.query(`SELECT fee_head_id, waiver_type, waiver_value FROM sms.fee_waivers
      WHERE student_id=$1 AND approval_status='APPROVED' AND effective_from <= CURDATE() AND (effective_to IS NULL OR effective_to >= CURDATE())`, [invoice.student_id]);
    const assignmentTotals = new Map(), lines = assignments.rows.map(row => ({ fee_head_id: row.fee_head_id, amount: row.amount, description: row.fee_name, assignment_id: row.assignment_id }));
    for (const row of assignments.rows) { if (!assignmentTotals.has(row.assignment_id)) assignmentTotals.set(row.assignment_id, { gross: 0, discount_percent: row.discount_percent, discount_amount: row.discount_amount }); assignmentTotals.get(row.assignment_id).gross += amount(row.amount); }
    const gross = lines.reduce((sum, line) => sum + amount(line.amount), 0);
    const assignmentDiscount = [...assignmentTotals.values()].reduce((sum, item) => sum + amount(item.discount_amount) + (item.gross * amount(item.discount_percent) / 100), 0);
    const waiverDiscount = lines.reduce((sum, line) => sum + approvedWaivers.rows.filter(waiver => !waiver.fee_head_id || Number(waiver.fee_head_id) === Number(line.fee_head_id)).reduce((lineDiscount, waiver) => lineDiscount + (waiver.waiver_type === 'PERCENT' ? amount(line.amount) * amount(waiver.waiver_value) / 100 : amount(waiver.waiver_value)), 0), 0);
    const discount = Math.min(gross, assignmentDiscount + waiverDiscount), net = gross - discount;
    await client.query("DELETE FROM sms.fee_invoice_lines WHERE invoice_id=$1", [invoice.invoice_id]);
    const updated = await client.query(`UPDATE sms.fee_invoices SET due_date=$1, remarks=$2, gross_amount=$3, discount_amount=$4, fine_amount=0,
      net_amount=$5, paid_amount=0, due_amount=$5, invoice_status='UNPAID' WHERE invoice_id=$6 RETURNING *`, [clean(req.body.due_date) || invoice.due_date, clean(req.body.remarks) || invoice.remarks, gross, discount, net, invoice.invoice_id]);
    for (const line of lines) {
      const lineDiscount = gross ? Number((discount * amount(line.amount) / gross).toFixed(2)) : 0, lineNet = amount(line.amount) - lineDiscount;
      await client.query("INSERT INTO sms.fee_invoice_lines (invoice_id,fee_head_id,description,amount,discount_amount,net_amount,due_amount) VALUES ($1,$2,$3,$4,$5,$6,$6)", [invoice.invoice_id, line.fee_head_id, clean(line.description), amount(line.amount), lineDiscount, lineNet]);
    }
    await client.query("COMMIT"); res.json({ success: true, data: updated.rows[0] });
  } catch (error) { await client.query("ROLLBACK"); failure(res, error, error.message || "Failed to regenerate invoice."); } finally { client.release(); }
});
router.delete("/invoices/:id", requirePermission("fee.invoice", "delete"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invoice = await client.query(`SELECT fi.* FROM sms.fee_invoices fi JOIN sms.students s ON s.student_id=fi.student_id
      WHERE fi.invoice_id=$1 AND s.institution_id=$2 FOR UPDATE`, [req.params.id, await institutionId(req)]);
    if (!invoice.rowCount) throw new Error("Invoice not found.");
    if (amount(invoice.rows[0].paid_amount) > 0) throw new Error("A paid or partially paid invoice cannot be deleted.");
    const collectionLines = await client.query("SELECT collection_line_id FROM sms.fee_collection_lines WHERE invoice_id=$1 LIMIT 1", [req.params.id]);
    if (collectionLines.rowCount) throw new Error("Delete the related collection before deleting this invoice.");
    await client.query("DELETE FROM sms.fee_invoice_lines WHERE invoice_id=$1", [req.params.id]);
    await client.query("DELETE FROM sms.fee_invoices WHERE invoice_id=$1", [req.params.id]);
    await client.query("COMMIT"); res.json({ success: true });
  } catch (error) { await client.query("ROLLBACK"); failure(res, error, error.message || "Failed to delete invoice."); } finally { client.release(); }
});
router.get("/invoices/:id", requirePermission("fee.invoice", "view"), async (req, res) => {
  try {
    const [invoice, lines] = await Promise.all([pool.query(`SELECT fi.*, s.full_name, s.student_no FROM sms.fee_invoices fi JOIN sms.students s ON s.student_id=fi.student_id WHERE fi.invoice_id=$1 AND s.institution_id=$2`, [req.params.id, await institutionId(req)]), pool.query(`SELECT fil.*, fh.fee_name FROM sms.fee_invoice_lines fil JOIN sms.fee_heads fh ON fh.fee_head_id=fil.fee_head_id WHERE fil.invoice_id=$1`, [req.params.id])]);
    if (!invoice.rowCount) return res.status(404).json({ success: false, message: "Invoice not found." }); res.json({ success: true, data: { ...invoice.rows[0], lines: lines.rows } });
  } catch (error) { failure(res, error, "Failed to load invoice."); }
});

router.get("/collections", requirePermission("fee.collection", "view"), async (req, res) => {
  try { const result = await pool.query(`SELECT fc.*, s.full_name, s.student_no FROM sms.fee_collections fc JOIN sms.students s ON s.student_id=fc.student_id WHERE s.institution_id=$1 ORDER BY fc.collection_id DESC LIMIT 100`, [await institutionId(req)]); res.json({ success: true, data: result.rows }); } catch (error) { failure(res, error, "Failed to load collections."); }
});
router.post("/collections", requirePermission("fee.collection", "create"), async (req, res) => {
  const client = await pool.connect();
  try {
    const lines = Array.isArray(req.body.lines) ? req.body.lines.filter(line => amount(line.paid_amount) > 0) : [], branch = await branchId(req, req.body.branch_id);
    if (!branch || !req.body.student_id || !lines.length || !paymentMethods.has(String(req.body.payment_method || "CASH").toUpperCase())) return res.status(400).json({ success: false, message: "Student, payment method and at least one positive payment are required." });
    await client.query("BEGIN"); const total = lines.reduce((sum, line) => sum + amount(line.paid_amount), 0), receiptNo = `RCPT-${today().replaceAll("-", "")}-${Date.now()}`;
    const created = await client.query("INSERT INTO sms.fee_collections (branch_id,student_id,receipt_no,collection_date,payment_method,reference_no,total_amount,remarks,collected_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *", [branch, req.body.student_id, receiptNo, req.body.collection_date || today(), String(req.body.payment_method || "CASH").toUpperCase(), clean(req.body.reference_no), total, clean(req.body.remarks), req.user.user_id]);
    for (const line of lines) {
      const invoice = await client.query(`SELECT fi.* FROM sms.fee_invoices fi JOIN sms.students s ON s.student_id=fi.student_id WHERE fi.invoice_id=$1 AND fi.student_id=$2 AND s.institution_id=$3 AND fi.invoice_status <> 'CANCELLED'`, [line.invoice_id, req.body.student_id, await institutionId(req)]);
      if (!invoice.rowCount) throw new Error("Invalid invoice selected for collection.");
      const discount = amount(line.discount_amount), fine = amount(line.fine_amount), newNet = amount(invoice.rows[0].net_amount) - discount + fine, newPaid = amount(invoice.rows[0].paid_amount) + amount(line.paid_amount);
      if (newPaid > newNet + 0.001) throw new Error(`Payment is greater than the remaining amount for ${invoice.rows[0].invoice_no}.`);
      const due = Math.max(newNet - newPaid, 0), status = due === 0 ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";
      await client.query("INSERT INTO sms.fee_collection_lines (collection_id,invoice_id,invoice_line_id,paid_amount,discount_amount,fine_amount) VALUES ($1,$2,$3,$4,$5,$6)", [created.rows[0].collection_id, line.invoice_id, clean(line.invoice_line_id), amount(line.paid_amount), discount, fine]);
      await client.query("UPDATE sms.fee_invoices SET discount_amount=discount_amount+$1,fine_amount=fine_amount+$2,net_amount=$3,paid_amount=$4,due_amount=$5,invoice_status=$6 WHERE invoice_id=$7", [discount, fine, newNet, newPaid, due, status, line.invoice_id]);
    }
    await client.query("COMMIT"); res.status(201).json({ success: true, data: created.rows[0], message: `Collection saved. Receipt: ${receiptNo}` });
  } catch (error) { await client.query("ROLLBACK"); failure(res, error, error.message || "Failed to save collection."); } finally { client.release(); }
});
router.put("/collections/:id", requirePermission("fee.collection", "update"), async (req, res) => {
  try {
    const method = String(req.body.payment_method || "CASH").toUpperCase();
    if (!paymentMethods.has(method) || !req.body.collection_date) return res.status(400).json({ success: false, message: "A valid payment method and collection date are required." });
    const result = await pool.query(`UPDATE sms.fee_collections fc JOIN sms.students s ON s.student_id=fc.student_id
      SET fc.collection_date=$1, fc.payment_method=$2, fc.reference_no=$3, fc.remarks=$4
      WHERE fc.collection_id=$5 AND s.institution_id=$6`, [req.body.collection_date, method, clean(req.body.reference_no), clean(req.body.remarks), req.params.id, await institutionId(req)]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Collection not found." });
    const updated = await pool.query("SELECT * FROM sms.fee_collections WHERE collection_id=$1", [req.params.id]);
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) { failure(res, error, "Failed to update collection."); }
});
router.delete("/collections/:id", requirePermission("fee.collection", "delete"), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const collection = await client.query(`SELECT fc.* FROM sms.fee_collections fc JOIN sms.students s ON s.student_id=fc.student_id
      WHERE fc.collection_id=$1 AND s.institution_id=$2 FOR UPDATE`, [req.params.id, await institutionId(req)]);
    if (!collection.rowCount) throw new Error("Collection not found.");
    const lines = await client.query("SELECT * FROM sms.fee_collection_lines WHERE collection_id=$1", [req.params.id]);
    for (const line of lines.rows) {
      const invoiceResult = await client.query("SELECT * FROM sms.fee_invoices WHERE invoice_id=$1 FOR UPDATE", [line.invoice_id]);
      if (!invoiceResult.rowCount) continue;
      const invoice = invoiceResult.rows[0], net = Math.max(amount(invoice.net_amount) + amount(line.discount_amount) - amount(line.fine_amount), 0), paid = Math.max(amount(invoice.paid_amount) - amount(line.paid_amount), 0), due = Math.max(net - paid, 0), status = due === 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";
      await client.query(`UPDATE sms.fee_invoices SET discount_amount=GREATEST(discount_amount-$1,0), fine_amount=GREATEST(fine_amount-$2,0),
        net_amount=$3, paid_amount=$4, due_amount=$5, invoice_status=$6 WHERE invoice_id=$7`, [amount(line.discount_amount), amount(line.fine_amount), net, paid, due, status, line.invoice_id]);
    }
    await client.query("DELETE FROM sms.fee_collection_lines WHERE collection_id=$1", [req.params.id]);
    await client.query("DELETE FROM sms.fee_collections WHERE collection_id=$1", [req.params.id]);
    await client.query("COMMIT"); res.json({ success: true });
  } catch (error) { await client.query("ROLLBACK"); failure(res, error, error.message || "Failed to delete collection."); } finally { client.release(); }
});

router.get("/waivers", requirePermission("fee.waiver", "view"), async (req, res) => {
  try { const result = await pool.query(`SELECT w.*, s.full_name, s.student_no, fh.fee_name FROM sms.fee_waivers w JOIN sms.students s ON s.student_id=w.student_id LEFT JOIN sms.fee_heads fh ON fh.fee_head_id=w.fee_head_id WHERE s.institution_id=$1 ORDER BY w.waiver_id DESC`, [await institutionId(req)]); res.json({ success: true, data: result.rows }); } catch (error) { failure(res, error, "Failed to load waivers."); }
});
router.post("/waivers", requirePermission("fee.waiver", "create"), async (req, res) => {
  try {
    const type = String(req.body.waiver_type || "").toUpperCase(); if (!req.body.student_id || !["PERCENT", "FIXED"].includes(type) || !req.body.effective_from || amount(req.body.waiver_value) <= 0) return res.status(400).json({ success: false, message: "Student, waiver type, positive value and effective date are required." });
    const result = await pool.query("INSERT INTO sms.fee_waivers (student_id,fee_head_id,waiver_type,waiver_value,effective_from,effective_to,remarks) SELECT $1,$2,$3,$4,$5,$6,$7 FROM sms.students WHERE student_id=$1 AND institution_id=$8 RETURNING *", [req.body.student_id, clean(req.body.fee_head_id), type, amount(req.body.waiver_value), req.body.effective_from, clean(req.body.effective_to), clean(req.body.remarks), await institutionId(req)]);
    if (!result.rowCount) return res.status(400).json({ success: false, message: "Invalid student." }); res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { failure(res, error, "Failed to create waiver."); }
});
router.put("/waivers/:id", requirePermission("fee.waiver", "update"), async (req, res) => {
  try {
    const type = String(req.body.waiver_type || "").toUpperCase();
    if (!req.body.student_id || !["PERCENT", "FIXED"].includes(type) || !req.body.effective_from || amount(req.body.waiver_value) <= 0) return res.status(400).json({ success: false, message: "Student, waiver type, positive value and effective date are required." });
    const result = await pool.query(`UPDATE sms.fee_waivers w JOIN sms.students s ON s.student_id=w.student_id
      JOIN sms.students target ON target.student_id=$1 AND target.institution_id=$9
      SET w.student_id=$1, w.fee_head_id=$2, w.waiver_type=$3, w.waiver_value=$4, w.effective_from=$5, w.effective_to=$6,
        w.remarks=$7, w.approval_status='PENDING', w.approved_by=NULL
      WHERE w.waiver_id=$8 AND s.institution_id=$9`, [req.body.student_id, clean(req.body.fee_head_id), type, amount(req.body.waiver_value), req.body.effective_from, clean(req.body.effective_to), clean(req.body.remarks), req.params.id, await institutionId(req)]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Waiver not found or selected student is invalid." });
    const updated = await pool.query("SELECT * FROM sms.fee_waivers WHERE waiver_id=$1", [req.params.id]);
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) { failure(res, error, "Failed to update waiver."); }
});
router.delete("/waivers/:id", requirePermission("fee.waiver", "delete"), async (req, res) => {
  try {
    const result = await pool.query(`DELETE w FROM sms.fee_waivers w JOIN sms.students s ON s.student_id=w.student_id
      WHERE w.waiver_id=$1 AND s.institution_id=$2`, [req.params.id, await institutionId(req)]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Waiver not found." });
    res.json({ success: true });
  } catch (error) { failure(res, error, "Failed to delete waiver."); }
});
router.put("/waivers/:id/approve", requirePermission("fee.waiver", "approve"), async (req, res) => {
  try { const result = await pool.query(`UPDATE sms.fee_waivers w JOIN sms.students s ON s.student_id=w.student_id SET w.approval_status='APPROVED',w.approved_by=$1 WHERE w.waiver_id=$2 AND s.institution_id=$3`, [req.user.user_id, req.params.id, await institutionId(req)]); if (!result.rowCount) return res.status(404).json({ success: false, message: "Waiver not found." }); res.json({ success: true }); } catch (error) { failure(res, error, "Failed to approve waiver."); }
});

export default router;
