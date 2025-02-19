import mongoose, { Document, Schema } from 'mongoose';

interface ITeam extends Document {
  team_name: string;
  club: mongoose.Schema.Types.ObjectId;
  team_type: 'mix' | 'women-only';
  description: string;
  players: mongoose.Schema.Types.ObjectId[];
  payment_slip_url?: string; //  Cloudinary URL for payment slip
  payment_status?: 'unpaid' | 'processing' | 'paid'; //  Default: "unpaid"
  payment_comment?: string;
}

const TeamSchema = new Schema<ITeam>(
  {
    team_name: { type: String, required: true, unique: true, trim: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    team_type: { type: String, enum: ['mix', 'women-only'], required: true },
    description: { type: String, trim: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    payment_slip_url: { type: String, default: null }, //  Cloudinary URL
    payment_status: { type: String, enum: ['unpaid', 'processing', 'paid'], default: 'unpaid' }, //  Payment status
    payment_comment: { type: String, default: null }, //  Optional comment
  },
  { timestamps: true }
);

export default mongoose.model<ITeam>('Team', TeamSchema);
