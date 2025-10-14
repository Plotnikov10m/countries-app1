const express = require('express');
const router = express.Router();
const db = require('../db');

// Get user by ID
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row || {});
    });
});

// Create new user
router.post('/', (req, res) => {
    const { username, email } = req.body;
    db.run('INSERT INTO users (username, email) VALUES (?, ?)', [username, email], function(err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ id: this.lastID, username, email });
    });
});

module.exports = router;