import Player from '../models/players';
import Club from '../models/Club';
import { BadRequestError } from '../utils/apiError';

// ✅ Add Player Service
export const addPlayer = async (
  name: string,
  cnic: string,
  date_of_birth: Date,
  fitness_category: string,
  weight: number,
  gender: 'male' | 'female',
  contact: string,
  emergency_contact: string,
  disability: string,
  clubId: string
) => {
  // ✅ Check if Club Exists (Using JWT Club ID)
  const club = await Club.findById(clubId);
  if (!club) {
    throw new BadRequestError('Club not found');
  }

  // ✅ Ensure CNIC is unique
  const existingPlayer = await Player.findOne({ cnic });
  if (existingPlayer) {
    throw new BadRequestError('A player with this CNIC already exists');
  }

  // ✅ Create a new Player (Unassigned by default)
  const player = new Player({
    name,
    cnic,
    date_of_birth,
    fitness_category,
    weight,
    gender,
    contact,
    emergency_contact,
    disability,
    club: clubId,
    assigned_team: 'unassigned',
    assigned_team_name: null,
    team: null,
  });

  return await player.save();
};



// ✅ Get Players Service (Only Selected Fields)
export const getPlayersByClub = async (clubId: string) => {
    // ✅ Find all players belonging to the club and select only required fields
    const players = await Player.find({ club: clubId })
      .select('name fitness_category gender age assigned_team assigned_team_name cnic') // ✅ Only these fields will be returned
      .lean(); // ✅ Convert Mongoose documents to plain JSON objects
  
    if (!players || players.length === 0) {
      throw new BadRequestError('No players found for this club');
    }
  
    return players;
  };
  

  