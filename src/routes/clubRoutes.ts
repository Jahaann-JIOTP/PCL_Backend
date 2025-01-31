import express from 'express';
import { registerClub, clubLogin, getProfile, logoutClub, restPassword } from '../controllers/clubController';
import { protect } from '../middleware/authMiddleware';

const clubRouter = express.Router();

// Register the Clubs 
clubRouter.post('/register', registerClub);
// Login Club 
clubRouter.post('/login', clubLogin); 

// Get Profile - PROTECTED ROUTE - Only accessible with a valid token
clubRouter.get('/profile', protect, getProfile);

// Logout Rout for the
clubRouter.post('/logout', protect, logoutClub);

// Reset the password on first login - protected
clubRouter.post('/reset-password', protect, restPassword);



export default clubRouter;
