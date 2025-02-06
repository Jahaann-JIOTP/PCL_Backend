import Player from '../models/players';
import Club from '../models/Club';
import { BadRequestError } from '../utils/apiError';
import teams from '../models/teams';

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
  clubId: string,
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
    assigned_team: 'unassigned', // ✅ Ensured consistency
    team: null, // ✅ No team assigned initially
  });

  return await player.save().then((res) => res.toObject()); // ✅ Convert to plain object for better response
};

// ✅ Get Players Service (Filtered by Assigned/Unassigned)
export const getPlayersByClub = async (clubId: string, assignedFilter?: 'assigned' | 'unassigned') => {
  // ✅ Create filter query based on assignment status
  const filter: any = { club: clubId };
  if (assignedFilter) {
    filter.assigned_team = assignedFilter;
  }

  // ✅ Find all players and populate team names dynamically
  const players = await Player.find(filter)
    .select('name fitness_category gender age assigned_team cnic team') // ✅ Only needed fields
    .populate<{ team: { team_name: string } | null }>({
      path: 'team',
      select: 'team_name', // ✅ Only fetch team_name field
      model: teams, // ✅ Ensure correct reference
    })
    .lean(); // ✅ Convert Mongoose documents to plain JSON objects

  if (!players || players.length === 0) {
    throw new BadRequestError(`No ${assignedFilter ? assignedFilter : ''} players found for this club`);
  }

  // ✅ Map and format response to include `assigned_team_name`
  const formattedPlayers = players.map((player) => ({
    _id: player._id,
    name: player.name,
    cnic: player.cnic,
    fitness_category: player.fitness_category,
    gender: player.gender,
    age: player.age,
    assigned_team: player.assigned_team,
    ...(player.team && player.team.team_name ? { assigned_team_name: player.team.team_name } : {}), // ✅ Safely handle team_name
  }));

  return formattedPlayers;
};
