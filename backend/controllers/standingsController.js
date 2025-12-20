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
    const matchesFinishedResult = db.exec(
      "SELECT m.* FROM matches m WHERE m.tournament_id = ? AND m.status = 'ukonceny'",
      [tournamentId]
    );
    const finishedMatches = rowsToObjects(matchesFinishedResult);

    // Also get all group-stage matches (for deriving groups when none finished)
    const allGroupMatchesResult = db.exec(
      'SELECT m.* FROM matches m WHERE m.tournament_id = ? AND m.round < 900',
      [tournamentId]
    );
    const allGroupMatches = rowsToObjects(allGroupMatchesResult);

    // No standings for elimination tournaments
    if (tournament.typ === 'pavouk') {
      return res.json({ type: tournament.typ, standings: [] });
    }

    if (finishedMatches.length === 0) {
      // No finished matches yet – return initial ordering based on draw
      // For elimination tournaments, still no standings
      if (tournament.typ === 'pavouk') {
        return res.json({ type: tournament.typ, standings: [] });
      }

      const playerOrderMap = createPlayerOrderMap(db, tournamentId); // id -> { jmeno, poradi }

      // If we have grouped rounds (encoded as >=100), provide per-group initial tables
      const hasEncodedGroups = allGroupMatches.some(m => m.round >= 100 && m.round < 900);
      if (tournament.typ === 'smiseny' || hasEncodedGroups) {
        const groupMatches = allGroupMatches;
        const groups = groupMatchesByGroup(groupMatches);
        const result = [];
        Array.from(groups.keys()).sort((a, b) => a - b).forEach(groupNum => {
          const matches = groups.get(groupNum);
          const playerIds = getUniquePlayerIds(matches);
          // Sort by player poradi
          playerIds.sort((a, b) => (playerOrderMap.get(a)?.poradi || 0) - (playerOrderMap.get(b)?.poradi || 0));
          const standings = playerIds.map(pid => ({
            player_id: pid,
            played: 0,
            wins: 0,
            losses: 0,
            sets_won: 0,
            sets_lost: 0,
            sets_diff: 0,
            jmeno: playerOrderMap.get(pid)?.jmeno || '' ,
            poradi: playerOrderMap.get(pid)?.poradi || 0
          }));
          result.push({ group: groupNum, standings });
        });
        return res.json({ type: tournament.typ, groups: result });
      }

      // Single group: list all players in tournament ordered by poradi
      const playersRes = db.exec('SELECT id, jmeno, poradi FROM players WHERE tournament_id = ? ORDER BY poradi ASC, jmeno ASC', [tournamentId]);
      const players = rowsToObjects(playersRes);
      const standings = players.map(p => ({
        player_id: p.id,
        played: 0,
        wins: 0,
        losses: 0,
        sets_won: 0,
        sets_lost: 0,
        sets_diff: 0,
        jmeno: p.jmeno,
        poradi: p.poradi || 0
      }));
      return res.json({ type: tournament.typ, standings });
    }

    // Create player name lookup function
    const playerNameMap = createPlayerNameMap(db);
    const getPlayerName = (id) => playerNameMap.get(id);

    // Round-robin tournament - if matches are encoded by groups, compute per group
    if (tournament.typ === 'skupina') {
      const hasEncodedGroups = finishedMatches.some(m => m.round < 900 && m.round >= 100);
      if (!hasEncodedGroups) {
        const playersResult = db.exec('SELECT id FROM players WHERE tournament_id = ?', [tournamentId]);
        const playerIds = rowsToObjects(playersResult).map(p => p.id);
        const standings = computeStandings(playerIds, finishedMatches, getPlayerName);
        return res.json({ type: tournament.typ, standings });
      } else {
        const groupMatches = finishedMatches.filter(m => m.round < 900);
        const groups = groupMatchesByGroup(groupMatches);

        const result = [];
        Array.from(groups.keys()).sort((a, b) => a - b).forEach(groupNum => {
          const matches = groups.get(groupNum);
          const playerIds = getUniquePlayerIds(matches);
          const standings = computeStandings(playerIds, matches, getPlayerName);
          result.push({ group: groupNum, standings });
        });

        return res.json({ type: tournament.typ, groups: result });
      }
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

function createPlayerOrderMap(db, tournamentId) {
  const result = db.exec('SELECT id, jmeno, poradi FROM players WHERE tournament_id = ?', [tournamentId]);
  const players = rowsToObjects(result);
  const map = new Map();
  players.forEach(p => map.set(p.id, { jmeno: p.jmeno, poradi: p.poradi || 0 }));
  return map;
}
