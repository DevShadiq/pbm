import express from "express";
import pool from "../config/db.js";

const router = express.Router();

const tables = {
  "branches": {
    table: "sms.branches",
    id: "branch_id",
    columns: [
      "institution_id",
      "branch_code",
      "branch_name",
      "branch_type",
      "phone",
      "email",
      "address_line",
      "is_main_branch",
      "status",
    ],
    required: ["institution_id", "branch_code", "branch_name", "status"],
    orderBy: "branch_id DESC",
  },

  "academic-years": {
    table: "sms.academic_years",
    id: "academic_year_id",
    columns: [
      "institution_id",
      "year_name",
      "start_date",
      "end_date",
      "is_current",
      "status",
    ],
    required: ["institution_id", "year_name", "start_date", "end_date", "status"],
    orderBy: "academic_year_id DESC",
  },

  "academic-sessions": {
    table: "sms.academic_sessions",
    id: "session_id",
    columns: [
      "institution_id",
      "academic_year_id",
      "session_name",
      "session_type",
      "start_date",
      "end_date",
      "is_current",
      "status",
    ],
    required: ["institution_id", "session_name", "status"],
    orderBy: "session_id DESC",
  },

  "class-levels": {
    table: "sms.class_levels",
    id: "class_id",
    columns: [
      "institution_id",
      "class_code",
      "class_name",
      "numeric_level",
      "status",
    ],
    required: ["institution_id", "class_code", "class_name", "status"],
    orderBy: "numeric_level NULLS LAST, class_id DESC",
  },

  "groups": {
    table: "sms.groups",
    id: "group_id",
    columns: [
      "institution_id",
      "group_code",
      "group_name",
      "status",
    ],
    required: ["institution_id", "group_code", "group_name", "status"],
    orderBy: "group_id DESC",
  },

  "sections": {
    table: "sms.sections",
    id: "section_id",
    columns: [
      "institution_id",
      "section_code",
      "section_name",
      "status",
    ],
    required: ["institution_id", "section_code", "section_name", "status"],
    orderBy: "section_id DESC",
  },

  "mediums": {
    table: "sms.mediums",
    id: "medium_id",
    columns: [
      "institution_id",
      "medium_code",
      "medium_name",
      "status",
    ],
    required: ["institution_id", "medium_code", "medium_name", "status"],
    orderBy: "medium_id DESC",
  },

  "shifts": {
    table: "sms.shifts",
    id: "shift_id",
    columns: [
      "institution_id",
      "shift_name",
      "start_time",
      "end_time",
      "status",
    ],
    required: ["institution_id", "shift_name", "status"],
    orderBy: "shift_id DESC",
  },

  "lookup-types": {
    table: "sms.lookup_types",
    id: "lookup_type_id",
    columns: [
      "type_code",
      "type_name",
      "description",
      "status",
    ],
    required: ["type_code", "type_name", "status"],
    orderBy: "lookup_type_id DESC",
  },

  "lookup-values": {
    table: "sms.lookup_values",
    id: "lookup_value_id",
    columns: [
      "lookup_type_id",
      "value_code",
      "value_name",
      "sort_order",
      "status",
    ],
    required: ["lookup_type_id", "value_code", "value_name", "status"],
    orderBy: "lookup_value_id DESC",
  },

  "academic-batches": {
    table: "sms.academic_batches",
    id: "batch_id",
    columns: [
      "branch_id",
      "academic_year_id",
      "class_id",
      "group_id",
      "section_id",
      "medium_id",
      "shift_id",
      "classroom_id",
      "batch_name",
      "capacity",
      "status",
    ],
    required: ["branch_id", "academic_year_id", "class_id", "batch_name", "status"],
    orderBy: "batch_id DESC",
  },
};

function getConfig(resource) {
  return tables[resource];
}

function normalizePayloadValue(value) {
  if (value === "") return null;
  return value;
}

function isBlank(value) {
  return value === null || value === undefined || value === "";
}

