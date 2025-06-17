import express from 'express';
import crypto from 'crypto';
import db from './db.js';

db.runSchema();

const app = express();

const connection = db.createConnection();

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database');
  }
});

app.use(express.json());

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const hash = crypto.createHash('md5');
  hash.update(password);
  const hashedPassword = hash.digest('hex');

  connection.query('SELECT uuid FROM users WHERE password=? AND email=?', [hashedPassword, email], (error, results, fields) => {
    if (error) {
      console.error('Error querying database:', error);
      return res.status(500).send({
        status: 500,
        message: "Internal Server Error. Please try again later.",
      });
    }

    if (results.length !== 1) {
      return res.status(404).send({
        status: 404,
        message: "No user with matching email and password found.",
      });
    }

    return res.status(200).send({
      status: 200,
      message: "Login successful",
      uuid: results[0].uuid,
    });
  });
});

// CREATE a new transaction
app.post('/api/transactions', (req, res) => {
  const {
    customer_uuid,
    wallet_id,
    type,
    amount,
    currency,
    status,
    provider,
    reference_id,
  } = req.body;

  connection.query(
    `INSERT INTO transactions
      (customer_uuid, wallet_id, type, amount, currency, status, provider, reference_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING transaction_id`,
    [customer_uuid, wallet_id, type, amount, currency, status, provider, reference_id],
    (error, results) => {
      if (error) {
        return res.status(500).send({ message: 'Internal Server Error' });
      }
      return res.status(201).send({ message: 'Transaction created', transactionId: results[0].transaction_id });
    }
  );
});

// READ all transactions
app.get('/api/transactions', (req, res) => {
  connection.query('SELECT * FROM transactions', (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Internal Server Error' });
    }
    return res.status(200).json(results);
  });
});

// READ a single transaction
app.get('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  connection.query(
    'SELECT * FROM transactions WHERE transaction_id = ?',
    [id],
    (error, results) => {
      if (error) {
        return res.status(500).send({ message: 'Internal Server Error' });
      }
      if (results.length === 0) {
        return res.status(404).send({ message: 'Transaction not found' });
      }
      return res.status(200).json(results[0]);
    }
  );
});

// PATCH (partially update) a transaction
app.patch('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const {
    customer_uuid,
    wallet_id,
    type,
    amount,
    currency,
    status,
    provider,
    reference_id
  } = req.body;

  const fields = [];
  const values = [];

  if (customer_uuid !== undefined) {
    fields.push('customer_uuid = ?');
    values.push(customer_uuid);
  }
  if (wallet_id !== undefined) {
    fields.push('wallet_id = ?');
    values.push(wallet_id);
  }
  if (type !== undefined) {
    fields.push('type = ?');
    values.push(type);
  }
  if (amount !== undefined) {
    fields.push('amount = ?');
    values.push(amount);
  }
  if (currency !== undefined) {
    fields.push('currency = ?');
    values.push(currency);
  }
  if (status !== undefined) {
    fields.push('status = ?');
    values.push(status);
  }
  if (provider !== undefined) {
    fields.push('provider = ?');
    values.push(provider);
  }
  if (reference_id !== undefined) {
    fields.push('reference_id = ?');
    values.push(reference_id);
  }

  // Return an error if no fields are provided
  if (!fields.length) {
    return res.status(400).send({ message: 'No fields provided for update' });
  }

  const sql = `UPDATE transactions SET ${fields.join(', ')} WHERE transaction_id = ?`;
  values.push(id);

  connection.query(sql, values, (error, results) => {
    if (error) {
      return res.status(500).send({ message: 'Internal Server Error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).send({ message: 'Transaction not found' });
    }
    return res.status(200).send({ message: 'Transaction updated' });
  });
});

// DELETE a transaction
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  connection.query(
    'DELETE FROM transactions WHERE transaction_id = ?',
    [id],
    (error, results) => {
      if (error) {
        return res.status(500).send({ message: 'Internal Server Error' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).send({ message: 'Transaction not found' });
      }
      return res.status(200).send({ message: 'Transaction deleted' });
    }
  );
});


// PAYMENT METHOD
// CREATE a payment method
app.post('/api/payment-method', (req, res) => {
  const { customer_uuid, type, label, details, is_active } = req.body;

  connection.query(
    'INSERT INTO payment_method (customer_uuid, type, label, details, is_active) VALUES (?, ?, ?, ?, ?)',
    [customer_uuid, type, label, JSON.stringify(details), is_active ?? true],
    (err, result) => {
      if (err) {
        console.error('Error inserting payment method:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error ❌' });
      }
      res.status(201).json({
        status: 201,
        message: 'Payment method created ✅',
        data: { payment_id: result.insertId }
      });
    }
  );
});

