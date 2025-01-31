import Club from '../models/Club';
import bcrypt from 'bcryptjs';
import generateToken from '../utils/jwtHelper';
import { BadRequestError } from '../utils/apiError';

// Register the Club Service
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
  const username = club_name.toLowerCase().replace(/\s/g, '') + Math.floor(1000 + Math.random() * 9000);

  const club = new Club({ 
    name, 
    description, 
    phoneNumber, 
    club_name,  
    address,
    password, 
    username,  // ✅ Assign generated username
    reset_password: false  // ✅ Default: false
  });

  return await club.save();
};



// Login the Club with username and password
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
    reset_password: club.reset_password,  // reset password flag
    name: club.name,
    // club: {
    //   id: club._id,
    //   name: club.name,
    //   username: club.username,  
    //   description: club.description,
    //   phoneNumber: club.phoneNumber,
    //   address: club.address,
    // },
  };
};


// Rest the password for the first time when user is logged in
export const resetPassword = async (club_name: string, newPassword: string) => {
  const club = await Club.findOne({ club_name });
  if (!club) {
    throw new BadRequestError('Club not found');
  }

  club.password = newPassword;  // New hashed password
  club.reset_password = true;   // Mark as reset

  await club.save();
};
