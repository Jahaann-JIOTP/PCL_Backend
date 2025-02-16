import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { getAdminDashboardData, getAllClubsData, getSingleClubDetails } from '../services/adminService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { BadRequestError, UnauthorizedError } from '../utils/apiError';

// ✅ Get Admin Dashboard Data
export const getAdminDashboard = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  const data = await getAdminDashboardData(clubId);

  return new SuccessResponse(data, 'Admin dashboard data retrieved successfully');
})


// ✅ Get All Registered Clubs (Excluding Admin)
export const getAllClubs = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  const clubsData = await getAllClubsData(clubId);

  return new SuccessResponse(clubsData, 'All registered clubs retrieved successfully');
});


// ✅ Admin Only: Get Single Club Full Data (By Club Name)
export const getSingleClubDetailsController = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new UnauthorizedError('Admin authentication failed');
  }

  // ✅ Extract `club_name` from the request query and **ensure it's a string**
  const club_name = req.query.club_name as string;
  if (!club_name || typeof club_name !== 'string') {
    throw new BadRequestError('Club name is required and must be a string');
  }

  // ✅ Call the service to fetch the full club details
  const clubData = await getSingleClubDetails(req.club.id, club_name);

  return new SuccessResponse(clubData, 'Club details retrieved successfully');
});