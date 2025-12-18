/**
 * Playoff bracket generation and progression utilities
 */

/**
 * Generate initial playoff bracket from group winners
 * @param {Array} qualifiers - Array of {seedType, group, player_id}
 * @returns {Array} Array of match pairs {player1_id, player2_id}
 */
export function generatePlayoffBracket(qualifiers) {
  // Separate winners and runners-up
  const winners = qualifiers.filter(q => q.seedType === 'winner').map(q => q.player_id);
  const runners = qualifiers.filter(q => q.seedType === 'runner').map(q => q.player_id);
  
  // Combine: winners first, then runners-up
  const seeds = [...winners, ...runners];

  // Calculate bracket size (next power of 2)
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(seeds.length)));
  
  // Pad with nulls for BYEs if needed
  while (seeds.length < bracketSize) {
    seeds.push(null);
  }

  // Create matchups: 1 vs last, 2 vs second-last, etc.
  const matchups = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    const player1 = seeds[i];
    const player2 = seeds[bracketSize - 1 - i];
    
    // Only create match if at least one player exists
    if (player1 !== null || player2 !== null) {
      matchups.push({ player1_id: player1, player2_id: player2 });
    }
  }

  return matchups;
}

/**
 * Generate next round from winners
 * @param {Array} winners - Array of winner player IDs from current round
 * @returns {Array} Array of match pairs {player1_id, player2_id}
 */
export function generateNextPlayoffRound(winners) {
  const matchups = [];
  
  // Pair winners sequentially
  for (let i = 0; i < winners.length; i += 2) {
    if (i + 1 < winners.length) {
      matchups.push({
        player1_id: winners[i],
        player2_id: winners[i + 1]
      });
    }
  }

  return matchups;
}

/**
 * Check if playoff round is complete
 * @param {Array} matches - Matches in the round
 * @returns {boolean} True if all matches are finished
 */
export function isPlayoffRoundComplete(matches) {
  return matches.every(m => m.status === 'ukonceny');
}

/**
 * Extract winners from matches in order
 * @param {Array} matches - Matches to extract winners from
 * @returns {Array} Array of winner player IDs
 */
export function extractWinners(matches) {
  return matches
    .map(m => m.winner_id)
    .filter(id => id !== null && id !== undefined);
}
