import Event from '../models/Event';
import Race, { IRace } from '../models/Race';
import { BadRequestError, NotFoundError } from '../utils/apiError';

//  Create a New Race (Admin Only)
export const createRace = async (
  name: string,
  type: string,
  distance: number,
  date: Date,
  time: string,
  createdBy: string,
  event_id: string
) => {
  //  Ensure race name is unique within the same event
  const existingRace = await Race.findOne({ name, event: event_id });
  if (existingRace) {
    throw new BadRequestError('A race with this name already exists for this event.');
  }

  //  Create new race
  const race = new Race({
    name,
    type,
    distance,
    date,
    time,
    event: event_id, //  Linking race to event
    createdBy,
  });

  return await race.save();
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

  //  Prevent Deletion if Teams Exist
  if (race.teams && race.teams.length > 0) {
    throw new BadRequestError('Cannot delete a race with assigned teams. Unassign teams first.');
  }

  await race.deleteOne();
  return { message: 'Race deleted successfully' };
};

//  Get Races by Event Name (Including Event ID)
export const getRacesByEvent = async (eventName: string) => {
  //  Find Event by Name
  const event = await Event.findOne({ event_name: eventName });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  //  Find Races for this Event
  const races = await Race.find({ event: event._id })
    .select('name type distance date time event teams')
    .populate('teams', 'team_name');

  return races.map((race) => ({
    _id: race._id,
    name: race.name,
    type: race.type,
    distance: race.distance,
    date: race.date,
    time: race.time,
    event: race.event, //  Include Event ID
    teams: race.teams,
  }));
};

