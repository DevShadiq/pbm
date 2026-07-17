-- Adds the Bengali institution-profile fields used by the current API and UI.
-- Run once for existing MySQL databases created from an earlier schema.
ALTER TABLE institutions
  ADD COLUMN institution_name_bn VARCHAR(200) NULL AFTER institution_name,
  ADD COLUMN short_name_bn VARCHAR(100) NULL AFTER institution_name_bn,
  ADD COLUMN phone_bn VARCHAR(30) NULL AFTER phone,
  ADD COLUMN address_line_bn TEXT NULL AFTER address_line,
  ADD COLUMN district_bn VARCHAR(100) NULL AFTER address_line_bn,
  ADD COLUMN upazila_bn VARCHAR(100) NULL AFTER district_bn,
  ADD COLUMN post_office_bn VARCHAR(100) NULL AFTER upazila_bn;
