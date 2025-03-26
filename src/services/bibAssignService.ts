import BibAssignment from "../models/BibAssignment";
import { BadRequestError } from "../utils/apiError";

export const assignBibNumberToPlayer = async ({
    player_id,
    event_id,
    club_id,
    bib_number,
  }: {
    player_id: string;
    event_id: string;
    club_id: string;
    bib_number: number;
  }) => {
    // Ensure bib is unique per event
    const existing = await BibAssignment.findOne({ event: event_id, bib_number });
    if (existing) {
      throw new BadRequestError('This bib number is already assigned in this event.');
    }
  
    // Ensure player doesn't already have bib in this event
    const existingPlayerBib = await BibAssignment.findOne({ player: player_id, event: event_id });
    if (existingPlayerBib) {
      throw new BadRequestError('Player already has a bib number assigned in this event.');
    }
  
    const assignment = new BibAssignment({ player: player_id, event: event_id, club: club_id, bib_number });
    return await assignment.save();
  };
  