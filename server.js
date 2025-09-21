import express from 'express';
import crypto from 'crypto';
import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

//changes made 
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import terminalRoutes from './routes/terminals.js';
import auditLogRoutes from './routes/audit_logs.js';
import amlFlagRoutes from './routes/aml_flags.js';

dotenv.config();

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

app.use(bodyParser.json());
app.use(express.json());


app.use('/api/terminals', terminalRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/aml-flag', amlFlagRoutes);

//done 
const port = 8080;
const server = app.listen(port,'0.0.0.0', () => {
  console.log(`Server is running at http://localhost:${port}`);  //http://64.227.156.143:${port}`);
}); 

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
// CREATE transaction
app.post('/api/transactions', (req, res) => {
  const {
    customer_uuid,
    wallet_id,
    reciever_id,
    reciever_wallet_id,
    type,
    amount,
    currency,
    status,
    provider,
    reference_id,
  } = req.body;

  const transaction_id = uuidv4(); // Generate UUID

  connection.query(
    `INSERT INTO transactions (
      transaction_id, customer_uuid, wallet_id,
      reciever_id, reciever_wallet_id,
      type, amount, currency, status, provider, reference_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      transaction_id, customer_uuid, wallet_id,
      reciever_id, reciever_wallet_id,
      type, amount, currency, status, provider, reference_id
    ],
    (error, results) => {
      if (error) {
        console.error('Insert error:', error.sqlMessage || error);
        return res.status(500).send({
          status: 500,
          message: 'Internal Server Error'
        });
      }
      return res.status(200).send({
        status: 200,
        message: 'Transaction created',
        transaction_id
      });
    }
  );
});

// READ all transactions
app.get('/api/transactions', (req, res) => {
  connection.query('SELECT * FROM transactions', (error, results) => {
    if (error) {
      return res.status(500).send({
        status: 500,
        message: 'Internal Server Error'
      });
    }
    return res.status(200).json(results);
  });
});

// READ single transaction by ID
app.get('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  connection.query(
    'SELECT * FROM transactions WHERE transaction_id = ?',
    [id],
    (error, results) => {
      if (error) {
        return res.status(500).send({
          status: 500,
          message: 'Internal Server Error'
        });
      }
      if (results.length === 0) {
        return res.status(404).send({
          status: 404,
          message: 'Transaction not found'
        });
      }
      return res.status(200).json(results[0]);
    }
  );
});

// UPDATE transaction by ID
app.put('/api/transactions/:transaction_id', (req, res) => {
  const { transaction_id } = req.params;
  const updateFields = req.body;

  connection.query(
    'UPDATE transactions SET ? WHERE transaction_id = ?',
    [updateFields, transaction_id],
    (err, result) => {
      if (err) {
        console.error('Update error:', err.sqlMessage || err);
        return res.status(500).json({
          status: 500,
          message: 'Internal Server Error'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 404,
          message: 'Transaction not found'
        });
      }

      res.status(200).json({
        status: 200,
        message: 'Transaction updated'
      });
    }
  );
});

// DELETE transaction by ID
app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  connection.query(
    'DELETE FROM transactions WHERE transaction_id = ?',
    [id],
    (error, results) => {
      if (error) {
        return res.status(500).send({
          status: 500,
          message: 'Internal Server Error'
        });
      }
      if (results.affectedRows === 0) {
        return res.status(404).send({
          status: 404,
          message: 'Transaction not found'
        });
      }
      return res.status(200).send({
        status: 200,
        message: 'Transaction deleted'
      });
    }
  );
});

// CREATE a payment method
app.post('/api/payment-method', (req, res) => {
  const {
    customer_uuid,
    payment_type,
    type,      
    label,
    details,
    is_active
  } = req.body;

  connection.query(
    `INSERT INTO payment_method (
      customer_uuid, payment_type, type, label, details, is_active
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      customer_uuid,
      payment_type,
      type,
      label,
      JSON.stringify(details),    // stringify for safety
      is_active ?? true
    ],
    (err, result) => {
      if (err) {
        console.error('❌ Error inserting payment method:', err);
        return res.status(500).json({
          status: 500,
          message: 'Internal server error ❌'
        });
      }
      res.status(200).json({
        status: 200,
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
      console.error('❌ Error fetching payment methods:', err);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error ❌'
      });
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

  connection.query(
    'SELECT * FROM payment_method WHERE payment_id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('❌ Error fetching payment method:', err);
        return res.status(500).json({
          status: 500,
          message: 'Internal server error ❌'
        });
      }
      if (results.length === 0) {
        return res.status(404).json({
          status: 404,
          message: 'Payment method not found ❌'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'Success ✅',
        data: results[0]
      });
    }
  );
});

// UPDATE a payment method
app.put('/api/payment-method/:payment_id', (req, res) => {
  const { payment_id } = req.params;
  const updateFields = req.body;

  if (updateFields.details) {
    updateFields.details = JSON.stringify(updateFields.details);
  }

  connection.query(
    'UPDATE payment_method SET ? WHERE payment_id = ?',
    [updateFields, payment_id],
    (err, result) => {
      if (err) {
        console.error('❌ SQL Error:', err);
        return res.status(500).json({
          status: 500,
          message: 'Internal server error ❌'
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 404,
          message: 'Payment method not found ❌'
        });
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

  connection.query(
    'DELETE FROM payment_method WHERE payment_id = ?',
    [id],
    (err, result) => {
      if (err) {
        console.error('❌ Error deleting payment method:', err);
        return res.status(500).json({
          status: 500,
          message: 'Internal server error ❌'
        });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 404,
          message: 'Payment method not found ❌'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'Payment method deleted ✅'
      });
    }
  );
});



// ===============================
// CREATE QR Code
// ===============================
app.post('/api/qrcodes', (req, res) => {
  const {
    customer_uuid,
    status,
    merchant_id,
    amount,
    transaction_id,
    currency_type,
    qr_type
  } = req.body;

  const qr_id = crypto.randomUUID();

  connection.query(
    `INSERT INTO qr_codes 
     (qr_id, customer_uuid, status, merchant_id, amount, transaction_id, currency_type, qr_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [qr_id, customer_uuid, status, merchant_id, amount, transaction_id, currency_type, qr_type],
    (err) => {
      if (err) {
        console.error('INSERT QR Code error:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to create QR code'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'QR code created',
        qr_id
      });
    }
  );
});

// ===============================
// READ ALL QR Codes
// ===============================
app.get('/api/qrcodes', (req, res) => {
  connection.query(
    'SELECT * FROM qr_codes',
    (err, results) => {
      if (err) {
        console.error('FETCH QR Codes error:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to fetch QR codes'
        });
      }
      res.status(200).json(results);
    }
  );
});

// ===============================
// READ ONE QR Code
// ===============================
app.get('/api/qrcodes/:qr_id', (req, res) => {
  connection.query(
    'SELECT * FROM qr_codes WHERE qr_id = ?',
    [req.params.qr_id],
    (err, results) => {
      if (err) {
        console.error('FETCH QR Code error:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to fetch QR code'
        });
      }
      if (results.length === 0) {
        return res.status(404).json({
          status: 404,
          message: 'QR code not found'
        });
      }
      res.status(200).json(results[0]);
    }
  );
});

// ===============================
// UPDATE QR Code status + transaction_id
// ===============================
app.put('/api/qrcodes/:qr_id', (req, res) => {
  const { status, transaction_id } = req.body;

  connection.query(
    `UPDATE qr_codes 
     SET status = ?, transaction_id = ?
     WHERE qr_id = ?`,
    [status, transaction_id, req.params.qr_id],
    (err) => {
      if (err) {
        console.error('UPDATE QR Code error:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to update QR code'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'QR code updated'
      });
    }
  );
});

// ===============================
// DELETE QR Code
// ===============================
app.delete('/api/qrcodes/:qr_id', (req, res) => {
  connection.query(
    'DELETE FROM qr_codes WHERE qr_id = ?',
    [req.params.qr_id],
    (err) => {
      if (err) {
        console.error('DELETE QR Code error:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to delete QR code'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'QR code deleted'
      });
    }
  );
});


// Create a new crypto transaction
app.post('/crypto-transactions', (req, res) => {
  const data = req.body;
  data.crypto_tx_id = uuidv4(); // 👈 generate and assign a unique UUID
  const sql = `INSERT INTO crypto_transaction SET ?`;
  connection.query(sql, data, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ message: "it is added, code 200", id: data.crypto_tx_id, ...data });
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
  const data = {
    id: crypto.randomUUID(),
    ...req.body,
  };

  connection.query('INSERT INTO activity_log SET ?', data, (err) => {
    if (err) {
      console.error("🔴 DB Error:", err);  // log the actual error
      return res.status(500).json({
        status: 500,
        message: "Internal Server Error. Please try again later."
      });
    }
    res.status(200).json({
      status: 200,
      message: "Activity log created",
      id: data.id
    });
  });
});


//Read (Get All Logs)
app.get('/activity_log', (req, res) => {
  connection.query('SELECT * FROM activity_log', (err, results) => {
    if (err) return res.status(500).send(err.message);
    res.status(200).send(results);
  });
});

//Read (Get One Log by ID)
app.get('/activity_log/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM activity_log WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).send(err.message);
    if (result.length === 0) return res.status(404).send('Log not found');
    res.status(200).send(result[0]);
  });
});

// Update activity log
app.put('/activity_log/:id', (req, res) => {
  const id = req.params.id;
  const updatedLog = req.body;
  connection.query('UPDATE activity_log SET ? WHERE id = ?', [updatedLog, id], (err, result) => {
    if (err) return res.status(500).send(err.message);
    res.status(200).send('Log updated');
  });
});

//Delete activity log
app.delete('/activity_log/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM activity_log WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).send(err.message);
    res.status(200).send('Log deleted');
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
    res.status(200).send({ message: "Notification added, code 200", id: data.notification_id, ...data });
  });
});

// Get all notifications
app.get('/notifications', (req, res) => {
  connection.query('SELECT * FROM notification', (err, results) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ results, message: "code 200" });
  });
});

// Update a notification
app.put('/notifications/:notification_id', (req, res) => {
  const { notification_id } = req.params;
  const updateFields = req.body;

  connection.query(
    'UPDATE notification SET ? WHERE notification_id = ?',
    [updateFields, notification_id],
    (err, result) => {
      if (err) {
        console.error('❌ SQL ERROR:', err); // This prints the real MySQL error
        return res.status(500).json({ status: 500, message: 'Internal server error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ status: 404, message: 'Notification not found' });
      }

      res.status(200).json({ status: 200, message: 'Notification updated' });
    }
  );
});

// Delete a notification
app.delete('/notifications/:id', (req, res) => {
  connection.query('DELETE FROM notification WHERE notification_id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(200).send({ message: 'Notification deleted successfully, code 200' });
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
        return res.status(500).json({ error: 500, message: 'Internal server error' });
      }
      res.status(200).json({ success: 200, message: 'RTA ticket created', ticket_id });
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
      return res.status(500).json({ error: 500, message: 'Internal server error' });
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
      return res.status(500).json({ error: 500, message: "Internal server error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 420, message: "Ticket not found" });
    }
    res.status(200).json({ success: 200, message: "Ticket updated successfully" });
  });
});

// Delete an RTA ticket by ID
app.delete('/api/rta-ticket/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM rta_ticket WHERE ticket_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting RTA ticket:', err);
      return res.status(500).json({ error: 500, message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 404, message: 'RTA ticket not found' });
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
  const { referrer_uuid, invite_code, referred_means, referred_uuid, bonus_given } = req.body;
  const referral_id = crypto.randomUUID();

  const query = `
    INSERT INTO referrals 
    (referral_id, referrer_uuid, invite_code, referred_means, referred_uuid, bonus_given) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  connection.query(query, [referral_id, referrer_uuid, invite_code, referred_means, referred_uuid, bonus_given || false], (err) => {
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
  const {
    customer_uuid,
    platform,
    ip_address,
    device_info,
    status,
    login_type,
    location
  } = req.body;

  const login_id = crypto.randomUUID();
  const login_status = status || 'success';

  const query = `
    INSERT INTO login_history 
    (login_id, customer_uuid, platform, ip_address, device_info, status, login_type, location) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [login_id, customer_uuid, platform, ip_address, device_info, login_status, login_type, location],
    (err) => {
      if (err) return res.status(500).json({ status: 500, message: err.message });
      res.status(200).json({
        status: 200,
        message: 'Login recorded ✅',
        data: { login_id }
      });
    }
  );
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


// PUT - Update Login History (status, login_type, location)
app.put('/api/login-history/:id', (req, res) => {
  const { id } = req.params;
  const { status, login_type, location } = req.body;

  const query = `
    UPDATE login_history
    SET status = ?, login_type = ?, location = ?
    WHERE login_id = ?
  `;

  connection.query(query, [status, login_type, location, id], (err, result) => {
    if (err) return res.status(500).json({ status: 500, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ status: 404, message: 'Login not found ❌' });
    res.status(200).json({ status: 200, message: 'Login record updated ✅' });
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
app.post('/api/external-logs', (req, res) => {
  const {
    provider,
    endpoint,
    request_body,
    response_body,
    status_code,
    customer_uuid
  } = req.body;

  const log_id = crypto.randomUUID();

  connection.query(
    `INSERT INTO external_api_logs
     (log_id, provider, endpoint, request_body, response_body, status_code, customer_uuid)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [log_id, provider, endpoint, request_body, response_body, status_code, customer_uuid],
    (err) => {
      if (err) {
        console.error('INSERT external API log:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to log external API call'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'External API log created',
        log_id
      });
    }
  );
});

// READ
app.get('/api/external-logs', (req, res) => {
  connection.query(
    'SELECT * FROM external_api_logs ORDER BY created_at DESC',
    (err, results) => {
      if (err) {
        console.error('FETCH external API logs:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to fetch external API logs'
        });
      }
      res.status(200).json(results);
    }
  );
});

app.get('/api/external-logs/:log_id', (req, res) => {
  connection.query(
    'SELECT * FROM external_api_logs WHERE log_id = ?',
    [req.params.log_id],
    (err, results) => {
      if (err) {
        console.error('FETCH external API log:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to fetch external API log'
        });
      }
      if (results.length === 0) {
        return res.status(404).json({
          status: 404,
          message: 'External API log not found'
        });
      }
      res.status(200).json(results[0]);
    }
  );
});


// UPDATE
app.put('/api/external-logs/:log_id', (req, res) => {
  const {
    provider,
    endpoint,
    request_body,
    response_body,
    status_code,
    customer_uuid
  } = req.body;

  connection.query(
    `UPDATE external_api_logs
     SET provider = ?,
         endpoint = ?,
         request_body = ?,
         response_body = ?,
         status_code = ?,
         customer_uuid = ?
     WHERE log_id = ?`,
    [provider, endpoint, request_body, response_body, status_code, customer_uuid, req.params.log_id],
    (err) => {
      if (err) {
        console.error('UPDATE external API log:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to update external API log'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'External API log updated'
      });
    }
  );
});


// DELETE
app.delete('/api/external-logs/:log_id', (req, res) => {
  connection.query(
    'DELETE FROM external_api_logs WHERE log_id = ?',
    [req.params.log_id],
    (err) => {
      if (err) {
        console.error('DELETE external API log:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to delete external API log'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'External API log deleted'
      });
    }
  );
});

//error_logs
app.post('/api/errors', (req, res) => {
  const { module, error_message, stack_trace, customer_uuid } = req.body;
  const error_id = crypto.randomUUID();

  connection.query(
    `INSERT INTO error_logs 
     (error_id, module, error_message, stack_trace, customer_uuid)
     VALUES (?, ?, ?, ?, ?)`,
    [error_id, module, error_message, stack_trace, customer_uuid],
    (err) => {
      if (err) {
        console.error('INSERT error log:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to log error'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'Error logged',
        error_id
      });
    }
  );
});
app.get('/api/errors/:error_id', (req, res) => {
  connection.query(
    'SELECT * FROM error_logs WHERE error_id = ?',
    [req.params.error_id],
    (err, results) => {
      if (err) {
        console.error('FETCH error log:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to fetch error log'
        });
      }
      if (results.length === 0) {
        return res.status(404).json({
          status: 404,
          message: 'Error log not found'
        });
      }
      res.status(200).json(results[0]);
    }
  );
});

// ===============================
// UPDATE error log by ID
// ===============================
app.put('/api/errors/:error_id', (req, res) => {
  const { module, error_message, stack_trace, customer_uuid } = req.body;

  connection.query(
    `UPDATE error_logs 
     SET module = ?, 
         error_message = ?, 
         stack_trace = ?, 
         customer_uuid = ?
     WHERE error_id = ?`,
    [module, error_message, stack_trace, customer_uuid, req.params.error_id],
    (err) => {
      if (err) {
        console.error('UPDATE error log:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to update error log'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'Error log updated'
      });
    }
  );
});


// ===============================
// DELETE error log by ID
// ===============================
app.delete('/api/errors/:error_id', (req, res) => {
  connection.query(
    'DELETE FROM error_logs WHERE error_id = ?',
    [req.params.error_id],
    (err) => {
      if (err) {
        console.error('DELETE error log:', err);
        return res.status(500).json({
          status: 500,
          message: 'Failed to delete error log'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'Error log deleted'
      });
    }
  );
});


//device_status
app.post('/device-status', (req, res) => {
  const data = { device_id: uuidv4(), ...req.body };
  connection.query('INSERT INTO device_status SET ?', data, (err) => {
    if (err) return res.status(500).send(err);
    res.status(200).json({ status:200,  message: 'success', device_id: data.device_id });
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
      return res.status(500).json({
        status: 500,
        message: 'Database error' });
    }
    res.status(200).json({
      status: 200,
      message: 'Settings created', id: customer_uuid });
  });
});

// Read settings for a customer
app.get('/api/settings/:uuid', (req, res) => {
  const uuid = req.params.uuid;
  connection.query('SELECT * FROM settings WHERE customer_uuid = ?', [uuid], (err, results) => {
    if (err) {
      console.error('Error fetching settings:', err);
      return res.status(500).json({
        status: 500,
        message: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Settings not found' });
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
      return res.status(500).json({
        status: 500,
        message: 'Database error' });
    }
    res.status(200).json({
      status: 200,
      message: 'Settings updated' });
  });
});

// Delete settings
app.delete('/api/settings/:uuid', (req, res) => {
  const uuid = req.params.uuid;
  connection.query('DELETE FROM settings WHERE customer_uuid = ?', [uuid], (err, results) => {
    if (err) {
      console.error('Error deleting settings:', err);
      return res.status(500).json({
        status: 500,
        message: 'Database error' });
    }
    res.status(200).json({
      status: 200,
      message: 'Settings deleted' });
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
      if (err) return res.status(500).json({
        status: 500,
        message: 'Failed to insert KYC' });
      res.status(200).json({
        status: 200,
        message: 'KYC submitted', kyc_id });
    }
  );
});

// READ ALL
app.get('/api/kyc', (req, res) => {
  connection.query('SELECT * FROM kyc_verification', (err, results) => {
    if (err) return res.status(500).json({
      status: 500,
      message: 'Failed to fetch KYC data' });
    res.status(200).json(results);
  });
});

// READ ONE
app.get('/api/kyc/:kyc_id', (req, res) => {
  connection.query(
    'SELECT * FROM kyc_verification WHERE kyc_id = ?',
    [req.params.kyc_id],
    (err, results) => {
      if (err) return res.status(500).json({
        status: 500,
        message: 'Failed to fetch KYC record' });
      if (results.length === 0) return res.status(404).json({
        status: 404,
        message: 'KYC not found' });
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
      if (err) return res.status(500).json({
        status: 500,
        message: 'Failed to update KYC' });
      res.status(200).json({
        status: 200,
        message: 'KYC status updated' });
    }
  );
});

// DELETE
app.delete('/api/kyc/:kyc_id', (req, res) => {
  connection.query(
    'DELETE FROM kyc_verification WHERE kyc_id = ?',
    [req.params.kyc_id],
    (err) => {
      if (err) return res.status(500).json({
        status: 500,
        message: 'Failed to delete KYC record' });
      res.status(200).json({
        status: 200,
        message: 'KYC record deleted' });
    }
  );
});


// CREATE merchant
app.post('/api/merchants', (req, res) => {
  const { name, business_name, email } = req.body;
  const merchant_id = crypto.randomUUID();

  connection.query(
    `INSERT INTO merchants 
     (merchant_id, name, business_name, email) 
     VALUES (?, ?, ?, ?)`,
    [merchant_id, name, business_name, email],
    (err) => {
      if (err) {
        console.error('INSERT error:', err);  // ✅ This will print the SQL error to your terminal!
        return res.status(500).json({
          status: 500,
          message: 'Failed to create merchant'
        });
      }
      res.status(200).json({
        status: 200,
        message: 'Merchant created',
        merchant_id
      });
    }
  );
});

// READ ALL merchants
app.get('/api/merchants', (req, res) => {
  connection.query('SELECT * FROM merchants', (err, results) => {
    if (err) return res.status(500).json({
      status: 500,
      message: 'Failed to fetch merchants'
    });
    res.status(200).json(results);
  });
});

// READ ONE merchant by ID
app.get('/api/merchants/:merchant_id', (req, res) => {
  connection.query(
    'SELECT * FROM merchants WHERE merchant_id = ?',
    [req.params.merchant_id],
    (err, results) => {
      if (err) return res.status(500).json({
        status: 500,
        message: 'Failed to fetch merchant'
      });
      if (results.length === 0) return res.status(404).json({
        status: 404,
        message: 'Merchant not found'
      });
      res.status(200).json(results[0]);
    }
  );
});

// UPDATE merchant (name, business_name, email)
app.put('/api/merchants/:merchant_id', (req, res) => {
  const { name, business_name, email } = req.body;

  connection.query(
    `UPDATE merchants 
     SET name = ?, business_name = ?, email = ? 
     WHERE merchant_id = ?`,
    [name, business_name, email, req.params.merchant_id],
    (err) => {
      if (err) return res.status(500).json({
        status: 500,
        message: 'Failed to update merchant'
      });
      res.status(200).json({
        status: 200,
        message: 'Merchant updated'
      });
    }
  );
});

// DELETE merchant
app.delete('/api/merchants/:merchant_id', (req, res) => {
  connection.query(
    'DELETE FROM merchants WHERE merchant_id = ?',
    [req.params.merchant_id],
    (err) => {
      if (err) return res.status(500).json({
        status: 500,
        message: 'Failed to delete merchant'
      });
      res.status(200).json({
        status: 200,
        message: 'Merchant deleted'
      });
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
        return res.status(500).json({
          status: 500,
          error: err.message });
    }
    res.status(200).json({
      status: 200,
      message: 'Exchange rate inserted successfully' });
});
});


// READ - Get all exchange rates
app.get('/api/exchange_rates', (req, res) => {
    connection.query('SELECT * FROM exchange_rates', (err, results) => {
        if (err) return res.status(500).json({
          status: 500,
          error: err.message });
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
        if (err) return res.status(500).json({
          status: 500,
          error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({
          status: 404,
          message: 'Exchange rate not found' });
        res.status(200).json({
          status: 200,
          message: 'Exchange rate updated successfully' });
    });
});


// DELETE - Delete a specific exchange rate by ID
app.delete('/api/exchange_rates/:rate_id', (req, res) => {
    const { rate_id } = req.params;

    connection.query('DELETE FROM exchange_rates WHERE rate_id = ?', [rate_id], (err, result) => {
        if (err) return res.status(500).json({
          status: 500,
          error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({
          status: 404,
          message: 'Exchange rate not found' });
        res.status(200).json({
          status: 200,
          message: 'Exchange rate deleted successfully' });
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
        if (err) return res.status(500).json({
          status: 500,
          error: err.message });
        res.status(200).json({
          status: 200,
          message: 'Feedback submitted successfully' });
    }); 
});

// READ - Get all feedback entries
app.get('/api/feedback', (req, res) => {
    connection.query('SELECT * FROM feedback', (err, results) => {
        if (err) return res.status(500).json({
          status: 500,
          error: err.message });
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
        if (err) return res.status(500).json({
          status: 500,
          error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({
          status: 404,
          message: 'Feedback not found' });
        res.status(200).json({
          status: 200,
          message: 'Feedback updated successfully' });
    });
});

// DELETE - Delete a specific feedback entry
app.delete('/api/feedback/:feedback_id', (req, res) => {
    const { feedback_id } = req.params;

    connection.query('DELETE FROM feedback WHERE feedback_id = ?', [feedback_id], (err, result) => {
        if (err) return res.status(500).json({
          status: 500,
          error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({
          status: 404,
          message: 'Feedback not found' });
        res.status(200).json({
          status: 200,
          message: 'Feedback deleted successfully' });
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
        return res.status(500).json({
          status: 500,
          message: 'Internal server error' });
      }
      res.status(200).json({
         status: 200, 
         wallet_id,
         message: 'Wallet created'});
    }
  );
});

// READ all wallets
app.get('/api/wallet', (req, res) => {
  connection.query('SELECT * FROM wallet', (err, results) => {
    if (err) {
      console.error('Error fetching wallets:', err);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error' });
    }
    res.status(200).json(results);
  });
});

// READ wallet by ID
app.get('/api/wallet/:id', (req, res) => {
  connection.query('SELECT * FROM wallet WHERE wallet_id = ?', [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching wallet:', err);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Wallet not found' });
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
        return res.status(500).json({
          status: 500,
          message: 'Internal server error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({
          status: 404,
          message: 'Wallet not found' });
      }
      res.status(200).json({
        status: 200,
        message: 'Wallet updated' });
    }
  );
});

// DELETE a wallet
app.delete('/api/wallet/:id', (req, res) => {
  connection.query('DELETE FROM wallet WHERE wallet_id = ?', [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting wallet:', err);
      return res.status(500).json({
        status: 500,
        message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Wallet not found' });
    }
    res.status(200).json({
      status: 200,
      message: 'Wallet deleted' });
  });
});

// CREATE a session token
app.post('/api/session-token', (req, res) => {
  const { customer_uuid, access_token, expires_at } = req.body;

  const token_id = crypto.randomUUID();
  const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const device_info = req.headers['user-agent'];

  connection.query(
    `INSERT INTO session_token 
     (token_id, customer_uuid, access_token, device_info, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [token_id, customer_uuid, access_token, device_info, ip_address, expires_at],
    (err) => {
      if (err) {
        console.error('Error creating session token:', err);
        return res.status(420).json({ "status" : "420" , "message" : 'Internal server error' });
      }
      res.status(200).json({
        "status" : "200",
        "message": 'Session token created',
        "token_id": token_id
      });
    }
  );
});


// READ all session tokens
app.get('/api/session-token', (req, res) => {
  connection.query('SELECT * FROM session_token', (err, results) => {
    if (err) {
      console.error('Error fetching session tokens:', err);
      return res.status(420).json({"status" : "420", "message": 'Internal server error' });
    }
    res.status(200).json({
      "status":"200",
      "message": 'Successful',
      "results" : results});
  });
});

// READ one session token by ID
app.get('/api/session-token/:id', (req, res) => {
  const { id } = req.params;
  connection.query('SELECT * FROM session_token WHERE token_id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching session token:', err);
      return res.status(420).json({ "status" : "420", "message": 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({"status" : "404", "message": 'Session token not found' });
    }
    res.status(200).json({
      "status":"200",
      "message": 'Successful',
      "results" : results[0]});
  });
});

// UPDATE a session token
app.put('/api/session-token/:id', (req, res) => {
  const { id } = req.params;
  const { access_token, expires_at } = req.body;

  const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const device_info = req.headers['user-agent'];

  connection.query(
    `UPDATE session_token SET 
      access_token = ?, 
      device_info = ?, 
      ip_address = ?, 
      expires_at = ? 
     WHERE token_id = ?`,
    [access_token, device_info, ip_address, expires_at, id],
    (err, result) => {
      if (err) {
        console.error('Error updating session token:', err);
        return res.status(420).json({"status" : "420", "message": 'Internal server error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ "status" : "404","message": 'Session token not found' });
      }
      res.status(200).json({"status" : "200", "message" : 'Session token updated' });
    }
  );
});


// DELETE a session token
app.delete('/api/session-token/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM session_token WHERE token_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting session token:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Session token not found' });
    }
    res.status(200).json({ message: 'Session token deleted' });
  });
});

// Create a new log entry
app.post('/api/logs', (req, res) => {
  const { module, action, performed_by, details } = req.body;

  if (!module || !action || !performed_by) {
    return res.status(400).send({
      error: 400,
      message: 'module, action and performed_by are required'
    });
  }

  const log_id = crypto.randomUUID();

  const query = `INSERT INTO admin_action_logs (log_id, module, action, performed_by, details) VALUES (?, ?, ?, ?, ?)`;

  connection.query(query, [log_id, module, action, performed_by, details || null], (error) => {
    if (error) {
      console.error('Error inserting log:', error);
      return res.status(420).json({ "status" : "420" , "message" : 'Internal server error' });
      }
      res.status(200).json({
        "status" : "200",
        "message": 'Log created',
        "log_id": log_id});
    }
  );
});

// Get all logs
app.get('/api/logs', (req, res) => {
  connection.query('SELECT * FROM admin_action_logs ORDER BY created_at DESC', (error, results) => {
    if (error) {
      console.error('Error fetching logs:', error);
      return res.status(420).send({ "status": 420, "message": 'Internal Server Error' });
    }
    res.status(200).json({
      "status":"200",
      "message": 'Successful',
      "results" : results});
  });
});

// Get log by id
app.get('/api/logs/:log_id', (req, res) => {
  const { log_id } = req.params;

  connection.query('SELECT * FROM admin_action_logs WHERE log_id = ?', [log_id], (error, results) => {
    if (error) {
      console.error('Error fetching log:', error);
      return res.status(42).send({ "status": 420, "message": 'Internal Server Error' });
    }
    if (results.length === 0) {
      return res.status(404).send({ "status": 404, "message": 'Log not found' });
    }
    res.status(200).json({
      "status":"200",
      "message": 'Successful',
      "results" :results[0]});
  });
});

// Update a log entry by log_id
app.put('/api/logs/:log_id', (req, res) => {
  const { log_id } = req.params;
  const { module, action, performed_by, details } = req.body;

  if (!module || !action || !performed_by) {
    return res.status(400).send({
      "status": 400,
      "message": 'module, action and performed_by are required'
    });
  }

  const query = `
    UPDATE admin_action_logs
    SET module = ?, action = ?, performed_by = ?, details = ?
    WHERE log_id = ?
  `;

  connection.query(query, [module, action, performed_by, details || null, log_id], (error, results) => {
    if (error) {
      console.error('Error updating log:', error);
      return res.status(420).send({ "status": 420 , "message" : 'Internal Server Error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).send({ "error" : 404, "message" : 'Log not found' });
    }
    res.send({"status":200 ,"message": 'Log updated' });
  });
});


// Delete log by id
app.delete('/api/logs/:log_id', (req, res) => {
  const { log_id } = req.params;

  connection.query('DELETE FROM admin_action_logs WHERE log_id = ?', [log_id], (error, results) => {
    if (error) {
      console.error('Error deleting log:', error);
      return res.status(420).send({ "status": 420, "status": 'Internal Server Error' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).send({ "status": 404, "message": 'Log not found' });
    }
    res.send({"status":200, "message": 'Log deleted' });
  });
});

// CREATE Offer
app.post('/api/offers', (req, res) => {
  const {
    title,
    description,
    discount_type,
    offer_type,
    discount_value,
    valid_from,
    valid_to,
    is_active
  } = req.body;

  const offer_id = crypto.randomUUID();
  // In JavaScript
  const validFrom = new Date('2025-12-01T00:00:00Z').toISOString().slice(0, 19).replace('T', ' ');
  const validTo = new Date('2025-12-31T23:59:59Z').toISOString().slice(0, 19).replace('T', ' ');

  const query = `
    INSERT INTO offers (
      offer_id, title, description, discount_type, offer_type,
      discount_value, valid_from, valid_to, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [
      offer_id,
      title,
      description,
      discount_type,
      offer_type,
      discount_value,
      validFrom,
      validTo,
      is_active ?? true
    ],
    (err) => {
      if (err) {
        console.error('Error inserting offer:', err);
        return res.status(420).json({ "status" : "420" , "message" : 'Internal server error' });
      }
      res.status(200).json({
        "status" : "200",
        "message": 'Log created',
        "offer_id": offer_id});
    }
  );
});

// READ All Offers
app.get('/api/offers', (req, res) => {
  connection.query('SELECT * FROM offers', (err, results) => {
    if (err) {
      console.error('Error fetching offers:', err);
      return res.status(420).send({ "status": 420, "message": 'Failed to retrieve offers' });
    }

    return res.status(200).json({
      "status":"200",
      "message": 'Successful',
      "results" :results});
  });
});

// READ One Offer by ID
app.get('/api/offers/:id', (req, res) => {
  const offerId = req.params.id;

  connection.query('SELECT * FROM offers WHERE offer_id = ?', [offerId], (err, results) => {
    if (err) {
      console.error('Error fetching offer:', err);
      return res.status(420).send({ "status:": 420, "message": 'Failed to retrieve offer' });
    }

    if (results.length === 0) {
      return res.status(404).send({ "status": 404, "message": 'Offer not found' });
    }

    return res.status(200).json({
      "status":"200",
      "message": 'Successful',
      "results" :results[0]});
  });
});

// UPDATE Offer
app.put('/api/offers/:id', (req, res) => {
  const offerId = req.params.id;
  const {
    title,
    description,
    discount_type,
    offer_type,
    discount_value,
    valid_from,
    valid_to,
    is_active
  } = req.body;

  const validFrom = new Date('2025-12-01T00:00:00Z').toISOString().slice(0, 19).replace('T', ' ');
  const validTo = new Date('2025-12-31T23:59:59Z').toISOString().slice(0, 19).replace('T', ' ');
  const query = `
    UPDATE offers SET
      title = ?, description = ?, discount_type = ?, offer_type = ?, discount_value = ?,
      valid_from = ?, valid_to = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE offer_id = ?
  `;

  connection.query(
    query,
    [
      title,
      description,
      discount_type,
      offer_type,
      discount_value,
      validFrom,
      validTo,
      is_active,
      offerId
    ],
    (err, result) => {
      if (err) {
        console.error('Error updating offer:', err);
        return res.status(420).send({ "status": 420, "message": 'Failed to update offer' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).send({ "status": 404, "message": 'Offer not found' });
      }

      return res.status(200).send({ "status": 200, "message": 'Offer updated successfully' });
    }
  );
});

// DELETE Offer
app.delete('/api/offers/:id', (req, res) => {
  const offerId = req.params.id;

  connection.query('DELETE FROM offers WHERE offer_id = ?', [offerId], (err, result) => {
    if (err) {
      console.error('Error deleting offer:', err);
      return res.status(420).send({ "status": 420, "message": 'Failed to delete offer' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ "status": 404, "message": 'Offer not found' });
    }

    return res.status(200).send({ "status": 200, "message": 'Offer deleted successfully' });
  });
});

// ADD saved-location
app.post('/api/saved-locations', (req, res) => {
  const { customer_uuid, label, latitude, longitude, address } = req.body;

  if (!customer_uuid || !label || latitude == null || longitude == null) {
    return res.status(400).json({ "status": 400, "message": 'Missing required fields' });
  }

  const location_id = crypto.randomUUID();

  connection.query(
    `INSERT INTO saved_locations 
    (location_id, customer_uuid, label, latitude, longitude, address) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [location_id, customer_uuid, label, latitude, longitude, address || null],
    (err) => {
      if (err) {
        console.error('Error saving location:', err);
        return res.status(420).json({ "status": 420, "message": 'Internal server error' });
      }
      res.status(200).json({
        "status": 200, "message": 'Location saved successfully',
        "location id" : location_id,
      });
    }
  );
});

// GET ALL saved-locations
app.get('/api/saved-locations', (req, res) => {
  const { customer_uuid } = req.query;

  let query = 'SELECT * FROM saved_locations';
  const params = [];

  if (customer_uuid) {
    query += ' WHERE customer_uuid = ?';
    params.push(customer_uuid);
  }

  connection.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching locations:', err);
      return res.status(420).json({ "status": 420, "message": 'Internal server error' });
    }
    res.status(200).json({
      "status":"200",
      "message": 'Successful',
      "results" :results});
  });
});

// GET location from location-id
app.get('/api/saved-locations/:id', (req, res) => {
  const { id } = req.params;

  connection.query(
    'SELECT * FROM saved_locations WHERE location_id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('Error fetching location:', err);
        return res.status(420).json({ "status": 420, "message": 'Internal server error' });
      }
      if (results.length === 0) {
        return res.status(404).json({"status": 404, "message": 'Location not found' });
      }
      res.status(200).json({
      "status":"200",
      "message": 'Successful',
      "results" :results[0]});
    }
  );
});

// UPDATE location
app.put('/api/saved-locations/:id', (req, res) => {
  const { id } = req.params;
  const { label, latitude, longitude, address } = req.body;

  connection.query(
    `UPDATE saved_locations 
     SET label = ?, latitude = ?, longitude = ?, address = ? 
     WHERE location_id = ?`,
    [label, latitude, longitude, address, id],
    (err, result) => {
      if (err) {
        console.error('Error updating location:', err);
        return res.status(420).json({ "status": 420, "message" :'Internal server error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ "status": 404, "message": 'Location not found' });
      }
      res.status(200).json({ "status": 200, "message": 'Location updated' });
    }
  );
});

// DELETE location
app.delete('/api/saved-locations/:id', (req, res) => {
  const { id } = req.params;

  connection.query(
    'DELETE FROM saved_locations WHERE location_id = ?',
    [id],
    (err, result) => {
      if (err) {
        console.error('Error deleting location:', err);
        return res.status(420).json({ "status": 420, "message": 'Internal server error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ "status": 404, "message": 'Location not found' });
      }
      res.status(200).json({"status": 200, "message": 'Location deleted' });
    }
  );
});

// Add metadata to a transaction
app.post('/api/transactions-meta', (req, res) => {
  const meta_id = crypto.randomUUID();  // <-- Generate UUID here
  const { transaction_id, meta_key, value } = req.body;

  if (!transaction_id || !meta_key) {
    return res.status(400).json({ "status": 400, "message": 'transaction_id and meta_key are required' });
  }

  const query = `
    INSERT INTO transactions_meta (meta_id, transaction_id, meta_key, value)
    VALUES (?, ?, ?, ?)
  `;
  connection.query(query, [meta_id, transaction_id, meta_key, value], (err, results) => {
    if (err) {
      console.error('Error inserting transaction meta:', err);
      return res.status(420).json({ "status": 420, "message": err.message });
    }
    res.status(200).json({ "status": 200, "message": 'Meta created successfully', "meta id" : meta_id });
  });
});

//Read all data from transactions_meta
app.get('/api/transactions-meta', (req, res) => {
  connection.query('SELECT * FROM transactions_meta', (err, results) => {
    if (err) {
      console.error('Error fetching transaction meta:', err);
      return res.status(420).json({ "status": 420, "message": 'Internal server error' });
    }
    res.status(200).json({
      "status":"200",
      "message": 'Successful',
      "results" : results});
  });
});

//Read transactions for specific meta_id
app.get('/api/transactions-meta/:meta_id', (req, res) => {
  const { meta_id } = req.params;

  connection.query('SELECT * FROM transactions_meta WHERE meta_id = ?', [meta_id], (err, results) => {
    if (err) {
      console.error('Error fetching transaction meta:', err);
      return res.status(420).json({ "status": 420, "message": 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ "status": 404, "message": 'Transaction meta not found' });
    }
    res.status(200).json({
      "status":"200",
      "message": 'Successful',
      "results" :results[0]});
  });
});

//Update transactiona_id
app.put('/api/transactions-meta/:meta_id', (req, res) => {
  const { meta_id } = req.params;
  const { meta_key, value } = req.body;

  connection.query(
    `UPDATE transactions_meta SET meta_key = ?, value = ? WHERE meta_id = ?`,
    [meta_key, value, meta_id],
    (err, result) => {
      if (err) {
        console.error('Error updating transaction meta:', err);
        return res.status(420).json({ "status": 420, "message": 'Internal server error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ "status": 404, "message": 'Transaction meta not found' });
      }
      res.status(200).json({ "status": 200, "message": 'Transaction meta updated successfully' });
    }
  );
});

//Delete transactions_meta data
app.delete('/api/transactions-meta/:meta_id', (req, res) => {
  const { meta_id } = req.params;

  connection.query('DELETE FROM transactions_meta WHERE meta_id = ?', [meta_id], (err, result) => {
    if (err) {
      console.error('Error deleting transaction meta:', err);
      return res.status(420).json({ "status": 420, "message": 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ "status": 404, "message": 'Transaction meta not found' });
    }
    res.status(200).json({ "status": 200, "message": 'Transaction meta deleted successfully' });
  });
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
