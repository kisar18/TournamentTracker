import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';

const SQL = await initSqlJs();
const filebuffer = readFileSync('./tournaments.db');
const db = new SQL.Database(filebuffer);

console.log('\n=== TOURNAMENTS ===');
const tournaments = db.exec('SELECT id, nazev, typ, status FROM tournaments');
if (tournaments.length > 0) {
  console.log('ID | Name | Type | Status');
  tournaments[0].values.forEach(v => {
    console.log(`${v[0]} | ${v[1]} | ${v[2]} | ${v[3]}`);
  });
} else {
  console.log('No tournaments found');
}

console.log('\n=== MATCHES BY TOURNAMENT ===');
const matchStats = db.exec(`
  SELECT 
    tournament_id,
    CASE WHEN round < 900 THEN 'group' ELSE 'playoff' END as stage,
    status,
    COUNT(*) as count
  FROM matches 
  GROUP BY tournament_id, stage, status
  ORDER BY tournament_id, stage, status
`);
if (matchStats.length > 0) {
  console.log('Tournament ID | Stage | Status | Count');
  matchStats[0].values.forEach(v => {
    console.log(`${v[0]} | ${v[1]} | ${v[2]} | ${v[3]}`);
  });
} else {
  console.log('No matches found');
}

console.log('\n=== DETAILED TOURNAMENT INFO ===');
const details = db.exec(`
  SELECT 
    t.id,
    t.nazev,
    t.typ,
    t.status,
    COUNT(DISTINCT CASE WHEN m.round < 900 THEN m.id END) as group_matches,
    COUNT(DISTINCT CASE WHEN m.round < 900 AND m.status = 'ukonceny' THEN m.id END) as group_finished,
    COUNT(DISTINCT CASE WHEN m.round >= 900 THEN m.id END) as playoff_matches
  FROM tournaments t
  LEFT JOIN matches m ON t.id = m.tournament_id
  GROUP BY t.id
`);
if (details.length > 0) {
  details[0].values.forEach(v => {
    console.log(`\nTournament: ${v[1]} (ID: ${v[0]})`);
    console.log(`  Type: ${v[2]}`);
    console.log(`  Status: ${v[3]}`);
    console.log(`  Group matches: ${v[4]} (${v[5]} finished)`);
    console.log(`  Playoff matches: ${v[6]}`);
    
    if (v[2] === 'smiseny' && v[3] === 'probiha' && v[4] === v[5] && v[6] === 0) {
      console.log('  ✅ Ready to generate playoffs!');
    }
  });
}

db.close();
