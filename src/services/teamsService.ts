import Team from '../models/teams';
import Club from '../models/Club';
import { BadRequestError } from '../utils/apiError';

// ✅ Add Team Service
export const addTeam = async (team_name: string, team_type: 'mix' | 'women-only', description: string, clubId: string) => {
  // ✅ Check if Club Exists
  const club = await Club.findById(clubId);
  if (!club) {
    throw new BadRequestError('Club not found');
  }

  // ✅ Ensure Team Name is Unique in the Club
  const existingTeam = await Team.findOne({ team_name, club: clubId });
  if (existingTeam) {
    throw new BadRequestError('A team with this name already exists in your club');
  }

  // ✅ Create and Save the New Team
  const team = new Team({
    team_name,
    team_type,
    description,
    club: clubId,
    players: [], // Initially, no players
  });

  const savedTeam = await team.save();

  // ✅ Also add the team to the Club's teams array
  await Club.findByIdAndUpdate(clubId, { $push: { teams: savedTeam._id } });

  return savedTeam;
};


// ✅ Get Teams Service (Filtered by Team Type)
export const getTeamsByClub = async (clubId: string, teamType?: 'mix' | 'women-only') => {
    const filter: any = { club: clubId };
  
    // ✅ If teamType is provided, filter by it
    if (teamType) {
      if (!['mix', 'women-only'].includes(teamType)) {
        throw new BadRequestError('Invalid team type. Allowed values: mix, women-only');
      }
      filter.team_type = teamType;
    }
  
    // ✅ Find teams matching the club (and optional team type)
    const teams = await Team.find(filter)
      .select('team_name team_type description players')
      .populate('players', 'name cnic assigned_team gender age fitness_category') // ✅ Populate only selected player fields
      .lean();
  
    if (!teams || teams.length === 0) {
      throw new BadRequestError('No teams found for this club');
    }
  
    return teams;
  };