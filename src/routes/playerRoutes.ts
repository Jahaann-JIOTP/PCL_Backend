import express from 'express';
import { addNewPlayer, getFilteredPlayers, getPlayers, getSinglePlayers, updatePlayer } from '../controllers/playerController';
import { protect } from '../middleware/authMiddleware';

const playerRouter = express.Router();

//  Route to Add a Player (Only Authenticated Clubs can add player in its portal)
playerRouter.post('/add', protect, addNewPlayer);

//  Route to Get Players (Authenticated Club Required)
playerRouter.get('/all', protect, getPlayers);

//  Edit Player (Update Any Field)
playerRouter.put('/edit/:playerCnic', protect, updatePlayer);


//  Route to Get Players (Authenticated Club Required)
playerRouter.get('/get-single-player/:playerCnic', protect, getSinglePlayers);

// ✅ Unified API for Filtering & Searching Players
playerRouter.get('/filter', protect, getFilteredPlayers);

export default playerRouter;
