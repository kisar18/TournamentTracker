import express from 'express';
import cors from 'cors';
import { initDB, getDB, saveDB } from './database.js';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
await initDB();

// API Routes

// GET all tournaments
app.get('/api/tournaments', (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT * FROM tournaments ORDER BY datum DESC');
    
    if (result.length === 0) {
      return res.json([]);
    }

    const columns = result[0].columns;
    const values = result[0].values;
    
    const tournaments = values.map(row => {
      const tournament = {};
      columns.forEach((col, index) => {
        tournament[col] = row[index];
      });
      return tournament;
    });

    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Chyba při načítání turnajů' });
  }
});

// GET single tournament by ID
app.get('/api/tournaments/:id', (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT * FROM tournaments WHERE id = ?', [parseInt(req.params.id)]);
    
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Turnaj nenalezen' });
    }

    const columns = result[0].columns;
    const values = result[0].values[0];
    
    const tournament = {};
    columns.forEach((col, index) => {
      tournament[col] = values[index];
    });

    res.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Chyba při načítání turnaje' });
  }
});

// POST create new tournament
app.post('/api/tournaments', (req, res) => {
  try {
    const { nazev, typ, maxPocetHracu, datum, misto, popis } = req.body;

    // Validation
    if (!nazev || !typ || !maxPocetHracu || !datum || !misto) {
      return res.status(400).json({ error: 'Chybí povinná pole' });
    }

    const db = getDB();
    
    db.run(`
      INSERT INTO tournaments (nazev, typ, maxPocetHracu, datum, misto, popis)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [nazev, typ, parseInt(maxPocetHracu), datum, misto, popis || '']);

    saveDB();

    // Get the last inserted tournament
    const result = db.exec('SELECT * FROM tournaments ORDER BY id DESC LIMIT 1');
    
    if (result.length > 0) {
      const columns = result[0].columns;
      const values = result[0].values[0];
      
      const newTournament = {};
      columns.forEach((col, index) => {
        newTournament[col] = values[index];
      });
      
      res.status(201).json(newTournament);
    } else {
      res.status(500).json({ error: 'Chyba při vytváření turnaje' });
    }
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({ error: 'Chyba při vytváření turnaje' });
  }
});

// PUT update tournament
app.put('/api/tournaments/:id', (req, res) => {
  try {
    const { nazev, typ, maxPocetHracu, datum, misto, popis, status } = req.body;
    const db = getDB();
    
    db.run(`
      UPDATE tournaments 
      SET nazev = ?, typ = ?, maxPocetHracu = ?, datum = ?, misto = ?, popis = ?, status = ?
      WHERE id = ?
    `, [nazev, typ, parseInt(maxPocetHracu), datum, misto, popis || '', status || 'nadchazejici', parseInt(req.params.id)]);

    saveDB();

    // Get updated tournament
    const result = db.exec('SELECT * FROM tournaments WHERE id = ?', [parseInt(req.params.id)]);
    
    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: 'Turnaj nenalezen' });
    }

    const columns = result[0].columns;
    const values = result[0].values[0];
    
    const updatedTournament = {};
    columns.forEach((col, index) => {
      updatedTournament[col] = values[index];
    });

    res.json(updatedTournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(500).json({ error: 'Chyba při aktualizaci turnaje' });
  }
});

// DELETE tournament
app.delete('/api/tournaments/:id', (req, res) => {
  try {
    const db = getDB();
    db.run('DELETE FROM tournaments WHERE id = ?', [parseInt(req.params.id)]);
    saveDB();
    
    res.json({ message: 'Turnaj byl úspěšně smazán' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Chyba při mazání turnaje' });
  }
});

// ============ PLAYER ENDPOINTS ============

// GET all players for a tournament
app.get('/api/tournaments/:id/players', (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT * FROM players WHERE tournament_id = ? ORDER BY jmeno ASC', [parseInt(req.params.id)]);
    
    if (result.length === 0) {
      return res.json([]);
    }

    const columns = result[0].columns;
    const values = result[0].values;
    
    const players = values.map(row => {
      const player = {};
      columns.forEach((col, index) => {
        player[col] = row[index];
      });
      return player;
    });

    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Chyba při načítání hráčů' });
  }
});

// POST add new player to tournament
app.post('/api/tournaments/:id/players', (req, res) => {
  try {
    const { jmeno } = req.body;
    const tournament_id = parseInt(req.params.id);

    // Validation
    if (!jmeno || jmeno.trim() === '') {
      return res.status(400).json({ error: 'Jméno hráče je povinné' });
    }

    const db = getDB();

    // Check tournament exists
    const tournamentResult = db.exec('SELECT maxPocetHracu FROM tournaments WHERE id = ?', [tournament_id]);
    if (tournamentResult.length === 0 || tournamentResult[0].values.length === 0) {
      return res.status(404).json({ error: 'Turnaj nebyl nalezen' });
    }

    const maxPocetHracu = tournamentResult[0].values[0][0];

    // Check player count limit
    const playerCountResult = db.exec('SELECT COUNT(*) FROM players WHERE tournament_id = ?', [tournament_id]);
    const playerCount = playerCountResult[0].values[0][0];

    if (playerCount >= maxPocetHracu) {
      return res.status(400).json({ error: `Maximální počet hráčů (${maxPocetHracu}) byl dosažen` });
    }

    db.run(`
      INSERT INTO players (tournament_id, jmeno)
      VALUES (?, ?)
    `, [tournament_id, jmeno.trim()]);

    saveDB();

    // Get the newly created player
    const result = db.exec('SELECT * FROM players ORDER BY id DESC LIMIT 1');
    
    if (result.length > 0) {
      const columns = result[0].columns;
      const values = result[0].values[0];
      
      const newPlayer = {};
      columns.forEach((col, index) => {
        newPlayer[col] = values[index];
      });
      
      res.status(201).json(newPlayer);
    } else {
      res.status(500).json({ error: 'Chyba při vytváření hráče' });
    }
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Chyba při přidávání hráče' });
  }
});

// DELETE player from tournament
app.delete('/api/players/:id', (req, res) => {
  try {
    const db = getDB();
    db.run('DELETE FROM players WHERE id = ?', [parseInt(req.params.id)]);
    saveDB();
    
    res.json({ message: 'Hráč byl úspěšně smazán' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Chyba při mazání hráče' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server běží' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server běží na http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/tournaments`);
});
