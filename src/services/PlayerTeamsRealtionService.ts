import mongoose from 'mongoose';
import Player from '../models/players';
import Team from '../models/teams';
import { BadRequestError } from '../utils/apiError';
import Club from "../models/Club";
import Race from "../models/Race";
import Event from "../models/Event";
import RaceTeamAssignment from '../models/models/RaceTeamAssignment';
import RacePlayerAssignment from '../models/RacePlayerAssignment';

//  Assign Multiple Players to a Team
export const assignMultiplePlayersToTeam = async (playerCnics: string[], teamName: string, clubId: string) => {
  //  Check if the team exists
  const team = await Team.findOne({ team_name: teamName, club: clubId });
  if (!team) {
    throw new BadRequestError('Team not found or does not belong to your club');
  }

  //  Get all players by CNICs
  const players = await Player.find({ cnic: { $in: playerCnics }, club: clubId });

  //  Identify missing players
  const foundCnics = players.map((p) => p.cnic);
  const missingPlayers = playerCnics.filter((cnic) => !foundCnics.includes(cnic));

  //  Identify already assigned players
  const alreadyAssigned = players.filter((p) => p.team);
  const alreadyAssignedCnics = alreadyAssigned.map((p) => p.cnic);

  //  Remove already assigned players from processing
  const playersToAssign = players.filter((p) => !p.team);

  //  Check if adding players exceeds team limit
  const teamSize = team.players?.length || 0;
  const newTotal = teamSize + playersToAssign.length;

  if (team.team_type === 'mix' && newTotal > 8) {
    throw new BadRequestError(`A mix team cannot have more than 8 players. Available slots: ${8 - teamSize}`);
  }
  if (team.team_type === 'women-only' && newTotal > 6) {
    throw new BadRequestError(`A women-only team cannot have more than 6 players. Available slots: ${6 - teamSize}`);
  }

  //  Assign all valid players to the team
  const playerIds = playersToAssign.map((p) => p._id);

  await Player.updateMany(
    { _id: { $in: playerIds } },
    {
      $set: {
        team: team._id,
        assigned_team: 'assigned',
        assigned_team_name: team.team_name,
      },
    },
  );

  //  Add players to the team's player list
  await Team.findByIdAndUpdate(team._id, { $push: { players: { $each: playerIds } } });

  return {
    assignedPlayers: playersToAssign.length,
    missingPlayers,
    alreadyAssignedPlayers: alreadyAssignedCnics,
    team,
  };
};

// //  Fetch Players Based on Query Params
// export const getPlayersByFilter = async (
//   clubId: string,
//   teamName?: string,
//   assignedStatus?: 'assigned' | 'unassigned',
//   teamType?: 'mix' | 'women-only' //  Added teamType filter
// ) => {
//   let filter: any = { club: clubId };

//   //  If team_name is provided, get players of that team
//   if (teamName) {
//     const team = await Team.findOne({ team_name: teamName, club: clubId });
//     if (!team) {
//       throw new BadRequestError('Team not found or does not belong to your club');
//     }
//     filter.team = team._id;
//     filter.assigned_team = 'assigned'; //  Ensure only assigned players
//   }

//   //  If assigned_team=unassigned is provided, fetch only unassigned players
//   if (assignedStatus === 'unassigned') {
//     filter.assigned_team = 'unassigned';
//     filter.assigned_team_name = null;

//     //  Apply gender-based filter **ONLY** when `teamType=women-only`
//     if (teamType === 'women-only') {
//       filter.gender = 'female'; //  Ensure only female players appear
//     } else if (teamType === 'mix') {
//       filter.gender = { $in: ['male', 'female'] }; //  Ensure both genders appear in `mix`
//     }
//   }

//   console.log("Applying filter: ", filter); //  Debugging

//   //  Fetch players based on the filter
//   const players = await Player.find(filter)
//     .select('name cnic gender assigned_team assigned_team_name age contact')
//     .lean();

//   if (!players.length) {
//     throw new BadRequestError('No players found with the given criteria');
//   }

//   return players;
// };

