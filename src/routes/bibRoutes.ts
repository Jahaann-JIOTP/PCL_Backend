import express from 'express';
import {
  assignBibNumber,
  getBibNumber,
  updateBibNumber,
} from '../controllers/bibAssignController';
import { adminOnly, protect } from '../middleware/authMiddleware';

const AssignBibRouter = express.Router();

// ✅ Assign Bib Number (Admin Only)
AssignBibRouter.post('/assign', protect, adminOnly, assignBibNumber);

// ✅ Get Bib Number for a Player in an Event
AssignBibRouter.get('/:player_id/:event_id', getBibNumber);

// ✅ Update Bib Number
AssignBibRouter.put('/update', protect, adminOnly,updateBibNumber);

export default AssignBibRouter;
