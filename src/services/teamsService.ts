import Team from '../models/teams';
import Club from '../models/Club';
import cloudinary from '../config/cloudinary';
import { BadRequestError } from '../utils/apiError';
import players from '../models/players';

// Add Team Service
export const addTeam = async (team_name: string, team_type: 'mix' | 'women-only', description: string, clubId: string) => {
  // Check if Club Exists
  const club = await Club.findById(clubId);
  if (!club) {
    throw new BadRequestError('Club not found');
  }

  // Ensure Team Name is Unique in the Club
  const existingTeam = await Team.findOne({ team_name, club: clubId });
  if (existingTeam) {
    throw new BadRequestError('A team with this name already exists in your club');
  }

  // Create and Save the New Team
  const team = new Team({
    team_name,
    team_type,
    description,
    club: clubId,
    players: [], // Initially, no players
  });

  const savedTeam = await team.save();

  // Also add the team to the Club's teams array
  await Club.findByIdAndUpdate(clubId, { $push: { teams: savedTeam._id } });

  return savedTeam;
};


// Get Teams Service (Filtered by Team Type)
export const getTeamsByClub = async (clubId: string, teamType?: 'mix' | 'women-only') => {
    const filter: any = { club: clubId };
  
    // If teamType is provided, filter by it
    if (teamType) {
      if (!['mix', 'women-only'].includes(teamType)) {
        throw new BadRequestError('Invalid team type. Allowed values: mix, women-only');
      }
      filter.team_type = teamType;
    }
  
    // Find teams matching the club (and optional team type)
    const teams = await Team.find(filter)
      .select('team_name team_type description payment_status payment_slip_url payment_comment players')
      .populate('players', 'name cnic assigned_team gender age fitness_category bib_number') // Populate only selected player fields
      .lean();
  
    if (!teams || teams.length === 0) {
      throw new BadRequestError('No teams found for this club');
    }
  
    return teams;
  };


  // Upload Payment Slip Service
export const uploadPaymentSlip = async (clubId: string, teamName: string, file: any, payment_comment?: string) => {
  // Ensure `clubId` is extracted from JWT
  if (!clubId) {
    throw new BadRequestError('Club authentication failed');
  }

  // Find the Team
  const team = await Team.findOne({ team_name: teamName, club: clubId });
  if (!team) {
    throw new BadRequestError('Team not found or does not belong to your club');
  }

  // Ensure File is Provided
  if (!file) {
    throw new BadRequestError('No file uploaded');
  }

  // Upload File to Cloudinary
  const result = await cloudinary.uploader.upload(file.tempFilePath, {
    folder: `payment-slips/${clubId}/${teamName}`, // Organize files in folders by club & team
    resource_type: 'auto',
  });

  // Update Team with Payment Slip URL & Status
  team.payment_slip_url = result.secure_url; // Store Cloudinary URL
  team.payment_status = 'processing'; // Update status
  if (payment_comment) team.payment_comment = payment_comment;

  await team.save();
  return team;
};



// ✅ Update Team Service
export const updateTeamDetails = async (
  clubId: string,
  currentTeamName: string,
  updates: { team_name?: string; description?: string; payment_status?: 'unpaid' | 'processing' | 'paid' }
) => {
  if (!updates.team_name && !updates.description && !updates.payment_status) {
    throw new BadRequestError('No valid fields provided for update');
  }

  // ✅ Find and update the team while ensuring it belongs to the club
  const updatedTeam = await Team.findOneAndUpdate(
    { team_name: currentTeamName, club: clubId }, // Find by current name
    { $set: updates }, // ✅ Only update provided fields
    { new: true, runValidators: true } // ✅ Return updated team, run validation only on updated fields
  );

  if (!updatedTeam) {
    throw new BadRequestError('Team not found or does not belong to your club');
  }

  return updatedTeam;
};


// // ✅ Delete Team Service
// export const deleteTeam = async (clubId: string, teamName: string) => {
//   // ✅ Find the team in the database
//   const team = await Team.findOne({ team_name: teamName, club: clubId });
//   if (!team) {
//     throw new BadRequestError('Team not found or does not belong to your club');
//   }

//   // ✅ Check if any players are assigned to this team
//   const assignedPlayers = await players.find({ team: team._id }).select('name cnic');
//   if (assignedPlayers.length > 0) {
//     throw new BadRequestError(
//       `This team has assigned players. Please unassign them before deleting.\nPlayers: ${JSON.stringify(assignedPlayers)}`,
//     );
//   }

//   // ✅ If a payment slip exists, delete it from Cloudinary
//   if (team.payment_slip_url) {
//     const publicId = team.payment_slip_url.split('/').pop()?.split('.')[0]; // Extract Cloudinary Public ID
//     if (publicId) {
//       await cloudinary.uploader.destroy(publicId);
//     }
//   }

//   // ✅ Remove the team reference from the Club document
//   await Club.findByIdAndUpdate(clubId, { $pull: { teams: team._id } });

//   // ✅ Delete the team
//   await Team.findByIdAndDelete(team._id);

//   return { message: 'Team deleted successfully' };
// };


// ✅ Delete Team Service
export const deleteTeam = async (clubId: string, teamName: string) => {
  // ✅ Find the team in the database
  const team = await Team.findOne({ team_name: teamName, club: clubId });
  if (!team) {
    throw new BadRequestError('Team not found or does not belong to your club');
  }

  // ✅ Check if any players are assigned to this team
  const assignedPlayers = await players.find({ team: team._id }).select('name cnic');

  if (assignedPlayers.length > 0) {
    throw new BadRequestError([
      { message: 'This team has assigned players. Please unassign them before deleting.' },
      ...assignedPlayers.map(player => ({ name: player.name, cnic: player.cnic }))
    ]);
  }

  // ✅ If a payment slip exists, delete it from Cloudinary
  if (team.payment_slip_url) {
    const publicId = team.payment_slip_url.split('/').pop()?.split('.')[0]; // Extract Cloudinary Public ID
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  }

  // ✅ Remove the team reference from the Club document
  await Club.findByIdAndUpdate(clubId, { $pull: { teams: team._id } });

  // ✅ Delete the team
  await Team.findByIdAndDelete(team._id);

  return { message: 'Team deleted successfully' };
};