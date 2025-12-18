import { getDB, saveDB } from '../database.js';
import { rowsToObjects, rowToObject, getSingleValue } from '../utils/dbHelpers.js';

export const getPlayers = (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT * FROM players WHERE tournament_id = ? ORDER BY jmeno ASC', [parseInt(req.params.id)]);
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

    // Check tournament exists and max players
    const tournamentResult = db.exec('SELECT maxPocetHracu FROM tournaments WHERE id = ?', [tournamentId]);
    const maxPlayers = getSingleValue(tournamentResult);

    if (!maxPlayers) {
      return res.status(404).json({ error: 'Turnaj nebyl nalezen' });
    }

    // Check current player count
    const playerCountResult = db.exec('SELECT COUNT(*) FROM players WHERE tournament_id = ?', [tournamentId]);
    const playerCount = getSingleValue(playerCountResult, 0);

    if (playerCount >= maxPlayers) {
      return res.status(400).json({ error: `Maximální počet hráčů (${maxPlayers}) byl dosažen` });
    }

    db.run('INSERT INTO players (tournament_id, jmeno) VALUES (?, ?)', [tournamentId, name.trim()]);
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
