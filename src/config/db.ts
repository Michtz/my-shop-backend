import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB Atlas verbunden');
  } catch (error) {
    console.error('MongoDB Verbindungsfehler:', error);
    process.exit(1);
  }
};

export default connectDB;
