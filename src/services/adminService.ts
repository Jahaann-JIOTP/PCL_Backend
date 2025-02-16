import Club from '../models/Club';
import Player, { IPlayer } from '../models/players';
import Team from '../models/teams';
import { BadRequestError, NotFoundError } from '../utils/apiError';

// ✅ Get Admin Dashboard Data
export const getAdminDashboardData = async (adminClubId: string) => {
  // ✅ Check if the logged-in user is an Admin
  const adminClub = await Club.findById(adminClubId);
  if (!adminClub) throw new BadRequestError('Admin club not found');

  if (adminClub.role !== 'admin') throw new BadRequestError('Unauthorized: Only admin can access this');

  // ✅ Count total clubs
  const totalClubs = await Club.countDocuments();

  // ✅ Count total players
  const totalPlayers = await Player.countDocuments();

  // ✅ Count total teams
  const totalTeams = await Team.countDocuments();

  // ✅ Count teams by payment status
  const paidTeams = await Team.countDocuments({ payment_status: 'paid' });
  const unpaidTeams = await Team.countDocuments({ payment_status: 'unpaid' });
  const processingTeams = await Team.countDocuments({ payment_status: 'processing' });

  return {
    admin_details: {
      id: adminClub._id,
      name: adminClub.name,
      club_name: adminClub.club_name,
      phoneNumber: adminClub.phoneNumber,
      description: adminClub.description, // ✅ Added Club Description
    },
    stats: {
      totalClubs,
      totalPlayers,
      totalTeams,
      paidTeams,
      unpaidTeams,
      processingTeams,
    },
  };
};

// ✅ Get All Registered Clubs (Excluding Admin)
export const getAllClubsData = async (adminClubId: string) => {
  // ✅ Check if the logged-in user is an Admin
  const adminClub = await Club.findById(adminClubId);
  if (!adminClub) throw new BadRequestError('Admin club not found');

  if (adminClub.role !== 'admin') throw new BadRequestError('Unauthorized: Only admin can access this');

  // ✅ Fetch all clubs except the admin club itself
  const clubs = await Club.find({ _id: { $ne: adminClubId } }).select('name club_name phoneNumber description teams');

  // ✅ Fetch all teams & players data
  const clubsData = await Promise.all(
    clubs.map(async (club) => {
      const totalTeams = await Team.countDocuments({ club: club._id });
      const totalPlayers = await Player.countDocuments({ club: club._id });

      // ✅ Count teams by payment status
      const paidTeams = await Team.countDocuments({ club: club._id, payment_status: 'paid' });
      const unpaidTeams = await Team.countDocuments({ club: club._id, payment_status: 'unpaid' });
      const processingTeams = await Team.countDocuments({ club: club._id, payment_status: 'processing' });

      return {
        id: club._id,
        name: club.name,
        club_name: club.club_name,
        phoneNumber: club.phoneNumber,
        contact_person: club.description,
        totalTeams,
        totalPlayers,
        paymentStatus: {
          paid: paidTeams,
          unpaid: unpaidTeams,
          processing: processingTeams,
        },
      };
    })
  );

  return clubsData;
};

// ✅ Define Interface for Team Data Structure
interface TeamData {
  name: string;
  players: Pick<IPlayer, 'name' | 'cnic' | 'assigned_team' | 'gender' | 'bib_number' | 'fitness_category'>[];
  payment_slip_url: string | null;
  payment_status: 'unpaid' | 'processing' | 'paid';
  payment_comment: string | null;
}

// ✅ Get Full Details of a Single Club (Admin Only)
export const getSingleClubDetails = async (adminId: string, club_name: string) => {
  // ✅ Fetch the club details from MongoDB
  const club = await Club.findOne({ club_name }).populate('teams');

  if (!club) {
    throw new BadRequestError(`No club found with name: ${club_name}`);
  }

  // ✅ Get all teams of the club
  const teams = await Team.find({ club: club._id });

  // ✅ Categorize teams into "mix" and "women-only"
  const mixTeams: TeamData[] = [];
  const womenOnlyTeams: TeamData[] = [];

  for (const team of teams) {
    // ✅ Fetch players assigned to this team
    const players = await Player.find({ team: team._id })
      .select('name cnic assigned_team gender bib_number fitness_category')
      .lean();

    // ✅ Structure the team data
    const teamData: TeamData = {
      name: team.team_name,
      players: players.map((player) => ({
        name: player.name,
        cnic: player.cnic,
        assigned_team: player.assigned_team,
        gender: player.gender,
        bib_number: player.bib_number,
        fitness_category: player.fitness_category,
      })),
      payment_slip_url: team.payment_slip_url || null,
      payment_status: team.payment_status || 'unpaid',
      payment_comment: team.payment_comment || null,
    };

    // ✅ Categorize into "mix" or "women-only"
    if (team.team_type === 'mix') {
      mixTeams.push(teamData);
    } else {
      womenOnlyTeams.push(teamData);
    }
  }

  return {
    id: club._id,
    name: club.name,
    club_name: club.club_name,
    phoneNumber: club.phoneNumber,
    description: club.description,
    teamsByType: {
      mix: mixTeams,
      womenOnly: womenOnlyTeams,
    },
  };
};