// READ all payment methods
app.get('/api/payment-method', (req, res) => {
  connection.query('SELECT * FROM payment_method', (err, results) => {
    if (err) {
      console.error('Error fetching payment methods:', err);
      return res.status(500).json({ status: 500, message: 'Internal server error ❌' });
    }
    res.status(200).json({
      status: 200,
      message: 'Success ✅',
      data: results
    });
  });
});

// READ one payment method by ID
app.get('/api/payment-method/:id', (req, res) => {
  const { id } = req.params;

  connection.query('SELECT * FROM payment_method WHERE payment_id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching payment method:', err);
      return res.status(500).json({ status: 500, message: 'Internal server error ❌' });
    }
    if (results.length === 0) {
      return res.status(404).json({ status: 404, message: 'Payment method not found ❌' });
    }
    res.status(200).json({
      status: 200,
      message: 'Success ✅',
      data: results[0]
    });
  });
});

// UPDATE a payment method
app.put('/api/payment-method/:id', (req, res) => {
  const { id } = req.params;
  const { type, label, details, is_active } = req.body;

  connection.query(
    'UPDATE payment_method SET type = ?, label = ?, details = ?, is_active = ? WHERE payment_id = ?',
    [type, label, JSON.stringify(details), is_active, id],
    (err, result) => {
      if (err) {
        console.error('Error updating payment method:', err);
        return res.status(500).json({ status: 500, message: 'Internal server error ❌' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 404, message: 'Payment method not found ❌' });
      }
      res.status(200).json({
        status: 200,
        message: 'Payment method updated ✅'
      });
    }
  );
});

// DELETE a payment method
app.delete('/api/payment-method/:id', (req, res) => {
  const { id } = req.params;

  connection.query('DELETE FROM payment_method WHERE payment_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting payment method:', err);
      return res.status(500).json({ status: 500, message: 'Internal server error ❌' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 404, message: 'Payment method not found ❌' });
    }
    res.status(200).json({
      status: 200,
      message: 'Payment method deleted ✅'
    });
  });
});


// CREATE a QR code
app.post('/api/qrcodes', (req, res) => {
  const { qr_id, customer_uuid, status, merchant_id, amount, transaction_id, currency_type } = req.body;
  connection.query(
    'INSERT INTO qr_codes (qr_id, customer_uuid, status, merchant_id, amount, transaction_id, currency_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [qr_id, customer_uuid, status, merchant_id, amount, transaction_id, currency_type],
    (err, result) => {
      if (err) {
        console.error('Error inserting QR code:', err);
        return res.status(500).json({ status: '500', message: 'Internal server error' });
      }
      res.status(201).json({
        status: '201',
        qr_id: qr_id,
        message: 'QR code created'
      });
    }
  );
});

// READ all QR codes
app.get('/api/qrcodes', (req, res) => {
  connection.query('SELECT * FROM qr_codes', (err, results) => {
    if (err) {
      console.error('Error fetching QR codes:', err);
      return res.status(500).json({ status: '500', message: 'Internal server error' });
    }
    res.status(200).json({ status: '200', results });
  });
});

// READ one QR code by ID
app.get('/api/qrcodes/:id', (req, res) => {
  const { id } = req.params;
  connection.query('SELECT * FROM qr_codes WHERE qr_id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching QR code:', err);
      return res.status(500).json({ status: '500', message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ status: '404', message: 'QR code not found' });
    }
    res.status(200).json({ status: '200', qr_code: results[0] });
  });
});

// UPDATE a QR code
app.put('/api/qrcodes/:id', (req, res) => {
  const { id } = req.params;
  const { customer_uuid, status, merchant_id, amount, transaction_id, currency_type } = req.body;

  connection.query(
    'UPDATE qr_codes SET customer_uuid = ?, status = ?, merchant_id = ?, amount = ?, transaction_id = ?, currency_type = ? WHERE qr_id = ?',
    [customer_uuid, status, merchant_id, amount, transaction_id, currency_type, id],
    (err, result) => {
      if (err) {
        console.error('Error updating QR code:', err);
        return res.status(500).json({ status: '500', message: 'Internal server error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: '404', message: 'QR code not found' });
      }
      res.status(200).json({ status: '200', message: 'QR code updated' });
    }
  );
});

// DELETE a QR code
app.delete('/api/qrcodes/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM qr_codes WHERE qr_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting QR code:', err);
      return res.status(500).json({ status: '500', message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: '404', message: 'QR code not found' });
    }
    res.status(200).json({ status: '200', message: 'QR code deleted' });
  });
});

