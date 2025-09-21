import express from 'express';
import connection  from '../db.js';

const router = express.Router();

// CRUD operations for terminals
router.post('/', (req, res) => {
  connection.query('INSERT INTO terminals SET ?', req.body, (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).send({ message: 'Terminal created', id: result.insertId });
  });
});

router.get('/', (req, res) => {
  connection.query('SELECT * FROM terminals', (err, rows) => {
    if (err) return res.status(500).send(err);
    res.send(rows);
  });
});

router.put('/:id', (req, res) => {
  connection.query('UPDATE terminals SET ? WHERE id = ?', [req.body, req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Terminal updated' });
  });
});

router.delete('/:id', (req, res) => {
  connection.query('DELETE FROM terminals WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ message: 'Terminal deleted' });
  });
});

export default router;
