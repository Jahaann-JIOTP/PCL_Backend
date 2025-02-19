import express from 'express';
import { getAdminDashboard, getAllClubs, getSingleClubDetailsController, updateTeamPaymentDetails } from '../controllers/adminController';
import { adminOnly, protect } from '../middleware/authMiddleware';


const adminRouter = express.Router();

//  Admin Dashboard Route (Only Accessible by Admin)
adminRouter.get('/dashboard', protect, getAdminDashboard);

//  All Clubs Route (Only Accessible by Admin)
adminRouter.get('/all-clubs', protect, getAllClubs);

//  Get Single Club Full Details (Admin Only)
adminRouter.get('/club/details', protect, getSingleClubDetailsController);

// Admin: Update Team Payment Status & Comment (Admin Only)
adminRouter.put('/update-team-payment', protect, adminOnly, updateTeamPaymentDetails);

export default adminRouter;
