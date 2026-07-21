import pool from "../config/db.js";

export async function ensureFeeSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS sms.fee_heads (
      fee_head_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, institution_id BIGINT NOT NULL,
      fee_code VARCHAR(30) NOT NULL, fee_name VARCHAR(120) NOT NULL, fee_type VARCHAR(30) NOT NULL DEFAULT 'REGULAR',
      is_recurring TINYINT(1) NOT NULL DEFAULT 0, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      UNIQUE KEY uk_fee_heads (institution_id, fee_code)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.fee_structures (
      fee_structure_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, branch_id BIGINT NOT NULL, academic_year_id BIGINT NOT NULL,
      class_id BIGINT NOT NULL, group_id BIGINT NULL, medium_id BIGINT NULL, structure_name VARCHAR(150) NOT NULL,
      effective_from DATE NOT NULL, effective_to DATE NULL, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', created_by BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_fee_structures (branch_id, academic_year_id, class_id, group_id, medium_id, structure_name)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.fee_structure_details (
      fee_structure_detail_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, fee_structure_id BIGINT NOT NULL, fee_head_id BIGINT NOT NULL,
      amount DECIMAL(12,2) NOT NULL DEFAULT 0, frequency VARCHAR(30) NOT NULL DEFAULT 'ONE_TIME', due_day INT NULL,
      is_optional TINYINT(1) NOT NULL DEFAULT 0, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      UNIQUE KEY uk_fee_structure_details (fee_structure_id, fee_head_id)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.student_fee_assignments (
      assignment_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, student_id BIGINT NOT NULL, enrollment_id BIGINT NOT NULL,
      fee_structure_id BIGINT NOT NULL, discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0, discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      reason TEXT NULL, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', assigned_by BIGINT NULL,
      assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uk_student_fee_assignment (student_id, enrollment_id, fee_structure_id)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.fee_invoices (
      invoice_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, branch_id BIGINT NOT NULL, student_id BIGINT NOT NULL, enrollment_id BIGINT NULL,
      invoice_no VARCHAR(50) NOT NULL, invoice_date DATE NOT NULL, due_date DATE NULL, billing_month INT NULL, billing_year INT NULL,
      gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0, discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0, fine_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      net_amount DECIMAL(12,2) NOT NULL DEFAULT 0, paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0, due_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      invoice_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID', remarks TEXT NULL, created_by BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_fee_invoices_no (branch_id, invoice_no), INDEX idx_fee_invoices_student (student_id, invoice_status)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.fee_invoice_lines (
      invoice_line_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, invoice_id BIGINT NOT NULL, fee_head_id BIGINT NOT NULL,
      description VARCHAR(200) NULL, amount DECIMAL(12,2) NOT NULL DEFAULT 0, discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      fine_amount DECIMAL(12,2) NOT NULL DEFAULT 0, net_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0, due_amount DECIMAL(12,2) NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS sms.fee_collections (
      collection_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, branch_id BIGINT NOT NULL, student_id BIGINT NOT NULL,
      receipt_no VARCHAR(50) NOT NULL, collection_date DATE NOT NULL, payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH',
      reference_no VARCHAR(100) NULL, total_amount DECIMAL(12,2) NOT NULL DEFAULT 0, remarks TEXT NULL, collected_by BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_fee_receipt_no (branch_id, receipt_no), INDEX idx_fee_collections_student (student_id, collection_date)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.fee_collection_lines (
      collection_line_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, collection_id BIGINT NOT NULL, invoice_id BIGINT NOT NULL,
      invoice_line_id BIGINT NULL, paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0, discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      fine_amount DECIMAL(12,2) NOT NULL DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS sms.fee_waivers (
      waiver_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, student_id BIGINT NOT NULL, fee_head_id BIGINT NULL,
      waiver_type VARCHAR(30) NOT NULL, waiver_value DECIMAL(12,2) NOT NULL, effective_from DATE NOT NULL, effective_to DATE NULL,
      approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', approved_by BIGINT NULL, remarks TEXT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
  ];

  for (const statement of statements) await pool.query(statement);
}
