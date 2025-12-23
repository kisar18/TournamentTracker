// Match generation algorithms for different tournament types

/**
 * Berger tables lookup - exact pairings from official tables
 * Format: [home, away] for each match in each round
 * Tables for even numbers (4, 6, 8, 10, 12)
 */
const BERGER_TABLES = {
  4: [ // 3 rounds
    [[1,4], [2,3]],
    [[4,3], [1,2]],
    [[2,4], [3,1]]
  ],
  6: [ // 5 rounds
    [[1,6], [2,5], [3,4]],
    [[6,4], [5,3], [1,2]],
    [[2,6], [3,1], [4,5]],
    [[6,5], [1,4], [2,3]],
    [[3,6], [4,2], [5,1]]
  ],
  8: [ // 7 rounds
    [[1,8], [2,7], [3,6], [4,5]],
    [[8,5], [6,4], [7,3], [1,2]],
    [[2,8], [3,1], [4,7], [5,6]],
    [[8,6], [7,5], [1,4], [2,3]],
    [[3,8], [4,2], [5,1], [6,7]],
    [[8,7], [1,6], [2,5], [3,4]],
    [[4,8], [5,3], [6,2], [7,1]]
  ],
  10: [ // 9 rounds
    [[1,10], [2,9], [3,8], [4,7], [5,6]],
    [[10,6], [7,5], [8,4], [9,3], [1,2]],
    [[2,10], [3,1], [4,9], [5,8], [6,7]],
    [[10,7], [8,6], [9,5], [1,4], [2,3]],
    [[3,10], [4,2], [5,1], [6,9], [7,8]],
    [[10,8], [9,7], [1,6], [2,5], [3,4]],
    [[4,10], [5,3], [6,2], [7,1], [8,9]],
    [[10,9], [1,8], [2,7], [3,6], [4,5]],
    [[5,10], [6,4], [7,3], [8,2], [9,1]]
  ],
  12: [ // 11 rounds
    [[1,12], [2,11], [3,10], [4,9], [5,8], [6,7]],
    [[12,7], [8,6], [9,5], [10,4], [11,3], [1,2]],
    [[2,12], [3,1], [4,11], [5,10], [6,9], [7,8]],
    [[12,8], [9,7], [10,6], [11,5], [1,4], [2,3]],
    [[3,12], [4,2], [5,1], [6,11], [7,10], [8,9]],
    [[12,9], [10,8], [11,7], [1,6], [2,5], [3,4]],
    [[4,12], [5,3], [6,2], [7,1], [8,11], [9,10]],
    [[12,10], [11,9], [1,8], [2,7], [3,6], [4,5]],
    [[5,12], [6,4], [7,3], [8,2], [9,1], [10,11]],
    [[12,11], [1,10], [2,9], [3,8], [4,7], [5,6]],
    [[6,12], [7,5], [8,4], [9,3], [10,2], [11,1]]
  ]
};

/**
 * Generate round-robin matches using Berger tables system
 * @param {Array} players - Array of player objects with id and jmeno
 * @returns {Array} Array of matches with round and match_number
 */
export function generateRoundRobinMatches(players) {
  const matches = [];
  let playerList = [...players];

  // Add dummy player if odd number of players
  const isOdd = playerList.length % 2 !== 0;
  if (isOdd) {
    playerList.push({ id: null, jmeno: 'BYE' });
  }

  const numPlayers = playerList.length;
  const numRounds = numPlayers - 1;
  const matchesPerRound = numPlayers / 2;

  // Berger tables algorithm
  // Fix first player, rotate others
  for (let round = 0; round < numRounds; round++) {
    let matchNumber = 1;

    for (let match = 0; match < matchesPerRound; match++) {
      let home, away;

      if (match === 0) {
        // First match: fixed player vs last player in rotation
        home = playerList[0];
        away = playerList[numPlayers - 1];
      } else {
        // Other matches: pair from both ends moving inward
        home = playerList[match];
        away = playerList[numPlayers - 1 - match];
      }

      // Skip matches with BYE player
      if (home.id !== null && away.id !== null) {
        matches.push({
          round: round + 1,
          match_number: matchNumber++,
          player1_id: home.id,
          player2_id: away.id,
          status: 'nehrany'
        });
      }
    }

    // Rotate players (keep first player fixed, rotate others)
    const lastPlayer = playerList.pop();
    playerList.splice(1, 0, lastPlayer);
  }

  return matches;
}

