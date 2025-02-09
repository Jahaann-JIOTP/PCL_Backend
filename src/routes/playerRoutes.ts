import express from 'express';
import { addNewPlayer, getPlayers, updatePlayer } from '../controllers/playerController';
import { protect } from '../middleware/authMiddleware';

const playerRouter = express.Router();

//  Route to Add a Player (Only Authenticated Clubs can add player in its portal)
playerRouter.post('/add', protect, addNewPlayer);

//  Route to Get Players (Authenticated Club Required)
playerRouter.get('/all', protect, getPlayers);

// ✅ Edit Player (Update Any Field)
playerRouter.put('/edit/:playerCnic', protect, updatePlayer);

export default playerRouter;
