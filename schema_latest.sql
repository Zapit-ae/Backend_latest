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
  created_at TIMESTAMP
   DEFAULT CURRENT_TIMESTAMP,
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
  merchant_id CHAR(36) PRIMARY KEY ,
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
  reciever_id CHAR(36) NOT NULL,
  reciever_wallet_id CHAR(36) NOT NULL,
  type VARCHAR(20),
  amount NUMERIC(18, 6) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(20),
  provider VARCHAR(20),
  reference_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid),
  FOREIGN KEY (wallet_id) REFERENCES wallet(wallet_id),
  FOREIGN KEY (reciever_id) REFERENCES users(uuid),
  FOREIGN KEY (reciever_wallet_id) REFERENCES wallet(wallet_id)
);

CREATE TABLE IF NOT EXISTS notification (
  notification_id CHAR(36) PRIMARY KEY,
  notification_time TIMESTAMP,
  language VARCHAR(20),
  feature_name VARCHAR(100),
  notification_count INT,
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
  payment_type VARCHAR(20) NOT NULL,
  customer_uuid CHAR(36),
  type VARCHAR(20) NOT NULL,
  label VARCHAR(255),
  details TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_uuid) REFERENCES users(uuid)
);

CREATE TABLE IF NOT EXISTS qr_codes (
  qr_id CHAR(36) PRIMARY KEY,
  customer_uuid CHAR(36) NOT NULL,
  merchant_id CHAR(36) NOT NULL,
  transaction_id CHAR(36) NOT NULL,
  status VARCHAR(50) NOT NULL,
  amount NUMERIC(10, 2),
  currency_type VARCHAR(10),
  qr_type VARCHAR(20),
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
  feedback VARCHAR(255),
  ticket_type VARCHAR(20),
  module VARCHAR(255),
  time_take TIMESTAMP,
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
  referred_means VARCHAR(50),
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
  login_type VARCHAR(20),
  location VARCHAR(100),         
  login_count INT DEFAULT 1, 
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
  offer_type VARCHAR(50),
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


CREATE TABLE IF NOT EXISTS country_master (
    id INT PRIMARY KEY,
    iso_alpha2 VARCHAR(2),
    iso_alpha3 VARCHAR(3),
    country_name VARCHAR(100),
    phone_code VARCHAR(10),
    currency_code VARCHAR(10),
    currency_name VARCHAR(50),
    capital VARCHAR(100),
    region VARCHAR(50),
    subregion VARCHAR(50),
    flag_url TEXT
);

INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (1, 'AW', 'ABW', 'Aruba', '', '', '', '', '', '', 'https://flagcdn.com/aw.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (2, 'AF', 'AFG', 'Afghanistan', '', '', '', '', '', '', 'https://flagcdn.com/af.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (3, 'AO', 'AGO', 'Angola', '', '', '', '', '', '', 'https://flagcdn.com/ao.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (4, 'AI', 'AIA', 'Anguilla', '', '', '', '', '', '', 'https://flagcdn.com/ai.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (5, 'AX', 'ALA', 'Åland Islands', '', '', '', '', '', '', 'https://flagcdn.com/ax.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (6, 'AL', 'ALB', 'Albania', '', '', '', '', '', '', 'https://flagcdn.com/al.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (7, 'AD', 'AND', 'Andorra', '', '', '', '', '', '', 'https://flagcdn.com/ad.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (8, 'AE', 'ARE', 'United Arab Emirates', '', '', '', '', '', '', 'https://flagcdn.com/ae.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (9, 'AR', 'ARG', 'Argentina', '', '', '', '', '', '', 'https://flagcdn.com/ar.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (10, 'AM', 'ARM', 'Armenia', '', '', '', '', '', '', 'https://flagcdn.com/am.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (11, 'AS', 'ASM', 'American Samoa', '', '', '', '', '', '', 'https://flagcdn.com/as.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (12, 'AQ', 'ATA', 'Antarctica', '', '', '', '', '', '', 'https://flagcdn.com/aq.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (13, 'TF', 'ATF', 'French Southern Territories', '', '', '', '', '', '', 'https://flagcdn.com/tf.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (14, 'AG', 'ATG', 'Antigua and Barbuda', '', '', '', '', '', '', 'https://flagcdn.com/ag.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (15, 'AU', 'AUS', 'Australia', '', '', '', '', '', '', 'https://flagcdn.com/au.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (16, 'AT', 'AUT', 'Austria', '', '', '', '', '', '', 'https://flagcdn.com/at.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (17, 'AZ', 'AZE', 'Azerbaijan', '', '', '', '', '', '', 'https://flagcdn.com/az.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (18, 'BI', 'BDI', 'Burundi', '', '', '', '', '', '', 'https://flagcdn.com/bi.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (19, 'BE', 'BEL', 'Belgium', '', '', '', '', '', '', 'https://flagcdn.com/be.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (20, 'BJ', 'BEN', 'Benin', '', '', '', '', '', '', 'https://flagcdn.com/bj.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (21, 'BQ', 'BES', 'Bonaire, Sint Eustatius and Saba', '', '', '', '', '', '', 'https://flagcdn.com/bq.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (22, 'BF', 'BFA', 'Burkina Faso', '', '', '', '', '', '', 'https://flagcdn.com/bf.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (23, 'BD', 'BGD', 'Bangladesh', '', '', '', '', '', '', 'https://flagcdn.com/bd.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (24, 'BG', 'BGR', 'Bulgaria', '', '', '', '', '', '', 'https://flagcdn.com/bg.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (25, 'BH', 'BHR', 'Bahrain', '', '', '', '', '', '', 'https://flagcdn.com/bh.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (26, 'BS', 'BHS', 'Bahamas', '', '', '', '', '', '', 'https://flagcdn.com/bs.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (27, 'BA', 'BIH', 'Bosnia and Herzegovina', '', '', '', '', '', '', 'https://flagcdn.com/ba.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (28, 'BL', 'BLM', 'Saint Barthélemy', '', '', '', '', '', '', 'https://flagcdn.com/bl.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (29, 'BY', 'BLR', 'Belarus', '', '', '', '', '', '', 'https://flagcdn.com/by.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (30, 'BZ', 'BLZ', 'Belize', '', '', '', '', '', '', 'https://flagcdn.com/bz.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (31, 'BM', 'BMU', 'Bermuda', '', '', '', '', '', '', 'https://flagcdn.com/bm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (32, 'BO', 'BOL', 'Bolivia, Plurinational State of', '', '', '', '', '', '', 'https://flagcdn.com/bo.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (33, 'BR', 'BRA', 'Brazil', '', '', '', '', '', '', 'https://flagcdn.com/br.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (34, 'BB', 'BRB', 'Barbados', '', '', '', '', '', '', 'https://flagcdn.com/bb.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (35, 'BN', 'BRN', 'Brunei Darussalam', '', '', '', '', '', '', 'https://flagcdn.com/bn.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (36, 'BT', 'BTN', 'Bhutan', '', '', '', '', '', '', 'https://flagcdn.com/bt.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (37, 'BV', 'BVT', 'Bouvet Island', '', '', '', '', '', '', 'https://flagcdn.com/bv.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (38, 'BW', 'BWA', 'Botswana', '', '', '', '', '', '', 'https://flagcdn.com/bw.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (39, 'CF', 'CAF', 'Central African Republic', '', '', '', '', '', '', 'https://flagcdn.com/cf.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (40, 'CA', 'CAN', 'Canada', '', '', '', '', '', '', 'https://flagcdn.com/ca.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (41, 'CC', 'CCK', 'Cocos (Keeling) Islands', '', '', '', '', '', '', 'https://flagcdn.com/cc.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (42, 'CH', 'CHE', 'Switzerland', '', '', '', '', '', '', 'https://flagcdn.com/ch.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (43, 'CL', 'CHL', 'Chile', '', '', '', '', '', '', 'https://flagcdn.com/cl.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (44, 'CN', 'CHN', 'China', '', '', '', '', '', '', 'https://flagcdn.com/cn.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (45, 'CI', 'CIV', 'Côte d''Ivoire', '', '', '', '', '', '', 'https://flagcdn.com/ci.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (46, 'CM', 'CMR', 'Cameroon', '', '', '', '', '', '', 'https://flagcdn.com/cm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (47, 'CD', 'COD', 'Congo, The Democratic Republic of the', '', '', '', '', '', '', 'https://flagcdn.com/cd.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (48, 'CG', 'COG', 'Congo', '', '', '', '', '', '', 'https://flagcdn.com/cg.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (49, 'CK', 'COK', 'Cook Islands', '', '', '', '', '', '', 'https://flagcdn.com/ck.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (50, 'CO', 'COL', 'Colombia', '', '', '', '', '', '', 'https://flagcdn.com/co.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (51, 'KM', 'COM', 'Comoros', '', '', '', '', '', '', 'https://flagcdn.com/km.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (52, 'CV', 'CPV', 'Cabo Verde', '', '', '', '', '', '', 'https://flagcdn.com/cv.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (53, 'CR', 'CRI', 'Costa Rica', '', '', '', '', '', '', 'https://flagcdn.com/cr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (54, 'CU', 'CUB', 'Cuba', '', '', '', '', '', '', 'https://flagcdn.com/cu.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (55, 'CW', 'CUW', 'Curaçao', '', '', '', '', '', '', 'https://flagcdn.com/cw.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (56, 'CX', 'CXR', 'Christmas Island', '', '', '', '', '', '', 'https://flagcdn.com/cx.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (57, 'KY', 'CYM', 'Cayman Islands', '', '', '', '', '', '', 'https://flagcdn.com/ky.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (58, 'CY', 'CYP', 'Cyprus', '', '', '', '', '', '', 'https://flagcdn.com/cy.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (59, 'CZ', 'CZE', 'Czechia', '', '', '', '', '', '', 'https://flagcdn.com/cz.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (60, 'DE', 'DEU', 'Germany', '', '', '', '', '', '', 'https://flagcdn.com/de.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (61, 'DJ', 'DJI', 'Djibouti', '', '', '', '', '', '', 'https://flagcdn.com/dj.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (62, 'DM', 'DMA', 'Dominica', '', '', '', '', '', '', 'https://flagcdn.com/dm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (63, 'DK', 'DNK', 'Denmark', '', '', '', '', '', '', 'https://flagcdn.com/dk.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (64, 'DO', 'DOM', 'Dominican Republic', '', '', '', '', '', '', 'https://flagcdn.com/do.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (65, 'DZ', 'DZA', 'Algeria', '', '', '', '', '', '', 'https://flagcdn.com/dz.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (66, 'EC', 'ECU', 'Ecuador', '', '', '', '', '', '', 'https://flagcdn.com/ec.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (67, 'EG', 'EGY', 'Egypt', '', '', '', '', '', '', 'https://flagcdn.com/eg.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (68, 'ER', 'ERI', 'Eritrea', '', '', '', '', '', '', 'https://flagcdn.com/er.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (69, 'EH', 'ESH', 'Western Sahara', '', '', '', '', '', '', 'https://flagcdn.com/eh.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (70, 'ES', 'ESP', 'Spain', '', '', '', '', '', '', 'https://flagcdn.com/es.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (71, 'EE', 'EST', 'Estonia', '', '', '', '', '', '', 'https://flagcdn.com/ee.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (72, 'ET', 'ETH', 'Ethiopia', '', '', '', '', '', '', 'https://flagcdn.com/et.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (73, 'FI', 'FIN', 'Finland', '', '', '', '', '', '', 'https://flagcdn.com/fi.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (74, 'FJ', 'FJI', 'Fiji', '', '', '', '', '', '', 'https://flagcdn.com/fj.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (75, 'FK', 'FLK', 'Falkland Islands (Malvinas)', '', '', '', '', '', '', 'https://flagcdn.com/fk.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (76, 'FR', 'FRA', 'France', '', '', '', '', '', '', 'https://flagcdn.com/fr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (77, 'FO', 'FRO', 'Faroe Islands', '', '', '', '', '', '', 'https://flagcdn.com/fo.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (78, 'FM', 'FSM', 'Micronesia, Federated States of', '', '', '', '', '', '', 'https://flagcdn.com/fm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (79, 'GA', 'GAB', 'Gabon', '', '', '', '', '', '', 'https://flagcdn.com/ga.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (80, 'GB', 'GBR', 'United Kingdom', '', '', '', '', '', '', 'https://flagcdn.com/gb.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (81, 'GE', 'GEO', 'Georgia', '', '', '', '', '', '', 'https://flagcdn.com/ge.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (82, 'GG', 'GGY', 'Guernsey', '', '', '', '', '', '', 'https://flagcdn.com/gg.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (83, 'GH', 'GHA', 'Ghana', '', '', '', '', '', '', 'https://flagcdn.com/gh.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (84, 'GI', 'GIB', 'Gibraltar', '', '', '', '', '', '', 'https://flagcdn.com/gi.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (85, 'GN', 'GIN', 'Guinea', '', '', '', '', '', '', 'https://flagcdn.com/gn.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (86, 'GP', 'GLP', 'Guadeloupe', '', '', '', '', '', '', 'https://flagcdn.com/gp.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (87, 'GM', 'GMB', 'Gambia', '', '', '', '', '', '', 'https://flagcdn.com/gm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (88, 'GW', 'GNB', 'Guinea-Bissau', '', '', '', '', '', '', 'https://flagcdn.com/gw.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (89, 'GQ', 'GNQ', 'Equatorial Guinea', '', '', '', '', '', '', 'https://flagcdn.com/gq.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (90, 'GR', 'GRC', 'Greece', '', '', '', '', '', '', 'https://flagcdn.com/gr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (91, 'GD', 'GRD', 'Grenada', '', '', '', '', '', '', 'https://flagcdn.com/gd.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (92, 'GL', 'GRL', 'Greenland', '', '', '', '', '', '', 'https://flagcdn.com/gl.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (93, 'GT', 'GTM', 'Guatemala', '', '', '', '', '', '', 'https://flagcdn.com/gt.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (94, 'GF', 'GUF', 'French Guiana', '', '', '', '', '', '', 'https://flagcdn.com/gf.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (95, 'GU', 'GUM', 'Guam', '', '', '', '', '', '', 'https://flagcdn.com/gu.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (96, 'GY', 'GUY', 'Guyana', '', '', '', '', '', '', 'https://flagcdn.com/gy.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (97, 'HK', 'HKG', 'Hong Kong', '', '', '', '', '', '', 'https://flagcdn.com/hk.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (98, 'HM', 'HMD', 'Heard Island and McDonald Islands', '', '', '', '', '', '', 'https://flagcdn.com/hm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (99, 'HN', 'HND', 'Honduras', '', '', '', '', '', '', 'https://flagcdn.com/hn.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (100, 'HR', 'HRV', 'Croatia', '', '', '', '', '', '', 'https://flagcdn.com/hr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (101, 'HT', 'HTI', 'Haiti', '', '', '', '', '', '', 'https://flagcdn.com/ht.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (102, 'HU', 'HUN', 'Hungary', '', '', '', '', '', '', 'https://flagcdn.com/hu.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (103, 'ID', 'IDN', 'Indonesia', '', '', '', '', '', '', 'https://flagcdn.com/id.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (104, 'IM', 'IMN', 'Isle of Man', '', '', '', '', '', '', 'https://flagcdn.com/im.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (105, 'IN', 'IND', 'India', '', '', '', '', '', '', 'https://flagcdn.com/in.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (106, 'IO', 'IOT', 'British Indian Ocean Territory', '', '', '', '', '', '', 'https://flagcdn.com/io.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (107, 'IE', 'IRL', 'Ireland', '', '', '', '', '', '', 'https://flagcdn.com/ie.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (108, 'IR', 'IRN', 'Iran, Islamic Republic of', '', '', '', '', '', '', 'https://flagcdn.com/ir.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (109, 'IQ', 'IRQ', 'Iraq', '', '', '', '', '', '', 'https://flagcdn.com/iq.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (110, 'IS', 'ISL', 'Iceland', '', '', '', '', '', '', 'https://flagcdn.com/is.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (111, 'IL', 'ISR', 'Israel', '', '', '', '', '', '', 'https://flagcdn.com/il.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (112, 'IT', 'ITA', 'Italy', '', '', '', '', '', '', 'https://flagcdn.com/it.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (113, 'JM', 'JAM', 'Jamaica', '', '', '', '', '', '', 'https://flagcdn.com/jm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (114, 'JE', 'JEY', 'Jersey', '', '', '', '', '', '', 'https://flagcdn.com/je.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (115, 'JO', 'JOR', 'Jordan', '', '', '', '', '', '', 'https://flagcdn.com/jo.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (116, 'JP', 'JPN', 'Japan', '', '', '', '', '', '', 'https://flagcdn.com/jp.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (117, 'KZ', 'KAZ', 'Kazakhstan', '', '', '', '', '', '', 'https://flagcdn.com/kz.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (118, 'KE', 'KEN', 'Kenya', '', '', '', '', '', '', 'https://flagcdn.com/ke.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (119, 'KG', 'KGZ', 'Kyrgyzstan', '', '', '', '', '', '', 'https://flagcdn.com/kg.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (120, 'KH', 'KHM', 'Cambodia', '', '', '', '', '', '', 'https://flagcdn.com/kh.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (121, 'KI', 'KIR', 'Kiribati', '', '', '', '', '', '', 'https://flagcdn.com/ki.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (122, 'KN', 'KNA', 'Saint Kitts and Nevis', '', '', '', '', '', '', 'https://flagcdn.com/kn.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (123, 'KR', 'KOR', 'Korea, Republic of', '', '', '', '', '', '', 'https://flagcdn.com/kr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (124, 'KW', 'KWT', 'Kuwait', '', '', '', '', '', '', 'https://flagcdn.com/kw.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (125, 'LA', 'LAO', 'Lao People''s Democratic Republic', '', '', '', '', '', '', 'https://flagcdn.com/la.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (126, 'LB', 'LBN', 'Lebanon', '', '', '', '', '', '', 'https://flagcdn.com/lb.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (127, 'LR', 'LBR', 'Liberia', '', '', '', '', '', '', 'https://flagcdn.com/lr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (128, 'LY', 'LBY', 'Libya', '', '', '', '', '', '', 'https://flagcdn.com/ly.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (129, 'LC', 'LCA', 'Saint Lucia', '', '', '', '', '', '', 'https://flagcdn.com/lc.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (130, 'LI', 'LIE', 'Liechtenstein', '', '', '', '', '', '', 'https://flagcdn.com/li.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (131, 'LK', 'LKA', 'Sri Lanka', '', '', '', '', '', '', 'https://flagcdn.com/lk.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (132, 'LS', 'LSO', 'Lesotho', '', '', '', '', '', '', 'https://flagcdn.com/ls.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (133, 'LT', 'LTU', 'Lithuania', '', '', '', '', '', '', 'https://flagcdn.com/lt.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (134, 'LU', 'LUX', 'Luxembourg', '', '', '', '', '', '', 'https://flagcdn.com/lu.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (135, 'LV', 'LVA', 'Latvia', '', '', '', '', '', '', 'https://flagcdn.com/lv.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (136, 'MO', 'MAC', 'Macao', '', '', '', '', '', '', 'https://flagcdn.com/mo.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (137, 'MF', 'MAF', 'Saint Martin (French part)', '', '', '', '', '', '', 'https://flagcdn.com/mf.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (138, 'MA', 'MAR', 'Morocco', '', '', '', '', '', '', 'https://flagcdn.com/ma.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (139, 'MC', 'MCO', 'Monaco', '', '', '', '', '', '', 'https://flagcdn.com/mc.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (140, 'MD', 'MDA', 'Moldova, Republic of', '', '', '', '', '', '', 'https://flagcdn.com/md.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (141, 'MG', 'MDG', 'Madagascar', '', '', '', '', '', '', 'https://flagcdn.com/mg.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (142, 'MV', 'MDV', 'Maldives', '', '', '', '', '', '', 'https://flagcdn.com/mv.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (143, 'MX', 'MEX', 'Mexico', '', '', '', '', '', '', 'https://flagcdn.com/mx.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (144, 'MH', 'MHL', 'Marshall Islands', '', '', '', '', '', '', 'https://flagcdn.com/mh.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (145, 'MK', 'MKD', 'North Macedonia', '', '', '', '', '', '', 'https://flagcdn.com/mk.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (146, 'ML', 'MLI', 'Mali', '', '', '', '', '', '', 'https://flagcdn.com/ml.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (147, 'MT', 'MLT', 'Malta', '', '', '', '', '', '', 'https://flagcdn.com/mt.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (148, 'MM', 'MMR', 'Myanmar', '', '', '', '', '', '', 'https://flagcdn.com/mm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (149, 'ME', 'MNE', 'Montenegro', '', '', '', '', '', '', 'https://flagcdn.com/me.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (150, 'MN', 'MNG', 'Mongolia', '', '', '', '', '', '', 'https://flagcdn.com/mn.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (151, 'MP', 'MNP', 'Northern Mariana Islands', '', '', '', '', '', '', 'https://flagcdn.com/mp.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (152, 'MZ', 'MOZ', 'Mozambique', '', '', '', '', '', '', 'https://flagcdn.com/mz.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (153, 'MR', 'MRT', 'Mauritania', '', '', '', '', '', '', 'https://flagcdn.com/mr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (154, 'MS', 'MSR', 'Montserrat', '', '', '', '', '', '', 'https://flagcdn.com/ms.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (155, 'MQ', 'MTQ', 'Martinique', '', '', '', '', '', '', 'https://flagcdn.com/mq.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (156, 'MU', 'MUS', 'Mauritius', '', '', '', '', '', '', 'https://flagcdn.com/mu.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (157, 'MW', 'MWI', 'Malawi', '', '', '', '', '', '', 'https://flagcdn.com/mw.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (158, 'MY', 'MYS', 'Malaysia', '', '', '', '', '', '', 'https://flagcdn.com/my.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (159, 'YT', 'MYT', 'Mayotte', '', '', '', '', '', '', 'https://flagcdn.com/yt.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (160, 'NA', 'NAM', 'Namibia', '', '', '', '', '', '', 'https://flagcdn.com/na.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (161, 'NC', 'NCL', 'New Caledonia', '', '', '', '', '', '', 'https://flagcdn.com/nc.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (162, 'NE', 'NER', 'Niger', '', '', '', '', '', '', 'https://flagcdn.com/ne.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (163, 'NF', 'NFK', 'Norfolk Island', '', '', '', '', '', '', 'https://flagcdn.com/nf.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (164, 'NG', 'NGA', 'Nigeria', '', '', '', '', '', '', 'https://flagcdn.com/ng.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (165, 'NI', 'NIC', 'Nicaragua', '', '', '', '', '', '', 'https://flagcdn.com/ni.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (166, 'NU', 'NIU', 'Niue', '', '', '', '', '', '', 'https://flagcdn.com/nu.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (167, 'NL', 'NLD', 'Netherlands', '', '', '', '', '', '', 'https://flagcdn.com/nl.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (168, 'NO', 'NOR', 'Norway', '', '', '', '', '', '', 'https://flagcdn.com/no.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (169, 'NP', 'NPL', 'Nepal', '', '', '', '', '', '', 'https://flagcdn.com/np.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (170, 'NR', 'NRU', 'Nauru', '', '', '', '', '', '', 'https://flagcdn.com/nr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (171, 'NZ', 'NZL', 'New Zealand', '', '', '', '', '', '', 'https://flagcdn.com/nz.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (172, 'OM', 'OMN', 'Oman', '', '', '', '', '', '', 'https://flagcdn.com/om.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (173, 'PK', 'PAK', 'Pakistan', '', '', '', '', '', '', 'https://flagcdn.com/pk.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (174, 'PA', 'PAN', 'Panama', '', '', '', '', '', '', 'https://flagcdn.com/pa.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (175, 'PN', 'PCN', 'Pitcairn', '', '', '', '', '', '', 'https://flagcdn.com/pn.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (176, 'PE', 'PER', 'Peru', '', '', '', '', '', '', 'https://flagcdn.com/pe.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (177, 'PH', 'PHL', 'Philippines', '', '', '', '', '', '', 'https://flagcdn.com/ph.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (178, 'PW', 'PLW', 'Palau', '', '', '', '', '', '', 'https://flagcdn.com/pw.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (179, 'PG', 'PNG', 'Papua New Guinea', '', '', '', '', '', '', 'https://flagcdn.com/pg.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (180, 'PL', 'POL', 'Poland', '', '', '', '', '', '', 'https://flagcdn.com/pl.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (181, 'PR', 'PRI', 'Puerto Rico', '', '', '', '', '', '', 'https://flagcdn.com/pr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (182, 'KP', 'PRK', 'Korea, Democratic People''s Republic of', '', '', '', '', '', '', 'https://flagcdn.com/kp.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (183, 'PT', 'PRT', 'Portugal', '', '', '', '', '', '', 'https://flagcdn.com/pt.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (184, 'PY', 'PRY', 'Paraguay', '', '', '', '', '', '', 'https://flagcdn.com/py.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (185, 'PS', 'PSE', 'Palestine, State of', '', '', '', '', '', '', 'https://flagcdn.com/ps.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (186, 'PF', 'PYF', 'French Polynesia', '', '', '', '', '', '', 'https://flagcdn.com/pf.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (187, 'QA', 'QAT', 'Qatar', '', '', '', '', '', '', 'https://flagcdn.com/qa.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (188, 'RE', 'REU', 'Réunion', '', '', '', '', '', '', 'https://flagcdn.com/re.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (189, 'RO', 'ROU', 'Romania', '', '', '', '', '', '', 'https://flagcdn.com/ro.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (190, 'RU', 'RUS', 'Russian Federation', '', '', '', '', '', '', 'https://flagcdn.com/ru.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (191, 'RW', 'RWA', 'Rwanda', '', '', '', '', '', '', 'https://flagcdn.com/rw.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (192, 'SA', 'SAU', 'Saudi Arabia', '', '', '', '', '', '', 'https://flagcdn.com/sa.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (193, 'SD', 'SDN', 'Sudan', '', '', '', '', '', '', 'https://flagcdn.com/sd.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (194, 'SN', 'SEN', 'Senegal', '', '', '', '', '', '', 'https://flagcdn.com/sn.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (195, 'SG', 'SGP', 'Singapore', '', '', '', '', '', '', 'https://flagcdn.com/sg.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (196, 'GS', 'SGS', 'South Georgia and the South Sandwich Islands', '', '', '', '', '', '', 'https://flagcdn.com/gs.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (197, 'SH', 'SHN', 'Saint Helena, Ascension and Tristan da Cunha', '', '', '', '', '', '', 'https://flagcdn.com/sh.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (198, 'SJ', 'SJM', 'Svalbard and Jan Mayen', '', '', '', '', '', '', 'https://flagcdn.com/sj.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (199, 'SB', 'SLB', 'Solomon Islands', '', '', '', '', '', '', 'https://flagcdn.com/sb.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (200, 'SL', 'SLE', 'Sierra Leone', '', '', '', '', '', '', 'https://flagcdn.com/sl.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (201, 'SV', 'SLV', 'El Salvador', '', '', '', '', '', '', 'https://flagcdn.com/sv.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (202, 'SM', 'SMR', 'San Marino', '', '', '', '', '', '', 'https://flagcdn.com/sm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (203, 'SO', 'SOM', 'Somalia', '', '', '', '', '', '', 'https://flagcdn.com/so.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (204, 'PM', 'SPM', 'Saint Pierre and Miquelon', '', '', '', '', '', '', 'https://flagcdn.com/pm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (205, 'RS', 'SRB', 'Serbia', '', '', '', '', '', '', 'https://flagcdn.com/rs.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (206, 'SS', 'SSD', 'South Sudan', '', '', '', '', '', '', 'https://flagcdn.com/ss.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (207, 'ST', 'STP', 'Sao Tome and Principe', '', '', '', '', '', '', 'https://flagcdn.com/st.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (208, 'SR', 'SUR', 'Suriname', '', '', '', '', '', '', 'https://flagcdn.com/sr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (209, 'SK', 'SVK', 'Slovakia', '', '', '', '', '', '', 'https://flagcdn.com/sk.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (210, 'SI', 'SVN', 'Slovenia', '', '', '', '', '', '', 'https://flagcdn.com/si.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (211, 'SE', 'SWE', 'Sweden', '', '', '', '', '', '', 'https://flagcdn.com/se.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (212, 'SZ', 'SWZ', 'Eswatini', '', '', '', '', '', '', 'https://flagcdn.com/sz.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (213, 'SX', 'SXM', 'Sint Maarten (Dutch part)', '', '', '', '', '', '', 'https://flagcdn.com/sx.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (214, 'SC', 'SYC', 'Seychelles', '', '', '', '', '', '', 'https://flagcdn.com/sc.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (215, 'SY', 'SYR', 'Syrian Arab Republic', '', '', '', '', '', '', 'https://flagcdn.com/sy.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (216, 'TC', 'TCA', 'Turks and Caicos Islands', '', '', '', '', '', '', 'https://flagcdn.com/tc.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (217, 'TD', 'TCD', 'Chad', '', '', '', '', '', '', 'https://flagcdn.com/td.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (218, 'TG', 'TGO', 'Togo', '', '', '', '', '', '', 'https://flagcdn.com/tg.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (219, 'TH', 'THA', 'Thailand', '', '', '', '', '', '', 'https://flagcdn.com/th.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (220, 'TJ', 'TJK', 'Tajikistan', '', '', '', '', '', '', 'https://flagcdn.com/tj.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (221, 'TK', 'TKL', 'Tokelau', '', '', '', '', '', '', 'https://flagcdn.com/tk.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (222, 'TM', 'TKM', 'Turkmenistan', '', '', '', '', '', '', 'https://flagcdn.com/tm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (223, 'TL', 'TLS', 'Timor-Leste', '', '', '', '', '', '', 'https://flagcdn.com/tl.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (224, 'TO', 'TON', 'Tonga', '', '', '', '', '', '', 'https://flagcdn.com/to.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (225, 'TT', 'TTO', 'Trinidad and Tobago', '', '', '', '', '', '', 'https://flagcdn.com/tt.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (226, 'TN', 'TUN', 'Tunisia', '', '', '', '', '', '', 'https://flagcdn.com/tn.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (227, 'TR', 'TUR', 'Turkey', '', '', '', '', '', '', 'https://flagcdn.com/tr.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (228, 'TV', 'TUV', 'Tuvalu', '', '', '', '', '', '', 'https://flagcdn.com/tv.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (229, 'TW', 'TWN', 'Taiwan, Province of China', '', '', '', '', '', '', 'https://flagcdn.com/tw.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (230, 'TZ', 'TZA', 'Tanzania, United Republic of', '', '', '', '', '', '', 'https://flagcdn.com/tz.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (231, 'UG', 'UGA', 'Uganda', '', '', '', '', '', '', 'https://flagcdn.com/ug.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (232, 'UA', 'UKR', 'Ukraine', '', '', '', '', '', '', 'https://flagcdn.com/ua.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (233, 'UM', 'UMI', 'United States Minor Outlying Islands', '', '', '', '', '', '', 'https://flagcdn.com/um.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (234, 'UY', 'URY', 'Uruguay', '', '', '', '', '', '', 'https://flagcdn.com/uy.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (235, 'US', 'USA', 'United States', '', '', '', '', '', '', 'https://flagcdn.com/us.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (236, 'UZ', 'UZB', 'Uzbekistan', '', '', '', '', '', '', 'https://flagcdn.com/uz.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (237, 'VA', 'VAT', 'Holy See (Vatican City State)', '', '', '', '', '', '', 'https://flagcdn.com/va.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (238, 'VC', 'VCT', 'Saint Vincent and the Grenadines', '', '', '', '', '', '', 'https://flagcdn.com/vc.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (239, 'VE', 'VEN', 'Venezuela, Bolivarian Republic of', '', '', '', '', '', '', 'https://flagcdn.com/ve.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (240, 'VG', 'VGB', 'Virgin Islands, British', '', '', '', '', '', '', 'https://flagcdn.com/vg.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (241, 'VI', 'VIR', 'Virgin Islands, U.S.', '', '', '', '', '', '', 'https://flagcdn.com/vi.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (242, 'VN', 'VNM', 'Viet Nam', '', '', '', '', '', '', 'https://flagcdn.com/vn.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (243, 'VU', 'VUT', 'Vanuatu', '', '', '', '', '', '', 'https://flagcdn.com/vu.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (244, 'WF', 'WLF', 'Wallis and Futuna', '', '', '', '', '', '', 'https://flagcdn.com/wf.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (245, 'WS', 'WSM', 'Samoa', '', '', '', '', '', '', 'https://flagcdn.com/ws.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (246, 'YE', 'YEM', 'Yemen', '', '', '', '', '', '', 'https://flagcdn.com/ye.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (247, 'ZA', 'ZAF', 'South Africa', '', '', '', '', '', '', 'https://flagcdn.com/za.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (248, 'ZM', 'ZMB', 'Zambia', '', '', '', '', '', '', 'https://flagcdn.com/zm.svg');
INSERT INTO country_master (id, iso_alpha2, iso_alpha3, country_name, phone_code, currency_code, currency_name, capital, region, subregion, flag_url) VALUES (249, 'ZW', 'ZWE', 'Zimbabwe', '', '', '', '', '', '', 'https://flagcdn.com/zw.svg');

CREATE TABLE terminals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  merchant_id INT,
  terminal_type VARCHAR(50),
  qr_code VARCHAR(255),
  device_id VARCHAR(100),
  last_sync DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50),
  actor VARCHAR(100),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  payload TEXT
);

CREATE TABLE aml_flags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT,
  reason_code VARCHAR(100),
  severity VARCHAR(50),
  reported_to VARCHAR(100)
);

