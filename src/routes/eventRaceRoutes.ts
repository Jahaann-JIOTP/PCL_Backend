import express from 'express';
import { getAllEventsWithRacesController } from '../controllers/eventRaceController';

const eventRaceRouter = express.Router();

//  Get All Events with Races
eventRaceRouter.get('/all', getAllEventsWithRacesController);

export default eventRaceRouter;
