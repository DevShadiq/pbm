-- Stores Bengali display codes for public and administrative class views.
ALTER TABLE class_levels
  ADD COLUMN class_code_bn VARCHAR(30) NULL AFTER class_code;
