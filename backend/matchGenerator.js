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
export function generateMixedMatches(players) {
  const matches = [];
  const numPlayers = players.length;

  // Determine number of groups (2-4 groups depending on player count)
  let numGroups;
  if (numPlayers <= 8) {
    numGroups = 2;
  } else if (numPlayers <= 16) {
    numGroups = 4;
  } else {
    numGroups = Math.min(8, Math.ceil(numPlayers / 4));
  }

  // Distribute players into groups
  const groups = Array.from({ length: numGroups }, () => []);
  players.forEach((player, index) => {
    groups[index % numGroups].push(player);
  });

  // Generate round-robin matches for each group
  let matchNumber = 1;
  groups.forEach((groupPlayers, groupIndex) => {
    const groupMatches = generateRoundRobinMatches(groupPlayers);
    
    groupMatches.forEach(match => {
      matches.push({
        ...match,
        match_number: matchNumber++,
        // Prefix round with group identifier (e.g., group 1 round 1 = 101, group 2 round 1 = 201)
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
