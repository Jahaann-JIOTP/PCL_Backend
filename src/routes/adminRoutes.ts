import express from 'express';
import { getAdminDashboard, getAllClubs, getSingleClubDetailsController } from '../controllers/adminController';
import { protect } from '../middleware/authMiddleware';


const adminRouter = express.Router();

//  Admin Dashboard Route (Only Accessible by Admin)
adminRouter.get('/dashboard', protect, getAdminDashboard);


//  All Clubs Route (Only Accessible by Admin)
adminRouter.get('/all-clubs', protect, getAllClubs);

// ✅ Get Single Club Full Details (Admin Only)
adminRouter.get('/club/details', protect, getSingleClubDetailsController);

export default adminRouter;
