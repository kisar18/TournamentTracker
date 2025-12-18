import { getDB, saveDB } from '../database.js';
import { rowsToObjects, rowToObject, getSingleValue } from '../utils/dbHelpers.js';
import { computeStandings, groupMatchesByGroup } from '../utils/standingsCalculator.js';
import { generatePlayoffBracket, generateNextPlayoffRound, extractWinners } from '../utils/playoffUtils.js';

export const generatePlayoffs = (req, res) => {
  try {
    const db = getDB();
    const tournament_id = parseInt(req.params.id);

    // Get tournament
    const tRes = db.exec('SELECT * FROM tournaments WHERE id = ?', [tournament_id]);
    const tournament = rowToObject(tRes);

    if (!tournament) {
      return res.status(404).json({ error: 'Turnaj nenalezen' });
    }

    if (tournament.typ !== 'smiseny') {
      return res.status(400).json({ error: 'Play-off lze generovat pouze pro smíšený turnaj' });
    }

    if (tournament.status !== 'probiha') {
      return res.status(400).json({ error: 'Play-off lze generovat pouze během probíhajícího turnaje' });
    }

    // Check if playoffs already exist
    const playoffCountRes = db.exec('SELECT COUNT(*) FROM matches WHERE tournament_id = ? AND round >= 900', [tournament_id]);
    const playoffCount = getSingleValue(playoffCountRes, 0);

    if (playoffCount > 0) {
      return res.status(400).json({ error: 'Play-off již byl vygenerován' });
    }

    // Check all group matches are finished
    const unfinishedRes = db.exec(
      "SELECT COUNT(*) FROM matches WHERE tournament_id = ? AND round < 900 AND status != 'ukonceny'",
      [tournament_id]
    );
    const unfinishedCount = getSingleValue(unfinishedRes, 0);

    if (unfinishedCount > 0) {
      return res.status(400).json({ error: 'Nejprve dohrajte všechny zápasy ve skupinách' });
    }

    // Get group matches
    const gMatchesRes = db.exec('SELECT * FROM matches WHERE tournament_id = ? AND round < 900', [tournament_id]);
    const groupMatches = rowsToObjects(gMatchesRes);

    if (groupMatches.length === 0) {
      return res.status(400).json({ error: 'Nejsou k dispozici žádné zápasy skupin' });
    }

    // Group matches by group number
    const groups = groupMatchesByGroup(groupMatches);

    // Get top 2 from each group
    const qualifiers = [];
    const playerNameMap = createPlayerNameMap(db);

    Array.from(groups.keys()).sort((a, b) => a - b).forEach(groupNum => {
      const matches = groups.get(groupNum);
      const playerIds = getUniquePlayerIds(matches);
      const standings = computeStandings(playerIds, matches, id => playerNameMap.get(id));

      if (standings.length > 0) {
        qualifiers.push({ seedType: 'winner', group: groupNum, player_id: standings[0].player_id });
      }
      if (standings.length > 1) {
        qualifiers.push({ seedType: 'runner', group: groupNum, player_id: standings[1].player_id });
      }
    });

    if (qualifiers.length < 2) {
      return res.status(400).json({ error: 'Nedostatek hráčů pro play-off' });
    }

    // Generate playoff bracket
    const matchups = generatePlayoffBracket(qualifiers);

    // Insert matches (round 900)
    let matchNo = 1;
    matchups.forEach(matchup => {
      if (matchup.player1_id && matchup.player2_id) {
        db.run(
          "INSERT INTO matches (tournament_id, round, match_number, player1_id, player2_id, status) VALUES (?, ?, ?, ?, ?, 'nehrany')",
          [tournament_id, 900, matchNo++, matchup.player1_id, matchup.player2_id]
        );
      }
    });

    saveDB();

    const createdRes = db.exec('SELECT COUNT(*) FROM matches WHERE tournament_id = ? AND round = 900', [tournament_id]);
    const created = getSingleValue(createdRes, 0);

    res.json({ message: 'Play-off vygenerováno', matchesCreated: created });
  } catch (error) {
    console.error('Error generating playoffs:', error);
    res.status(500).json({ error: 'Chyba při generování play-off' });
  }
};

