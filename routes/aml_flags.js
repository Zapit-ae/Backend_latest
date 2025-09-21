import express from 'express';
import connection from '../db.js';

const router = express.Router();

// CRUD operations for terminals
// CREATE
router.post('/', (req, res) => {
  const data = req.body;
  connection.query('INSERT INTO aml_flags SET ?', data, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, ...data });
  });
});

// READ
router.get('/', (req, res) => {
  connection.query('SELECT * FROM aml_flags', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

// UPDATE
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  connection.query('UPDATE aml_flags SET ? WHERE id = ?', [data, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'AML flag updated', id });
  });
});

// DELETE
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM aml_flags WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'AML flag deleted', id });
  });
});

export default router;