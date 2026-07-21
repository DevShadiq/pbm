-- Fees Management module. The API also runs this schema safely at startup.
-- Full normalized definitions are maintained in database/mysql-schema.sql.
CREATE TABLE IF NOT EXISTS fee_heads (
  fee_head_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  institution_id BIGINT NOT NULL, fee_code VARCHAR(30) NOT NULL, fee_name VARCHAR(120) NOT NULL,
  fee_type VARCHAR(30) NOT NULL DEFAULT 'REGULAR', is_recurring TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', UNIQUE KEY uk_fee_heads (institution_id, fee_code)
);

-- The remaining fee tables are created by apps/api/src/utils/ensureFeeSchema.js:
-- fee_structures, fee_structure_details, student_fee_assignments, fee_invoices,
-- fee_invoice_lines, fee_collections, fee_collection_lines and fee_waivers.
