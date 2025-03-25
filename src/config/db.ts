import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    } as mongoose.ConnectOptions);
    console.log(` Connected to MongoDB Atlas Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
};

export default connectDB;

// for iotdb connection 
// import mongoose from 'mongoose';
// import dotenv from 'dotenv';

// dotenv.config(); // Load environment variables

// const connectDB = async () => {
//   try {
//     if (!process.env.MONGO_URI) {
//       throw new Error('❌ MONGO_URI is not defined in environment variables');
//     }

//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       authSource: "iotdb", // Ensure auth source is correct
//     } as mongoose.ConnectOptions);

//     console.log(' MongoDB Connected to iotdb');
//   } catch (error) {
//     console.error('❌ MongoDB Connection Failed:', error);
//     process.exit(1);
//   }
// };

// export default connectDB;
