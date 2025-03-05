import mongoose, { Document, Schema } from "mongoose";

export interface IRaceTeamAssignment extends Document {
  race: mongoose.Schema.Types.ObjectId; // ✅ Race ID
  event: mongoose.Schema.Types.ObjectId; // ✅ Event ID
  team: mongoose.Schema.Types.ObjectId; // ✅ Team ID
  club: mongoose.Schema.Types.ObjectId; // ✅ Club ID (which club owns the team)
}

const RaceTeamAssignmentSchema = new Schema<IRaceTeamAssignment>(
  {
    race: { type: mongoose.Schema.Types.ObjectId, ref: "Race", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },
  },
  { timestamps: true }
);

// ✅ Ensure a Team is assigned to a specific Race in an Event only once
RaceTeamAssignmentSchema.index({ race: 1, event: 1, team: 1 }, { unique: true });

export default mongoose.model<IRaceTeamAssignment>("RaceTeamAssignment", RaceTeamAssignmentSchema);
