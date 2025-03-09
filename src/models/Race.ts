import mongoose, { Document, Schema } from 'mongoose';

export interface IRace extends Document {
  name: string;
  type: string;
  distance: number;
  date: Date;
  time: string;
  createdBy: mongoose.Schema.Types.ObjectId; // Admin who created it
  teams?: mongoose.Schema.Types.ObjectId[]; // Teams that join the race
  event: mongoose.Schema.Types.ObjectId;
  active_player_no: number; // Number of active players in the race.
}

const RaceSchema = new Schema<IRace>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    distance: { type: Number, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }, // ✅ Required relation to Event
    active_player_no: { type: Number, required: true, min: 1 }, // ✅ New field
  },
  { timestamps: true }
);

// ✅ Ensure race names are unique within the same event
RaceSchema.index({ name: 1, event: 1 }, { unique: true });

export default mongoose.model<IRace>('Race', RaceSchema);

  