const port = 8080;
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Create a new crypto transaction
app.post('/crypto-transactions', (req, res) => {
  const data = req.body;
  data.crypto_tx_id = uuidv4(); // 👈 generate and assign a unique UUID
  const sql = `INSERT INTO crypto_transaction SET ?`;
  connection.query(sql, data, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).send({ message: "it is added, code 200", id: data.crypto_tx_id, ...data });
  });
});

// Get all transactions
app.get('/crypto-transactions', (req, res) => {
  connection.query('SELECT * FROM crypto_transaction', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send({ results, message: "code 200" });
  });
});

// Update a transaction
app.put('/crypto-transactions/:id', (req, res) => {
  connection.query('UPDATE crypto_transaction SET ? WHERE crypto_tx_id = ?', [req.body, req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Transaction updated successfully, code 200' });
  });
});

// Delete a transaction
app.delete('/crypto-transactions/:id', (req, res) => {
  connection.query('DELETE FROM crypto_transaction WHERE crypto_tx_id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Transaction deleted successfully, code 200' });
  });
});



//activity_log
// Create activity log 
app.post('/activity_log', (req, res) => {
  const log = req.body;
  log.id = uuidv4();
  const sql = 'INSERT INTO activity_log SET ?';
  connection.query(sql, log, (err, result) => {
    if (err) return res.status(500).send({
      status: 500,
      message: "Internal Server Error. Please try again later.",
    });
    res.send({
      Status: 200,
      message: 'Activity log added , code 200', id: log.id
    });
  });
});

//Read (Get All Logs)
app.get('/activity_log', (req, res) => {
  connection.query('SELECT * FROM activity_log', (err, results) => {
    if (err) return res.status(500).send(err.message);
    res.send(results);
  });
});

//Read (Get One Log by ID)
app.get('/activity_log/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM activity_log WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).send(err.message);
    if (result.length === 0) return res.status(404).send('Log not found');
    res.send(result[0]);
  });
});

// Update activity log
app.put('/activity_log/:id', (req, res) => {
  const id = req.params.id;
  const updatedLog = req.body;
  connection.query('UPDATE activity_log SET ? WHERE id = ?', [updatedLog, id], (err, result) => {
    if (err) return res.status(500).send(err.message);
    res.send('Log updated');
  });
});

//Delete activity log
app.delete('/activity_log/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM activity_log WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).send(err.message);
    res.send('Log deleted');
  });
});


// Create a new notification
app.post('/notifications', (req, res) => {
  const data = req.body;
  data.notification_id = uuidv4(); // 👈 generate UUID
  data.created_at = new Date();    // 👈 current timestamp

  const sql = `INSERT INTO notification SET ?`;
  connection.query(sql, data, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).send({ message: "Notification added, code 200", id: data.notification_id, ...data });
  });
});

// Get all notifications
app.get('/notifications', (req, res) => {
  connection.query('SELECT * FROM notification', (err, results) => {
    if (err) return res.status(500).send(err);
    res.send({ results, message: "code 200" });
  });
});

// Update a notification
app.put('/notifications/:id', (req, res) => {
  connection.query('UPDATE notification SET ? WHERE notification_id = ?', [req.body, req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Notification updated successfully, code 200' });
  });
});

// Delete a notification
app.delete('/notifications/:id', (req, res) => {
  connection.query('DELETE FROM notification WHERE notification_id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Notification deleted successfully, code 200' });
  });
});


