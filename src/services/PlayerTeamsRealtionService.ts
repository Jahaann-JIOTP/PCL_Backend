import mongoose from 'mongoose';
import Player from '../models/players';
import Team from '../models/teams';
import { BadRequestError } from '../utils/apiError';
import Club from "../models/Club";
import Race from "../models/Race";
import Event from "../models/Event";
import RaceTeamAssignment from '../models/RaceTeamAssignment';
import RacePlayerAssignment from '../models/RacePlayerAssignment';
import BibAssignment from "../models/BibAssignment";


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
    const allEvents = await Event.find().select("registration_enabled").lean();

    const registrationEnabled = allEvents.every(event => event.registration_enabled === true);


  if (!players.length) {
    throw new BadRequestError('No players found with the given criteria');
  }

  return { players, registration_enabled: registrationEnabled };
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

  // ASSIGN TEAM IN RACE AND ALSO AUTOMATICALLY ASSIGN THE PLAYERS ACTIVE / SUBSTITUTE
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

  // ✅ Ensure Race Exists and Fetch Active Player Limit
  const raceExists = await Race.findOne({ _id: race_id, event: event_id });
  if (!raceExists) {
    throw new BadRequestError("Race not found in this event.");
  }
  const activePlayerLimit = raceExists.active_player_no; // ✅ Get Dynamic Active Player Limit

  // ✅ Ensure Team Exists and Belongs to the Club
  const teamExists = await Team.findOne({ _id: team_id, club: club_id }).populate("players");
  if (!teamExists) {
    throw new BadRequestError("Team not found in this club.");
  }

  // ✅ Ensure the Team is NOT already assigned to the Race
  const existingAssignment = await RaceTeamAssignment.findOne({
    team: team_id,
    race: race_id,
    event: event_id,
  });

  if (existingAssignment) {
    throw new BadRequestError("This team is already assigned to this race.");
  }

  // ✅ Assign the Team to the Race
  const assignment = new RaceTeamAssignment({
    team: team_id,
    race: race_id,
    event: event_id,
    club: club_id,
  });

  await assignment.save();

// ✅ Fetch All Players of the Team (Ensure we get full player objects, not just IDs)
const teamWithPlayers = await Team.findById(team_id).populate("players", "_id");

if (!teamWithPlayers || !teamWithPlayers.players.length) {
  throw new BadRequestError("No players found in this team.");
}

// ✅ Get Players from Populated Team
const allPlayers = teamWithPlayers.players; 

// ✅ Assign "active" status to the first `active_player_no` players
const playersToAssign = allPlayers.map((player: any, index) => ({
  player: player._id, // ✅ Now `_id` exists because we populated it
  race: race_id,
  event: event_id,
  team: team_id,
  club: club_id,
  status: index < activePlayerLimit ? "active" : "substitute", // ✅ Dynamically assign "active" or "substitute"
}));

// ✅ Bulk Insert Player Assignments
await RacePlayerAssignment.insertMany(playersToAssign);

return { message: "Team assigned to race successfully, and players assigned dynamically." };

};

// ✅ Fetch all Teams in a Race and Their Players with Status
// export const getTeamsAndPlayersForRace = async (event_id: string, race_id: string) => {
//   // ✅ Step 1: Fetch all teams assigned to this race
//   const assignedTeams = await RaceTeamAssignment.find({ event: event_id, race: race_id })
//     .select("team") // ✅ Only fetch team IDs
//     .lean();

//   if (!assignedTeams || assignedTeams.length === 0) {
//     throw new BadRequestError("No teams assigned to this race.");
//   }

//   const teamIds = assignedTeams.map(team => team.team);

//   // ✅ Step 2: Fetch team details (name, type) for the retrieved team IDs
//   const teams = await Team.find({ _id: { $in: teamIds } })
//     .select("_id team_name team_type")
//     .lean();

//   if (!teams || teams.length === 0) {
//     throw new BadRequestError("No teams found for this race.");
//   }

//   // ✅ Step 3: Fetch all players from these teams
//   const players = await Player.find({ team: { $in: teamIds } })
//     .select("_id name bib_number gender cnic team emergency_contact weight") // ✅ Fetch only required fields
//     .lean();
    
