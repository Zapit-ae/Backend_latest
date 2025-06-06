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
CREATE TABLE IF NOT EXISTS notification (
  notification_id CHAR(36) PRIMARY KEY,           -- UUID as primary key
  customer_uuid CHAR(36),                         -- Regular UUID column (no FK constraint)
  title VARCHAR(255),                             -- Notification title
  message TEXT,                                   -- Notification content
  type VARCHAR(20),                               -- 'transaction', 'promo', etc.
  is_read BOOLEAN DEFAULT FALSE,                  -- Read/unread status
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Time of creation
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

CREATE TABLE IF NOT EXISTS payment_method (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_uuid VARCHAR(36),
  type VARCHAR(20) NOT NULL,
  label VARCHAR(255),
  details TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

<<<<<<< HEAD
 CREATE TABLE IF NOT EXISTS merchants (
    merchant_id BIGINT PRIMARY KEY NOT NULL,
    name VARCHAR(100) NOT NULL,
    business_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

 CREATE TABLE IF NOT EXISTS qr_codes (
    qr_id BIGINT PRIMARY KEY,
    customer_uuid VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    merchant_id BIGINT NOT NULL,
    amount NUMERIC(10, 2),
    transaction_id BIGINT,
    currency_type VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_uuid) REFERENCES customers(customer_uuid),
    FOREIGN KEY (merchant_id) REFERENCES merchants(merchant_id),
    FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
     );
=======
CREATE TABLE IF NOT EXISTS crypto_transaction (
  crypto_tx_id UUID PRIMARY KEY,
  customer_uuid UUID,
  transaction_id UUID,
  tx_hash VARCHAR(255),
  network VARCHAR(255),
  crypto_type VARCHAR(255),
  wallet_address VARCHAR(255),
  status VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  transaction_id UUID,
  description TEXT,
  platform VARCHAR(20),
  ip_address VARCHAR(45),
  device_info TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 
>>>>>>> 9b65ed0e238844d6bd5a5efecc13616c9d390538
