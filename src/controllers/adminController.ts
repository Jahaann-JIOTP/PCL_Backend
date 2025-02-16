import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { getAdminDashboardData } from '../services/adminService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// ✅ Get Admin Dashboard Data
export const getAdminDashboard = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  const data = await getAdminDashboardData(clubId);

  return new SuccessResponse(data, 'Admin dashboard data retrieved successfully');
})