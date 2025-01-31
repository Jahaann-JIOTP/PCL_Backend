import { Request, Response } from 'express';
import { createClub , loginClub, resetPassword } from '../services/clubService';
import { asyncWrapper } from '../utils/asyncWrapper';
import { SuccessResponse } from '../utils/successResponse';
import { BadRequestError } from '../utils/apiError';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Register the Club Controller
export const registerClub = asyncWrapper(async (req: Request, res: Response) => {
  const { name, description, phoneNumber, club_name, address , password} = req.body;

  if (!name || !description || !phoneNumber || !club_name || !password) {
    throw new BadRequestError('All required fields must be provided');
  }

  const club = await createClub(name, description, phoneNumber, club_name, address, password);
  return new SuccessResponse(club, 'Club registered successfully');
});

// Login the Club Controller
export const clubLogin = asyncWrapper(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  const loginData = await loginClub(username, password);

  return new SuccessResponse(loginData, 'Login successful');
});


// Get the profile after token verification Controller
export const getProfile = asyncWrapper(async (req: AuthenticatedRequest, res: Response) => {
     // no logic yet just checking the authorization and returning success response
    return new SuccessResponse({club: req.club }, 'You have accessed a protected route!');
  }
);

// Logout Club 
// There is no logic on backend to logout jwt from frontend just remove the token from the loacal storage or cookies where they are saved
export const logoutClub = asyncWrapper(async (req: Request, res: Response) => {
  // ✅ On logout, just sending a response to tell the frontend to remove the token
  // Please remove the token from storage.
  return new SuccessResponse({}, 'Logged out successfully');
});

// Reset the password for the first time when user logedin
export const restPassword = asyncWrapper(async (req: Request, res: Response) => {
 
  const { club_name, password } = req.body; // no need fro current password just match on frontend only

  if (!club_name || !password) {
    throw new Error('club_name and password are required');
  }

  const resetedPassword = await resetPassword(club_name, password);

  return new SuccessResponse(resetedPassword, 'Password Reseted successful');
});

