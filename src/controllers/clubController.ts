import { Request, Response } from 'express';
import { createClub } from '../services/clubService';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { BadRequestError } from '../utils/apiError';

export const registerClub = asyncWrapper(async (req: Request, res: Response) => {
  const { name, description, phoneNumber, club_name, address } = req.body;

  if (!name || !description || !phoneNumber || !club_name) {
    throw new BadRequestError('All required fields must be provided');
  }

  const club = await createClub(name, description, phoneNumber, club_name, address);
  return new SuccessResponse(club, 'Club registered successfully');
});
