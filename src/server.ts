import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import clubRoutes from './routes/clubRoutes';
import ErrorHandler from './utils/errorHandler';

// Load environment variables
dotenv.config();

// Initialize unhandled error tracking
ErrorHandler.initializeUnhandledException();

// Connect to MongoDB Atlas
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/clubs', clubRoutes);

// Global Error Handler
app.use(ErrorHandler.handle());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
