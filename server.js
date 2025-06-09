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

// CREATE a payment method
app.post('/api/payment-method', (req, res) => {
  const { customer_uuid, type, label, details, is_active } = req.body;
  connection.query(
    'INSERT INTO payment_method (customer_uuid, type, label, details, is_active) VALUES (?, ?, ?, ?, ?)',
    [customer_uuid, type, label, JSON.stringify(details), is_active ?? true],
    (err, result) => {
      if (err) {
        console.error('Error inserting payment method:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
      res.status(201).json({
        payment_id: result.insertId,
        message: 'Payment method created'
      });
    }
  );
});

// READ all payment methods
app.get('/api/payment-method', (req, res) => {
  connection.query('SELECT * FROM payment_method', (err, results) => {
    if (err) {
      console.error('Error fetching payment methods:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    res.status(200).json(results);
  });
});

// READ one payment method by ID
app.get('/api/payment-method/:id', (req, res) => {
  const { id } = req.params;
  connection.query('SELECT * FROM payment_method WHERE payment_id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching payment method:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    res.status(200).json(results[0]);
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
        return res.status(500).json({ message: 'Internal server error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Payment method not found' });
      }
      res.status(200).json({ message: 'Payment method updated' });
    }
  );
});

// DELETE a payment method
app.delete('/api/payment-method/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM payment_method WHERE payment_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting payment method:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Payment method not found' });
    }
    res.status(200).json({ message: 'Payment method deleted' });
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


// handle graceful shutdown
function shutdown() {
  server.close(() => {
    console.log('Server closed');
  });
  connection.end();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

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