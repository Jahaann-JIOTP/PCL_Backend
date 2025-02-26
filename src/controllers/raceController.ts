import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { BadRequestError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { createRace, deleteRace, getAllRaces, getRaceByName, updateRace } from '../services/raceService';

// ✅ Add New Race (Admin Only)
export const addNewRace = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can create races');
  }

  const { name, type, distance, date, time } = req.body;
  if (!name || !type || !distance || !date || !time) {
    throw new BadRequestError('All fields are required');
  }

  const race = await createRace(name, type, distance, date, time, req.club.id);
  return new SuccessResponse(race, 'Race created successfully');
});

// ✅ Get All Races (For All Clubs)
export const getRaces = asyncWrapper(async (req: Request, res: Response) => {
  const races = await getAllRaces();
  return new SuccessResponse(races, 'Races retrieved successfully');
});

// ✅ Get a Single Race by Name
export const getSingleRace = asyncWrapper(async (req: Request, res: Response) => {
  const { raceName } = req.params;
  const race = await getRaceByName(raceName);
  return new SuccessResponse(race, 'Race retrieved successfully');
});

// ✅ Update Race (Admin Only)
export const updateRaceDetails = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can update races');
  }

  const { raceName } = req.params;
  const updates = req.body;
  const updatedRace = await updateRace(raceName, updates);
  return new SuccessResponse(updatedRace, 'Race updated successfully');
});

// ✅ Delete Race (Admin Only)
export const deleteRaceController = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can delete races');
  }

  const { raceName } = req.params;
  const result = await deleteRace(raceName);
  return new SuccessResponse(result, 'Race deleted successfully');
});
