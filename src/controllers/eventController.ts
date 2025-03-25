import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { BadRequestError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { createEvent, deleteEvent, getAllEvents, getEventByName, getEventConfig, updateEvent, updateEventConfig } from '../services/eventService';

//  Add New Event (Admin Only)
export const addNewEvent = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can create events');
  }

  const { event_name, year, location, image, start_date, end_date } = req.body;
  if (!event_name || !year || !location) {
    throw new BadRequestError('Event name, year, and location are required');
  }

  const event = await createEvent(event_name, year, location, req.club.id, image, start_date, end_date);
  return new SuccessResponse(event, 'Event created successfully');
});

//  Update Event (Admin Only)
export const updateEventDetails = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can update events');
  }

  const { eventName } = req.params;
  const updates = req.body;
  const updatedEvent = await updateEvent(eventName, updates);
  return new SuccessResponse(updatedEvent, 'Event updated successfully');
});

//  Get All Events (Admin Only)
export const getEvents = asyncWrapper(async (req: Request, res: Response) => {
  const events = await getAllEvents();
  return new SuccessResponse(events, 'Events retrieved successfully');
});

//  Get a Single Event by Name
export const getSingleEvent = asyncWrapper(async (req: Request, res: Response) => {
  const { eventName } = req.params;
  const event = await getEventByName(eventName);
  return new SuccessResponse(event, 'Event retrieved successfully');
});

//  Delete Event (Admin Only)
export const deleteEventController = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can delete events');
  }

  const { eventName } = req.params;
  const result = await deleteEvent(eventName);
  return new SuccessResponse(result, 'Event deleted successfully');
});


  // ADMIN ONLY CONFIGURATIONS

export const updateEventConfigController = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can update event config');
  }

  const { eventId } = req.params;
  const configUpdates = req.body;

  const updated = await updateEventConfig(eventId, configUpdates);
  return new SuccessResponse(updated, 'Event configuration updated successfully');
});

export const getEventConfigController = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id || req.club.role !== 'admin') {
    throw new BadRequestError('Only Admins can view event config');
  }

  const { eventId } = req.params;
  const event = await getEventConfig(eventId);
  return new SuccessResponse(event, 'Event configuration fetched successfully');
});


