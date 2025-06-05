import fs from 'fs';
import mysql from 'mysql';
import dotenv from 'dotenv';

dotenv.config();

const options = {
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME ?? 'zappit',
};

// create temporary connection to create the schema
// by allowing multiple statements
const schemaConnection = mysql.createConnection({
  ...options,
  multipleStatements: true,
});

const schema = fs.readFileSync('schema.sql', 'utf8');
schemaConnection.query(schema);
schemaConnection.end();

// main connection without multiple statements
const connection = mysql.createConnection(options);

export default connection;