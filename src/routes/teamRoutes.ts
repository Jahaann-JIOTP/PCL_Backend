import express from 'express';
import { addNewTeam, getTeams } from '../controllers/teameController';
import { protect } from '../middleware/authMiddleware';

const teamRouter = express.Router();

// ✅ Route to Add a Team (Authenticated Club Required)
teamRouter.post('/add', protect, addNewTeam);
// ✅ Route to Get Teams (Authenticated Club Required)
teamRouter.get('/all', protect, getTeams);

export default teamRouter;
