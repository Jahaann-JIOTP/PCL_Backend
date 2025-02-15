import { Request, Response } from 'express';
import { addTeam, deleteTeam, getTeamsByClub, updateTeamDetails, uploadPaymentSlip } from '../services/teamsService';
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


// ✅ Upload Payment Slip Controller
export const uploadTeamPaymentSlip = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  // ✅ Extract `clubId` from JWT token
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  const { team_name, payment_comment } = req.body;
  const file = req.files?.payment_slip; // ✅ Get Uploaded file

  const updatedTeam = await uploadPaymentSlip(clubId, team_name, file, payment_comment);

  return new SuccessResponse(updatedTeam, 'Payment slip uploaded successfully');
});


// ✅ Update Team Controller
export const updateTeam = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new BadRequestError('Club authentication failed');
  }
  const clubId = req.club.id;

  const { current_team_name, team_name, description, payment_status } = req.body;

  if (!current_team_name) {
    throw new BadRequestError('Current team name is required to update the team');
  }

  const updatedTeam = await updateTeamDetails(clubId, current_team_name, { team_name, description, payment_status });

  return new SuccessResponse(updatedTeam, 'Team updated successfully');
});

// ✅ Delete Team Controller (Using JWT to get Club ID)
export const deleteTeamController = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  // ✅ Extract club ID from JWT
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  const { team_name } = req.body;
  if (!team_name) {
    throw new Error('Team name is required');
  }

  const result = await deleteTeam(clubId, team_name);
  return new SuccessResponse(result, 'Team deleted successfully');
});