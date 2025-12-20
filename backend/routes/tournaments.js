import express from 'express';
import {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament
} from '../controllers/tournamentController.js';
import { getPlayers, addPlayer, updatePlayerOrder } from '../controllers/playerController.js';
import { startTournament, getMatches } from '../controllers/matchController.js';
import { generatePlayoffs, generateNextRound, resetPlayoffs } from '../controllers/playoffController.js';
import { resetGroups } from '../controllers/groupsController.js';
import { getStandings } from '../controllers/standingsController.js';

const router = express.Router();

// Tournament CRUD
router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);
router.post('/', createTournament);
router.put('/:id', updateTournament);
router.delete('/:id', deleteTournament);

// Tournament-specific operations
router.post('/:id/start', startTournament);
router.get('/:id/players', getPlayers);
router.post('/:id/players', addPlayer);
router.put('/:id/players/order', updatePlayerOrder);
router.get('/:id/matches', getMatches);
router.get('/:id/standings', getStandings);

// Playoff operations
router.post('/:id/playoffs', generatePlayoffs);
router.post('/:id/playoffs/next-round', generateNextRound);
router.delete('/:id/playoffs', resetPlayoffs);

// Group operations
router.delete('/:id/groups', resetGroups);

export default router;
