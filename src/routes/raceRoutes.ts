import express from 'express';
import { addNewRace, deleteRaceController, getEventRaces, getRaces, updateRaceDetails } from '../controllers/raceController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const raceRouter = express.Router();

//  Create a New Race (Admin Only)
raceRouter.post('/add', protect, adminOnly, addNewRace);

//  Get All Races (Everyone Can Access)
raceRouter.get('/all', protect, getRaces);

//  Get Single Race by Name
// raceRouter.get('/:raceName', protect, getSingleRace);

//  Update Race Details (Admin Only)
raceRouter.put('/update/:raceId', protect, adminOnly, updateRaceDetails);

//  Delete Race (Admin Only)
raceRouter.delete('/delete/:raceId', protect, adminOnly, deleteRaceController);

// ✅ Get Races by Event Name
raceRouter.get('/by-event/:eventName', getEventRaces);


export default raceRouter;
