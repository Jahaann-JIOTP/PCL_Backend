import { Request, Response } from 'express';
import { createClub, loginClub, resetPassword } from '../services/clubService';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { BadRequestError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// ✅ Register the Club Controller (Now Includes `teams`)
export const registerClub = asyncWrapper(async (req: Request, res: Response) => {
  const { name, description, phoneNumber, club_name, address, password } = req.body;

  if (!name || !description || !phoneNumber || !club_name || !password) {
    throw new BadRequestError('All required fields must be provided');
  }

  const club = await createClub(name, description, phoneNumber, club_name, address, password);
  return new SuccessResponse(club, 'Club registered successfully');
});

// ✅ Login the Club Controller (Now Includes `teams`)
export const clubLogin = asyncWrapper(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  const loginData = await loginClub(username, password);

  return new SuccessResponse(loginData, 'Login successful');
});

// ✅ Get Club Profile (Now Returns Teams Associated with Club)
export const getProfile = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
    return new SuccessResponse({ club: req.club?.club_name}, 'You have accessed a protected route!');
});

// ✅ Logout Club (No Changes Required)
export const logoutClub = asyncWrapper(async (req: Request, res: Response) => {
  return new SuccessResponse({}, 'Logged out successfully');
});

// ✅ Reset Password Controller (No Changes Required)
export const restPassword = asyncWrapper(async (req: Request, res: Response) => {
  const { club_name, password } = req.body; 

  if (!club_name || !password) {
    throw new Error('Club name and password are required');
  }

  const resetedPassword = await resetPassword(club_name, password);

  return new SuccessResponse(resetedPassword, 'Password reset successful');
});
