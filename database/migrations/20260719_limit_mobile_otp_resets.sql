-- Run once after 20260719_mobile_otp_password_reset.sql.
-- Supports the per-user, per-day mobile OTP send limit.
ALTER TABLE password_reset_otps
  ADD INDEX idx_password_reset_otps_daily_limit (user_id, created_at);
