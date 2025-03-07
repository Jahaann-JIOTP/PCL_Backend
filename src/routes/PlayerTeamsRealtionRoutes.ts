import express from 'express';
import { assignPlayers, assignTeamToRace, checkBeforeDelete, getAssignedTeamsController, getFiltersPlayers, getPlayersWithStatus, getUnassignedTeamsController, removePlayer, unassignPlayer } from '../controllers/playerTeamRelationController';
import { protect } from '../middleware/authMiddleware';

const relationRouter = express.Router();

//  Route to Assign a Player to a Team (Authenticated Club Required)
relationRouter.post('/assign-player', protect, assignPlayers);

//  Route to Get Players (Authenticated Club Required)
relationRouter.get('/all', protect, getFiltersPlayers);

//  Route to Unassign Player (Authenticated Club Required)
relationRouter.post('/unassign', protect, unassignPlayer);


//  Check if a player is assigned before deletion
relationRouter.get('/check-delete/:player_cnic', protect, checkBeforeDelete);

//  Delete a player only if unassigned
relationRouter.delete('/delete/:player_cnic', protect, removePlayer);



    // --------------- APIS For Teams assignation in Races -------------------------------
// Team Assignment in Race
relationRouter.post("/race/assign-team", protect, assignTeamToRace);


// ✅ Get Teams Assigned to a Race in a Specific Event
relationRouter.get("/race/assigned-teams", getAssignedTeamsController);

// ✅ Get Unassigned Teams for a Specific Event (Club Portal)
relationRouter.get("/race/unassigned-teams", protect, getUnassignedTeamsController);

// ✅ API: Get Players with Status for a Specific Team, Event & Race
relationRouter.get("/race/players-status", protect, getPlayersWithStatus);

export default relationRouter;
