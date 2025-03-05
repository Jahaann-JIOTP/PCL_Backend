import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { getAllEventsWithRaces } from '../services/eventRaceService';

// ✅ Get All Events with Races
export const getAllEventsWithRacesController = asyncWrapper(async (req: Request, res: Response) => {
    const events = await getAllEventsWithRaces();
    return new SuccessResponse(events, 'All events with races retrieved successfully');
});