// //  Fetch Players Based on Query Params   - changed Params
export const getPlayersByFilter = async (
  clubId: string,
  teamName?: string,
  assignedStatus?: 'assigned' | 'unassigned',
  teamTypeKey?: string, //  Changed from `teamType` to `teamTypeKey`
) => {
  let filter: any = { club: clubId };

  //  If teamName is provided, get players of that specific team
  if (teamName) {
    const team = await Team.findOne({ team_name: teamName, club: clubId });
    if (!team) {
      throw new BadRequestError('Team not found or does not belong to your club');
    }
    filter.team = team._id;
    filter.assigned_team = 'assigned'; //  Ensure only assigned players
  }

  //  Fetch Unassigned Players Before Gender Filtering
  if (assignedStatus === 'unassigned') {
    filter.assigned_team = 'unassigned';
    filter.assigned_team_name = null;

    //  Fetch Players Before Gender Filtering
    const allUnassignedPlayers = await Player.find(filter).lean();
    console.log(' All Unassigned Players: ', allUnassignedPlayers);

    if (teamTypeKey) {
      const team = await Team.findOne({ team_name: teamTypeKey, club: clubId });

      if (!team) {
        throw new BadRequestError('Team not found or does not belong to your club');
      }

      const teamType = team.team_type;

      //  Apply Gender-Based Filtering
      if (teamType === 'women-only') {
        filter.gender = 'female';
      } else if (teamType === 'mix') {
        filter.gender = { $in: ['male', 'female'] };
      }
    }
  }

  // console.log('Applying filter: ', filter); //  Debugging

  //  Fetch players based on the filter
  const players = await Player.find(filter).select('name cnic gender assigned_team age contact fitness_category bib_number').lean();
  // console.log(players);

  if (!players.length) {
    throw new BadRequestError('No players found with the given criteria');
  }

  return players;
};

//  Unassign a Player from a Team
export const unassignPlayerFromTeam = async (playerCnic: string, clubId: string) => {
  //  Find player by CNIC & Club
  const player = await Player.findOne({ cnic: playerCnic, club: clubId });
  if (!player) {
    throw new BadRequestError('Player not found or does not belong to your club');
  }

  //  Check if the player is already unassigned
  if (!player.team) {
    throw new BadRequestError('Player is already unassigned');
  }

  //  Find the team where the player was assigned
  const team = await Team.findById(player.team);
  if (!team) {
    throw new BadRequestError('Team not found');
  }

  //  Remove the player from the team's players array
  await Team.findByIdAndUpdate(team._id, { $pull: { players: player._id } });

  //  Reset the player’s team details
  player.team = undefined;
  player.assigned_team = 'unassigned';
  // player.assigned_team_name = undefined;

  //  Save the updated player
  await player.save();

  return { message: 'Player unassigned successfully', player };
};

//  Check if the player is assigned to a team before deletion
export const checkPlayerAssignment = async (playerCnic: string, clubId: string) => {
  //  Find the player by CNIC and Club ID
  const player = await Player.findOne({ cnic: playerCnic, club: clubId });
  if (!player) {
    throw new BadRequestError('Player not found or does not belong to your club');
  }

  //  If the player is assigned to a team, return details
  if (player.team) {
    const team = await Team.findById(player.team);
    return {
      assigned: true,
      message: `Player is assigned to the team: ${team?.team_name}`,
      player: {
        name: player.name,
        cnic: player.cnic,
        team_name: team?.team_name,
      },
    };
  }

  //  Player is unassigned and can be deleted
  return { assigned: false, message: 'Player is unassigned and can be deleted' };
};

//  Delete Player Service
export const deletePlayerService = async (playerCnic: string, clubId: string) => {
  //  Find the player by CNIC and club
  const player = await Player.findOne({ cnic: playerCnic, club: clubId });

  if (!player) {
    throw new BadRequestError('Player not found in your club');
  }

  //  Check if the player is assigned to a team
  if (player.team) {
    const team = await Team.findById(player.team);
    if (team) {
      return {
        success: false,
        message: `Player '${player.name}' with CNIC '${player.cnic}' is assigned to team '${team.team_name}'. Please unassign the player before deletion.`,
      };
    }
  }

  //  If unassigned, delete the player
  await Player.findByIdAndDelete(player._id);

  return {
    success: true,
    message: `Player '${player.name}' with CNIC '${player.cnic}' has been deleted successfully.`,
  };
};



      //  ------------------ APIS For TEAMS assignation in races --------------------------------

// ✅ Assign a Team to a Race
export const assignTeam = async (
  race_id: string,
  event_id: string,
  team_id: string,
  club_id: string
) => {
  // ✅ Ensure Club Exists
  const clubExists = await Club.findById(club_id);
  if (!clubExists) {
    throw new BadRequestError("Club not found.");
  }

  // ✅ Ensure Event Exists
  const eventExists = await Event.findById(event_id);
  if (!eventExists) {
    throw new BadRequestError("Event not found.");
  }

  // ✅ Ensure Race Exists and is in the Given Event
  const raceExists = await Race.findOne({ _id: race_id, event: event_id });
  if (!raceExists) {
    throw new BadRequestError("Race not found in this event.");
  }

  // ✅ Ensure Team Exists and Belongs to the Club
  const teamExists = await Team.findOne({ _id: team_id, club: club_id });
  if (!teamExists) {
    throw new BadRequestError("Team not found in this club.");
  }

  // ✅ Ensure the Team is NOT already assigned to the Race
  const existingAssignment = await RaceTeamAssignment.findOne({ team: team_id, race: race_id, event: event_id });
  if (existingAssignment) {
    throw new BadRequestError("This team is already assigned to this race.");
  }

  // ✅ Create and Save Assignment
  const assignment = new RaceTeamAssignment({
    team: team_id,
    race: race_id,
    event: event_id,
    club: club_id, // ✅ Ensures the relation is correct
  });

  return await assignment.save();
};



