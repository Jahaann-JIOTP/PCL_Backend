import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware';
import { addNewEvent, deleteEventController, getEvents, getSingleEvent, updateEventDetails } from '../controllers/eventController';


const eventRouter = express.Router();

//  Create a New Event (Admin Only)
eventRouter.post('/add', protect, adminOnly, addNewEvent);

//  Get All Events (Admin Only)
eventRouter.get('/all', protect, adminOnly, getEvents);

 //Get Single Event by Name
eventRouter.get('/single-event/:eventName', protect, adminOnly, getSingleEvent);

//  Update Event Details (Admin Only)
eventRouter.put('/edit/:eventName', protect, adminOnly, updateEventDetails);

//  Delete Event (Admin Only)
eventRouter.delete('/delete-event/:eventName', protect, adminOnly, deleteEventController);

export default eventRouter;
