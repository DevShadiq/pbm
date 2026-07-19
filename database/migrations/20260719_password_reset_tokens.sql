CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_password_reset_tokens_user
    FOREIGN KEY (user_id) REFERENCES app_users(user_id) ON DELETE CASCADE,
  INDEX idx_password_reset_tokens_lookup (token_hash, used_at, expires_at),
  INDEX idx_password_reset_tokens_user (user_id)
);
