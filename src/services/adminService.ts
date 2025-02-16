import Club from '../models/Club';
import Player from '../models/players';
import Team from '../models/teams';
import { BadRequestError } from '../utils/apiError';

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
