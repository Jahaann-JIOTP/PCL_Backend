import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { BadRequestError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { createRace, deleteRace, getAllRaces, getRaceByName, getRacesByEvent, updateRace } from '../services/raceService';
import Event from '../models/Event';

//  Add New Race (Admin Only) - Without race id in the database
// export const addNewRace = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
//   if (!req.club?.id || req.club.role !== 'admin') {
//     throw new BadRequestError('Only Admins can create races');
//   }

//   const { name, type, distance, date, time, event_id } = req.body;

//   //  Validate required fields
//   if (!name || !type || !distance || !date || !time || !event_id) {
//     throw new BadRequestError('All fields including event_id are required');
//   }

//   //  Ensure the event exists before adding a race
//   const eventExists = await Event.findById(event_id);
//   if (!eventExists) {
//     throw new BadRequestError('Event not found. Please provide a valid event_id.');
//   }

//   //  Create the race linked to the event
//   const race = await createRace(name, type, distance, date, time, req.club.id, event_id);

//   return new SuccessResponse(race, 'Race created successfully');
// });
export const addNewRace = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can create races');
  }

  const { name, type, distance, date, time, event_id } = req.body;

  // ✅ Validate required fields
  if (!name || !type || !distance || !date || !time || !event_id) {
    throw new BadRequestError('All fields including event_id are required');
  }

  // ✅ Ensure the event exists before adding a race
  const eventExists = await Event.findById(event_id);
  if (!eventExists) {
    throw new BadRequestError('Event not found. Please provide a valid event_id.');
  }

  // ✅ Create the race linked to the event
  const race = await createRace(name, type, distance, date, time, req.club.id, event_id);

  return new SuccessResponse(race, 'Race created successfully');
});


//  Get All Races (For All Clubs)
export const getRaces = asyncWrapper(async (req: Request, res: Response) => {
  const races = await getAllRaces();
  return new SuccessResponse(races, 'Races retrieved successfully');
});

// export const getEventRaces = asyncWrapper(async (req: Request, res: Response) => {
//   const { eventName } = req.params;

//   if (!eventName) {
//     throw new BadRequestError('Event name is required');
//   }

//   const races = await getRacesByEvent(eventName);
//   return new SuccessResponse(races, `Races for event ${eventName} retrieved successfully`);
// });

// ✅ Get All Races in an Event with Teams & Players
export const getEventRaces = asyncWrapper(async (req: Request, res: Response) => {
  const { eventName } = req.params;

  if (!eventName) {
    throw new BadRequestError("Event name is required");
  }

  const races = await getRacesByEvent(eventName);
  return new SuccessResponse(races, `Races for event ${eventName} retrieved successfully`);
});

//  Update Race Details (Admin Only)
export const updateRaceDetails = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can update races');
  }

  const { raceId } = req.params;
  const updates = req.body;

  const updatedRace = await updateRace(raceId, updates);
  return new SuccessResponse(updatedRace, 'Race updated successfully');
});

//  Delete Race (Admin Only) - Prevents deletion if teams are assigned
export const deleteRaceController = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can delete races');
  }

  const { raceId } = req.params;

  const result = await deleteRace(raceId);
  return new SuccessResponse(result, 'Race deleted successfully');
});
