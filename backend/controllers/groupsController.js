import { getDB, saveDB } from '../database.js';
import { rowToObject, getSingleValue } from '../utils/dbHelpers.js';

export const resetGroups = (req, res) => {
  try {
    const db = getDB();
    const tournament_id = parseInt(req.params.id);

    // Check tournament exists
    const tRes = db.exec('SELECT * FROM tournaments WHERE id = ?', [tournament_id]);
    const tournament = rowToObject(tRes);
    if (!tournament) {
      return res.status(404).json({ error: 'Turnaj nenalezen' });
    }

    // Count group-stage matches (round < 900)
    const countRes = db.exec('SELECT COUNT(*) FROM matches WHERE tournament_id = ? AND round < 900', [tournament_id]);
    const deletedCount = getSingleValue(countRes, 0);

    // Delete group-stage matches
    db.run('DELETE FROM matches WHERE tournament_id = ? AND round < 900', [tournament_id]);

    // Reset tournament status to upcoming to allow reconfiguration/start
    db.run('UPDATE tournaments SET status = ? WHERE id = ?', ['nadchazejici', tournament_id]);

    saveDB();

    return res.json({ message: 'Skupiny byly resetovány. Turnaj je opět v nadcházejícím stavu.', deletedMatches: deletedCount });
  } catch (error) {
    console.error('Error resetting groups:', error);
    res.status(500).json({ error: 'Chyba při resetování skupin' });
  }
};
