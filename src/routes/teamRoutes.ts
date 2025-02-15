import express from 'express';
import { addNewTeam, deleteTeamController, getTeams, updateTeam, uploadTeamPaymentSlip } from '../controllers/teameController';
import { protect } from '../middleware/authMiddleware';


const teamRouter = express.Router();

// ✅ Route to Add a Team (Authenticated Club Required)
teamRouter.post('/add', protect, addNewTeam);
// ✅ Route to Get Teams (Authenticated Club Required)
teamRouter.get('/all', protect, getTeams);

// ✅ Upload Payment Slip API (Protected)
teamRouter.post('/upload-payment-slip', protect, uploadTeamPaymentSlip);

// ✅ Route to Update Team Details (Authenticated Club Required)
teamRouter.put('/update', protect, updateTeam);

// ✅ Delete Team Route (Protected)
teamRouter.delete('/delete', protect, deleteTeamController);

export default teamRouter;
