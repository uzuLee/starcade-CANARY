const fs = require('fs');
const path = require('path');
const config = require('./config');

const DB_FILE = path.join(__dirname, '..', config.dbFile);

// Helper to read/write mock DB
const readDb = () => {
    if (!fs.existsSync(DB_FILE)) {
        return { users: [], onlineUsers: {}, scores: [] };
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const db = JSON.parse(data);
    // Ensure scores array exists even if old db.json doesn't have it
    if (!db.scores) {
        db.scores = [];
    }
    return db;
};

const writeDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Initialize DB if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    writeDb({ users: [], onlineUsers: {}, scores: [] });
}

module.exports = {
    readDb,
    writeDb
};