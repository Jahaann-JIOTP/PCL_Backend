import mongoose, { Document, Schema } from 'mongoose';

interface IClub extends Document {
  name: string; // contact person name
  description: string; 
  phoneNumber: string;
  club_name: string;
  address: string;
}

const ClubSchema = new Schema<IClub>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\d{10,15}$/, 'Phone number must be between 10-15 digits'],
    },
    club_name: { type: String, required: true, unique: true, trim: true },
    address: { type: String,trim: true },
  },
  { timestamps: true },
);

export default mongoose.model<IClub>('Club', ClubSchema);