// Create an RTA ticket
app.post('/api/rta-ticket', (req, res) => {
  const {
    customer_uuid,
    rta_route,
    start_location,
    end_location,
    ticket_time,
    transaction_id
  } = req.body;

  const ticket_id = crypto.randomUUID();

  const formattedTicketTime = ticket_time
    ? ticket_time.replace('T', ' ').replace('Z', '')
    : null;

  connection.query(
    `INSERT INTO rta_ticket 
      (ticket_id, customer_uuid, rta_route, start_location, end_location, ticket_time, transaction_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ticket_id, customer_uuid, rta_route, start_location, end_location, formattedTicketTime, transaction_id],
    (err, result) => {
      if (err) {
        console.error('Error creating ticket:', err);
        return res.status(500).json({ error: 420, message: 'Internal server error' });
      }
      res.status(201).json({ success: 200, message: 'RTA ticket created', ticket_id });
    }
  );
});

// Read all RTA tickets
app.get('/api/rta-ticket', (req, res) => {
  connection.query('SELECT * FROM rta_ticket', (err, results) => {
    if (err) {
      console.error('Error fetching RTA tickets:', err);
      return res.status(500).json({ error: 420, message: 'Internal server error' });
    }
    res.status(200).json({ success: 200, message: 'RTA tickets fetched', data: results });
  });
});

// Read one RTA ticket by ID
app.get('/api/rta-ticket/:id', (req, res) => {
  const { id } = req.params;
  connection.query('SELECT * FROM rta_ticket WHERE ticket_id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching RTA ticket:', err);
      return res.status(500).json({ error: 420, message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 420, message: 'RTA ticket not found' });
    }
    res.status(200).json({ success: 200, message: 'RTA ticket fetched', data: results[0] });
  });
});

// Update an RTA ticket by ID
app.put('/api/rta-ticket/:ticket_id', (req, res) => {
  const ticketId = req.params.ticket_id;
  const { rta_route, start_location, end_location, ticket_time } = req.body;

  let formattedTicketTime = null;
  if (ticket_time) {
    const dateObj = new Date(ticket_time);
    if (isNaN(dateObj)) {
      return res.status(400).json({ error: 420, message: "Invalid date format for ticket_time" });
    }
    formattedTicketTime = dateObj.toISOString().slice(0, 19).replace('T', ' ');
  }

  const sql = `
    UPDATE rta_ticket
    SET rta_route = ?, start_location = ?, end_location = ?, ticket_time = ?
    WHERE ticket_id = ?
  `;

  connection.query(sql, [rta_route, start_location, end_location, formattedTicketTime, ticketId], (err, result) => {
    if (err) {
      console.error("Error updating RTA ticket:", err);
      return res.status(500).json({ error: 420, message: "Database error while updating ticket" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 420, message: "Ticket not found" });
    }
    res.json({ success: 200, message: "Ticket updated successfully" });
  });
});

// Delete an RTA ticket by ID
app.delete('/api/rta-ticket/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM rta_ticket WHERE ticket_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting RTA ticket:', err);
      return res.status(500).json({ error: 420, message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 420, message: 'RTA ticket not found' });
    }
    res.status(200).json({ success: 200, message: 'RTA ticket deleted successfully' });
  });
});


// SUPPORT TICKET
// CREATE Support Ticket
app.post('/api/support-ticket', (req, res) => {
  const { customer_uuid, subject, description, status, related_transaction_id } = req.body;
  const query = `
    INSERT INTO support_ticket 
    (customer_uuid, subject, description, status, related_transaction_id) 
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [customer_uuid, subject, description, status || 'open', related_transaction_id || null],
    (err, result) => {
      if (err) return res.status(500).json({ status: 500, message: err.message });
      res.status(200).json({
        status: 200,
        message: 'Support ticket created ✅',
        data: { ticket_id: result.insertId }
      });
    }
  );
});

// GET All Support Tickets
app.get('/api/support-ticket', (req, res) => {
  connection.query('SELECT * FROM support_ticket', (err, results) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    res.status(200).json({
      status: 200,
      message: 'Success ✅',
      data: results
    });
  });
});

// GET Support Ticket by ID
app.get('/api/support-ticket/:id', (req, res) => {
  connection.query('SELECT * FROM support_ticket WHERE ticket_id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (results.length === 0) {
      return res.status(404).json({ status: 404, message: 'Ticket not found ❌' });
    }
    res.status(200).json({
      status: 200,
      message: 'Success ✅',
      data: results[0]
    });
  });
});

// UPDATE Support Ticket
app.put('/api/support-ticket/:id', (req, res) => {
  const { subject, description, status, related_transaction_id } = req.body;

  const query = `
    UPDATE support_ticket 
    SET subject = ?, description = ?, status = ?, related_transaction_id = ? 
    WHERE ticket_id = ?
  `;

  connection.query(
    query,
    [subject, description, status, related_transaction_id, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ status: 500, message: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 404, message: 'Ticket not found ❌' });
      }
      res.status(200).json({
        status: 200,
        message: 'Support ticket updated ✅'
      });
    }
  );
});