export const generateNextRound = (req, res) => {
  try {
    const db = getDB();
    const tournament_id = parseInt(req.params.id);

    // Get tournament
    const tRes = db.exec('SELECT * FROM tournaments WHERE id = ?', [tournament_id]);
    const tournament = rowToObject(tRes);

    if (!tournament) {
      return res.status(404).json({ error: 'Turnaj nenalezen' });
    }

    if (tournament.typ !== 'smiseny') {
      return res.status(400).json({ error: 'Další kolo play-off lze generovat pouze pro smíšený turnaj' });
    }

    if (tournament.status !== 'probiha') {
      return res.status(400).json({ error: 'Play-off lze generovat pouze během probíhajícího turnaje' });
    }

    // Find highest playoff round
    const roundsRes = db.exec(
      'SELECT DISTINCT round FROM matches WHERE tournament_id = ? AND round >= 900 ORDER BY round DESC',
      [tournament_id]
    );

    if (roundsRes.length === 0 || roundsRes[0].values.length === 0) {
      return res.status(400).json({ error: 'Play-off nebylo ještě vygenerováno' });
    }

    const currentRound = roundsRes[0].values[0][0];

    // Check all matches in current round are finished
    const unfinishedRes = db.exec(
      "SELECT COUNT(*) FROM matches WHERE tournament_id = ? AND round = ? AND status != 'ukonceny'",
      [tournament_id, currentRound]
    );
    const unfinishedCount = getSingleValue(unfinishedRes, 0);

    if (unfinishedCount > 0) {
      return res.status(400).json({ error: 'Nejprve dohrajte všechny zápasy aktuálního kola play-off' });
    }

    // Check if next round already exists
    const nextRoundRes = db.exec(
      'SELECT COUNT(*) FROM matches WHERE tournament_id = ? AND round = ?',
      [tournament_id, currentRound + 1]
    );
    const nextRoundExists = getSingleValue(nextRoundRes, 0) > 0;

    if (nextRoundExists) {
      return res.status(400).json({ error: 'Další kolo play-off již bylo vygenerováno' });
    }

    // Get current round matches
    const matchesRes = db.exec(
      'SELECT * FROM matches WHERE tournament_id = ? AND round = ? ORDER BY match_number',
      [tournament_id, currentRound]
    );
    const matches = rowsToObjects(matchesRes);
    const winners = extractWinners(matches);

    if (winners.length < 2) {
      return res.status(400).json({ error: 'Nedostatek vítězů pro další kolo' });
    }

    if (winners.length === 1) {
      return res.status(400).json({ error: 'Play-off je dokončeno, vítěz byl určen' });
    }

    // Generate next round
    const matchups = generateNextPlayoffRound(winners);
    const nextRound = currentRound + 1;

    let matchNo = 1;
    matchups.forEach(matchup => {
      db.run(
        "INSERT INTO matches (tournament_id, round, match_number, player1_id, player2_id, status) VALUES (?, ?, ?, ?, ?, 'nehrany')",
        [tournament_id, nextRound, matchNo++, matchup.player1_id, matchup.player2_id]
      );
    });

    saveDB();

    const createdRes = db.exec(
      'SELECT COUNT(*) FROM matches WHERE tournament_id = ? AND round = ?',
      [tournament_id, nextRound]
    );
    const created = getSingleValue(createdRes, 0);

    res.json({ message: 'Další kolo play-off vygenerováno', matchesCreated: created, round: nextRound });
  } catch (error) {
    console.error('Error generating next playoff round:', error);
    res.status(500).json({ error: 'Chyba při generování dalšího kola play-off' });
  }
};

export const resetPlayoffs = (req, res) => {
  try {
    const db = getDB();
    const tournament_id = parseInt(req.params.id);

    // Check tournament exists
    const tRes = db.exec('SELECT typ FROM tournaments WHERE id = ?', [tournament_id]);
    if (!rowToObject(tRes)) {
      return res.status(404).json({ error: 'Turnaj nenalezen' });
    }

    // Count playoff matches
    const countRes = db.exec('SELECT COUNT(*) FROM matches WHERE tournament_id = ? AND round >= 900', [tournament_id]);
    const count = getSingleValue(countRes, 0);

    // Delete playoff matches
    db.run('DELETE FROM matches WHERE tournament_id = ? AND round >= 900', [tournament_id]);
    saveDB();

    res.json({ message: 'Play-off byl resetován', deletedMatches: count });
  } catch (error) {
    console.error('Error resetting playoffs:', error);
    res.status(500).json({ error: 'Chyba při resetování play-off' });
  }
};

// Helper functions
function createPlayerNameMap(db) {
  const result = db.exec('SELECT id, jmeno FROM players');
  const players = rowsToObjects(result);
  const map = new Map();
  players.forEach(p => map.set(p.id, p.jmeno));
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
