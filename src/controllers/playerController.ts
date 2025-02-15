import { Request, Response } from 'express';
import { addPlayer, editPlayer, findPlayerByCnic, getFilteredAndSearchedPlayers, getPlayersByClub } from '../services/playerService';
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

// ✅ Get Players Controller (Using JWT to Identify Club)
export const getSinglePlayers = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  // ✅ Extract clubId from JWT token
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }

  const { playerCnic } = req.params; // ✅ Player cnic from request params
  if (!playerCnic) {
    throw new BadRequestError('Player ID is required');
  }

  // ✅ Fetch players of the authenticated club
  const players = await findPlayerByCnic(playerCnic);

  return new SuccessResponse(players, 'Player retrieved successfully');
});

  // ✅ Edit Player Controller
export const updatePlayer = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const { playerCnic } = req.params; // ✅ Player cnic from request params
  const updates = req.body; // ✅ Dynamic updates from request body

  if (!playerCnic) {
    throw new BadRequestError('Player ID is required');
  }

  const updatedPlayer = await editPlayer(playerCnic, updates);

  return new SuccessResponse(updatedPlayer, 'Player updated successfully');
});

// ✅ Get Players by Filter or Search
export const getFilteredPlayers = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new BadRequestError('Club authentication failed');
  }
  const clubId = req.club.id;

  // ✅ Extract Query Params
  const { assigned_team, search } = req.query as { assigned_team?: 'assigned' | 'unassigned'; search?: string };

  // ✅ Fetch Filtered & Searched Players
  const players = await getFilteredAndSearchedPlayers(clubId, assigned_team, search);

  return new SuccessResponse(players, 'Players retrieved successfully');
});


