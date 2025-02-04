import mongoose from 'mongoose';
import Player from '../models/players';
import Team from '../models/teams';
import { BadRequestError } from '../utils/apiError';

// ✅ Assign Player to a Team Service
export const assignPlayerToTeam = async (playerCnic: string, teamName: string, clubId: string) => {
  try {
    // ✅ Check if the team exists (by name and club)
    const team = await Team.findOne({ team_name: teamName, club: clubId });
    if (!team) {
      throw new BadRequestError('Team not found or does not belong to your club');
    }

    // ✅ Check if the player exists (by CNIC and club)
    const player = await Player.findOne({ cnic: playerCnic, club: clubId });
    if (!player) {
      throw new BadRequestError('Player not found or does not belong to your club');
    }

    // ✅ Check if the player is already assigned to a team
    if (player.team) {
      throw new BadRequestError('Player is already assigned to a team');
    }

    // ✅ Enforce player limits based on team type
    const teamSize = team.players?.length || 0;
    if (team.team_type === 'mix' && teamSize >= 8) {
      throw new BadRequestError('A mix team cannot have more than 8 players');
    }
    if (team.team_type === 'women-only' && teamSize >= 6) {
      throw new BadRequestError('A women-only team cannot have more than 6 players');
    }

    // ✅ Assign the player to the team (no need to convert ObjectId)
    player.team = team._id;  // Directly use ObjectId from MongoDB
    player.assigned_team = 'assigned';
    player.assigned_team_name = team.team_name;

    // ✅ Update team with new player
    await Team.findByIdAndUpdate(team._id, { $push: { players: player._id } });

    // ✅ Save player assignment
    await player.save();

    return { player, team };
  } catch (error) {
    console.error('Error in assigning player:', error);
    throw new BadRequestError('Failed to assign');
  }
};


// ✅ Fetch Players Based on Query Params
export const getPlayersByFilter = async (clubId: string, teamName?: string, assignedStatus?: 'assigned' | 'unassigned') => {
  let filter: any = { club: clubId };

  // ✅ If team_name is provided, get players of that team
  if (teamName) {
    const team = await Team.findOne({ team_name: teamName, club: clubId });
    if (!team) {
      throw new BadRequestError('Team not found or does not belong to your club');
    }
    filter.team = team._id;
    filter.assigned_team = 'assigned'; // ✅ Ensure only assigned players
  }
  // ✅ If assigned_team=unassigned is provided, fetch only unassigned players
  if (assignedStatus === 'unassigned') {
    filter = { club: clubId, assigned_team: 'unassigned', assigned_team_name: null };
  }

  // ✅ Fetch players based on the filter
  const players = await Player.find(filter)
    .select('name cnic gender assigned_team assigned_team_name age contact')
    .lean();

  if (!players.length) {
    throw new BadRequestError('No players found with the given criteria');
  }

  return players;
};

// ✅ Unassign a Player from a Team
export const unassignPlayerFromTeam = async (playerCnic: string, clubId: string) => {
  // ✅ Find player by CNIC & Club
  const player = await Player.findOne({ cnic: playerCnic, club: clubId });
  if (!player) {
    throw new BadRequestError('Player not found or does not belong to your club');
  }

  // ✅ Check if the player is already unassigned
  if (!player.team) {
    throw new BadRequestError('Player is already unassigned');
  }

  // ✅ Find the team where the player was assigned
  const team = await Team.findById(player.team);
  if (!team) {
    throw new BadRequestError('Team not found');
  }

  // ✅ Remove the player from the team's players array
  await Team.findByIdAndUpdate(team._id, { $pull: { players: player._id } });

  // ✅ Reset the player’s team details
  player.team = undefined;
  player.assigned_team = 'unassigned';
  player.assigned_team_name = undefined;

  // ✅ Save the updated player
  await player.save();

  return { message: 'Player unassigned successfully', player };
};