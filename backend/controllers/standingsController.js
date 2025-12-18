import { getDB } from '../database.js';
import { rowsToObjects, rowToObject } from '../utils/dbHelpers.js';
import { computeStandings, groupMatchesByGroup } from '../utils/standingsCalculator.js';

export const getStandings = (req, res) => {
  try {
    const db = getDB();
    const tournamentId = parseInt(req.params.id);

    // Get tournament
    const tournamentResult = db.exec('SELECT * FROM tournaments WHERE id = ?', [tournamentId]);
    const tournament = rowToObject(tournamentResult);

    if (!tournament) {
      return res.status(404).json({ error: 'Turnaj nenalezen' });
    }

    // Get finished matches
    const matchesResult = db.exec(
      "SELECT m.* FROM matches m WHERE m.tournament_id = ? AND m.status = 'ukonceny'",
      [tournamentId]
    );
    const finishedMatches = rowsToObjects(matchesResult);

    // No standings for elimination tournaments
    if (tournament.typ === 'pavouk') {
      return res.json({ type: tournament.typ, standings: [] });
    }

    if (finishedMatches.length === 0) {
      return res.json({ type: tournament.typ, standings: [] });
    }

    // Create player name lookup function
    const playerNameMap = createPlayerNameMap(db);
    const getPlayerName = (id) => playerNameMap.get(id);

    // Round-robin tournament
    if (tournament.typ === 'skupina') {
      const playersResult = db.exec('SELECT id FROM players WHERE tournament_id = ?', [tournamentId]);
      const playerIds = rowsToObjects(playersResult).map(p => p.id);
      const standings = computeStandings(playerIds, finishedMatches, getPlayerName);
      return res.json({ type: tournament.typ, standings });
    }

    // Mixed tournament - compute per group
    const groupMatches = finishedMatches.filter(m => m.round < 900);
    const groups = groupMatchesByGroup(groupMatches);

    const result = [];
    Array.from(groups.keys()).sort((a, b) => a - b).forEach(groupNum => {
      const matches = groups.get(groupNum);
      const playerIds = getUniquePlayerIds(matches);
      const standings = computeStandings(playerIds, matches, getPlayerName);
      result.push({ group: groupNum, standings });
    });

    res.json({ type: tournament.typ, groups: result });
  } catch (error) {
    console.error('Error computing standings:', error);
    res.status(500).json({ error: 'Chyba při výpočtu tabulky' });
  }
};

// Helper functions
function createPlayerNameMap(db) {
  const result = db.exec('SELECT id, jmeno FROM players');
  const players = rowsToObjects(result);
  const map = new Map();
  players.forEach(player => map.set(player.id, player.jmeno));
  return map;
}

function getUniquePlayerIds(matches) {
  const ids = new Set();
  matches.forEach(m => {
    if (m.player1_id) ids.add(m.player1_id);
    if (m.player2_id) ids.add(m.player2_id);
  });
  return Array.from(ids);
}
