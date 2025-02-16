import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import clubRoutes from './routes/clubRoutes';
import ErrorHandler from './utils/errorHandler';
import playerRouter from './routes/playerRoutes';
import fileUpload from 'express-fileupload'; 
import teamRouter from './routes/teamRoutes';
import relationRouter from './routes/PlayerTeamsRealtionRoutes';
import adminRouter from './routes/adminRoutes';

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

app.use(
    fileUpload({
      useTempFiles: true,
      tempFileDir: '/tmp/', //  Temporary folder for storing files before Cloudinary upload
    })
  );

app.get('/', (req, res) => {
    res.send('Hello, PCL Backend!');
})
// Routes
app.use('/api/clubs', clubRoutes);
app.use('/api/players', playerRouter);
app.use('/api/teams', teamRouter);
app.use('/api/relation', relationRouter);
app.use('/api/admin', adminRouter);



// Global Error Handler
app.use(ErrorHandler.handle());

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
