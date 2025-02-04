import express from 'express';
import { assignPlayers, checkBeforeDelete, getFiltersPlayers, removePlayer, unassignPlayer } from '../controllers/playerTeamRelationController';
import { protect } from '../middleware/authMiddleware';

const relationRouter = express.Router();

// ✅ Route to Assign a Player to a Team (Authenticated Club Required)
relationRouter.post('/assign-player', protect, assignPlayers);

// ✅ Route to Get Players (Authenticated Club Required)
relationRouter.get('/all', protect, getFiltersPlayers);

// ✅ Route to Unassign Player (Authenticated Club Required)
relationRouter.post('/unassign', protect, unassignPlayer);


// ✅ Check if a player is assigned before deletion
relationRouter.get('/check-delete/:player_cnic', protect, checkBeforeDelete);

// ✅ Delete a player only if unassigned
relationRouter.delete('/delete/:player_cnic', protect, removePlayer);

export default relationRouter;
