import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connectionPool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  namedPlaceholders: false,
});

const primaryKeys = {
  institutions: "institution_id",
  branches: "branch_id",
  academic_years: "academic_year_id",
  academic_sessions: "session_id",
  lookup_types: "lookup_type_id",
  lookup_values: "lookup_value_id",
  app_users: "user_id",
  roles: "role_id",
  permissions: "permission_id",
  menus: "menu_id",
  education_boards: "board_id",
  mediums: "medium_id",
  shifts: "shift_id",
  class_levels: "class_id",
  groups: "group_id",
  sections: "section_id",
  classrooms: "classroom_id",
  subjects: "subject_id",
  academic_batches: "batch_id",
  students: "student_id",
  student_admissions: "admission_id",
  guardians: "guardian_id",
  student_guardians: "student_guardian_id",
  student_addresses: "address_id",
  student_enrollments: "enrollment_id",
  student_documents: "document_id",
  student_status_history: "status_history_id",
};

const uniqueKeys = {
  student_addresses: ["student_id", "address_type"],
  student_enrollments: ["student_id", "academic_year_id"],
  student_guardians: ["student_id", "guardian_id", "relation_type"],
};

function normalizeIdentifier(identifier = "") {
  return identifier
    .trim()
    .replace(/[`"]/g, "")
    .replace(/^sms\./i, "");
}

function quoteTable(identifier = "") {
  const table = normalizeIdentifier(identifier);
  return table === "groups" ? "`groups`" : table;
}

function normalizeSql(sql) {
  return sql
    .replace(/\bsms\.groups\b/gi, "`groups`")
    .replace(/\bsms\./gi, "")
    .replace(/\bBOOL_OR\s*\(/gi, "MAX(")
    .replace(/\bILIKE\b/gi, "LIKE")
    .replace(/COUNT\(\*\)::int/gi, "CAST(COUNT(*) AS UNSIGNED)")
    .replace(/(\w+)\s+NULLS\s+LAST/gi, "$1 IS NULL, $1")
    .replace(/(\w+)\s+NULLS\s+FIRST/gi, "$1 IS NOT NULL, $1")
    .replace(/EXCLUDED\.(\w+)/gi, "VALUES($1)")
    .replace(
      /ON\s+CONFLICT\s*\([^)]+\)\s*DO\s+UPDATE\s+SET/gi,
      "ON DUPLICATE KEY UPDATE"
    )
    .replace(
      /ON\s+CONFLICT\s*\([^)]+\)\s*DO\s+NOTHING/gi,
      "ON DUPLICATE KEY UPDATE"
    );
}

function convertPlaceholders(sql, values = []) {
  const convertedValues = [];
  const convertedSql = sql
    .replace(/\$(\d+)::[A-Za-z_][A-Za-z0-9_]*/g, (_, index) => {
      convertedValues.push(values[Number(index) - 1]);
      return "?";
    })
    .replace(/\$(\d+)/g, (_, index) => {
      convertedValues.push(values[Number(index) - 1]);
      return "?";
    });

  return { sql: convertedSql, values: convertedValues };
}

function prepareSql(sql, values = []) {
  return convertPlaceholders(normalizeSql(sql), values);
}

function toPgResult(result) {
  if (Array.isArray(result)) {
    return {
      rows: result,
      rowCount: result.length,
    };
  }

  return {
    rows: [],
    rowCount: result?.affectedRows ?? 0,
    insertId: result?.insertId,
    affectedRows: result?.affectedRows ?? 0,
  };
}

function getReturningParts(sql) {
  const match = sql.match(/\s+RETURNING\s+([\s\S]+?)\s*;?\s*$/i);

  if (!match) return null;

  return {
    columns: match[1].trim(),
    sqlWithoutReturning: sql.slice(0, match.index).trim(),
  };
}

function getInsertTable(sql) {
  const match = sql.match(/^\s*INSERT\s+INTO\s+([`"\w.]+)/i);
  return match ? normalizeIdentifier(match[1]) : null;
}

function getInsertColumns(sql) {
  const match = sql.match(/^\s*INSERT\s+INTO\s+[`"\w.]+\s*\(([\s\S]+?)\)\s*VALUES/i);

  if (!match) return [];

  return match[1]
    .split(",")
    .map((column) => normalizeIdentifier(column))
    .filter(Boolean);
}

function getUpdateTable(sql) {
  const match = sql.match(/^\s*UPDATE\s+([`"\w.]+)/i);
  return match ? normalizeIdentifier(match[1]) : null;
}

function getDeleteTable(sql) {
  const match = sql.match(/^\s*DELETE\s+FROM\s+([`"\w.]+)/i);
  return match ? normalizeIdentifier(match[1]) : null;
}

function getWhereClause(sql) {
  const match = sql.match(/\s+WHERE\s+([\s\S]+)$/i);
  return match ? match[1].trim() : "";
}

async function executeRaw(executor, sql, values = []) {
  const [result] = await executor.execute(sql, values);
  return result;
}

async function executeTransactionCommand(executor, command) {
  if (command === "BEGIN" && typeof executor.beginTransaction === "function") {
    await executor.beginTransaction();
    return { rows: [], rowCount: 0 };
  }

  if (command === "COMMIT" && typeof executor.commit === "function") {
    await executor.commit();
    return { rows: [], rowCount: 0 };
  }

  if (command === "ROLLBACK" && typeof executor.rollback === "function") {
    await executor.rollback();
    return { rows: [], rowCount: 0 };
  }

  const sqlByCommand = {
    BEGIN: "START TRANSACTION",
    COMMIT: "COMMIT",
    ROLLBACK: "ROLLBACK",
  };

  await executor.query(sqlByCommand[command]);
  return { rows: [], rowCount: 0 };
}

async function selectRows(executor, table, columns, whereClause, values) {
  const safeColumns = columns === "*" ? "*" : columns;
  const where = whereClause ? ` WHERE ${whereClause}` : "";
  const { sql, values: queryValues } = prepareSql(
    `SELECT ${safeColumns} FROM ${quoteTable(table)}${where}`,
    values
  );
  const result = await executeRaw(executor, sql, queryValues);
  return Array.isArray(result) ? result : [];
}

async function selectInsertedRows(executor, table, columns, insertSql, insertValues, insertId) {
  const primaryKey = primaryKeys[table];

  if (primaryKey && insertId) {
    return selectRows(executor, table, columns, `${primaryKey} = $1`, [insertId]);
  }

  const uniqueKey = uniqueKeys[table];

  if (!uniqueKey) return [];

  const insertColumns = getInsertColumns(insertSql);
  const whereValues = [];
  const whereClause = uniqueKey
    .map((column, index) => {
      const valueIndex = insertColumns.indexOf(column);
      whereValues.push(insertValues[valueIndex]);
      return `${column} = $${index + 1}`;
    })
    .join(" AND ");

  return selectRows(executor, table, columns, whereClause, whereValues);
}

async function executeQuery(executor, sql, values = []) {
  const trimmedSql = sql.trim();
  const command = trimmedSql.split(/\s+/, 1)[0]?.toUpperCase();

  if (["BEGIN", "COMMIT", "ROLLBACK"].includes(command)) {
    return executeTransactionCommand(executor, command);
  }

  const returning = getReturningParts(trimmedSql);

  if (returning && command === "INSERT") {
    const table = getInsertTable(returning.sqlWithoutReturning);
    const { sql: querySql, values: queryValues } = prepareSql(
      returning.sqlWithoutReturning,
      values
    );
    const result = await executeRaw(executor, querySql, queryValues);

    const rows = await selectInsertedRows(
      executor,
      table,
      returning.columns,
      returning.sqlWithoutReturning,
      values,
      result.insertId
    );

    return {
      rows,
      rowCount: result.affectedRows ?? rows.length,
      insertId: result.insertId,
    };
  }

  if (returning && command === "UPDATE") {
    const table = getUpdateTable(returning.sqlWithoutReturning);
    const whereClause = getWhereClause(returning.sqlWithoutReturning);
    const { sql: querySql, values: queryValues } = prepareSql(
      returning.sqlWithoutReturning,
      values
    );
    const result = await executeRaw(executor, querySql, queryValues);
    const rows = result.affectedRows
      ? await selectRows(executor, table, returning.columns, whereClause, values)
      : [];

    return {
      rows,
      rowCount: result.affectedRows ?? rows.length,
      affectedRows: result.affectedRows ?? 0,
    };
  }

  if (returning && command === "DELETE") {
    const table = getDeleteTable(returning.sqlWithoutReturning);
    const whereClause = getWhereClause(returning.sqlWithoutReturning);
    const rows = await selectRows(executor, table, returning.columns, whereClause, values);
    const { sql: querySql, values: queryValues } = prepareSql(
      returning.sqlWithoutReturning,
      values
    );
    const result = await executeRaw(executor, querySql, queryValues);

    return {
      rows,
      rowCount: result.affectedRows ?? rows.length,
      affectedRows: result.affectedRows ?? 0,
    };
  }

  const { sql: querySql, values: queryValues } = prepareSql(sql, values);
  const result = await executeRaw(executor, querySql, queryValues);
  return toPgResult(result);
}

const pool = {
  query(sql, values = []) {
    return executeQuery(connectionPool, sql, values);
  },

  async connect() {
    const connection = await connectionPool.getConnection();

    return {
      query(sql, values = []) {
        return executeQuery(connection, sql, values);
      },
      release() {
        connection.release();
      },
    };
  },
};

export default pool;