//   // ✅ Step 4: Fetch player assignments (status) for the given event & race
//   const playerIds = players.map(player => player._id);
//   const playerAssignments = await RacePlayerAssignment.find({
//     player: { $in: playerIds },
//     event: event_id,
//     race: race_id
//   })
//     .select("player status") // ✅ Fetch player status only
//     .lean();

//   // ✅ Step 5: Create a mapping for quick lookup
//   const playerStatusMap = new Map(playerAssignments.map(pa => [pa.player.toString(), pa.status]));

//   // ✅ Step 6: Group players under their respective teams
//   const teamPlayerMap = new Map();
//   teams.forEach(team => {
//     teamPlayerMap.set(
//       team._id.toString(),
//       players
//         .filter(player => player.team?.toString() === team._id.toString())
//         .map(player => ({
//           _id: player._id,
//           player_name: player.name,
//           bib_number: player.bib_number || "N/A",
//           gender: player.gender,
//           cnic: player.cnic,
//           weight: player.weight,
//           emergency_contact: player.emergency_contact,
//           status: playerStatusMap.get(player._id.toString()) || null // ✅ Default to null
//         }))
//     );
//   });

//   // ✅ Step 7: Return structured response
//   return teams.map(team => ({
//     _id: team._id,
//     team_name: team.team_name,
//     team_type: team.team_type,
//     players: teamPlayerMap.get(team._id.toString()) || [] // ✅ Default to empty array if no players
//   }));
// };


// ✅ Modified Service: Get Teams and Players for a Specific Race & Event (Scoped to Club + Bib + Race Info)
export const getTeamsAndPlayersForRace = async (event_id: string, race_id: string, club_id: string) => {
  // ✅ Step 1: Fetch race info
  const raceInfo = await Race.findById(race_id).select("name type active_player_no").lean();
  if (!raceInfo) throw new BadRequestError("Race not found.");

  // ✅ Step 2: Fetch all teams assigned to this race + event + club
  const assignedTeams = await RaceTeamAssignment.find({
    event: event_id,
    race: race_id,
    club: club_id
  })
    .select("team")
    .lean();

  if (!assignedTeams || assignedTeams.length === 0) {
    throw new BadRequestError("No teams assigned to this race by your club.");
  }

  const teamIds = assignedTeams.map(team => team.team);

  // ✅ Step 3: Fetch team details
  const teams = await Team.find({ _id: { $in: teamIds } })
    .select("_id team_name team_type")
    .lean();

  // ✅ Step 4: Fetch all players from these teams
  const players = await Player.find({ team: { $in: teamIds } })
    .select("_id name gender cnic team emergency_contact weight")
    .lean();

  const playerIds = players.map(p => p._id);

  // ✅ Step 5: Get status from RacePlayerAssignment
  const playerAssignments = await RacePlayerAssignment.find({
    player: { $in: playerIds },
    event: event_id,
    race: race_id
  }).select("player status group").lean();

  const playerStatusMap = new Map(playerAssignments.map(pa => [pa.player.toString(), pa.status]));

  const playerGroupMap = new Map(
    playerAssignments.map(pa => [pa.player.toString(), pa.group || null])
  );
  
  const shouldIncludeGroup = [
    "Road Race Mix",
    "Road Race Women Only"
  ].includes(raceInfo.type);
  
  // ✅ Step 6: Get Bib Number Assignments
  const bibs = await BibAssignment.find({
    player: { $in: playerIds },
    event: event_id
  }).select("player bib_number").lean();

  const bibMap = new Map(bibs.map(b => [b.player.toString(), b.bib_number]));

// ✅ Step 9: Get race lock status from Event
const event = await Event.findById(event_id).select("race_lock_status").lean();

let lock_status = false; // default to false
if (event?.race_lock_status && typeof event.race_lock_status === "object") {
  const raceStatus = event.race_lock_status[race_id];
  lock_status = raceStatus === true;
}


  // ✅ Step 7: Group players under teams
  const teamPlayerMap = new Map();
  teams.forEach(team => {
    teamPlayerMap.set(
      team._id.toString(),
      players
        .filter(player => player.team?.toString() === team._id.toString())
        .map(player => {
          const base = {
            _id: player._id,
            player_name: player.name,
            bib_number: bibMap.get(player._id.toString()) || "N/A",
            gender: player.gender,
            cnic: player.cnic,
            weight: player.weight,
            emergency_contact: player.emergency_contact,
            status: playerStatusMap.get(player._id.toString()) || null,
          };
        
          if (shouldIncludeGroup) {
            return {
              ...base,
              group: playerGroupMap.get(player._id.toString()) || null
            };
          }
        
          return base;
        })
       
    );
  });

  // ✅ Step 8: Build Final Structured Response
  return {
    race_name: raceInfo.name,
    race_type: raceInfo.type,
    active_player_limit: raceInfo.active_player_no || 0,
    lock_status, 
    teams: teams.map(team => ({
      _id: team._id,
      team_name: team.team_name,
      team_type: team.team_type,
      players: teamPlayerMap.get(team._id.toString()) || []
    }))
  };
};



