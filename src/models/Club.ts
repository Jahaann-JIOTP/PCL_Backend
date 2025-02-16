import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// interface IClub extends Document {
//   name: string;
//   description: string;
//   phoneNumber: string;
//   club_name: string;
//   password: string;
//   address: string;
//   username: string;  //  Unique username
//   reset_password: boolean;  //  Track if password is reset
//   teams: mongoose.Schema.Types.ObjectId[];  //  Reference to Teams
//   matchPassword(enteredPassword: string): Promise<boolean>;
// }

// const ClubSchema = new Schema<IClub>(
//   {
//     name: { type: String, required: true, trim: true },
//     description: { type: String, required: true, trim: true },
//     phoneNumber: {
//       type: String,
//       required: true,
//       match: [/^\d{10,15}$/, 'Phone number must be between 10-15 digits'],
//     },
//     club_name: { type: String, required: true, unique: true, trim: true },
//     address: { type: String, trim: true },
//     password: { type: String, required: true },
//     username: { type: String, required: true, unique: true, lowercase: true },
//     reset_password: { type: Boolean, default: false },
//     teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],  //  New field linking to teams
//   },
//   { timestamps: true },
// );

// // Hash password before saving
// ClubSchema.pre<IClub>('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Password verification method
// ClubSchema.methods.matchPassword = async function (enteredPassword: string) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// export default mongoose.model<IClub>('Club', ClubSchema);


interface IClub extends Document {
  name: string;
  description: string;
  phoneNumber: string;
  club_name: string;
  password: string;
  address: string;
  username: string;  //  Unique username
  reset_password: boolean;  //  Track if password is reset
  teams: mongoose.Schema.Types.ObjectId[];  //  Reference to Teams
  role?: 'admin' | 'club'; //  New role field (Default: 'club')
  matchPassword(enteredPassword: string): Promise<boolean>;
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
    address: { type: String, trim: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true },
    reset_password: { type: Boolean, default: false },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }], 
    role: { type: String, enum: ['admin', 'club'], default: 'club' }, //  New role field
  },
  { timestamps: true },
);

// Hash password before saving
ClubSchema.pre<IClub>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password verification method
ClubSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IClub>('Club', ClubSchema);