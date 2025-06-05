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

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  customer_uuid VARCHAR(36) NOT NULL,
  wallet_id VARCHAR(36) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('bus_ticket', 'flight_ticket', 'topup', 'transfer', 'crypto_payment')),
  amount NUMERIC(18, 6) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'success', 'failed')),
  provider VARCHAR(20) CHECK (provider IN ('annie', 'crypto', 'rta', 'flight_api')),
  reference_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);