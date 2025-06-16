CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT (UUID()),
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

CREATE TABLE IF NOT EXISTS merchants (
  merchant_id BIGINT PRIMARY KEY NOT NULL,
  name VARCHAR(100) NOT NULL,
  business_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT (UUID()),
  customer_uuid UUID NOT NULL,
  wallet_id VARCHAR(36) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('bus_ticket', 'flight_ticket', 'topup', 'transfer', 'crypto_payment')),
  amount NUMERIC(18, 6) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'success', 'failed')),
  provider VARCHAR(20) CHECK (provider IN ('annie', 'crypto', 'rta', 'flight_api')),
  reference_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS notification (
  notification_id UUID PRIMARY KEY,               -- UUID as primary key
  customer_uuid UUID NOT NULL,                    -- Regular UUID column (no FK constraint)
  title VARCHAR(255),                             -- Notification title
  message TEXT,                                   -- Notification content
  type VARCHAR(20),                               -- 'transaction', 'promo', etc.
  is_read BOOLEAN DEFAULT FALSE,                  -- Read/unread status
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Time of creation

  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS rta_ticket (
  ticket_id UUID PRIMARY KEY DEFAULT (UUID()),
  customer_uuid UUID NOT NULL,
  rta_route VARCHAR(255),
  start_location VARCHAR(255),
  end_location VARCHAR(255),
  ticket_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  transaction_id UUID NOT NULL,

  FOREIGN KEY (customer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
);

CREATE TABLE IF NOT EXISTS payment_method (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_uuid UUID,
  type VARCHAR(20) NOT NULL,
  label VARCHAR(255),
  details TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);


CREATE TABLE IF NOT EXISTS qr_codes (
  qr_id BIGINT PRIMARY KEY,
  customer_uuid UUID NOT NULL,
  merchant_id BIGINT NOT NULL,
  transaction_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL,
  amount NUMERIC(10, 2),
  currency_type VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
);

CREATE TABLE IF NOT EXISTS crypto_transaction (
  crypto_tx_id UUID PRIMARY KEY,
  customer_uuid UUID NOT NULL,
  transaction_id UUID NOT NULL,
  tx_hash VARCHAR(255),
  network VARCHAR(255),
  crypto_type VARCHAR(255),
  wallet_address VARCHAR(255),
  status VARCHAR(20),

  FOREIGN KEY (customer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  transaction_id UUID NOT NULL,
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
  customer_uuid VARCHAR(36),
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  related_transaction_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (related_transaction_id) REFERENCES transactions(transaction_id)
);

CREATE TABLE IF NOT EXISTS referrals (
  referral_id UUID PRIMARY KEY,
  referrer_uuid VARCHAR(36) NOT NULL,
  invite_code VARCHAR(255) NOT NULL,
  referred_uuid VARCHAR(36),
  bonus_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (referrer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (referred_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS login_history (
  login_id UUID PRIMARY KEY,
  customer_uuid VARCHAR(36) NOT NULL,
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
  customer_uuid VARCHAR(36),  -- Nullable, for personalized flags
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);