// ✅ Fetch Teams NOT Assigned to a Specific Race in an Event

export const getUnassignedTeams = async (event_id: string, race_id: string, club_id: string) => {
  // ✅ Step 1: Find the Race Type for Validation
  const race = await Race.findById(race_id).select("type");
  if (!race) {
    throw new BadRequestError("Race not found.");
  }

  const womenOnlyRaces = [
    "Road Race Women Only",
    // "Road - women",
    "Individual Time Trial Women Only",
    "Team Time Trial Women Only",
  ];

  const isWomenOnlyRace = womenOnlyRaces.includes(race.type);

  // ✅ Step 2: Get All Teams Already Assigned to This Race
  const assignedTeams = await RaceTeamAssignment.find({ event: event_id, race: race_id }).distinct("team");

  // ✅ Step 3: Find Teams NOT Assigned to This Race in the Event
  const teamFilter: any = {
    club: club_id,
    _id: { $nin: assignedTeams }, // Exclude already assigned teams
    team_type: isWomenOnlyRace ? "women-only" : "mix", // ✅ Apply gender-based filter
  };

  // ✅ Step 4: Get Teams (Now Fetching Players Count)
  const unassignedTeams = await Team.find(teamFilter)
    .select("_id team_name team_type club players") // ✅ Fetch players to filter based on count
    .lean();

  // ✅ Step 5: Filter Out Teams With Insufficient Players
  const minPlayersRequired = isWomenOnlyRace ? 4 : 6;
  const filteredTeams = unassignedTeams.filter(team => team.players.length >= minPlayersRequired);

  if (!filteredTeams || filteredTeams.length === 0) {
    throw new BadRequestError("No unassigned teams found.");
  }

  // ✅ Step 6: Return Only Required Fields
  return filteredTeams.map(({ _id, team_name, team_type, club }) => ({
    _id,
    team_name,
    team_type,
    club,
  }));
};


// ✅ Fetch Players of a Team with Their Status for a Specific Event & Race
export const getTeamPlayersWithStatus = async (team_id: string, event_id: string, race_id: string) => {
  // ✅ Step 1: Fetch all players of the given team
  const players = await Player.find({ team: team_id })
    .select("_id name bib_number gender cnic weight emergency_contact") // ✅ Fetch only required fields
    .lean();

  if (!players || players.length === 0) {
    throw new BadRequestError("No players found for this team.");
  }

  // ✅ Step 2: Fetch player assignments (status) for the given event & race
  const playerIds = players.map(player => player._id); // ✅ Extract player IDs
  const playerAssignments = await RacePlayerAssignment.find({
    player: { $in: playerIds },
    event: event_id,
    race: race_id
  })
    .select("player status") // ✅ Fetch player status only
    .lean();

  // ✅ Step 3: Map players with their status
  const playerStatusMap = new Map(playerAssignments.map(pa => [pa.player.toString(), pa.status]));

  // ✅ Step 4: Merge player details with their status
  const playersWithStatus = players.map(player => ({
    _id: player._id,
    player_name: player.name,
    bib_number: player.bib_number || "N/A",
    gender: player.gender,
    cnic: player.cnic,
    status: playerStatusMap.get(player._id.toString()) || "unassigned" // ✅ Default to "unassigned" if not found
  }));

  return playersWithStatus;
};

// Get the missing races array which are not yet assign to a team

