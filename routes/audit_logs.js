import express from 'express';
import connection  from '../db.js';

const router = express.Router();

// CRUD operations for audit logs
router.post('/', (req, res) => {
    const data = req.body;
    connection.query('INSERT INTO audit_logs SET ?', data, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, ...data });
  });
});

router.get('/', (req, res) => {
  connection.query('SELECT * FROM audit_logs', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(results);
  });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  connection.query('UPDATE audit_logs SET ? WHERE id = ?', [data, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Audit log updated', id });
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM audit_logs WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: 'Audit log deleted', id });
  });
});

export default router;