// DELETE Support Ticket
app.delete('/api/support-ticket/:id', (req, res) => {
  connection.query('DELETE FROM support_ticket WHERE ticket_id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 404, message: 'Ticket not found ❌' });
    }
    res.status(200).json({
      status: 200,
      message: 'Support ticket deleted ✅'
    });
  });
});


// REFERRALS
// POST - Create Referral
app.post('/api/referral', (req, res) => {
  const { referrer_uuid, invite_code, referred_uuid, bonus_given } = req.body;
  const referral_id = crypto.randomUUID();

  const query = `
    INSERT INTO referrals 
    (referral_id, referrer_uuid, invite_code, referred_uuid, bonus_given) 
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(query, [referral_id, referrer_uuid, invite_code, referred_uuid, bonus_given || false], (err) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    res.status(200).json({ status: 200, message: 'Referral created ✅', data: { referral_id } });
  });
});

// GET - All Referrals
app.get('/api/referral', (req, res) => {
  connection.query('SELECT * FROM referrals', (err, results) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    res.status(200).json({ status: 200, message: 'Success ✅', data: results });
  });
});

// GET - Referral by ID
app.get('/api/referral/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM referrals WHERE referral_id = ?';

  connection.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (results.length === 0) return res.status(404).json({ status: 404, message: 'Referral not found ❌' });
    res.status(200).json({ status: 200, message: 'Success ✅', data: results[0] });
  });
});

// PUT - Update Referral
app.put('/api/referral/:id', (req, res) => {
  const { id } = req.params;
  const { bonus_given } = req.body;

  const query = 'UPDATE referrals SET bonus_given = ? WHERE referral_id = ?';

  connection.query(query, [bonus_given, id], (err, result) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ status: 404, message: 'Referral not found ❌' });
    res.status(200).json({ status: 200, message: 'Referral updated ✅' });
  });
});

// DELETE - Delete Referral
app.delete('/api/referral/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM referrals WHERE referral_id = ?';

  connection.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ status: 404, message: 'Referral not found ❌' });
    res.status(200).json({ status: 200, message: 'Referral deleted ✅' });
  });
});


// LOGIN HISTORY
// POST - Add Login History
app.post('/api/login-history', (req, res) => {
  const { customer_uuid, platform, ip_address, device_info, status } = req.body;
  const login_id = crypto.randomUUID();

  const query = `
    INSERT INTO login_history 
    (login_id, customer_uuid, platform, ip_address, device_info, status) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  connection.query(query, [login_id, customer_uuid, platform, ip_address, device_info, status || 'success'], (err) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    res.status(200).json({ status: 200, message: 'Login recorded ✅', data: { login_id } });
  });
});

// GET - All Login History
app.get('/api/login-history', (req, res) => {
  connection.query('SELECT * FROM login_history', (err, results) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    res.status(200).json({ status: 200, message: 'Success ✅', data: results });
  });
});

// GET - Login History by ID
app.get('/api/login-history/:id', (req, res) => {
  const { id } = req.params;

  connection.query('SELECT * FROM login_history WHERE login_id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (results.length === 0) return res.status(404).json({ status: 404, message: 'Login not found ❌' });
    res.status(200).json({ status: 200, message: 'Success ✅', data: results[0] });
  });
});

// PUT - Update Login History Status
app.put('/api/login-history/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ status: 400, message: 'Missing status in request body ❌' });

  const query = 'UPDATE login_history SET status = ? WHERE login_id = ?';
  connection.query(query, [status, id], (err, result) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ status: 404, message: 'Login not found ❌' });
    res.status(200).json({ status: 200, message: 'Login status updated ✅' });
  });
});

// DELETE - Delete Login History by ID
app.delete('/api/login-history/:id', (req, res) => {
  const { id } = req.params;

  connection.query('DELETE FROM login_history WHERE login_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ status: 404, message: 'Login not found ❌' });
    res.status(200).json({ status: 200, message: 'Login deleted ✅' });
  });
});


//FEATURE FLAGS
// POST - Create a Feature Flag
app.post('/api/feature-flag', (req, res) => {
  const { feature_name, is_enabled, customer_uuid } = req.body;

  const query = `
    INSERT INTO feature_flags (feature_name, is_enabled, customer_uuid)
    VALUES (?, ?, ?)
  `;

  connection.query(query, [feature_name, typeof is_enabled === 'boolean' ? is_enabled : false, customer_uuid || null], (err) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    res.status(200).json({ status: 200, message: 'Feature flag created ✅' });
  });
});

