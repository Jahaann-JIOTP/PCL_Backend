import Club from '../models/Club';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/jwtHelper';
import { BadRequestError } from '../utils/apiError';

// ✅ Register the Club Service (Now Initializes `teams` as an Empty Array)
export const createClub = async (
  name: string,
  description: string,
  phoneNumber: string,
  club_name: string,
  address: string,
  password: string,
) => {
  const existingClub = await Club.findOne({ club_name });
  if (existingClub) {
    throw new Error('Club with this name already exists');
  }

  // ✅ Generate a unique username (based on club_name)
  const username = club_name.toLowerCase().replace(/\s/g, '');

  const club = new Club({ 
    name, 
    description, 
    phoneNumber, 
    club_name,  
    address,
    password, 
    username,  
    reset_password: false,  
    teams: []  // Initialize teams as empty array
  });

  return await club.save();
};

//  Login Club with username and password (Now Includes `teams`)
export const loginClub = async (username: string, password: string) => {
  console.log("🔍 Checking club existence...");
  const club = await Club.findOne({ username });

  if (!club) {
    throw new Error('Club not found');
  }

  console.log("🟢 Club found:", club);

  // Verify password
  const isPasswordValid = await club.matchPassword(password);
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  console.log("✅ Password matched!");

  // Generate JWT token
  const token = generateToken(club._id.toString(), club.username);

  return {
    token,
    reset_password: club.reset_password, 
    username: club.username,
    club_name: club.club_name,
    // teams: club.teams,  //  Return associated teams
  };
};

//  Reset Password Service 
export const resetPassword = async (club_name: string, newPassword: string) => {
  const club = await Club.findOne({ club_name });
  if (!club) {
    throw new BadRequestError('Club not found');
  }

  club.password = newPassword;
  club.reset_password = true;

  await club.save();
};
