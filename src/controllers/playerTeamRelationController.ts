import { Request, Response } from 'express';
import { assignPlayerToTeam, getPlayersByFilter, unassignPlayerFromTeam } from '../services/PlayerTeamsRealtionService';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { BadRequestError } from '../utils/apiError';

// ✅ Assign Player to a Team Controller
export const assignPlayer = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const { player_cnic, team_name } = req.body;

  // ✅ Ensure the JWT token contains club information
  if (!req.club?.id) {
    throw new BadRequestError('Club authentication failed');
  }
  const clubId = req.club.id;

  if (!player_cnic || !team_name) {
    throw new BadRequestError('Both player_cnic and team_name are required');
  }

  const result = await assignPlayerToTeam(player_cnic, team_name, clubId);

  return new SuccessResponse(result, 'Player assigned to team successfully');
});

// ✅ Get Players Controller (Using JWT to Identify Club)
export const getFiltersPlayers = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  // ✅ Extract clubId from JWT token
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  // ✅ Extract query parameters
  const { team_name, assigned_team } = req.query as { team_name?: string; assigned_team?: 'assigned' | 'unassigned' };

  // ✅ Fetch players of the club based on query params
  const players = await getPlayersByFilter(clubId, team_name, assigned_team);

  return new SuccessResponse(players, 'Players retrieved successfully');
});


// ✅ Unassign Player Controller
export const unassignPlayer = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  // ✅ Extract clubId from JWT token
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  // ✅ Extract player CNIC from request body
  const { player_cnic } = req.body;
  if (!player_cnic) {
    throw new BadRequestError('Player CNIC is required');
  }

  // ✅ Unassign player from team
  const result = await unassignPlayerFromTeam(player_cnic, clubId);

  return new SuccessResponse(result, 'Player unassigned successfully');
});