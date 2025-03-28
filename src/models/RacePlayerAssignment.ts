import mongoose, { Document, Schema } from "mongoose";

export interface IRacePlayerAssignment extends Document {
  player: mongoose.Schema.Types.ObjectId; // Player ID
  race: mongoose.Schema.Types.ObjectId; // Race ID
  event: mongoose.Schema.Types.ObjectId; // Event ID (to separate flags per event)
  team: mongoose.Schema.Types.ObjectId; // Team ID (which team the player belongs to)
  club: mongoose.Schema.Types.ObjectId; // Club ID (Which club owns the team)
  status: "active" | "substitute"; // Flag assigned in that specific event
  group?: string | null; // Optional: Group name (e.g., "A", "B")

}

const RacePlayerAssignmentSchema = new Schema<IRacePlayerAssignment>(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
    race: { type: mongoose.Schema.Types.ObjectId, ref: "Race", required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true }, // Ensure event separation
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true }, // ✅ Store Club ID
    status: { type: String, enum: ["active", "substitute"], required: true }, // Status within that event
    group: { type: String, default: null }, // Optional: Group A / Group B / etc.
  },
  { timestamps: true }
);

// ✅ Ensure uniqueness per event, race, and player
RacePlayerAssignmentSchema.index({ player: 1, race: 1, event: 1 }, { unique: true });

export default mongoose.model<IRacePlayerAssignment>("RacePlayerAssignment", RacePlayerAssignmentSchema);
