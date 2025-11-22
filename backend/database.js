import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'tournaments.db');

let db;

// Initialize database
const initDB = async () => {
  const SQL = await initSqlJs();
  
  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tournaments table
  db.run(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nazev TEXT NOT NULL,
      typ TEXT NOT NULL,
      maxPocetHracu INTEGER NOT NULL,
      datum TEXT NOT NULL,
      misto TEXT NOT NULL,
      popis TEXT,
      status TEXT DEFAULT 'nadchazejici',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  saveDB();
  console.log('✅ Databáze inicializována');
};

// Save database to file
const saveDB = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
};

// Get database instance
const getDB = () => db;

export { initDB, getDB, saveDB };