export const getMissingRacesForTeam = async (team_id: string, event_id: string) => {
  // ✅ Step 1: Fetch the Team to Get its Type
  const team = await Team.findById(team_id).select("team_name team_type");
  if (!team) {
    throw new BadRequestError("Team not found.");
  }

  const isWomenOnlyTeam = team.team_type === "women-only";

  // ✅ Step 2: Define the Expected Race Types Based on Team Type
  const expectedRaceTypes = isWomenOnlyTeam
    ? ["Road Race Women Only", "Team Time Trial Women Only", "Individual Time Trial Women Only"]
    : ["Road Race Mix", "Team Time Trial Mix", "Individual Time Trial Mix"];

  // ✅ Step 3: Get All Races in This Event Matching the Expected Types
  const allRaces = await Race.find({
    event: event_id,
    type: { $in: expectedRaceTypes },
  })
    .select("_id name type")
    .lean();

  // ✅ Step 4: Fetch Races This Team Is Already Assigned To (Using RaceTeamAssignment)
  const assignedRaceIds = await RaceTeamAssignment.find({
    team: new mongoose.Types.ObjectId(team_id), // Ensure it's treated as ObjectId
    event: new mongoose.Types.ObjectId(event_id),
  })
    .distinct("race"); // Get all race ObjectIds assigned to this team

  // ✅ Convert ObjectId array to String array for proper comparison
  const assignedRaceIdsSet = new Set(assignedRaceIds.map((id) => id.toString()));

  // ✅ Step 5: Find Races That Are Not Yet Assigned
  const missingRaces = allRaces.filter((race) => !assignedRaceIdsSet.has(race._id.toString()));

  // ✅ Step 6: Return the Missing Races
  return {
    team_id: team_id,
    team_name: team.team_name,
    missing_races: missingRaces.map((race) => ({
      race_id: race._id,
      name: race.name,
      type: race.type,
    })),
  };
};



// FOR BIB ASSIGNMENT TAB

// ✅ Get All Races in Event with Teams & Players (with status, bib no, and club info)
export const getFullEventRaceData = async (event_id: string) => {
  // ✅ Step 1: Fetch all races of the event
  const races = await Race.find({ event: event_id })
    .select('_id name type distance date time')
    .lean();

  if (!races || races.length === 0) {
    throw new BadRequestError("No races found for this event.");
  }

  const raceIds = races.map(r => r._id);

  // ✅ Step 2: Fetch all team assignments
  const allAssignments = await RaceTeamAssignment.find({ event: event_id, race: { $in: raceIds } })
    .select('race team club')
    .lean();

  const teamIds = allAssignments.map(a => a.team);
  const raceTeamMap = new Map<string, { team: string, club: string }[]>();

  allAssignments.forEach((a) => {
    const r = a.race.toString();
    if (!raceTeamMap.has(r)) raceTeamMap.set(r, []);
    raceTeamMap.get(r)?.push({ team: a.team.toString(), club: a.club.toString() });
  });

  // ✅ Step 3: Fetch team details
  const teams = await Team.find({ _id: { $in: teamIds } })
    .select('_id team_name team_type club')
    .populate('club', 'name')
    .lean();

  const players = await Player.find({ team: { $in: teamIds } })
    .select('_id name gender cnic team emergency_contact weight')
    .lean();

  const playerIds = players.map(p => p._id);

  const assignments = await RacePlayerAssignment.find({ player: { $in: playerIds }, event: event_id })
    .select('player race status group')
    .lean();

  const bibs = await BibAssignment.find({ player: { $in: playerIds }, event: event_id })
    .select('player bib_number')
    .lean();

  const statusMap = new Map(assignments.map(a => [`${a.player}-${a.race}`, a.status]));
  const groupMap = new Map(assignments.map(a => [`${a.player}-${a.race}`, a.group || null]));
  const bibMap = new Map(bibs.map(b => [b.player.toString(), b.bib_number]));

  const teamMap = new Map();
  teams.forEach(t => teamMap.set(t._id.toString(), t));

  const playerTeamMap = new Map();
  teams.forEach(t => playerTeamMap.set(t._id.toString(), []));

  players.forEach(p => {
    if (playerTeamMap.has(p.team?.toString())) {
      playerTeamMap.get(p.team?.toString()).push({
        _id: p._id,
        player_name: p.name,
        bib_number: bibMap.get(p._id.toString()) || 'N/A',
        gender: p.gender,
        cnic: p.cnic,
        weight: p.weight,
        emergency_contact: p.emergency_contact,
      });
    }
  });

  return races.map(race => {
    const teamsInRace = raceTeamMap.get(race._id.toString()) || [];
    return {
      _id: race._id,
      name: race.name,
      type: race.type,
      distance: race.distance,
      date: race.date,
      time: race.time,
      teams: teamsInRace.map(({ team, club }) => {
        const teamData = teamMap.get(team);
        const players = playerTeamMap.get(team) || [];
        const shouldIncludeGroup = ["Road Race Mix", "Road Race Women Only"].includes(race.type);
        const playersWithStatus = players.map(p => {
          const base = {
            ...p,
            status: statusMap.get(`${p._id}-${race._id}`) || null
          };
          
          if (shouldIncludeGroup) {
            return {
              ...base,
              group: groupMap.get(`${p._id}-${race._id}`) || null
            };
          }
        
          return base;
        });
        return {
          _id: teamData._id,
          team_name: teamData.team_name,
          team_type: teamData.team_type,
          club: {
            _id: teamData.club?._id || club,
            name: teamData.club?.name || 'Unknown',
          },
          players: playersWithStatus
        };
      })
    };
  });
};



