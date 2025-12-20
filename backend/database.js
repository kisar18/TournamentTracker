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
      pocetStolu INTEGER NOT NULL DEFAULT 1,
      status TEXT DEFAULT 'nadchazejici',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create players table
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      jmeno TEXT NOT NULL,
      poradi INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tournament_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      match_number INTEGER NOT NULL,
      player1_id INTEGER,
      player2_id INTEGER,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      winner_id INTEGER,
      status TEXT DEFAULT 'nehrany',
      table_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
      FOREIGN KEY (player1_id) REFERENCES players(id) ON DELETE SET NULL,
      FOREIGN KEY (player2_id) REFERENCES players(id) ON DELETE SET NULL,
      FOREIGN KEY (winner_id) REFERENCES players(id) ON DELETE SET NULL
    )
  `);

  // Migrations: add new columns when missing
  const hasColumn = (table, column) => {
    const res = db.exec(`PRAGMA table_info(${table})`);
    if (!res || !res[0] || !res[0].values) return false;
    return res[0].values.some(row => row[1] === column);
  };

  if (!hasColumn('tournaments', 'pocetStolu')) {
    db.run('ALTER TABLE tournaments ADD COLUMN pocetStolu INTEGER NOT NULL DEFAULT 1');
  }

  // Add optional number of groups for round-robin or mixed tournaments
  if (!hasColumn('tournaments', 'pocetSkupin')) {
    db.run('ALTER TABLE tournaments ADD COLUMN pocetSkupin INTEGER DEFAULT 1');
  }

  // Add schedule type (round-robin pattern): 'standard' | 'berger'
  if (!hasColumn('tournaments', 'rozpis')) {
    db.run("ALTER TABLE tournaments ADD COLUMN rozpis TEXT DEFAULT 'standard'");
  }

  if (!hasColumn('matches', 'table_number')) {
    db.run('ALTER TABLE matches ADD COLUMN table_number INTEGER');
  }

  // Add player ordering column if missing and initialize
  if (!hasColumn('players', 'poradi')) {
    db.run('ALTER TABLE players ADD COLUMN poradi INTEGER');
    // Initialize ordering to current id per tournament
    db.run('UPDATE players SET poradi = id WHERE poradi IS NULL');
  }

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
