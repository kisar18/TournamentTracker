// Match generation algorithms for different tournament types

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
 * Generate round-robin matches using Berger tables order
 * @param {Array} players - Array of player objects with id and jmeno
 * @returns {Array} Array of matches with round and match_number
 */
export function generateRoundRobinMatchesBerger(players) {
  const matches = [];
  let playerIds = players.map(p => ({ id: p.id, jmeno: p.jmeno }));

  // Add BYE if odd
  const isOdd = playerIds.length % 2 !== 0;
  if (isOdd) {
    playerIds.push({ id: null, jmeno: 'BYE' });
  }

  const n = playerIds.length;
  const R = n - 1;
  const indices = [...Array(n - 1).keys()].map(i => i + 1); // 1..n-1

  // Helper to get player by label (1..n)
  const getPlayer = (label) => (label === n ? playerIds[n - 1] : playerIds[label - 1]);

  // Build rounds per r using canonical Berger pairing
  const rounds = [];
  for (let r = 1; r <= R; r++) {
    const roundMatches = [];
    // Team n vs team r
    const a = getPlayer(n);
    const b = getPlayer(r);
    if (a.id !== null && b.id !== null) {
      roundMatches.push({ player1_id: a.id, player2_id: b.id });
    }

    // Other pairs
    for (let i = 1; i <= (n / 2) - 1; i++) {
      const homeLabel = ((r + i - 2) % (n - 1)) + 1;
      const awayLabel = ((r - i - 1 + (n - 1)) % (n - 1)) + 1;
      const p1 = getPlayer(homeLabel);
      const p2 = getPlayer(awayLabel);
      if (p1.id !== null && p2.id !== null) {
        roundMatches.push({ player1_id: p1.id, player2_id: p2.id });
      }
    }
    rounds.push(roundMatches);
  }

  // Reorder rounds to typical Berger display order: 1, R-1, 2, R, 3, R-2, ...
  const order = [];
  let left = 1;
  let right = R;
  let toggle = true;
  while (order.length < R) {
    order.push(left);
    left += 1;
    if (order.length < R) {
      order.push(right - 1);
      right -= 1;
    }
  }

  let matchNumber = 1;
  order.forEach((rIndex, roundIdx) => {
    const rm = rounds[rIndex - 1];
    rm.forEach(m => {
      matches.push({
        round: roundIdx + 1,
        match_number: matchNumber++,
        player1_id: m.player1_id,
        player2_id: m.player2_id,
        status: 'nehrany'
      });
    });
  });

  return matches;
}

/**
 * Generate round-robin matches across multiple groups
 * Rounds are encoded as (groupIndex+1)*100 + roundInGroup to distinguish groups in UI/standings.
 * @param {Array} players - Array of player objects with id and jmeno
 * @param {number} numGroups - Desired number of groups (>=1)
 * @returns {Array} Array of matches with encoded round and global match_number
 */
export function generateGroupedRoundRobinMatches(players, numGroups, scheduleType = 'standard') {
  const matches = [];
  const groups = Array.from({ length: Math.max(1, numGroups || 1) }, () => []);

  // Distribute players into groups as evenly as possible
  players.forEach((player, index) => {
    groups[index % groups.length].push(player);
  });

  let globalMatchNumber = 1;
  groups.forEach((groupPlayers, groupIndex) => {
    const groupMatches = scheduleType === 'berger'
      ? generateRoundRobinMatchesBerger(groupPlayers)
      : generateRoundRobinMatches(groupPlayers);
    groupMatches.forEach(m => {
      matches.push({
        round: (groupIndex + 1) * 100 + m.round,
        match_number: globalMatchNumber++,
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
  let matchNumber = 1;
  groups.forEach((groupPlayers, groupIndex) => {
    const groupMatches = scheduleType === 'berger'
      ? generateRoundRobinMatchesBerger(groupPlayers)
      : generateRoundRobinMatches(groupPlayers);
    groupMatches.forEach(match => {
      matches.push({
        ...match,
        match_number: matchNumber++,
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
