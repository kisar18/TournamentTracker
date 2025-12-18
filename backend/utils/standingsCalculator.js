/**
 * Calculate standings from matches
 */

/**
 * Compute standings for a set of players and their matches
 * @param {Array} playerIds - Array of player IDs
 * @param {Array} matches - Array of match objects
 * @param {Function} getPlayerName - Function to get player name by ID
 * @returns {Array} Sorted standings with position numbers
 */
export function computeStandings(playerIds, matches, getPlayerName) {
  const table = new Map();

  // Initialize table for all players
  playerIds.forEach(pid => {
    table.set(pid, {
      player_id: pid,
      played: 0,
      wins: 0,
      losses: 0,
      sets_won: 0,
      sets_lost: 0,
      sets_diff: 0,
      jmeno: ''
    });
  });

  // Process all matches
  matches.forEach(match => {
    if (!match.player1_id || !match.player2_id) return;

    const player1 = table.get(match.player1_id);
    const player2 = table.get(match.player2_id);

    if (!player1 || !player2) return;

    // Update match counts
    player1.played++;
    player2.played++;

    // Update sets
    const p1Score = match.player1_score || 0;
    const p2Score = match.player2_score || 0;
    
    player1.sets_won += p1Score;
    player1.sets_lost += p2Score;
    player2.sets_won += p2Score;
    player2.sets_lost += p1Score;

    // Update wins/losses
    if (p1Score > p2Score) {
      player1.wins++;
      player2.losses++;
    } else {
      player2.wins++;
      player1.losses++;
    }
  });

  // Convert to array and calculate set difference
  const standings = Array.from(table.values());
  standings.forEach(row => {
    row.sets_diff = row.sets_won - row.sets_lost;
    if (getPlayerName) {
      row.jmeno = getPlayerName(row.player_id) || '';
    }
  });

  // Sort by: 1. Wins (desc), 2. Set diff (desc), 3. Sets won (desc), 4. Name (asc)
  standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.sets_diff !== a.sets_diff) return b.sets_diff - a.sets_diff;
    if (b.sets_won !== a.sets_won) return b.sets_won - a.sets_won;
    return a.jmeno.localeCompare(b.jmeno, 'cs');
  });

  // Add position numbers
  standings.forEach((row, index) => {
    row.poradi = index + 1;
  });

  return standings;
}

/**
 * Get top N players from standings
 * @param {Array} standings - Computed standings array
 * @param {number} count - Number of top players to return
 * @returns {Array} Player IDs of top players
 */
export function getTopPlayers(standings, count) {
  return standings.slice(0, count).map(s => s.player_id);
}

/**
 * Group matches by group number (based on round encoding)
 * @param {Array} matches - Array of match objects
 * @returns {Map} Map of group number to matches array
 */
export function groupMatchesByGroup(matches) {
  const groups = new Map();
  
  matches.forEach(match => {
    const groupNum = Math.floor(match.round / 100) || 1;
    if (!groups.has(groupNum)) {
      groups.set(groupNum, []);
    }
    groups.get(groupNum).push(match);
  });

  return groups;
}
