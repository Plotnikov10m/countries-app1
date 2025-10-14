const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'countries.db');
const db = new sqlite3.Database(dbPath);

// Initialize database
db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Wishlist table
    db.run(`CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        country_code TEXT NOT NULL,
        country_name TEXT NOT NULL,
        rating INTEGER DEFAULT 0,
        notes TEXT,
        added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, country_code)
    )`);

    // Create default user for demo
    db.run(`INSERT OR IGNORE INTO users (username, email) VALUES ('demo', 'demo@example.com')`);
    
    console.log('✅ Database initialized successfully');
});

module.exports = db;