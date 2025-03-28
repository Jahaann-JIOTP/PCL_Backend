import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { getAllEventsWithRaces, updatePlayerGroupOnly, updatePlayerStatusOnly } from '../services/raceTeamService';
import { BadRequestError } from "../utils/apiError";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { assignPlayersToRace } from "../services/raceTeamService";

//  Get All Events with Races
export const getAllEventsWithRacesController = asyncWrapper(async (req: Request, res: Response) => {
    const events = await getAllEventsWithRaces();
    return new SuccessResponse(events, 'All events with races retrieved successfully');
});

//  Assign Players to a Race (Club Portal)
export const assignPlayers = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.club?.id) {
      throw new BadRequestError("Club authentication failed.");
    }
  
    const club_id = req.club.id; // ✅ Get Club ID from JWT
    const { race_id, event_id, team_id, players } = req.body;
  
    // ✅ Validate required fields
    if (!race_id || !event_id || !team_id || !players || players.length === 0) {
      throw new BadRequestError("Race ID, Event ID, Team ID, and Players list are required.");
    }
  
    // ✅ Call Service Function with Validations
    const result = await assignPlayersToRace(race_id, event_id, team_id, club_id, players);
  
    return new SuccessResponse(result, "Players assigned successfully.");
  });

//  Update Player Status in a Race (Club Portal)
// export const updatePlayerStatus = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
//     if (!req.club?.id) {
//       throw new BadRequestError("Club authentication failed.");
//     }
  
//     const club_id = req.club.id; //  Get Club ID from JWT
//     const { race_id, event_id, team_id, player_id, status } = req.body;
  
//     //  Validate required fields
//     if (!race_id || !event_id || !team_id || !player_id || !status) {
//       throw new BadRequestError("Race ID, Event ID, Team ID, Player ID, and Status are required.");
//     }
  
//     //  Call Service Function
//     const result = await updatePlayerStatusInRace(race_id, event_id, team_id, club_id, player_id, status);
  
//     return new SuccessResponse(result, "Player status updated successfully.");
//   });


// ✅ Update Player Status in a Race (Club Portal)
export const updatePlayerStatus = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new BadRequestError("Club authentication failed.");
  }

  const club_id = req.club.id; // ✅ Get Club ID from JWT
  const { race_id, event_id, team_id, player_id, status } = req.body;

  // ✅ Validate required fields
  if (!race_id || !event_id || !team_id || !player_id || !status) {
    throw new BadRequestError("Race ID, Event ID, Team ID, Player ID, and Status are required.");
  }

  // ✅ Call Service Function
  const result = await updatePlayerStatusOnly(race_id, event_id, team_id, club_id, player_id, status);

  return new SuccessResponse(result, "Player status updated successfully.");
});



export const updatePlayerGroup = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new BadRequestError("Club authentication failed.");
  }

  const club_id = req.club.id;
  const { race_id, event_id, team_id, player_id, group } = req.body;

  // ✅ Allow empty string as valid value for unassigning
  if (!race_id || !event_id || !team_id || !player_id || group === undefined) {
    throw new BadRequestError("Race ID, Event ID, Team ID, Player ID, and group are required.");
  }

  const result = await updatePlayerGroupOnly(race_id, event_id, team_id, club_id, player_id, group);

  return new SuccessResponse(result, "Player group updated successfully.");
});
