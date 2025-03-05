import express from 'express';
import { getAllEventsWithRacesController, updatePlayerStatus } from '../controllers/raceTeamController';
import { assignPlayers } from "../controllers/raceTeamController";
import { protect } from "../middleware/authMiddleware";

const eventRaceRouter = express.Router();

//  Get All Events with Races
eventRaceRouter.get('/all', getAllEventsWithRacesController);

//  Assign Players to a Race (Club Portal)
eventRaceRouter.post("/assign-players", protect, assignPlayers);

//  Update Player Status (Active / Substitute)
eventRaceRouter.put("/update-player-status", protect, updatePlayerStatus);

export default eventRaceRouter;


