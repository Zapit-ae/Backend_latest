import express from 'express';
import mysql from 'mysql';
import crypto from 'crypto';

// read from schema.sql file
import fs from 'fs';
const schema = fs.readFileSync('schema.sql', 'utf8');

const app = express();
const port = 8080; // Default port for MariaDB is 3306

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'zappit'
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

app.post('/api/register', (req, res) => {
  const { email, password, phone_number, full_name } = req.body;

  if (!email || !password || !phone_number || !full_name) {
    return res.status(400).send({
      status: 400,
      message: "Missing required fields. Please provide email, password, phone number, and full name.",
    });
  }

  const emailRegex = /.+@.+/;
  if (!emailRegex.test(email)) {
    return res.status(400).send({
      status: 400,
      message: "Invalid email format. Please provide a valid email address.",
    });
  }

  const hash = crypto.createHash('md5');
  hash.update(password);
  const hashedPassword = hash.digest('hex');

  connection.query('INSERT INTO users (email, password, phone_number, full_name) VALUES (?, ?, ?, ?) RETURNING uuid',
    [email, hashedPassword, phone_number, full_name], (error, results) => {
      if (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).send({
            status: 409,
            message: "Email already in use",
          });
        }
        console.error('Error inserting user:', error);
        return res.status(500).send({
          status: 500,
          message: "Internal Server Error. Please try again later.",
        });
      }

      res.status(201).send({
        status: 201,
        message: "User registered successfully",
        uuid: results[0].uuid,
      });
    });
});

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    console.log('Server closed');
  });
  connection.end();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);