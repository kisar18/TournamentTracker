import express from 'express';
import { deletePlayer } from '../controllers/playerController.js';

const router = express.Router();

router.delete('/:id', deletePlayer);

export default router;
