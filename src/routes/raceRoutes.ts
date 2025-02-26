import express from 'express';
import { addNewRace, deleteRaceController, getRaces, getSingleRace, updateRaceDetails } from '../controllers/raceController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const raceRouter = express.Router();

//  Create a New Race (Admin Only)
raceRouter.post('/add', protect, adminOnly, addNewRace);

//  Get All Races (Everyone Can Access)
raceRouter.get('/all', protect, getRaces);

//  Get Single Race by Name
raceRouter.get('/:raceName', protect, getSingleRace);

//  Update Race Details (Admin Only)
raceRouter.put('/:raceName', protect, adminOnly, updateRaceDetails);

//  Delete Race (Admin Only)
raceRouter.delete('/:raceName', protect, adminOnly, deleteRaceController);

export default raceRouter;
