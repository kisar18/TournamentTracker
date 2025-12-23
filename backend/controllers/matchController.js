import { getDB, saveDB } from '../database.js';
import { rowsToObjects, rowToObject, getSingleValue } from '../utils/dbHelpers.js';
import { generateRoundRobinMatches, generateEliminationMatches, generateMixedMatches, generateGroupedRoundRobinMatches, generateRoundRobinMatchesBerger } from '../matchGenerator.js';

export const startTournament = (req, res) => {
  try {
    const db = getDB();
    const tournamentId = parseInt(req.params.id);

    // Get tournament
    const tournamentResult = db.exec('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
    const tournament = rowToObject(tournamentResult);

    if (!tournament) {
      return res.status(404).json({ error: 'Turnaj nebyl nalezen' });
    }

    if (tournament.status !== 'nadchazejici') {
      return res.status(400).json({ error: 'Turnaj již byl zahájen' });
    }

    // Get players in seeded order (poradi) for alternating group assignment
    const playersResult = db.exec('SELECT * FROM players WHERE tournament_id = ? ORDER BY poradi ASC, jmeno ASC', [tournamentId]);
    const players = rowsToObjects(playersResult);

    if (players.length < 2) {
      return res.status(400).json({ error: 'Turnaj musí mít alespoň 2 hráče' });
    }

    // Generate matches
    let matches = [];
    switch (tournament.typ) {
      case 'skupina':
        if (tournament.pocetSkupin && tournament.pocetSkupin > 1) {
          matches = generateGroupedRoundRobinMatches(players, tournament.pocetSkupin, 'berger');
        } else {
          matches = generateRoundRobinMatchesBerger(players);
        }
        break;
      case 'pavouk':
        matches = generateEliminationMatches(players);
        break;
      case 'smiseny':
        matches = generateMixedMatches(
          players,
          tournament.pocetSkupin && tournament.pocetSkupin > 0 ? tournament.pocetSkupin : undefined,
          'berger'
        );
        break;
      default:
        return res.status(400).json({ error: 'Neznámý typ turnaje' });
    }

    // Insert matches
    matches.forEach(match => {
      db.run(
        'INSERT INTO matches (tournament_id, round, match_number, player1_id, player2_id, status) VALUES (?, ?, ?, ?, ?, ?)',
        [tournamentId, match.round, match.match_number, match.player1_id, match.player2_id, match.status]
      );
    });

    // Update tournament status
    db.run('UPDATE tournaments SET status = ? WHERE id = ?', ['probiha', tournamentId]);
    saveDB();

    res.json({
      message: 'Turnaj byl úspěšně zahájen',
      matchesGenerated: matches.length
    });
  } catch (error) {
    console.error('Error starting tournament:', error);
    res.status(500).json({ error: 'Chyba při zahájení turnaje' });
  }
};

export const getMatches = (req, res) => {
  try {
    const db = getDB();
    const tournamentId = parseInt(req.params.id);

    const result = db.exec(`
      SELECT 
        m.*,
        p1.jmeno as player1_name,
        p2.jmeno as player2_name,
        w.jmeno as winner_name
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players w ON m.winner_id = w.id
      WHERE m.tournament_id = ?
      ORDER BY m.round, m.match_number
    `, [tournamentId]);

    const matches = rowsToObjects(result);

    // Derive group letter (A, B, ...) and per-group match numbering for round-robin groups
    const groupCounters = new Map();
    matches.forEach(m => {
      if (m.round < 900) {
        const groupIndex = m.round >= 100 ? Math.floor(m.round / 100) - 1 : 0; // 0-based
        const groupLetter = String.fromCharCode(65 + groupIndex);
        const nextNumber = (groupCounters.get(groupIndex) || 0) + 1;
        groupCounters.set(groupIndex, nextNumber);
        m.groupLetter = groupLetter;
        m.matchNumberInGroup = nextNumber;
      }
    });

    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Chyba při načítání zápasů' });
  }
};

export const updateMatchResult = (req, res) => {
  try {
    const db = getDB();
    const matchId = parseInt(req.params.id);
    const { player1_score, player2_score } = req.body || {};

    if (player1_score === undefined || player2_score === undefined) {
      return res.status(400).json({ error: 'Chybí výsledek zápasu' });
    }

    const s1 = parseInt(player1_score);
    const s2 = parseInt(player2_score);

    // Validate scores (BO5: 3:0, 3:1, 3:2, 2:3, 1:3, 0:3)
    const allowed = (s1 === 3 && [0, 1, 2].includes(s2)) || (s2 === 3 && [0, 1, 2].includes(s1));
    if (!allowed) {
      return res.status(400).json({ error: 'Neplatný výsledek. Povolené: 3:0, 3:1, 3:2, 2:3, 1:3, 0:3' });
    }

    // Get match
    const matchResult = db.exec('SELECT * FROM matches WHERE id = ?', [matchId]);
    const match = rowToObject(matchResult);

    if (!match) {
      return res.status(404).json({ error: 'Zápas nenalezen' });
    }

    // Determine winner
    const winner_id = s1 > s2 ? match.player1_id : match.player2_id;

    // Update match
    db.run(
      "UPDATE matches SET player1_score = ?, player2_score = ?, winner_id = ?, status = 'ukonceny' WHERE id = ?",
      [s1, s2, winner_id, matchId]
    );
    saveDB();

    // Auto-generate next playoff round if applicable
    const autoGeneratedNextRound = autoGenerateNextPlayoffRound(db, match);

    // Return updated match
    const updated = db.exec(`
      SELECT m.*, p1.jmeno as player1_name, p2.jmeno as player2_name, w.jmeno as winner_name
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players w ON m.winner_id = w.id
      WHERE m.id = ?
    `, [matchId]);

    const updatedMatch = rowToObject(updated);
    updatedMatch.autoGeneratedNextRound = autoGeneratedNextRound;
    res.json(updatedMatch);
  } catch (error) {
    console.error('Error updating match result:', error);
    res.status(500).json({ error: 'Chyba při ukládání výsledku zápasu' });
  }
};

export const resetMatchResult = (req, res) => {
  try {
    const db = getDB();
    const matchId = parseInt(req.params.id);

    const matchRes = db.exec('SELECT id FROM matches WHERE id = ?', [matchId]);
    if (!rowToObject(matchRes)) {
      return res.status(404).json({ error: 'Zápas nenalezen' });
    }

    db.run(
      "UPDATE matches SET player1_score = NULL, player2_score = NULL, winner_id = NULL, status = 'nehrany', table_number = NULL WHERE id = ?",
      [matchId]
    );
    saveDB();

    const updated = db.exec(`
      SELECT m.*, p1.jmeno as player1_name, p2.jmeno as player2_name
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      WHERE m.id = ?
    `, [matchId]);

    res.json(rowToObject(updated));
  } catch (error) {
    console.error('Error resetting match result:', error);
    res.status(500).json({ error: 'Chyba při resetování výsledku zápasu' });
  }
};

export const updateMatchState = (req, res) => {
  try {
    const db = getDB();
    const matchId = parseInt(req.params.id);
    const { status, table_number } = req.body || {};

    if (status === undefined && table_number === undefined) {
      return res.status(400).json({ error: 'Neurčen žádný parametr ke změně' });
    }

    const allowedStatuses = ['nehrany', 'probiha', 'ukonceny'];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Neplatný stav zápasu' });
    }

    const matchRes = db.exec('SELECT * FROM matches WHERE id = ?', [matchId]);
    const match = rowToObject(matchRes);
    if (!match) {
      return res.status(404).json({ error: 'Zápas nenalezen' });
    }

    let tableNoToSet = table_number;
    if (tableNoToSet === '' || tableNoToSet === null) {
      tableNoToSet = null;
    }
    if (tableNoToSet !== undefined && tableNoToSet !== null) {
      const parsed = parseInt(tableNoToSet);
      if (Number.isNaN(parsed) || parsed < 1) {
        return res.status(400).json({ error: 'Číslo stolu musí být kladné' });
      }

      const tRes = db.exec('SELECT pocetStolu FROM tournaments WHERE id = ?', [match.tournament_id]);
      const tournament = rowToObject(tRes);
      const maxTables = tournament?.pocetStolu || 1;
      if (parsed > maxTables) {
        return res.status(400).json({ error: `K dispozici je pouze ${maxTables} stolů` });
      }
      tableNoToSet = parsed;
    }

    const updates = [];
    const params = [];
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (tableNoToSet !== undefined) {
      updates.push('table_number = ?');
      params.push(tableNoToSet);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nic k aktualizaci' });
    }

    params.push(matchId);
    db.run(`UPDATE matches SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDB();

    const updated = db.exec(`
      SELECT m.*, p1.jmeno as player1_name, p2.jmeno as player2_name, w.jmeno as winner_name
      FROM matches m
      LEFT JOIN players p1 ON m.player1_id = p1.id
      LEFT JOIN players p2 ON m.player2_id = p2.id
      LEFT JOIN players w ON m.winner_id = w.id
      WHERE m.id = ?
    `, [matchId]);

    res.json(rowToObject(updated));
  } catch (error) {
    console.error('Error updating match state:', error);
    res.status(500).json({ error: 'Chyba při ukládání stavu zápasu' });
  }
};

// Helper: Auto-generate next playoff round
function autoGenerateNextPlayoffRound(db, match) {
  if (match.round < 900) return false;

  // Check tournament type
  const tRes = db.exec('SELECT typ FROM tournaments WHERE id = ?', [match.tournament_id]);
  const tournament = rowToObject(tRes);
  
  if (!tournament || tournament.typ !== 'smiseny') return false;

  // Check if all matches in current round are finished
  const unfinishedRes = db.exec(
    "SELECT COUNT(*) FROM matches WHERE tournament_id = ? AND round = ? AND status != 'ukonceny'",
    [match.tournament_id, match.round]
  );
  const unfinishedCount = getSingleValue(unfinishedRes, 0);

  if (unfinishedCount > 0) return false;

  // Check if next round already exists
  const nextRoundRes = db.exec(
    'SELECT COUNT(*) FROM matches WHERE tournament_id = ? AND round = ?',
    [match.tournament_id, match.round + 1]
  );
  const nextRoundExists = getSingleValue(nextRoundRes, 0) > 0;

  if (nextRoundExists) return false;

  // Get winners from current round
  const matchesRes = db.exec(
    'SELECT * FROM matches WHERE tournament_id = ? AND round = ? ORDER BY match_number',
    [match.tournament_id, match.round]
  );
  const matches = rowsToObjects(matchesRes);
  const winners = matches.map(m => m.winner_id).filter(id => id !== null);

  // Need at least 2 winners to create next round
  if (winners.length < 2) return false;

  // Create next round matches
  const nextRound = match.round + 1;
  let matchNo = 1;
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      db.run(
        "INSERT INTO matches (tournament_id, round, match_number, player1_id, player2_id, status) VALUES (?, ?, ?, ?, ?, 'nehrany')",
        [match.tournament_id, nextRound, matchNo++, winners[i], winners[i + 1]]
      );
    }
  }

  saveDB();
  return true;
}
