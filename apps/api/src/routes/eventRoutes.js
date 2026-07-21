import express from "express";
import pool from "../config/db.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();
const clean = (value) => (value === "" || value === undefined ? null : value);
const statuses = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);

async function institutionIdFor(req, payload) {
  if (!req.user.is_super_admin) return req.user.institution_id;
  if (clean(payload.institution_id)) return clean(payload.institution_id);

  const result = await pool.query(`
    SELECT institution_id
    FROM sms.institutions
    WHERE status = 'ACTIVE'
    ORDER BY institution_id
    LIMIT 1
  `);
  return result.rows[0]?.institution_id || null;
}

function scopedWhere(req, values) {
  if (req.user.is_super_admin) return "";
  values.push(req.user.institution_id);
  return ` AND institution_id = $${values.length}`;
}

router.get("/", authenticateUser, requirePermission("event.management", "view"), async (req, res) => {
  try {
    const values = [];
    let where = "WHERE 1 = 1";
    if (req.user.is_super_admin && req.query.institution_id) { values.push(req.query.institution_id); where += ` AND e.institution_id = $${values.length}`; }
    if (!req.user.is_super_admin) { values.push(req.user.institution_id); where += ` AND e.institution_id = $${values.length}`; }
    const result = await pool.query(`SELECT e.* FROM sms.events e ${where} ORDER BY e.event_date DESC, e.start_time DESC`, values);
    res.json({ success: true, data: result.rows });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to load events." }); }
});

router.post("/", authenticateUser, requirePermission("event.management", "create"), async (req, res) => {
  try {
    const institutionId = await institutionIdFor(req, req.body);
    const title = String(req.body.title || "").trim();
    const eventDate = String(req.body.event_date || "").trim();
    const status = String(req.body.status || "DRAFT").toUpperCase();
    if (!institutionId || !title || !eventDate || !statuses.has(status)) return res.status(400).json({ success: false, message: "Institution, title, date, and valid status are required." });
    const result = await pool.query(`INSERT INTO sms.events (institution_id, title, title_bn, description, event_date, start_time, end_time, status, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [institutionId, title, clean(req.body.title_bn), clean(req.body.description), eventDate, clean(req.body.start_time), clean(req.body.end_time), status, req.user.user_id]);
    res.status(201).json({ success: true, message: "Event created successfully.", data: result.rows[0] });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to create event." }); }
});

router.put("/:id", authenticateUser, requirePermission("event.management", "update"), async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const eventDate = String(req.body.event_date || "").trim();
    const status = String(req.body.status || "DRAFT").toUpperCase();
    if (!title || !eventDate || !statuses.has(status)) return res.status(400).json({ success: false, message: "Title, date, and valid status are required." });
    const values = [title, clean(req.body.title_bn), clean(req.body.description), eventDate, clean(req.body.start_time), clean(req.body.end_time), status, req.params.id];
    const scope = scopedWhere(req, values);
    const result = await pool.query(`UPDATE sms.events SET title=$1, title_bn=$2, description=$3, event_date=$4, start_time=$5, end_time=$6, status=$7 WHERE event_id=$8${scope} RETURNING *`, values);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Event not found." });
    res.json({ success: true, message: "Event updated successfully.", data: result.rows[0] });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to update event." }); }
});

router.delete("/:id", authenticateUser, requirePermission("event.management", "delete"), async (req, res) => {
  try {
    const values = [req.params.id]; const scope = scopedWhere(req, values);
    const result = await pool.query(`DELETE FROM sms.events WHERE event_id=$1${scope} RETURNING event_id`, values);
    if (!result.rowCount) return res.status(404).json({ success: false, message: "Event not found." });
    res.json({ success: true, message: "Event deleted successfully." });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to delete event." }); }
});

export default router;
