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
  password: process.env.DB_PASS || 'Akshat123',
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

// Create an RTA ticket
app.post('/api/rta-ticket', (req, res) => {
  const {
    customeruu_id,
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
      (ticket_id, customeruu_id, rta_route, start_location, end_location, ticket_time, transaction_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [ticket_id, customeruu_id, rta_route, start_location, end_location, formattedTicketTime, transaction_id],
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
