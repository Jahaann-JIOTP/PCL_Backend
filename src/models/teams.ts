import mongoose, { Document, Schema } from 'mongoose';

interface ITeam extends Document {
  team_name: string;
  club: mongoose.Schema.Types.ObjectId;  // ✅ Club Reference
  team_type: 'mix' | 'women-only';  // ✅ Type of team
  description: string;
  players: mongoose.Schema.Types.ObjectId[]; // ✅ Array of players
}

const TeamSchema = new Schema<ITeam>(
  {
    team_name: { type: String, required: true, unique: true, trim: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true }, // ✅ Reference to Club
    team_type: { type: String, enum: ['mix', 'women-only'], required: true },
    description: { type: String, trim: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }], // ✅ Linking players
  },
  { timestamps: true },
);

export default mongoose.model<ITeam>('Team', TeamSchema);