/**
 * Generate round-robin matches using official Berger tables (lookup-based)
 * Uses hardcoded pairings from official Berger rotation tables
 * 
 * @param {Array} players - Array of player objects with id and jmeno
 * @returns {Array} Array of matches with round and match_number
 */
export function generateRoundRobinMatchesBerger(players) {
  const matches = [];
  let playerList = players.map(p => ({ id: p.id, jmeno: p.jmeno }));

  // Add BYE if odd
  const isOdd = playerList.length % 2 !== 0;
  if (isOdd) {
    playerList.push({ id: null, jmeno: 'BYE' });
  }

  const n = playerList.length;
  
  // Check if we have a Berger table for this size
  if (!BERGER_TABLES[n]) {
    // Fallback to algorithmic approach for unsupported sizes
    return generateRoundRobinMatches(players);
  }

  const table = BERGER_TABLES[n];
  let matchNumber = 1;

  // Generate matches from lookup table
  table.forEach((round, roundIdx) => {
    round.forEach(([home, away]) => {
      // Convert 1-based indices to 0-based
      const p1 = playerList[home - 1];
      const p2 = playerList[away - 1];
      
      // Only add match if both players are real (not BYE with null id)
      if (p1.id !== null && p2.id !== null) {
        matches.push({
          round: roundIdx + 1,
          match_number: matchNumber++,
          player1_id: p1.id,
          player2_id: p2.id,
          status: 'nehrany'
        });
      }
    });
  });

  return matches;
}

/**
 * Generate round-robin matches across multiple groups
 * Rounds are encoded as (groupIndex+1)*100 + roundInGroup to distinguish groups in UI/standings.
 * Ensures even player count per group (for Berger tables).
 * @param {Array} players - Array of player objects with id and jmeno
 * @param {number} numGroups - Desired number of groups (>=1)
 * @returns {Array} Array of matches with encoded round and global match_number
 */
export function generateGroupedRoundRobinMatches(players, numGroups, scheduleType = 'standard') {
  const matches = [];
  const totalPlayers = players.length;
  const groups = Array.from({ length: Math.max(1, numGroups || 1) }, () => []);

  // Calculate even distribution: ensure each group has even number of players
  // If total is odd, we'll add a virtual BYE player
  const needsBye = totalPlayers % 2 === 1;
  const effectivePlayers = needsBye ? totalPlayers + 1 : totalPlayers;
  const basePerGroup = Math.floor(effectivePlayers / groups.length);
  const remainder = effectivePlayers % groups.length;

  // Distribute players ensuring even counts
  let playerIndex = 0;
  groups.forEach((group, groupIndex) => {
    // Groups with index < remainder get basePerGroup + 1 players
    const groupSize = groupIndex < remainder ? basePerGroup + 1 : basePerGroup;
    
    // Ensure group size is even
    const evenGroupSize = groupSize % 2 === 0 ? groupSize : groupSize + 1;
    
    for (let i = 0; i < evenGroupSize; i++) {
      if (playerIndex < totalPlayers) {
        group.push(players[playerIndex++]);
      } else {
        // Add BYE player if needed
        group.push({ id: null, jmeno: 'BYE' });
      }
    }
  });

  let globalMatchNumber = 1;
  groups.forEach((groupPlayers, groupIndex) => {
    const groupMatches = scheduleType === 'berger'
      ? generateRoundRobinMatchesBerger(groupPlayers)
      : generateRoundRobinMatches(groupPlayers);
    const groupLetter = String.fromCharCode(65 + groupIndex);
    let matchNumberInGroup = 1;
    groupMatches.forEach(m => {
      matches.push({
        round: (groupIndex + 1) * 100 + m.round,
        match_number: globalMatchNumber++,
        groupLetter: groupLetter,
        matchNumberInGroup: matchNumberInGroup++,
        player1_id: m.player1_id,
        player2_id: m.player2_id,
        status: m.status
      });
    });
  });

  return matches;
}

