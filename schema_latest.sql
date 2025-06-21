CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(255),
  full_name VARCHAR(255),
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet (
  wallet_id CHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36),
  type VARCHAR(10),
  currency VARCHAR(10) NOT NULL,
  balance DECIMAL(18, 6) DEFAULT 0.0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS merchants (
  merchant_id BIGINT PRIMARY KEY NOT NULL,
  name VARCHAR(100) NOT NULL,
  business_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS external_api_logs (
  log_id CHAR(36) PRIMARY KEY,
  provider VARCHAR(100),
  endpoint TEXT,
  request_body TEXT,
  response_body TEXT,
  status_code INT,
  customer_uuid CHAR(36),
  created_at TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS error_logs (
  error_id CHAR(36) PRIMARY KEY,
  module VARCHAR(100),
  error_message TEXT,
  stack_trace TEXT,
  customer_uuid CHAR(36),
  created_at TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS device_status (
  device_id CHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36),
  platform VARCHAR(50),
  app_version VARCHAR(50),
  os_version VARCHAR(50),
  last_active_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id CHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36) NOT NULL,
  wallet_id CHAR(36) NOT NULL,
  type VARCHAR(20),
  amount NUMERIC(18, 6) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(20),
  provider VARCHAR(20),
  reference_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (wallet_id) REFERENCES wallet(wallet_id)
);

CREATE TABLE IF NOT EXISTS notification (
  notification_id CHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(20),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS rta_ticket (
  ticket_id CHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36) NOT NULL,
  rta_route VARCHAR(255),
  start_location VARCHAR(255),
  end_location VARCHAR(255),
  ticket_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  transaction_id CHAR(36) NOT NULL,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
);

CREATE TABLE IF NOT EXISTS payment_method (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_uuid CHAR(36),
  type VARCHAR(20) NOT NULL,
  label VARCHAR(255),
  details TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS qr_codes (
  qr_id BIGINT PRIMARY KEY,
  customer_uuid CHAR(36) NOT NULL,
  merchant_id BIGINT NOT NULL,
  transaction_id CHAR(36) NOT NULL,
  status VARCHAR(50) NOT NULL,
  amount NUMERIC(10, 2),
  currency_type VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
);

CREATE TABLE IF NOT EXISTS crypto_transaction (
  crypto_tx_id CHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36) NOT NULL,
  transaction_id CHAR(36) NOT NULL,
  tx_hash VARCHAR(255),
  network VARCHAR(255),
  crypto_type VARCHAR(255),
  wallet_address VARCHAR(255),
  status VARCHAR(20),
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  transaction_id CHAR(36) NOT NULL,
  description TEXT,
  platform VARCHAR(20),
  ip_address VARCHAR(45),
  device_info TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(uuid),
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
);

CREATE TABLE IF NOT EXISTS support_ticket (
  ticket_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_uuid CHAR(36),
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  related_transaction_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (related_transaction_id) REFERENCES transactions(transaction_id)
);

CREATE TABLE IF NOT EXISTS referrals (
  referral_id CHAR(36) PRIMARY KEY,
  referrer_uuid CHAR(36) NOT NULL,
  invite_code VARCHAR(255) NOT NULL,
  referred_uuid CHAR(36),
  bonus_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (referred_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS login_history (
  login_id CHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36) NOT NULL,
  platform VARCHAR(20),
  ip_address VARCHAR(45),
  device_info TEXT,
  status VARCHAR(20),
  logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS feature_flags (
  feature_name VARCHAR(100) PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  customer_uuid CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS settings (
  customer_uuid CHAR(36) PRIMARY KEY,
  language VARCHAR(10),
  currency VARCHAR(10),
  notifications_enabled BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS kyc_verification (
  kyc_id CHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36),
  document_type VARCHAR(50),
  document_number VARCHAR(100),
  status VARCHAR(20),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP NULL,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  rate_id CHAR(36) PRIMARY KEY,
  base_currency VARCHAR(10),
  target_currency VARCHAR(10),
  rate NUMERIC(18,8),
  source VARCHAR(255),
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
  feedback_id CHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36),
  rating INT,
  comments TEXT,
  source VARCHAR(100),
  created_at TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS session_token (
  token_id VARCHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36),
  access_token TEXT NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_action_logs (
  log_id VARCHAR(36) PRIMARY KEY,
  module VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  performed_by CHAR(36) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (performed_by) REFERENCES users(uuid)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS offers (
  offer_id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(50),
  discount_value NUMERIC(10, 2) NOT NULL,
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_locations (
  location_id VARCHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36),
  label VARCHAR(255),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions_meta (
  meta_id VARCHAR(36) PRIMARY KEY,
  transaction_id CHAR(36) NOT NULL,
  meta_key VARCHAR(255) NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
