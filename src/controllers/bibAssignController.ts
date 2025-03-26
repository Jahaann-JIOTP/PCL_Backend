import { Request, Response } from "express";
import { assignBibNumberToPlayer } from "../services/bibAssignService";
import { BadRequestError, NotFoundError } from "../utils/apiError";
import { asyncWrapper } from "../utils/asyncWrapper";
import { SuccessResponse } from "../utils/successResponse";
import BibAssignment from "../models/BibAssignment";
import Player from "../models/players";
import Event from "../models/Event";
import Club from "../models/Club";

export const assignBibNumber = asyncWrapper(async (req: Request, res: Response) => {
  const { player_id, event_id, club_id, bib_number } = req.body;

  if (!player_id || !event_id || !club_id || !bib_number) {
    throw new BadRequestError("All fields are required.");
  }

  // ✅ Validate Player
  const playerExists = await Player.findById(player_id);
  if (!playerExists) {
    throw new NotFoundError("Player not found.");
  }

  // ✅ Validate Event
  const eventExists = await Event.findById(event_id);
  if (!eventExists) {
    throw new NotFoundError("Event not found.");
  }

  // ✅ Validate Club
  const clubExists = await Club.findById(club_id);
  if (!clubExists) {
    throw new NotFoundError("Club not found.");
  }

  const result = await assignBibNumberToPlayer({ player_id, event_id, club_id, bib_number });
  return new SuccessResponse(result, "Bib number assigned successfully.");
});

  

//   Get Bib Number by Player & Event
export const getBibNumber = asyncWrapper(async (req: Request, res: Response) => {
    const { player_id, event_id } = req.params;
  
    const playerExists = await Player.findById(player_id);
    if (!playerExists) throw new NotFoundError("Player not found.");
  
    const eventExists = await Event.findById(event_id);
    if (!eventExists) throw new NotFoundError("Event not found.");
  
    const bib = await BibAssignment.findOne({ player: player_id, event: event_id });
    if (!bib) throw new NotFoundError("Bib number not found.");
  
    return new SuccessResponse(bib, "Bib number retrieved successfully.");
  });
  


// Update the Bib Number by Player & Event
export const updateBibNumber = asyncWrapper(async (req: Request, res: Response) => {
    const { player_id, event_id, bib_number } = req.body;
  
    if (!player_id || !event_id || !bib_number) {
      throw new BadRequestError("Player ID, Event ID, and Bib number are required.");
    }
  
    const playerExists = await Player.findById(player_id);
    if (!playerExists) throw new NotFoundError("Player not found.");
  
    const eventExists = await Event.findById(event_id);
    if (!eventExists) throw new NotFoundError("Event not found.");
  
    const existing = await BibAssignment.findOne({ event: event_id, bib_number });
    if (existing && existing.player.toString() !== player_id) {
      throw new BadRequestError("This bib number is already used by another player.");
    }
  
    const updated = await BibAssignment.findOneAndUpdate(
      { player: player_id, event: event_id },
      { $set: { bib_number } },
      { new: true }
    );
  
    if (!updated) throw new NotFoundError("Bib record not found for this player in event.");
  
    return new SuccessResponse(updated, "Bib number updated.");
  });
  
  