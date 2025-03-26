import Event, { IEvent } from '../models/Event';
import { BadRequestError, NotFoundError } from '../utils/apiError';

export const createEvent = async (
    event_name: string,
    year: number,
    location: string,
    createdBy: string,
    image?: string,
    start_date?: Date,
    end_date?: Date
  ) => {
    //  Check if event already exists
    const existingEvent = await Event.findOne({ event_name, year });
    if (existingEvent) {
      throw new BadRequestError('An event with this name and year already exists');
    }
  
    //  Create new event
    const event = new Event({
      event_name,
      year,
      location,
      createdBy,
      image: image || null, //  Default to null if not provided
      start_date: start_date || null, //  Default to null if not provided
      end_date: end_date || null, //  Default to null if not provided
    });
  
    return await event.save();
  };
  
  //  Update Event (Admin Only)
  export const updateEvent = async (eventName: string, updates: Partial<IEvent>) => {
    const event = await Event.findOneAndUpdate({ event_name: eventName }, updates, { new: true });
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    return event;
  };
  
//  Get All Events (Admin Only)
export const getAllEvents = async () => {
  return await Event.find().select('event_name year location image status races end_date start_date').populate('races', 'name type distance date time');
};

//  Get a Single Event by Name
export const getEventByName = async (eventName: string) => {
  const event = await Event.findOne({ event_name: eventName }).populate('races', 'name type distance date time');
  if (!event) {
    throw new NotFoundError('Event not found');
  }
  return event;
};

//  Delete Event (Admin Only) - Only if No Races are Linked
export const deleteEvent = async (eventName: string) => {
  const event = await Event.findOne({ event_name: eventName });

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  if (event.races && event.races.length > 0) {
    throw new BadRequestError('Cannot delete an event with linked races. Remove races first.');
  }

  await event.deleteOne();
  return { message: 'Event deleted successfully' };
};

    // ADMIN ONLY CONFIGURATIONS
export const updateEventConfig = async (eventId: string, config: any) => {
  const updated = await Event.findByIdAndUpdate(
    eventId,
    {
      $set: {
        registration_enabled: config.registration_enabled,
        publish_teams: config.publish_teams,
        publish_leaderboard_portal: config.publish_leaderboard_portal,
        publish_leaderboard_website: config.publish_leaderboard_website,
        locked_races: config.locked_races || [],
      },
    },
    { new: true }
  );

  if (!updated) {
    throw new NotFoundError('Event not found');
  }

  return updated;
};

export const getEventConfig = async (eventId: string) => {
  const event = await Event.findById(eventId).select(
    'event_name registration_enabled publish_teams publish_leaderboard_portal publish_leaderboard_website locked_races'
  );

  if (!event) {
    throw new NotFoundError('Event not found');
  }

  return event;
};
