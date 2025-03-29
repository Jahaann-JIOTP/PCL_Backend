import Event from '../models/Event';
import Race, { IRace } from '../models/Race';
import { BadRequestError, NotFoundError } from '../utils/apiError';
import RacePlayerAssignment from "../models/RacePlayerAssignment";
import RaceTeamAssignment from '../models/RaceTeamAssignment';
import Team from '../models/teams';
import Player, { IPlayer } from '../models/players';
import Club from '../models/Club';

//  Create a New Race (Admin Only) 

// export const createRace = async (
//   name: string,
//   type: string,
//   distance: number,
//   date: Date,
//   time: string,
//   createdBy: string,
//   event_id: string
// ) => {
//   //  Ensure race name is unique within the same event
//   const existingRace = await Race.findOne({ name, event: event_id });
//   if (existingRace) {
//     throw new BadRequestError('A race with this name already exists for this event.');
//   }

//   //  Ensure the event exists before adding a race
//   const event = await Event.findById(event_id);
//   if (!event) {
//     throw new BadRequestError('Event not found. Please provide a valid event_id.');
//   }

//   //  Create new race
//   const race = new Race({
//     name,
//     type,
//     distance,
//     date,
//     time,
//     event: event_id, // Linking race to event
//     createdBy,
//   });

//   const savedRace = await race.save();

//   //  Update the event to include this race in its `races` array
//   await Event.findByIdAndUpdate(event_id, { $push: { races: savedRace._id } });

//   return savedRace;
// };
export const createRace = async (
  name: string,
  type: string,
  distance: number,
  date: Date,
  time: string,
  createdBy: string,
  event_id: string,
  active_player_no: number // ✅ Accept active players count
) => {
  // ✅ Ensure race name is unique within the same event
  const existingRace = await Race.findOne({ name, event: event_id });
  if (existingRace) {
    throw new BadRequestError('A race with this name already exists for this event.');
  }

  // ✅ Ensure the event exists before adding a race
  const event = await Event.findById(event_id);
  if (!event) {
    throw new BadRequestError('Event not found. Please provide a valid event_id.');
  }

  // ✅ Create new race with `active_player_no`
  const race = new Race({
    name,
    type,
    distance,
    date,
    time,
    event: event_id,
    createdBy,
    active_player_no, // ✅ New field
  });

  const savedRace = await race.save();

  // ✅ Update the event to include this race in its `races` array
  await Event.findByIdAndUpdate(event_id, { $push: { races: savedRace._id } });

  return savedRace;
};


//  Get All Races (Visible to All Clubs)
export const getAllRaces = async () => {
  return await Race.find().select('name type distance date time teams').populate('teams', 'team_name');
};

//  Get a Single Race by Name
export const getRaceByName = async (raceName: string) => {
  const race = await Race.findOne({ name: raceName }).populate('teams', 'team_name');
  if (!race) {
    throw new NotFoundError('Race not found');
  }
  return race;
};

//  Update Race (Admin Only) - Ensuring Unique Name in the Event
export const updateRace = async (
  raceId: string,
  updates: Partial<IRace>
) => {
  const { name, event } = updates;

  //  Ensure the race exists
  const race = await Race.findById(raceId);
  if (!race) {
    throw new NotFoundError('Race not found');
  }

  //  Ensure the event exists before updating
  if (event) {
    const eventExists = await Event.findById(event);
    if (!eventExists) {
      throw new BadRequestError('Invalid event ID. The specified event does not exist.');
    }
  }

  //  Ensure race name is unique within the same event
  if (name && race.event) {
    const existingRace = await Race.findOne({ name, event: race.event, _id: { $ne: raceId } });
    if (existingRace) {
      throw new BadRequestError('A race with this name already exists for this event.');
    }
  }

  Object.assign(race, updates);
  await race.save();

  return race;
};

//  Delete Race (Admin Only) - Prevents deletion if teams exist
export const deleteRace = async (raceId: string) => {
  const race = await Race.findById(raceId);

  if (!race) {
    throw new NotFoundError('Race not found');
  }

  // // ✅ Prevent Deletion if Teams Exist
  // if (race.teams && race.teams.length > 0) {
  //   throw new BadRequestError('Cannot delete a race with assigned teams. Unassign teams first.');
  // }

  // ✅ Remove Race ID from the Event Collection
  await Event.findByIdAndUpdate(race.event, { 
    $pull: { races: raceId } 
  });

  // ✅ Delete the Race
  await race.deleteOne();

  return { message: 'Race deleted successfully' };
};



