CREATE TABLE IF NOT EXISTS employee_addresses (
  address_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  address_type VARCHAR(30) NOT NULL,
  address_line TEXT,
  district VARCHAR(120),
  division VARCHAR(120),
  postal_code VARCHAR(20),
  country VARCHAR(80) DEFAULT 'Bangladesh',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uk_employee_addresses UNIQUE (employee_id, address_type),
  CONSTRAINT fk_employee_addresses_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
);
