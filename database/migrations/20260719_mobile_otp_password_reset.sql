-- Run once. First resolve any duplicate non-empty mobile values in app_users.
ALTER TABLE app_users ADD CONSTRAINT uk_app_users_mobile UNIQUE (mobile);

CREATE TABLE IF NOT EXISTS password_reset_otps (
  otp_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  otp_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_otps_user FOREIGN KEY (user_id) REFERENCES app_users(user_id) ON DELETE CASCADE,
  INDEX idx_password_reset_otps_lookup (user_id, used_at, expires_at)
);
