import express from 'express';
import { updateMatchResult, resetMatchResult, updateMatchState } from '../controllers/matchController.js';

const router = express.Router();

router.put('/:id/result', updateMatchResult);
router.put('/:id/reset', resetMatchResult);
router.put('/:id/state', updateMatchState);

export default router;
