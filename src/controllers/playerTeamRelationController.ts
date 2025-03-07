import { Request, Response } from 'express';
import { assignMultiplePlayersToTeam, assignTeam, checkPlayerAssignment, deletePlayerService, getAssignedTeams, getPlayersByFilter, getUnassignedTeams, unassignPlayerFromTeam } from '../services/PlayerTeamsRealtionService';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { BadRequestError } from '../utils/apiError';
import teamRouter from '../routes/teamRoutes';

//  Assign Multiple Players to a Team Controller
export const assignPlayers = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const { player_cnic, team_name } = req.body;

  //  Ensure JWT token contains club information
  if (!req.club?.id) {
    throw new BadRequestError('Club authentication failed');
  }
  const clubId = req.club.id;

  //  Ensure request has a valid list of players
  if (!player_cnic || !Array.isArray(player_cnic) || player_cnic.length === 0 || !team_name) {
    throw new BadRequestError('A valid list of player CNICs and a team name are required');
  }

  const result = await assignMultiplePlayersToTeam(player_cnic, team_name, clubId);

  return new SuccessResponse(result, 'Players assigned to team successfully');
});

//  Get Players Controller (Using JWT to Identify Club)
export const getFiltersPlayers = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  //  Extract clubId from JWT token
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  //  Extract query parameters
  const { team_name, assigned_team, teamTypeKey } = req.query as { 
    team_name?: string; 
    assigned_team?: 'assigned' | 'unassigned';
    teamTypeKey?: string; //  Extract teamType filter
  };



  //  const teamType = 'women-only';

  //  Fetch players of the club based on query params (Pass teamType)
  const players = await getPlayersByFilter(clubId, team_name, assigned_team, teamTypeKey);

  return new SuccessResponse(players, 'Players retrieved successfully');
});


//  Unassign Player Controller
export const unassignPlayer = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  //  Extract clubId from JWT token
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  //  Extract player CNIC from request body
  const { player_cnic } = req.body;
  if (!player_cnic) {
    throw new BadRequestError('Player CNIC is required');
  }

  //  Unassign player from team
  const result = await unassignPlayerFromTeam(player_cnic, clubId);

  return new SuccessResponse(result, 'Player unassigned successfully');
});

//  Controller to check if a player is assigned before deletion
export const checkBeforeDelete = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const { player_cnic } = req.params;

  //  Get Club ID from JWT (No need to pass clubId from frontend)
  if (!req.club?.id) {
    throw new BadRequestError('Club authentication failed');
  }
  const clubId = req.club.id;

  if (!player_cnic) {
    throw new BadRequestError('Player CNIC is required');
  }

  const result = await checkPlayerAssignment(player_cnic, clubId);

  return new SuccessResponse(result, 'Player assignment checked successfully');
});


//  Delete Player Controller
export const removePlayer = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  const { player_cnic } = req.params;

  if (!req.club?.id) {
    throw new BadRequestError('Club authentication failed');
  }
  const clubId = req.club.id;

  //  Call the service to handle deletion
  const result = await deletePlayerService(player_cnic, clubId);

  return new SuccessResponse(result, 'Player deletion processed successfully');
});


              //  ------------------ APIS For Teams Assignation in races ---------------------------

// ✅ Assign a Team to a Race (Club Portal)
export const assignTeamToRace = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new BadRequestError("Club authentication failed.");
  }

  const club_id = req.club.id; // ✅ Club ID from JWT
  const { race_id, event_id, team_id } = req.body;

  if (!race_id || !event_id || !team_id) {
    throw new BadRequestError("Race ID, Event ID, and Team ID are required.");
  }

  const result = await assignTeam(race_id, event_id, team_id, club_id);

  return new SuccessResponse(result, "Team assigned to race successfully.");
});




// ✅ Get Assigned Teams in a Race for a Specific Event
export const getAssignedTeamsController = asyncWrapper(async (req: Request, res: Response) => {
  const { event_id, race_id } = req.query;

  if (!event_id || !race_id) {
    throw new BadRequestError("Event ID and Race ID are required.");
  }

  const assignedTeams = await getAssignedTeams(event_id as string, race_id as string);
  return new SuccessResponse(assignedTeams, "Assigned teams retrieved successfully.");
});

// ✅ Get Unassigned Teams for a Specific Event (Only for Club)
export const getUnassignedTeamsController = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new BadRequestError("Club authentication failed.");
  }

  const { event_id } = req.query;
  if (!event_id) {
    throw new BadRequestError("Event ID is required.");
  }

  const unassignedTeams = await getUnassignedTeams(event_id as string, req.club.id);
  return new SuccessResponse(unassignedTeams, "Unassigned teams retrieved successfully.");
});