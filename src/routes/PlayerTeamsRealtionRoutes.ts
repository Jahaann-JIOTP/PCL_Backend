import express from 'express';
import { assignPlayer, getFiltersPlayers, unassignPlayer } from '../controllers/playerTeamRelationController';
import { protect } from '../middleware/authMiddleware';

const relationRouter = express.Router();

// ✅ Route to Assign a Player to a Team (Authenticated Club Required)
relationRouter.post('/assign-player', protect, assignPlayer);

// ✅ Route to Get Players (Authenticated Club Required)
relationRouter.get('/all', protect, getFiltersPlayers);

// ✅ Route to Unassign Player (Authenticated Club Required)
relationRouter.post('/unassign', protect, unassignPlayer);

export default relationRouter;
