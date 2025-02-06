import { Request, Response } from 'express';
import { addPlayer, getPlayersByClub } from '../services/playerService';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { BadRequestError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// ✅ Add Player Controller (Now Uses Club ID from JWT)
export const addNewPlayer = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const { name, cnic, date_of_birth, fitness_category, weight, gender, contact, emergency_contact, disability } = req.body;

  // ✅ Ensure the JWT token contains club information
  if (!req.club?.id) {
    throw new BadRequestError('Club authentication failed');
  }

  // ✅ Use club ID from JWT
  const clubId = req.club.id;

  if (!name || !cnic || !date_of_birth || !fitness_category || !weight || !gender || !contact || !emergency_contact) {
    throw new BadRequestError('All required fields must be provided');
  }

  const player = await addPlayer(
    name,
    cnic,
    date_of_birth,
    fitness_category,
    weight,
    gender,
    contact,
    emergency_contact,
    disability,
    clubId
  );

  return new SuccessResponse(player, 'Player added successfully');
});


// ✅ Get Players Controller (Using JWT to Identify Club)
export const getPlayers = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    // ✅ Extract clubId from JWT token
    if (!req.club?.id) {
      throw new Error('Club authentication failed');
    }
    const clubId = req.club.id;
  
    // ✅ Fetch players of the authenticated club
    const players = await getPlayersByClub(clubId);
  
    return new SuccessResponse(players, 'Players retrieved successfully');
  });