// ✅ Fetch all Races of an Event & Attach Teams & Players with Status - without club name
// export const getRacesByEvent = async (eventName: string) => {
//   // ✅ Step 1: Find the event by name
//   const event = await Event.findOne({ event_name: eventName });

//   if (!event) {
//     throw new BadRequestError("Event not found");
//   }

//   // ✅ Step 2: Find all races in this event
//   const races = await Race.find({ event: event._id })
//     .select("_id name type distance date time event") // ✅ Fetch race details
//     .lean();

//   if (!races || races.length === 0) {
//     throw new BadRequestError("No races found for this event.");
//   }

//   // ✅ Step 3: Fetch all team assignments for these races
//   const raceIds = races.map((race) => race._id);
//   const assignedTeams = await RaceTeamAssignment.find({
//     event: event._id,
//     race: { $in: raceIds },
//   })
//     .select("race team") // ✅ Fetch only necessary fields
//     .lean();

//   // ✅ Step 4: Group teams by race
//   const raceTeamMap = new Map();
//   assignedTeams.forEach((assignment) => {
//     const raceId = assignment.race.toString();
//     if (!raceTeamMap.has(raceId)) {
//       raceTeamMap.set(raceId, []);
//     }
//     raceTeamMap.get(raceId).push(assignment.team);
//   });

//   // ✅ Step 5: Fetch all team details
//   const teamIds = assignedTeams.map((t) => t.team);
//   const teams = await Team.find({ _id: { $in: teamIds } })
//     .select("_id team_name team_type description")
//     .lean();

//   // ✅ Step 6: Fetch players for these teams
//   const players = await Player.find({ team: { $in: teamIds } })
//     .select("_id name bib_number gender cnic team")
//     .lean();

//   // ✅ Step 7: Fetch player status from `RacePlayerAssignment`
//   const playerIds = players.map((p) => p._id);
//   const playerAssignments = await RacePlayerAssignment.find({
//     player: { $in: playerIds },
//     event: event._id,
//     race: { $in: raceIds },
//   })
//     .select("player status race team")
//     .lean();

//   // ✅ Step 8: Create Player Status Map
//   const playerStatusMap = new Map(playerAssignments.map((pa) => [pa.player.toString(), pa.status]));

//   // ✅ Step 9: Map Players to Their Teams
//   const teamPlayerMap = new Map();
//   teams.forEach((team) => {
//     teamPlayerMap.set(
//       team._id.toString(),
//       players
//         .filter((player) => player.team?.toString() === team._id.toString())
//         .map((player) => ({
//           _id: player._id,
//           player_name: player.name,
//           bib_number: player.bib_number || "N/A",
//           gender: player.gender,
//           cnic: player.cnic,
//           status: playerStatusMap.get(player._id.toString()) || "unassigned",
//         }))
//     );
//   });

//   // ✅ Step 10: Attach Teams (With Players) to Races
//   const racesWithTeams = races.map((race) => ({
//     _id: race._id,
//     name: race.name,
//     type: race.type,
//     distance: race.distance,
//     date: race.date,
//     time: race.time,
//     event: race.event,
//     teams: (raceTeamMap.get(race._id.toString()) || []).map((teamId) => {
//       const team = teams.find((t) => t._id.toString() === teamId.toString());
//       return team
//         ? {
//             _id: team._id,
//             team_name: team.team_name,
//             team_type: team.team_type,
//             description: team.description,
//             players: teamPlayerMap.get(team._id.toString()) || [],
//           }
//         : null;
//     }).filter((team) => team !== null), // ✅ Remove null values
//   }));

//   return racesWithTeams;
// };

// ✅ Fetch all Races of an Event & Attach Teams & Players with Status - with club name

