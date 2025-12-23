import { getDB, saveDB } from '../database.js';
import { rowsToObjects, rowToObject, getSingleValue } from '../utils/dbHelpers.js';

export const getPlayers = (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT * FROM players WHERE tournament_id = ? ORDER BY poradi ASC, jmeno ASC', [parseInt(req.params.id)]);
    const players = rowsToObjects(result);
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Chyba při načítání hráčů' });
  }
};

export const addPlayer = (req, res) => {
  try {
    const { jmeno: name } = req.body;
    const tournamentId = parseInt(req.params.id);

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Jméno hráče je povinné' });
    }

    const db = getDB();

    // Check tournament exists
    const tournamentResult = db.exec('SELECT id FROM tournaments WHERE id = ?', [tournamentId]);
    const tournament = rowToObject(tournamentResult);

    if (!tournament) {
      return res.status(404).json({ error: 'Turnaj nebyl nalezen' });
    }

    // Determine next order within tournament
    const maxOrderRes = db.exec('SELECT COALESCE(MAX(poradi), 0) FROM players WHERE tournament_id = ?', [tournamentId]);
    const nextOrder = getSingleValue(maxOrderRes, 0) + 1;

    db.run('INSERT INTO players (tournament_id, jmeno, poradi) VALUES (?, ?, ?)', [tournamentId, name.trim(), nextOrder]);
    saveDB();

    const result = db.exec('SELECT * FROM players ORDER BY id DESC LIMIT 1');
    const newPlayer = rowToObject(result);

    res.status(201).json(newPlayer || { error: 'Chyba při vytváření hráče' });
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Chyba při přidávání hráče' });
  }
};

export const deletePlayer = (req, res) => {
  try {
    const db = getDB();
    db.run('DELETE FROM players WHERE id = ?', [parseInt(req.params.id)]);
    saveDB();
    res.json({ message: 'Hráč byl úspěšně smazán' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Chyba při mazání hráče' });
  }
};

export const updatePlayerOrder = (req, res) => {
  try {
    const db = getDB();
    const tournamentId = parseInt(req.params.id);
    const { order } = req.body || {};

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'Neplatný formát pořadí hráčů' });
    }

    // Validate that provided IDs belong to this tournament
    const idsRes = db.exec('SELECT id FROM players WHERE tournament_id = ?', [tournamentId]);
    const existingIds = rowsToObjects(idsRes).map(r => r.id);
    const setExisting = new Set(existingIds);
    for (const pid of order) {
      if (!setExisting.has(pid)) {
        return res.status(400).json({ error: 'Seznam obsahuje hráče mimo tento turnaj' });
      }
    }

    // Apply ordering: poradi = position index + 1
    let pos = 1;
    for (const pid of order) {
      db.run('UPDATE players SET poradi = ? WHERE id = ?', [pos++, pid]);
    }
    saveDB();

    res.json({ message: 'Pořadí hráčů aktualizováno' });
  } catch (error) {
    console.error('Error updating player order:', error);
    res.status(500).json({ error: 'Chyba při aktualizaci pořadí hráčů' });
  }
};
