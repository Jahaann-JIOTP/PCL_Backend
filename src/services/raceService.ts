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
  // ✅ Ensure race name is unique within the same event
  const existingRace = await Race.findOne({ name, event: event_id });
  if (existingRace) {
    throw new BadRequestError('A race with this name already exists for this event.');
  }

  // ✅ Create new race
  const race = new Race({
    name,
    type,
    distance,
    date,
    time,
    event: event_id, // ✅ Linking race to event
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

//  Update Race (Admin Only)
export const updateRace = async (
  raceName: string,
  updates: Partial<IRace>
) => {
  const race = await Race.findOneAndUpdate({ name: raceName }, updates, { new: true });
  if (!race) {
    throw new NotFoundError('Race not found');
  }
  return race;
};

//  Delete Race (Admin Only) - Only if No Teams are Registered
export const deleteRace = async (raceName: string) => {
  const race = await Race.findOne({ name: raceName });

  if (!race) {
    throw new NotFoundError('Race not found');
  }

  if (race.teams && race.teams.length > 0) {
    throw new BadRequestError('Cannot delete a race with registered teams. Remove teams first.');
  }

  await race.deleteOne();
  return { message: 'Race deleted successfully' };
};
