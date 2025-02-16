import express from 'express';
import { getAdminDashboard } from '../controllers/adminController';
import { protect } from '../middleware/authMiddleware';

const adminRouter = express.Router();

//  Admin Dashboard Route (Only Accessible by Admin)
adminRouter.get('/dashboard', protect, getAdminDashboard);

export default adminRouter;
