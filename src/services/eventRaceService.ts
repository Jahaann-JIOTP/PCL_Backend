import Event from '../models/Event';
import { NotFoundError } from '../utils/apiError';

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