// fOR Publish  teams and unpublish teams from admin portal - Get api on that flag
// export const getPublishedRaceDataByEvent = async (event_id: string) => {
//   // 1. Check if Event exists and if publish_teams is true
//   const event = await Event.findById(event_id).lean();

//   if (!event || !event.publish_teams) {
//     return null; // controller will handle the response message
//   }

//   // 2. Get all races for this event
//   const races = await Race.find({ event: event_id }).lean();
//   const raceIds = races.map(r => r._id);

//   // 3. Get all assignments for races in this event
//   const raceAssignments = await RaceTeamAssignment.find({ event: event_id })
//     .select("team race club")
//     .lean();

//   const teamIds = raceAssignments.map(a => a.team);
//   const teamClubMap = new Map(raceAssignments.map(a => [a.team.toString(), a.club.toString()]));

//   // 4. Get Teams + their Clubs
//   const teams = await Team.find({ _id: { $in: teamIds } })
//     .select("_id team_name team_type club")
//     .lean();

//   const clubIds = teams.map(t => teamClubMap.get(t._id.toString()));
//   const clubs = await Club.find({ _id: { $in: clubIds } }).select("_id name").lean();
//   const clubMap = new Map(clubs.map(club => [club._id.toString(), club.name]));

//   // 5. Get all Players in those teams
//   const players = await Player.find({ team: { $in: teamIds } }).lean();
//   const playerIds = players.map(p => p._id.toString());

//   // 6. Get Player Status
//   const playerStatuses = await RacePlayerAssignment.find({
//     event: event_id,
//     race: { $in: raceIds },
//     player: { $in: playerIds }
//   }).lean();

//   const statusMap = new Map(
//     playerStatuses.map(p => [p.player.toString(), p.status])
//   );

//   // 7. Get Bib Assignments
//   const bibs = await BibAssignment.find({
//     event: event_id,
//     player: { $in: playerIds }
//   }).lean();

//   const bibMap = new Map(
//     bibs.map(b => [b.player.toString(), b.bib_number])
//   );

//   // 8. Group Players by Team
//   const teamPlayerMap = new Map();
//   teams.forEach(team => {
//     const teamPlayers = players.filter(p => p.team?.toString() === team._id.toString()).map(p => ({
//       _id: p._id,
//       player_name: p.name,
//       bib_number: bibMap.get(p._id.toString()) || "N/A",
//       gender: p.gender,
//       cnic: p.cnic,
//       weight: p.weight,
//       emergency_contact: p.emergency_contact,
//       status: statusMap.get(p._id.toString()) || null
//     }));
//     teamPlayerMap.set(team._id.toString(), teamPlayers);
//   });

//   // 9. Group Teams under Each Race
//   const raceMap = new Map();
//   races.forEach(race => {
//     raceMap.set(race._id.toString(), {
//       race_id: race._id,
//       name: race.name,
//       type: race.type,
//       teams: []
//     });
//   });

//   for (const assignment of raceAssignments) {
//     const team = teams.find(t => t._id.toString() === assignment.team.toString());
//     if (!team) continue;

