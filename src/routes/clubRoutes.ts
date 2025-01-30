import express from 'express';
import { registerClub } from '../controllers/clubController';

const router = express.Router();

router.post('/register', registerClub);

export default router;
