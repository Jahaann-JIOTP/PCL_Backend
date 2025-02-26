import mongoose, { Document, Schema } from 'mongoose';

export interface IRace extends Document {
  name: string;
  type: string;
  distance: number;
  date: Date;
  time: string;
  createdBy: mongoose.Schema.Types.ObjectId; // Admin who created it
  teams?: mongoose.Schema.Types.ObjectId[]; // Teams that join the race
}

const RaceSchema = new Schema<IRace>(
  {
    name: { type: String, required: true, unique: true, trim: true }, //  Unique Race Name
    type: { type: String, required: true, trim: true }, //  Type of Race (Road, Time Trial, etc.)
    distance: { type: Number, required: true }, //  Distance in KM or Miles
    date: { type: Date, required: true }, //  Race Date
    time: { type: String, required: true, trim: true }, //  Time (HH:MM Format)
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true }, //  Only Admins can create
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }], //  Registered Teams
  },
  { timestamps: true }
);

export default mongoose.model<IRace>('Race', RaceSchema);
