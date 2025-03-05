import Event from '../models/Event';
import { NotFoundError } from '../utils/apiError';
import RacePlayerAssignment from "../models/RacePlayerAssignment";
import { BadRequestError } from "../utils/apiError";
import Player, { IPlayer } from '../models/players';
import Club from '../models/Club';
import teams from '../models/teams';

//  Fetch All Events with Their Races
export const getAllEventsWithRaces = async () => {
    const events = await Event.find()
        .select('event_name year location status races')
        .populate({
            path: 'races', //  Ensure Races are Populated
            select: 'name type distance date time teams',
            populate: { path: 'teams', select: 'team_name' } //  Populate Teams Inside Races
        })
        .lean(); //  Converts Mongoose Document to Plain JSON Object

    if (!events || events.length === 0) {
        throw new NotFoundError('No events found');
    }

    return events.map(event => ({
        _id: event._id,
        event_name: event.event_name,
        year: event.year,
        location: event.location,
        status: event.status,
        races: event.races ? event.races.map((race: any) => ({
            _id: race._id,
            name: race.name,
            type: race.type,
            distance: race.distance,
            date: race.date,
            time: race.time,
            teams: race.teams
        })) : [] //  Ensure `races` is an Array, Even If Empty
    }));
};


// Assign the ACTIVE / SUBSTITUTE flag to player
export const assignPlayersToRace = async (
    race_id: string,
    event_id: string,
    team_id: string,
    club_id: string, // ✅ Extracted from JWT
    players: { player_id: string; status: "active" | "substitute" }[]
  ) => {
    if (!race_id || !event_id || !team_id || !club_id || !players || players.length === 0) {
      throw new BadRequestError("Race ID, Event ID, Team ID, Club ID, and Players list are required.");
    }
  
    // ✅ 1. Validate if Club Exists
    const clubExists = await Club.findById(club_id);
    if (!clubExists) {
      throw new BadRequestError("Club not found.");
    }
  
    // ✅ 2. Ensure Team belongs to the Club
    const teamExists = await teams.findOne({ _id: team_id, club: club_id });
    if (!teamExists) {
      throw new BadRequestError("Team not found or does not belong to this club.");
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
        throw new BadRequestError("Some players are already assigned to this race in this event.");
      }
      throw error;
    }
  
    return { message: "Players assigned successfully" };
  };


//  Update Player Status in a Race
export const updatePlayerStatusInRace = async (
    race_id: string,
    event_id: string,
    team_id: string,
    club_id: string,
    player_id: string,
    status: "active" | "substitute"
  ) => {
    //  Ensure that the assignment exists before updating
    const existingAssignment = await RacePlayerAssignment.findOne({
      race: race_id,
      event: event_id,
      team: team_id,
      player: player_id,
      club: club_id, // Ensure update is within the same club
    });
  
    if (!existingAssignment) {
      throw new BadRequestError("Player is not assigned to this race in this event.");
    }
  
    //  Update the player's status
    existingAssignment.status = status;
    await existingAssignment.save();
  
    return { message: "Player status updated successfully" };
  };