/**
 * Generate single elimination bracket matches
 * @param {Array} players - Array of player objects with id and jmeno
 * @returns {Array} Array of matches with round and match_number
 */
export function generateEliminationMatches(players) {
  const matches = [];
  const numPlayers = players.length;

  // Find next power of 2
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
  const numByes = bracketSize - numPlayers;

  // Shuffle players for random seeding
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  // First round setup
  let round1Players = [...shuffledPlayers];
  
  // Add null players for byes
  for (let i = 0; i < numByes; i++) {
    round1Players.push({ id: null, jmeno: 'BYE' });
  }

  // Generate first round matches
  let matchNumber = 1;
  for (let i = 0; i < round1Players.length; i += 2) {
    const player1 = round1Players[i];
    const player2 = round1Players[i + 1];

    // Only create match if both players exist
    if (player1.id !== null && player2.id !== null) {
      matches.push({
        round: 1,
        match_number: matchNumber++,
        player1_id: player1.id,
        player2_id: player2.id,
        status: 'nehrany'
      });
    }
  }

  // Calculate number of rounds needed
  const totalRounds = Math.log2(bracketSize);

  // Generate placeholder matches for subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round);
    for (let i = 1; i <= matchesInRound; i++) {
      matches.push({
        round: round,
        match_number: i,
        player1_id: null,
        player2_id: null,
        status: 'nehrany'
      });
    }
  }

  return matches;
}

/**
 * Generate mixed tournament matches (groups + elimination)
 * @param {Array} players - Array of player objects with id and jmeno
 * @returns {Array} Array of matches with round and match_number
 */
export function generateMixedMatches(players, numGroupsOptional, scheduleType = 'standard') {
  const matches = [];
  const numPlayers = players.length;

  // Determine number of groups (2-4 groups depending on player count)
  let numGroups = numGroupsOptional && numGroupsOptional > 0 ? numGroupsOptional : undefined;
  if (!numGroups) {
    if (numPlayers <= 8) {
      numGroups = 2;
    } else if (numPlayers <= 16) {
      numGroups = 4;
    } else {
      numGroups = Math.min(8, Math.ceil(numPlayers / 4));
    }
  }

  // Distribute players into groups
  const groups = Array.from({ length: numGroups }, () => []);
  players.forEach((player, index) => {
    groups[index % numGroups].push(player);
  });

  // Generate round-robin matches for each group
  let globalMatchNumber = 1;
  groups.forEach((groupPlayers, groupIndex) => {
    const groupMatches = scheduleType === 'berger'
      ? generateRoundRobinMatchesBerger(groupPlayers)
      : generateRoundRobinMatches(groupPlayers);
    const groupLetter = String.fromCharCode(65 + groupIndex);
    let matchNumberInGroup = 1;
    groupMatches.forEach(match => {
      matches.push({
        ...match,
        match_number: globalMatchNumber++,
        groupLetter: groupLetter,
        matchNumberInGroup: matchNumberInGroup++,
        round: (groupIndex + 1) * 100 + match.round
      });
    });
  });

  // Placeholder: Later rounds will be elimination bracket
  // This would be populated after group stage completion
  // For now, we'll add a marker for playoff stage
  matches.push({
    round: 900, // Special round number for playoffs
    match_number: 0,
    player1_id: null,
    player2_id: null,
    status: 'nehrany'
  });

  return matches;
}
