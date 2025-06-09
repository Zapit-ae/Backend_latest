import mysql from 'mysql';
import dotenv from 'dotenv';
import fs from 'fs';


function createConnection(allowMultipleStatements = false) {
  dotenv.config();
  if (process.env.DB_HOST === undefined || process.env.DB_USER === undefined || process.env.DB_PASS === undefined || process.env.DB_NAME === undefined) {
    console.error('Database connection parameters are not set in the environment variables.\n' +
      'Create a .env file in the root directory with the variables in .env.example');
    process.exit(1);
  }
  return mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: allowMultipleStatements,
  });
}

function runSchema() {
  const schema = fs.readFileSync('./schema.sql', 'utf8');
  const connection = createConnection(true);
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }
    connection.query(schema, (err) => {
      connection.end();
      if (err) {
        console.error('Error executing schema:', err);
        return;
      }
    });
  });

}

export default { createConnection, runSchema };