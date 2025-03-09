import mongoose, { Document, Schema } from "mongoose";

export interface IRaceTeamAssignment extends Document {
  team: mongoose.Schema.Types.ObjectId; // Team ID
  race: mongoose.Schema.Types.ObjectId; // Race ID
  event: mongoose.Schema.Types.ObjectId; // Event ID
  club: mongoose.Schema.Types.ObjectId; // Club ID (Club owning the team)
}

const RaceTeamAssignmentSchema = new Schema<IRaceTeamAssignment>(
  {
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    race: { type: mongoose.Schema.Types.ObjectId, ref: "Race", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true }, // ✅ Ensures team is linked to the right club
  },
  { timestamps: true }
);

// ✅ Ensure uniqueness (No duplicate assignments in the same race & event)
RaceTeamAssignmentSchema.index({ team: 1, race: 1, event: 1 }, { unique: true });

export default mongoose.model<IRaceTeamAssignment>("RaceTeamAssignment", RaceTeamAssignmentSchema);
