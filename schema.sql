CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT (UUID()),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone_number TEXT,
  full_name TEXT,
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS rta_ticket (
  ticket_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  customeruu_id VARCHAR(36),
  rta_route VARCHAR(255),
  start_location VARCHAR(255),
  end_location VARCHAR(255),
  ticket_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  transaction_id VARCHAR(36),
  FOREIGN KEY (customeruu_id) REFERENCES users(uuid),
  FOREIGN KEY (transaction_id) REFERENCES transaction(transaction_id)
);
