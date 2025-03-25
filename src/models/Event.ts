import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  event_name: string;
  year: number;
  location: string;
  image?: string;
  status: 'upcoming' | 'past';
  createdBy: mongoose.Schema.Types.ObjectId;
  races?: mongoose.Schema.Types.ObjectId[];
  start_date?: Date; //  Optional start date
  end_date?: Date; //  Optional end date

    // ✅ New Added Fields
    registration_enabled?: boolean;
    publish_teams?: boolean;
    publish_leaderboard_portal?: boolean;
    publish_leaderboard_website?: boolean;
    locked_races?: mongoose.Schema.Types.ObjectId[];
}

const EventSchema = new Schema<IEvent>(
  {
    event_name: { type: String, required: true, unique: true, trim: true },
    year: { type: Number, required: true },
    location: { type: String, required: true, trim: true },
    image: { type: String, default: null }, //  Default null (Optional)
    status: { type: String, enum: ['upcoming', 'past'], default: 'upcoming' }, //  Default status
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    races: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Race' }],
    start_date: { type: Date, default: null }, //  Optional start date
    end_date: { type: Date, default: null }, //  Optional end date

    // Added Attributes
   registration_enabled: { type: Boolean, default: true },
   publish_teams: { type: Boolean, default: false },
   publish_leaderboard_portal: { type: Boolean, default: false },
   publish_leaderboard_website: { type: Boolean, default: false },
   locked_races: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Race', default: [] }],

  },
  { timestamps: true }
);

export default mongoose.model<IEvent>('Event', EventSchema);
// export default mongoose.model<IEvent>('EventModel', EventSchema);