export const getRacesByEvent = async (eventName: string) => {
  // ✅ Step 1: Find the event by name
  const event = await Event.findOne({ event_name: eventName });

  if (!event) {
    throw new BadRequestError("Event not found");
  }

  // ✅ Step 2: Find all races in this event
  const races = await Race.find({ event: event._id })
    .select("_id name type distance date time event active_player_no") // ✅ Fetch race details
    .lean();

  if (!races || races.length === 0) {
    throw new BadRequestError("No races found for this event.");
  }

  // ✅ Step 3: Fetch all team assignments for these races
  const raceIds = races.map((race) => race._id);
  const assignedTeams = await RaceTeamAssignment.find({
    event: event._id,
    race: { $in: raceIds },
  })
    .select("race team club") // ✅ Fetch club details along with team
    .lean();

  // ✅ Step 4: Group teams by race
  const raceTeamMap = new Map();
  assignedTeams.forEach((assignment) => {
    const raceId = assignment.race.toString();
    if (!raceTeamMap.has(raceId)) {
      raceTeamMap.set(raceId, []);
    }
    raceTeamMap.get(raceId).push({
      team: assignment.team,
      club: assignment.club, // ✅ Store the club ID
    });
  });

  // ✅ Step 5: Fetch all team details
  const teamIds = assignedTeams.map((t) => t.team);
  const teams = await Team.find({ _id: { $in: teamIds } })
    .select("_id team_name team_type description")
    .lean();

  // ✅ Step 6: Fetch all club details for teams
  const clubIds = assignedTeams.map((t) => t.club);
  const clubs = await Club.find({ _id: { $in: clubIds } }).select("_id name").lean();

  // ✅ Step 7: Create a Club Map for Quick Lookup
  const clubMap = new Map(clubs.map((club) => [club._id.toString(), club.name]));

  // ✅ Step 8: Fetch players for these teams
  const players = await Player.find({ team: { $in: teamIds } })
    .select("_id name bib_number gender cnic team weight age emergency_contact")
    .lean();

  // ✅ Step 9: Fetch player status from `RacePlayerAssignment`
  const playerIds = players.map((p) => p._id);
  const playerAssignments = await RacePlayerAssignment.find({
    player: { $in: playerIds },
    event: event._id,
    race: { $in: raceIds },
  })
    .select("player status race team")
    .lean();

  // ✅ Step 10: Create Player Status Map
  // const playerStatusMap = new Map(playerAssignments.map((pa) => [pa.player.toString(), pa.status]));
  const playerStatusMap = new Map<string, Map<string, string>>(); // Map<raceId, Map<playerId, status>>

  playerAssignments.forEach(pa => {
    const raceKey = pa.race.toString();
    if (!playerStatusMap.has(raceKey)) {
      playerStatusMap.set(raceKey, new Map());
    }
    playerStatusMap.get(raceKey)!.set(pa.player.toString(), pa.status);
  });


  // ✅ Step 11: Map Players to Their Teams
  const teamPlayerMap = new Map();
  teams.forEach((team) => {
    teamPlayerMap.set(
      team._id.toString(),
      players
        .filter((player) => player.team?.toString() === team._id.toString())
        .map((player) => ({
          _id: player._id,
          player_name: player.name,
          bib_number: player.bib_number || "N/A",
          gender: player.gender,
          cnic: player.cnic,
          weight: player.weight,
          emergency_contact: player.emergency_contact,
          disability: player.disability,
          age: player.age,
          status: playerStatusMap.get(player._id.toString()) || "unassigned",
        }))
    );
  });

  /// ✅ Step 11 & 12 Combined: Attach Teams (With Players) to Races
const racesWithTeams = races.map((race) => {
  // ✅ Get player status map per race
  const statusMapForRace = new Map(
    playerAssignments
      .filter((pa) => pa.race.toString() === race._id.toString())
      .map((pa) => [pa.player.toString(), pa.status])
  );

  const teamsForRace = (raceTeamMap.get(race._id.toString()) || []).map(({ team: teamId, club: clubId }) => {
    const team = teams.find((t) => t._id.toString() === teamId.toString());
    if (!team) return null;

    const playersForTeam = players
      .filter((p) => p.team?.toString() === team._id.toString())
      .map((player) => ({
        _id: player._id,
        player_name: player.name,
        bib_number: player.bib_number || "N/A",
        gender: player.gender,
        cnic: player.cnic,
        weight: player.weight,
        emergency_contact: player.emergency_contact,
        disability: player.disability,
        age: player.age,
        status: statusMapForRace.get(player._id.toString()) || "unassigned",
      }));

    return {
      _id: team._id,
      team_name: team.team_name,
      team_type: team.team_type,
      description: team.description,
      club_name: clubMap.get(clubId.toString()) || "Unknown Club",
      players: playersForTeam,
    };
  }).filter((team) => team !== null);

  return {
    _id: race._id,
    name: race.name,
    type: race.type,
    distance: race.distance,
    date: race.date,
    time: race.time,
    event: race.event,
    active_player_no: race.active_player_no,
    teams: teamsForRace,
  };
});
return racesWithTeams;
}