import { Request, Response } from 'express';
import { addTeam, getTeamsByClub } from '../services/teamsService';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { BadRequestError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// ✅ Add Team Controller (Uses JWT to Identify Club)
export const addNewTeam = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const { team_name, team_type, description } = req.body;

  // ✅ Ensure the JWT token contains club information
  if (!req.club?.id) {
    throw new BadRequestError('Club authentication failed');
  }

  const clubId = req.club.id;

  if (!team_name || !team_type) {
    throw new BadRequestError('Team name and team type are required');
  }

  const team = await addTeam(team_name, team_type, description, clubId);

  return new SuccessResponse(team, 'Team added successfully');
});


// ✅ Get Teams Controller (Using JWT to Identify Club)
export const getTeams = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    // ✅ Extract clubId from JWT token
    if (!req.club?.id) {
      throw new Error('Club authentication failed');
    }
    const clubId = req.club.id;
  
    // ✅ Extract team_type from query parameters
    const { team_type } = req.query as { team_type?: 'mix' | 'women-only' };
  
    // ✅ Fetch teams of the authenticated club
    const teams = await getTeamsByClub(clubId, team_type);
  
    return new SuccessResponse(teams, 'Teams retrieved successfully');
  });