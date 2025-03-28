import Event from '../models/Event';
import { NotFoundError } from '../utils/apiError';
import RacePlayerAssignment from '../models/RacePlayerAssignment';
import { BadRequestError } from '../utils/apiError';
import Player, { IPlayer } from '../models/players';
import Club from '../models/Club';
import teams from '../models/teams';
import Race from '../models/Race';

//  Fetch All Events with Their Races
export const getAllEventsWithRaces = async () => {
  const events = await Event.find()
    .select('event_name year location status races registration_enabled')
    .populate({
      path: 'races', //  Ensure Races are Populated
      select: 'name type distance date time teams',
      populate: { path: 'teams', select: 'team_name' }, //  Populate Teams Inside Races
    })
    .lean(); //  Converts Mongoose Document to Plain JSON Object

  if (!events || events.length === 0) {
    throw new NotFoundError('No events found');
  }

  return events.map((event) => ({
    _id: event._id,
    event_name: event.event_name,
    year: event.year,
    location: event.location,
    status: event.status,
    registration_enabled: event.registration_enabled,
    races: event.races
      ? event.races.map((race: any) => ({
          _id: race._id,
          name: race.name,
          type: race.type,
          distance: race.distance,
          date: race.date,
          time: race.time,
          teams: race.teams,
        }))
      : [], //  Ensure `races` is an Array, Even If Empty
  }));
};

// Assign the ACTIVE / SUBSTITUTE flag to player
export const assignPlayersToRace = async (
  race_id: string,
  event_id: string,
  team_id: string,
  club_id: string, // ✅ Extracted from JWT
  players: { player_id: string; status: 'active' | 'substitute' }[],
) => {
  if (!race_id || !event_id || !team_id || !club_id || !players || players.length === 0) {
    throw new BadRequestError('Race ID, Event ID, Team ID, Club ID, and Players list are required.');
  }

  // ✅ 1. Validate if Club Exists
  const clubExists = await Club.findById(club_id);
  if (!clubExists) {
    throw new BadRequestError('Club not found.');
  }

  // ✅ Ensure Team belongs to the Club
  const teamExists = await teams.findOne({ _id: team_id, club: club_id });
  if (!teamExists) {
    throw new BadRequestError('Team not found or does not belong to this club.');
  }

  // ✅ Fetch team type
  const teamType = teamExists.team_type;

  // ✅ Count how many "active" players are currently assigned
  const activePlayersCount = await RacePlayerAssignment.countDocuments({
    team: team_id,
    event: event_id,
    race: race_id,
    status: 'active',
  });

  // ✅ Count how many new "active" players are being assigned
  const newActivePlayersCount = players.filter((p) => p.status === 'active').length;

  // ✅ Set Maximum Limit Based on Team Type
  const maxActiveLimit = teamType === 'mix' ? 6 : 4;

  // ✅ Ensure the total "active" count doesn't exceed the limit
  if (activePlayersCount + newActivePlayersCount > maxActiveLimit) {
    throw new BadRequestError(`Cannot assign more than ${maxActiveLimit} active players to this ${teamType} team.`);
  }

  // ✅ 3. Validate Each Player belongs to the Team
  for (const { player_id } of players) {
    const playerExists = await Player.findOne({ _id: player_id });
    if (!playerExists) {
      throw new BadRequestError(`Player ${player_id} not found in this team.`);
    }
  }

  const assignments = players.map(({ player_id, status }) => ({
    player: player_id,
    race: race_id,
    event: event_id,
    team: team_id,
    club: club_id, // ✅ Assign Club ID
    status,
  }));

  try {
    // Insert new player assignments (only if they don't already exist)
    await RacePlayerAssignment.insertMany(assignments, { ordered: false });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new BadRequestError('Some players are already assigned to this race in this event.');
    }
    throw error;
  }

  return { message: 'Players assigned successfully' };
};



//  Update Player Status in a Race
// export const updatePlayerStatusInRace = async (
//   race_id: string,
//   event_id: string,
//   team_id: string,
//   club_id: string,
//   player_id: string,
//   status: 'active' | 'substitute',
// ) => {
//   //  Ensure that the assignment exists before updating
//   const existingAssignment = await RacePlayerAssignment.findOne({
//     race: race_id,
//     event: event_id,
//     team: team_id,
//     player: player_id,
//     club: club_id, // Ensure update is within the same club
//   });

