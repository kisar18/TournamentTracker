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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server běží' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server běží na http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api/tournaments`);
});
