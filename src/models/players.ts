import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  cnic: string;
  date_of_birth: Date;
  fitness_category: string;
  weight: number;
  gender: 'male' | 'female';
  contact: string;
  emergency_contact: string;
  disability?: string  | null;
  age: number;
  assigned_team: 'assigned' | 'unassigned';
  club: mongoose.Schema.Types.ObjectId;
  team?: mongoose.Schema.Types.ObjectId;
  bib_number?: number | null; //  Newly added field (optional)
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: { type: String, required: true, trim: true },
    cnic: { type: String, required: true, unique: true, match: [/^\d{13}$/, 'CNIC must be 13 digits'] },
    date_of_birth: { type: Date, required: true },
    fitness_category: { type: String, required: true },
    weight: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    contact: { type: String, required: true },
    emergency_contact: { type: String, required: true },
    disability: { type: String, default: 'None' },

    // ✅ Auto-calculated age before saving
    age: { type: Number, required: true },

    // ✅ Assigned Team Logic
    assigned_team: { type: String, enum: ['assigned', 'unassigned'], default: 'unassigned' },

    // ✅ References to Club and Team
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },

    // ✅ Bib Number (Must Be Unique)
    bib_number: { type: Number, unique: true, sparse: true, default: null },

  },
  { timestamps: true }
);

//  Fix Age Calculation
PlayerSchema.pre<IPlayer>('validate', function (next) {
  if (this.date_of_birth) {
    const birthDate = new Date(this.date_of_birth);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    this.age = age;
  }
  next();
});

//  Auto-set assigned_team status before saving
PlayerSchema.pre<IPlayer>('save', function (next) {
  this.assigned_team = this.team ? 'assigned' : 'unassigned';
  next();
});

export default mongoose.model<IPlayer>('Player', PlayerSchema);