//     const raceBlock = raceMap.get(assignment.race.toString());
//     if (raceBlock) {
//       raceBlock.teams.push({
//         _id: team._id,
//         team_name: team.team_name,
//         team_type: team.team_type,
//         club_id: assignment.club,
//         club_name: clubMap.get(assignment.club.toString()) || "N/A",
//         players: teamPlayerMap.get(team._id.toString()) || []
//       });
//     }
//   }

//   // 10. Return Final Array of Races
//   return Array.from(raceMap.values());
// };

export const getPublishedRaceDataByEvent = async (event_id: string, allowedRaceTypes?: string[]) => {
  const event = await Event.findById(event_id).lean();
  if (!event || !event.publish_teams) return null;

  // 1. Get all races, apply race-type filter if provided
  const raceQuery: any = { event: event_id };
  if (allowedRaceTypes) raceQuery.type = { $in: allowedRaceTypes };

  const races = await Race.find(raceQuery).lean();
  const raceIds = races.map(r => r._id);

  // 2. Get all team assignments for those races
  const raceAssignments = await RaceTeamAssignment.find({
    event: event_id,
    race: { $in: raceIds },
  }).select("team race club").lean();

  const teamIds = raceAssignments.map(a => a.team);
  const teamClubMap = new Map(raceAssignments.map(a => [a.team.toString(), a.club.toString()]));

  // 3. Teams & their Clubs
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const clubIds = teams.map(t => teamClubMap.get(t._id.toString()));
  const clubs = await Club.find({ _id: { $in: clubIds } }).select("_id name").lean();
  const clubMap = new Map(clubs.map(club => [club._id.toString(), club.name]));

  // 4. Players
  const players = await Player.find({ team: { $in: teamIds } }).lean();
  const playerIds = players.map(p => p._id.toString());

  // 5. Player Status
  const playerStatuses = await RacePlayerAssignment.find({
    event: event_id,
    race: { $in: raceIds },
    player: { $in: playerIds },
  }).select("player status group race").lean();

  const statusMap = new Map(playerStatuses.map(p => [p.player.toString(), p.status]));
  const groupMap = new Map(playerStatuses.map(p => [`${p.player.toString()}-${p.race.toString()}`, p.group || null]));
  const raceTypeMap = new Map(races.map(r => [r._id.toString(), r.type]));
  
  // 6. Bibs
  const bibs = await BibAssignment.find({ event: event_id, player: { $in: playerIds } }).lean();
  const bibMap = new Map(bibs.map(b => [b.player.toString(), b.bib_number]));

  // 7. Group Players by Team
  const teamPlayerMap = new Map();
  teams.forEach(team => {
    const teamPlayers = players
      .filter(p => p.team?.toString() === team._id.toString())
      .map(p => {
        const base = {
          _id: p._id,
          player_name: p.name,
          bib_number: bibMap.get(p._id.toString()) || "N/A",
          gender: p.gender,
          cnic: p.cnic,
          weight: p.weight,
          emergency_contact: p.emergency_contact,
          status: statusMap.get(p._id.toString()) || null,
        };
  
        // ✅ Only add group if race is a Road Race (we’ll check later)
        return { ...base, __playerId: p._id.toString() }; // temp field for race lookup
      });
    teamPlayerMap.set(team._id.toString(), teamPlayers);
  });
  

  // 8. Group teams under each race
  const raceMap = new Map();
  races.forEach(race => {
    raceMap.set(race._id.toString(), {
      race_id: race._id,
      name: race.name,
      type: race.type,
      teams: [],
    });
  });

  for (const assignment of raceAssignments) {
    const team = teams.find(t => t._id.toString() === assignment.team.toString());
    if (!team) continue;

    const raceBlock = raceMap.get(assignment.race.toString());
    if (raceBlock) {
      const isRoadRace = ["Road Race Mix", "Road Race Women Only"].includes(raceBlock.type);
      const players = (teamPlayerMap.get(team._id.toString()) || []).map(p => {
        const base = { ...p };
        if (isRoadRace) {
          base.group = groupMap.get(`${p.__playerId}-${assignment.race.toString()}`) || null;
        }
        delete base.__playerId;
        return base;
      });
    
      raceBlock.teams.push({
        _id: team._id,
        team_name: team.team_name,
        team_type: team.team_type,
        club_id: assignment.club,
        club_name: clubMap.get(assignment.club.toString()) || "N/A",
        players,
      });
    }    
  }

  return Array.from(raceMap.values());
};