function humanizeColumn(column) {
  const labelMap = {
    institution_id: "Institution",
    branch_id: "Branch",
    academic_year_id: "Academic Year",
    class_id: "Class",
    group_id: "Group",
    section_id: "Section",
    medium_id: "Medium",
    shift_id: "Shift",
    classroom_id: "Classroom",
    lookup_type_id: "Lookup Type",
  };

  if (labelMap[column]) return labelMap[column];

  return column
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getMissingColumns(config, payload, onlySubmitted = false) {
  return (config.required || []).filter((column) => {
    if (onlySubmitted && !Object.prototype.hasOwnProperty.call(payload, column)) {
      return false;
    }

    return isBlank(payload[column]);
  });
}

router.get("/:resource", async (req, res) => {
  try {
    const { resource } = req.params;
    const config = getConfig(resource);

    if (!config) {
      return res.status(404).json({
        message: `Route /api/${resource} not found`,
      });
    }

    let sql;

    if (resource === "academic-batches") {
      sql = `
        SELECT 
          ab.*,
          b.branch_name,
          ay.year_name,
          cl.class_name,
          g.group_name,
          s.section_name,
          m.medium_name,
          sh.shift_name
        FROM sms.academic_batches ab
        LEFT JOIN sms.branches b ON b.branch_id = ab.branch_id
        LEFT JOIN sms.academic_years ay ON ay.academic_year_id = ab.academic_year_id
        LEFT JOIN sms.class_levels cl ON cl.class_id = ab.class_id
        LEFT JOIN sms.groups g ON g.group_id = ab.group_id
        LEFT JOIN sms.sections s ON s.section_id = ab.section_id
        LEFT JOIN sms.mediums m ON m.medium_id = ab.medium_id
        LEFT JOIN sms.shifts sh ON sh.shift_id = ab.shift_id
        ORDER BY ab.batch_id DESC
      `;
    } else if (resource === "lookup-values") {
      sql = `
        SELECT 
          lv.*,
          lt.type_name,
          lt.type_code
        FROM sms.lookup_values lv
        JOIN sms.lookup_types lt ON lt.lookup_type_id = lv.lookup_type_id
        ORDER BY lv.sort_order, lv.lookup_value_id DESC
      `;
    } else {
      sql = `SELECT * FROM ${config.table} ORDER BY ${config.orderBy}`;
    }

    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error("Master GET error:", error);
    res.status(500).json({
      message: "Failed to load data",
      error: error.message,
    });
  }
});

router.post("/:resource", async (req, res) => {
  try {
    const { resource } = req.params;
    const config = getConfig(resource);

    if (!config) {
      return res.status(404).json({
        message: `Route /api/${resource} not found`,
      });
    }

    const allowedColumns = config.columns;
    const payload = Object.fromEntries(
      Object.entries(req.body || {}).map(([key, value]) => [key, normalizePayloadValue(value)])
    );

    const columns = allowedColumns.filter((col) =>
      Object.prototype.hasOwnProperty.call(payload, col)
    );

    if (columns.length === 0) {
      return res.status(400).json({
        message: "No valid column found in request body",
      });
    }

    const missingColumns = getMissingColumns(config, payload);
    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `${missingColumns.map(humanizeColumn).join(", ")} required`,
      });
    }

    const values = columns.map((col) => payload[col]);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    const sql = `
      INSERT INTO ${config.table} (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const result = await pool.query(sql, values);

    res.status(201).json({
      message: "Created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Master POST error:", error);
    res.status(500).json({
      message: "Failed to create data",
      error: error.message,
    });
  }
});

router.put("/:resource/:id", async (req, res) => {
  try {
    const { resource, id } = req.params;
    const config = getConfig(resource);

    if (!config) {
      return res.status(404).json({
        message: `Route /api/${resource} not found`,
      });
    }

    const allowedColumns = config.columns;
    const payload = Object.fromEntries(
      Object.entries(req.body || {}).map(([key, value]) => [key, normalizePayloadValue(value)])
    );

    const columns = allowedColumns.filter((col) =>
      Object.prototype.hasOwnProperty.call(payload, col)
    );

    if (columns.length === 0) {
      return res.status(400).json({
        message: "No valid column found in request body",
      });
    }

    const missingColumns = getMissingColumns(config, payload, true);
    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `${missingColumns.map(humanizeColumn).join(", ")} required`,
      });
    }

    const values = columns.map((col) => payload[col]);

    const setClause = columns
      .map((col, index) => `${col} = $${index + 1}`)
      .join(", ");

    values.push(id);

    const sql = `
      UPDATE ${config.table}
      SET ${setClause}
      WHERE ${config.id} = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(sql, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    res.json({
      message: "Updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Master PUT error:", error);
    res.status(500).json({
      message: "Failed to update data",
      error: error.message,
    });
  }
});

router.delete("/:resource/:id", async (req, res) => {
  try {
    const { resource, id } = req.params;
    const config = getConfig(resource);

    if (!config) {
      return res.status(404).json({
        message: `Route /api/${resource} not found`,
      });
    }

    const sql = `
      DELETE FROM ${config.table}
      WHERE ${config.id} = $1
      RETURNING *
    `;

    const result = await pool.query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    res.json({
      message: "Deleted successfully",
    });
  } catch (error) {
    console.error("Master DELETE error:", error);
    res.status(500).json({
      message: "Failed to delete data",
      error: error.message,
    });
  }
});

export default router;