// GET - All Feature Flags
app.get('/api/feature-flag', (req, res) => {
  connection.query('SELECT * FROM feature_flags', (err, results) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    res.status(200).json({ status: 200, message: 'Success ✅', data: results });
  });
});

// GET - Feature Flag by Name
app.get('/api/feature-flag/:name', (req, res) => {
  const { name } = req.params;

  connection.query('SELECT * FROM feature_flags WHERE feature_name = ?', [name], (err, results) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (results.length === 0) return res.status(404).json({ status: 404, message: 'Feature not found ❌' });
    res.status(200).json({ status: 200, message: 'Success ✅', data: results[0] });
  });
});

// PUT - Update Feature Flag
app.put('/api/feature-flag/:name', (req, res) => {
  const { name } = req.params;
  const { is_enabled, customer_uuid } = req.body;

  const query = `
    UPDATE feature_flags 
    SET is_enabled = ?, customer_uuid = ? 
    WHERE feature_name = ?
  `;

  connection.query(query, [is_enabled, customer_uuid || null, name], (err, result) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ status: 404, message: 'Feature not found ❌' });
    res.status(200).json({ status: 200, message: 'Feature flag updated ✅' });
  });
});

// DELETE - Delete Feature Flag
app.delete('/api/feature-flag/:name', (req, res) => {
  const { name } = req.params;

  connection.query('DELETE FROM feature_flags WHERE feature_name = ?', [name], (err, result) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ status: 404, message: 'Feature not found ❌' });
    res.status(200).json({ status: 200, message: 'Feature flag deleted ✅' });
  });
});


//EXTERNAL_API_LOGS
// CREATE
app.post('/external-api-logs', (req, res) => {
  const data = {
    log_id: uuidv4(),
    ...req.body
  };
  connection.query('INSERT INTO external_api_logs SET ?', data, (err) => {
    if (err) return res.status(500).send(err);
    res.status(201).json({status:201, message: 'success', log_id: data.log_id });
  });
});

// READ
app.get('/external-api-logs', (req, res) => {
  connection.query('SELECT * FROM external_api_logs', (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results);
  });
});

// UPDATE
app.put('/external-api-logs/:log_id', (req, res) => {
  connection.query('UPDATE external_api_logs SET ? WHERE log_id = ?', [req.body, req.params.log_id], (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).json({ status:200, message: 'success' });
  });
});

// DELETE
app.delete('/external-api-logs/:log_id', (req, res) => {
  connection.query('DELETE FROM external_api_logs WHERE log_id = ?', [req.params.log_id], (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).json({ status:200,  message: 'success' });
  });
});

//error_logs
app.post('/error-logs', (req, res) => {
  const data = { error_id: uuidv4(), ...req.body };
  connection.query('INSERT INTO error_logs SET ?', data, (err) => {
    if (err) return res.status(500).send(err);
    res.status(201).json({  status:201, message: 'success', error_id: data.error_id });
  });
});

app.get('/error-logs', (req, res) => {
  connection.query('SELECT * FROM error_logs', (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results);
  });
});

app.put('/error-logs/:error_id', (req, res) => {
  connection.query('UPDATE error_logs SET ? WHERE error_id = ?', [req.body, req.params.error_id], (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).json({ status:200,  message: 'success' });
  });
});

app.delete('/error-logs/:error_id', (req, res) => {
  connection.query('DELETE FROM error_logs WHERE error_id = ?', [req.params.error_id], (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).json({ status:200,  message: 'success' });
  });
});

//device_status
app.post('/device-status', (req, res) => {
  const data = { device_id: uuidv4(), ...req.body };
  connection.query('INSERT INTO device_status SET ?', data, (err) => {
    if (err) return res.status(500).send(err);
    res.status(201).json({ status:201,  message: 'success', device_id: data.device_id });
  });
});

app.get('/device-status', (req, res) => {
  connection.query('SELECT * FROM device_status', (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).json(results);
  });
});

app.put('/device-status/:device_id', (req, res) => {
  connection.query('UPDATE device_status SET ? WHERE device_id = ?', [req.body, req.params.device_id], (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).json({  status:200, message: 'success' });
  });
});

app.delete('/device-status/:device_id', (req, res) => {
  connection.query('DELETE FROM device_status WHERE device_id = ?', [req.params.device_id], (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).json({ status:200,  message: 'success' });
  });
});



