const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'universe.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Create constellations table
  db.run(`
    CREATE TABLE IF NOT EXISTS constellations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create memories table
  db.run(`
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      constellation_id INTEGER NOT NULL,
      star_index INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (constellation_id) REFERENCES constellations(id) ON DELETE CASCADE,
      UNIQUE(constellation_id, star_index)
    )
  `);

  // Create default constellation if it doesn't exist
  db.run(`
    INSERT OR IGNORE INTO constellations (name) VALUES ('GAURI')
  `, (err) => {
    if (!err) {
      console.log('Default constellation "GAURI" initialized');
    }
  });
}

// Generic database query helper
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Get single row
const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Run insert/update/delete
const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

module.exports = {
  query,
  queryOne,
  run,
  db
};