//   if (!existingAssignment) {
//     throw new BadRequestError('Player is not assigned to this race in this event.');
//   }

//   //  Update the player's status
//   existingAssignment.status = status;
//   await existingAssignment.save();

//   return { message: 'Player status updated successfully' };
// };

// ✅ Update Player Status in a Race
// export const updatePlayerStatusInRace = async (
//   race_id: string,
//   event_id: string,
//   team_id: string,
//   club_id: string,
//   player_id: string,
//   group: string,
//   status: 'active' | 'substitute',
// ) => {
//   // ✅ Ensure the assignment exists
//   const existingAssignment = await RacePlayerAssignment.findOne({
//     race: race_id,
//     event: event_id,
//     team: team_id,
//     player: player_id,
//     club: club_id, // ✅ Ensure it's within the same club
//   });

//   if (!existingAssignment) {
//     throw new BadRequestError('Player is not assigned to this race in this event.');
//   }

//   // ✅ Fetch the race details to get the `active_player_no` limit
//   const race = await Race.findById(race_id);
//   if (!race) {
//     throw new BadRequestError('Race not found.');
//   }
//   const activePlayerLimit = race.active_player_no; // ✅ Get active player limit

//   // ✅ Count current "active" players in this race & team
//   const activePlayersCount = await RacePlayerAssignment.countDocuments({
//     race: race_id,
//     event: event_id,
//     team: team_id,
//     status: 'active',
//   });

//   // ✅ If updating to "active", check if the limit is already reached
//   if (status === 'active' && activePlayersCount >= activePlayerLimit) {
//     throw new BadRequestError(
//       `This race already has ${activePlayerLimit} active players. Please switch an existing active player to substitute first.`
//     );
//   }

//   existingAssignment.group = group;
//   // ✅ Update the player's status
//   existingAssignment.status = status;
//   await existingAssignment.save();

//   return { message: 'Player status updated successfully.' };
// };

// ✅ Update Player Status in a Race (with Group Handling)
// ✅ Service 1: Update Player Status ONLY
export const updatePlayerStatusOnly = async (
  race_id: string,
  event_id: string,
  team_id: string,
  club_id: string,
  player_id: string,
  status: 'active' | 'substitute'
) => {
  const assignment = await RacePlayerAssignment.findOne({
    race: race_id,
    event: event_id,
    team: team_id,
    player: player_id,
    club: club_id,
  });

  if (!assignment) {
    throw new BadRequestError('Player is not assigned to this race in this event.');
  }

  const race = await Race.findById(race_id);
  if (!race) throw new BadRequestError('Race not found.');

  const activePlayerLimit = race.active_player_no;
  const activeCount = await RacePlayerAssignment.countDocuments({
    race: race_id,
    event: event_id,
    team: team_id,
    status: 'active'
  });

  if (status === 'active' && activeCount >= activePlayerLimit) {
    throw new BadRequestError(
      `This race already has ${activePlayerLimit} active players. Please switch an existing active player to substitute first.`
    );
  }

  if (status === 'substitute' && assignment.group) {
    throw new BadRequestError(
      `Cannot mark this player as substitute while they are assigned to group "${assignment.group}". Please remove the group assignment first.`
    );
  }

  assignment.status = status;
  await assignment.save();
  return { message: 'Player status updated successfully.' };
};


// ✅ Service 2: Update Player Group ONLY
export const updatePlayerGroupOnly = async (
  race_id: string,
  event_id: string,
  team_id: string,
  club_id: string,
  player_id: string,
  group: string // can be "" to unassign
) => {
  const assignment = await RacePlayerAssignment.findOne({
    race: race_id,
    event: event_id,
    team: team_id,
    player: player_id,
    club: club_id,
  });

  if (!assignment) {
    throw new BadRequestError('Player is not assigned to this race in this event.');
  }

  // ✅ Unassigning group using $unset (will remove the field)
  if (group === '') {
    await RacePlayerAssignment.updateOne(
      { _id: assignment._id },
      { $unset: { group: "" } }
    );
    return { message: 'Group unassigned successfully.' };
  }

  // ✅ Assign group (only for active players)
  if (assignment.status !== 'active') {
    throw new BadRequestError('Only active players can be assigned to a group.');
  }

  assignment.group = group;
  await assignment.save();

  return { message: 'Group assigned successfully.' };
};
