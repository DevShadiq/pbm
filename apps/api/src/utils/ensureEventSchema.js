import pool from "../config/db.js";

export async function ensureEventSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sms.events (
      event_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institution_id BIGINT NULL,
      title VARCHAR(255) NOT NULL,
      title_bn VARCHAR(255) NULL,
      description TEXT NULL,
      event_date DATE NOT NULL,
      start_time TIME NULL,
      end_time TIME NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
      created_by BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_events_public (institution_id, status, event_date)
    )
  `);
}
