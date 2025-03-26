// models/BibAssignment.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBibAssignment extends Document {
  player: mongoose.Schema.Types.ObjectId;
  event: mongoose.Schema.Types.ObjectId;
  club: mongoose.Schema.Types.ObjectId;
  bib_number: number;
}

const BibAssignmentSchema = new Schema<IBibAssignment>({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  bib_number: { type: Number, required: true },
});

// Unique Bib Per Event
BibAssignmentSchema.index({ event: 1, bib_number: 1 }, { unique: true });

export default mongoose.model<IBibAssignment>('BibAssignment', BibAssignmentSchema);
