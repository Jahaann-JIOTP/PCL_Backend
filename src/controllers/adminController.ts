import { Request, Response } from 'express';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { getAdminDashboardData, getAllClubsData, getSingleClubDetails, updateTeamPayment } from '../services/adminService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { BadRequestError, UnauthorizedError } from '../utils/apiError';

//  Get Admin Dashboard Data
export const getAdminDashboard = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  const data = await getAdminDashboardData(clubId);

  return new SuccessResponse(data, 'Admin dashboard data retrieved successfully');
})


//  Get All Registered Clubs (Excluding Admin)
export const getAllClubs = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new Error('Club authentication failed');
  }
  const clubId = req.club.id;

  const clubsData = await getAllClubsData(clubId);

  return new SuccessResponse(clubsData, 'All registered clubs retrieved successfully');
});


//  Admin Only: Get Single Club Full Data (By Club Name)
export const getSingleClubDetailsController = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.club?.id) {
    throw new UnauthorizedError('Admin authentication failed');
  }

  //  Extract `club_name` from the request query and **ensure it's a string**
  const club_name = req.query.club_name as string;
  if (!club_name || typeof club_name !== 'string') {
    throw new BadRequestError('Club name is required and must be a string');
  }

  //  Call the service to fetch the full club details
  const clubData = await getSingleClubDetails(req.club.id, club_name);

  return new SuccessResponse(clubData, 'Club details retrieved successfully');
});



//  Admin: Update Team Payment Status & Comment
export const updateTeamPaymentDetails = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
  //  Ensure request is from an admin
  if (!req.club || req.club.role !== 'admin') {
    throw new UnauthorizedError('Only admin users can update payment details.');
  }

  const { team_name, payment_status, payment_comment } = req.body;

  //  Validate Input
  if (!team_name) {
    throw new BadRequestError('Team name is required.');
  }

  //  Call Service to Update Team
  const updatedTeam = await updateTeamPayment(team_name, { payment_status, payment_comment });

  return new SuccessResponse(updatedTeam, 'Team payment details updated successfully.');
});