const express = require('express');
const router = express.Router();
const db = require('../db');

// Get user's wishlist
router.get('/:userId', (req, res) => {
    db.all(
        `SELECT * FROM wishlist WHERE user_id = ? ORDER BY added_date DESC`,
        [req.params.userId],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(rows);
        }
    );
});

// Add country to wishlist
router.post('/:userId', (req, res) => {
    const { country_code, country_name, rating, notes } = req.body;
    db.run(
        `INSERT INTO wishlist (user_id, country_code, country_name, rating, notes) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.params.userId, country_code, country_name, rating || 0, notes || ''],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({
                id: this.lastID,
                user_id: req.params.userId,
                country_code,
                country_name,
                rating: rating || 0,
                notes: notes || ''
            });
        }
    );
});

// Update wishlist item
router.put('/:userId/:countryCode', (req, res) => {
    const { rating, notes } = req.body;
    db.run(
        `UPDATE wishlist SET rating = ?, notes = ? 
         WHERE user_id = ? AND country_code = ?`,
        [rating, notes, req.params.userId, req.params.countryCode],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ updated: this.changes });
        }
    );
});

// Remove from wishlist
router.delete('/:userId/:countryCode', (req, res) => {
    db.run(
        `DELETE FROM wishlist WHERE user_id = ? AND country_code = ?`,
        [req.params.userId, req.params.countryCode],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ deleted: this.changes });
        }
    );
});

module.exports = router;