// handle graceful shutdown
function shutdown() {
  server.close(() => {
    console.log('Server closed');
  });
  connection.end();
}
// Create new settings
app.post('/api/settings', (req, res) => {
  const { customer_uuid, language, currency, notifications_enabled } = req.body;
  const query = `
    INSERT INTO settings (customer_uuid, language, currency, notifications_enabled)
    VALUES (?, ?, ?, ?)
  `;
  connection.query(query, [customer_uuid, language, currency, notifications_enabled], (err, results) => {
    if (err) {
      console.error('Error creating settings:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(200).json({ message: 'Settings created', id: customer_uuid });
  });
});

// Read settings for a customer
app.get('/api/settings/:uuid', (req, res) => {
  const uuid = req.params.uuid;
  connection.query('SELECT * FROM settings WHERE customer_uuid = ?', [uuid], (err, results) => {
    if (err) {
      console.error('Error fetching settings:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Settings not found' });
    }
    res.status(200).json(results[0]);
  });
});



// Update settings
app.put('/api/settings/:uuid', (req, res) => {
  const uuid = req.params.uuid;
  const { language, currency, notifications_enabled } = req.body;
  const query = `
    UPDATE settings
    SET language = ?, currency = ?, notifications_enabled = ?
    WHERE customer_uuid = ?
  `;
  connection.query(query, [language, currency, notifications_enabled, uuid], (err, results) => {
    if (err) {
      console.error('Error updating settings:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(200).json({ message: 'Settings updated' });
  });
});

// Delete settings
app.delete('/api/settings/:uuid', (req, res) => {
  const uuid = req.params.uuid;
  connection.query('DELETE FROM settings WHERE customer_uuid = ?', [uuid], (err, results) => {
    if (err) {
      console.error('Error deleting settings:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(200).json({ message: 'Settings deleted' });
  });
});

 //======================= KYC =======================

// CREATE
app.post('/api/kyc', (req, res) => {
  const { customer_uuid, document_type, document_number } = req.body;
  const kyc_id = crypto.randomUUID();
  const status = 'pending';

  connection.query(
    `INSERT INTO kyc_verification 
     (kyc_id, customer_uuid, document_type, document_number, status) 
     VALUES (?, ?, ?, ?, ?)`,
    [kyc_id, customer_uuid, document_type, document_number, status],
    (err) => {
      if (err) return res.status(500).json({ message: 'Failed to insert KYC' });
      res.status(200).json({ message: 'KYC submitted', kyc_id });
    }
  );
});

// READ ALL
app.get('/api/kyc', (req, res) => {
  connection.query('SELECT * FROM kyc_verification', (err, results) => {
    if (err) return res.status(500).json({ message: 'Failed to fetch KYC data' });
    res.status(200).json(results);
  });
});

// READ ONE
app.get('/api/kyc/:kyc_id', (req, res) => {
  connection.query(
    'SELECT * FROM kyc_verification WHERE kyc_id = ?',
    [req.params.kyc_id],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch KYC record' });
      if (results.length === 0) return res.status(404).json({ message: 'KYC not found' });
      res.status(200).json(results[0]);
    }
  );
});

// UPDATE STATUS
app.put('/api/kyc/:kyc_id', (req, res) => {
  const { status } = req.body;
  connection.query(
    `UPDATE kyc_verification 
     SET status=?, verified_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE NULL END 
     WHERE kyc_id=?`,
    [status, status, req.params.kyc_id],
    (err) => {
      if (err) return res.status(500).json({ message: 'Failed to update KYC' });
      res.status(200).json({ message: 'KYC status updated' });
    }
  );
});

// DELETE
app.delete('/api/kyc/:kyc_id', (req, res) => {
  connection.query(
    'DELETE FROM kyc_verification WHERE kyc_id = ?',
    [req.params.kyc_id],
    (err) => {
      if (err) return res.status(500).json({ message: 'Failed to delete KYC record' });
      res.status(200).json({ message: 'KYC record deleted' });
    }
  );
});

// CREATE - Add exchange rate
app.post('/api/exchange_rates', (req, res) => {
    const { base_currency, target_currency, rate, source} = req.body;
    const rate_id = crypto.randomUUID();
    const fetched_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
        INSERT INTO exchange_rates (rate_id, base_currency, target_currency, rate, source, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [rate_id, base_currency, target_currency, rate, source, fetched_at];

    connection.query(sql, values, (err, result) => {
    if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
    }
    res.status(200).json({ message: 'Exchange rate inserted successfully' });
});
});


// READ - Get all exchange rates
app.get('/api/exchange_rates', (req, res) => {
    connection.query('SELECT * FROM exchange_rates', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});


// UPDATE - Update a specific exchange rate by ID
app.put('/api/exchange_rates/:rate_id', (req, res) => {
    const { rate_id } = req.params;
    const { base_currency, target_currency, rate, source, fetched_at } = req.body;

    const sql = `
        UPDATE exchange_rates
        SET base_currency = ?, target_currency = ?, rate = ?, source = ?, fetched_at = ?
        WHERE rate_id = ?
    `;
    const values = [base_currency, target_currency, rate, source, fetched_at, rate_id];

    connection.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Exchange rate not found' });
        res.status(200).json({ message: 'Exchange rate updated successfully' });
    });
});


// DELETE - Delete a specific exchange rate by ID
app.delete('/api/exchange_rates/:rate_id', (req, res) => {
    const { rate_id } = req.params;

    connection.query('DELETE FROM exchange_rates WHERE rate_id = ?', [rate_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Exchange rate not found' });
        res.status(200).json({ message: 'Exchange rate deleted successfully' });
    });
});

// CREATE - Add feedback
app.post('/api/feedback', (req, res) => {
    const { customer_uuid, rating, comments, source} = req.body;
    const feedback_id = crypto.randomUUID();
    const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const sql = `
        INSERT INTO feedback (feedback_id, customer_uuid, rating, comments, source, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [feedback_id, customer_uuid, rating, comments, source, created_at];

    connection.query(sql, values, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Feedback submitted successfully' });
    }); 
});

// READ - Get all feedback entries
app.get('/api/feedback', (req, res) => {
    connection.query('SELECT * FROM feedback', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json(results);
    });
});

// UPDATE - Update a specific feedback entry
app.put('/api/feedback/:feedback_id', (req, res) => {
    const { feedback_id } = req.params;
    const { customer_uuid, rating, comments, source, created_at } = req.body;

    const sql = `
        UPDATE feedback
        SET customer_uuid = ?, rating = ?, comments = ?, source = ?, created_at = ?
        WHERE feedback_id = ?
    `;
    const values = [customer_uuid, rating, comments, source, created_at, feedback_id];

    connection.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Feedback not found' });
        res.status(200).json({ message: 'Feedback updated successfully' });
    });
});

// DELETE - Delete a specific feedback entry
app.delete('/api/feedback/:feedback_id', (req, res) => {
    const { feedback_id } = req.params;

    connection.query('DELETE FROM feedback WHERE feedback_id = ?', [feedback_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Feedback not found' });
        res.status(200).json({ message: 'Feedback deleted successfully' });
    });
});

// CREATE a wallet
app.post('/api/wallet', (req, res) => {
  const { customer_uuid, type, currency, balance = 0.0 } = req.body;
  const wallet_id = crypto.randomUUID();

  connection.query(
    'INSERT INTO wallet (wallet_id, customer_uuid, type, currency, balance) VALUES (?, ?, ?, ?, ?)',
    [wallet_id, customer_uuid, type, currency, balance],
    (err, result) => {
      if (err) {
        console.error('Error creating wallet:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.status(201).json({ wallet_id, message: 'Wallet created' });
    }
  );
});

// READ all wallets
app.get('/api/wallet', (req, res) => {
  connection.query('SELECT * FROM wallet', (err, results) => {
    if (err) {
      console.error('Error fetching wallets:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(200).json(results);
  });
});

// READ wallet by ID
app.get('/api/wallet/:id', (req, res) => {
  connection.query('SELECT * FROM wallet WHERE wallet_id = ?', [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching wallet:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    res.status(200).json(results[0]);
  });
});

// UPDATE a wallet
app.put('/api/wallet/:id', (req, res) => {
  const { type, currency, balance } = req.body;

  connection.query(
    'UPDATE wallet SET type = ?, currency = ?, balance = ?, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = ?',
    [type, currency, balance, req.params.id],
    (err, result) => {
      if (err) {
        console.error('Error updating wallet:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      res.status(200).json({ message: 'Wallet updated' });
    }
  );
});

// DELETE a wallet
app.delete('/api/wallet/:id', (req, res) => {
  connection.query('DELETE FROM wallet WHERE wallet_id = ?', [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting wallet:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    res.status(200).json({ message: 'Wallet deleted' });
  });
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);