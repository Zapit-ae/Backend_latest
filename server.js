import express from 'express';
import mysql from 'mysql';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// read from schema.sql file
import fs from 'fs';
const schema = fs.readFileSync('schema.sql', 'utf8');

const app = express();


const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'zappit',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the database');
  }
});


connection.query(schema);

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

const port = 8080;
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
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