// ✅ Fetch Teams Assigned to a Specific Event and Race
export const getAssignedTeams = async (event_id: string, race_id: string) => {
  const assignedTeams = await RaceTeamAssignment.find({ event: event_id, race: race_id })
    .populate<{ team: { _id: string; team_name: string; club: string } }>({
      path: "team",
      select: "team_name club"
    })
    .lean(); // ✅ Convert Mongoose documents to plain JavaScript objects

  if (!assignedTeams || assignedTeams.length === 0) {
    throw new BadRequestError('No teams assigned to this race.');
  }

  return assignedTeams.map(assignment => ({
    _id: assignment.team._id, // ✅ Now correctly recognized
    team_name: assignment.team.team_name, // ✅ Now correctly recognized
    club: assignment.team.club, // ✅ Now correctly recognized
    assigned_race: assignment.race,
    event: assignment.event
  }));
};



// // ✅ Fetch Assigned Teams with Player Details (Filtered)
// export const getAssignedTeams = async (event_id: string, race_id: string) => {
//   const assignedTeams = await RaceTeamAssignment.find({ event: event_id, race: race_id })
//     .populate({
//       path: "team",
//       select: "_id team_name team_type description club", // ✅ Fetch only required team fields
//       populate: {
//         path: "club",
//         select: "_id name" // ✅ Fetch club details
//       }
//     })
//     .populate({
//       path: "race",
//       select: "_id name type distance date time" // ✅ Fetch race details
//     })
//     .populate({
//       path: "event",
//       select: "_id event_name" // ✅ Fetch event details
//     })
//     .lean(); // ✅ Convert Mongoose documents into plain JSON objects

//   // ✅ Handle case where no teams are assigned
//   if (!assignedTeams || assignedTeams.length === 0) {
//     throw new NotFoundError("No teams assigned to this race.");
//   }

//   // ✅ Fetch Player Details for Each Team
//   const teamsWithPlayers = await Promise.all(
//     assignedTeams.map(async (assignment) => {
//       if (!assignment.team || !assignment.team._id) return null; // ✅ Ensure valid team

//       // ✅ Fetch players assigned to this team in the specific race & event
//       const playersStatus = await RacePlayerAssignment.find({
//         event: event_id,
//         race: race_id,
//         team: assignment.team._id
//       })
//         .populate({
//           path: "player",
//           select: "_id name bib_number gender cnic" // ✅ Fetch required player details
//         })
//         .lean();

//       return {
//         _id: assignment.team._id,
//         team_name: assignment.team.team_name || "Unknown Team",
//         team_type: assignment.team.team_type || "Unknown Type",
//         description: assignment.team.description || "No Description",
//         club: assignment.team.club?.name || "Unknown Club",
//         assigned_race: {
//           _id: assignment.race?._id || null,
//           name: assignment.race?.name || "Unknown Race",
//           type: assignment.race?.type || "Unknown Type",
//           distance: assignment.race?.distance || 0,
//           date: assignment.race?.date || null,
//           time: assignment.race?.time || "Unknown Time",
//         },
//         event: assignment.event?._id || null,
//         players: playersStatus.map((playerAssignment) => ({
//           _id: playerAssignment.player?._id || null,
//           name: playerAssignment.player?.name || "Unknown Player",
//           bib_number: playerAssignment.player?.bib_number || "N/A",
//           gender: playerAssignment.player?.gender || "Unknown",
//           cnic: playerAssignment.player?.cnic || "N/A",
//         }))
//       };
//     })
//   );

//   // ✅ Remove any `null` values in case of missing teams
//   return teamsWithPlayers.filter((team) => team !== null);
// };




// ✅ Fetch Teams NOT Assigned to Any Race in a Specific Event
export const getUnassignedTeams = async (event_id: string, club_id: string) => {
  // Find all assigned teams for this event
  const assignedTeams = await RaceTeamAssignment.find({ event: event_id }).distinct("team");

  // Find all teams of the club that are NOT in assignedTeams
  const unassignedTeams = await Team.find({
    club: club_id,
    _id: { $nin: assignedTeams }
  }).select("_id team_name team_type club");

  if (!unassignedTeams || unassignedTeams.length === 0) {
    throw new BadRequestError('No unassigned teams found.');
  }

  return unassignedTeams;
};

