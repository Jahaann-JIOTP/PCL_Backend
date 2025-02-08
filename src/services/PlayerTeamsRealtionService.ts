import mongoose from 'mongoose';
import Player from '../models/players';
import Team from '../models/teams';
import { BadRequestError } from '../utils/apiError';

// ✅ Assign Multiple Players to a Team
export const assignMultiplePlayersToTeam = async (playerCnics: string[], teamName: string, clubId: string) => {
  // ✅ Check if the team exists
  const team = await Team.findOne({ team_name: teamName, club: clubId });
  if (!team) {
    throw new BadRequestError('Team not found or does not belong to your club');
  }

  // ✅ Get all players by CNICs
  const players = await Player.find({ cnic: { $in: playerCnics }, club: clubId });

  // ✅ Identify missing players
  const foundCnics = players.map((p) => p.cnic);
  const missingPlayers = playerCnics.filter((cnic) => !foundCnics.includes(cnic));

  // ✅ Identify already assigned players
  const alreadyAssigned = players.filter((p) => p.team);
  const alreadyAssignedCnics = alreadyAssigned.map((p) => p.cnic);

  // ✅ Remove already assigned players from processing
  const playersToAssign = players.filter((p) => !p.team);

  // ✅ Check if adding players exceeds team limit
  const teamSize = team.players?.length || 0;
  const newTotal = teamSize + playersToAssign.length;

  if (team.team_type === 'mix' && newTotal > 8) {
    throw new BadRequestError(`A mix team cannot have more than 8 players. Available slots: ${8 - teamSize}`);
  }
  if (team.team_type === 'women-only' && newTotal > 6) {
    throw new BadRequestError(`A women-only team cannot have more than 6 players. Available slots: ${6 - teamSize}`);
  }

  // ✅ Assign all valid players to the team
  const playerIds = playersToAssign.map((p) => p._id);

  await Player.updateMany(
    { _id: { $in: playerIds } },
    {
      $set: {
        team: team._id,
        assigned_team: 'assigned',
        assigned_team_name: team.team_name,
      },
    },
  );

  // ✅ Add players to the team's player list
  await Team.findByIdAndUpdate(team._id, { $push: { players: { $each: playerIds } } });

  return {
    assignedPlayers: playersToAssign.length,
    missingPlayers,
    alreadyAssignedPlayers: alreadyAssignedCnics,
    team,
  };
};

// // ✅ Fetch Players Based on Query Params
// export const getPlayersByFilter = async (
//   clubId: string,
//   teamName?: string,
//   assignedStatus?: 'assigned' | 'unassigned',
//   teamType?: 'mix' | 'women-only' // ✅ Added teamType filter
// ) => {
//   let filter: any = { club: clubId };

//   // ✅ If team_name is provided, get players of that team
//   if (teamName) {
//     const team = await Team.findOne({ team_name: teamName, club: clubId });
//     if (!team) {
//       throw new BadRequestError('Team not found or does not belong to your club');
//     }
//     filter.team = team._id;
//     filter.assigned_team = 'assigned'; // ✅ Ensure only assigned players
//   }

//   // ✅ If assigned_team=unassigned is provided, fetch only unassigned players
//   if (assignedStatus === 'unassigned') {
//     filter.assigned_team = 'unassigned';
//     filter.assigned_team_name = null;

//     // ✅ Apply gender-based filter **ONLY** when `teamType=women-only`
//     if (teamType === 'women-only') {
//       filter.gender = 'female'; // ✅ Ensure only female players appear
//     } else if (teamType === 'mix') {
//       filter.gender = { $in: ['male', 'female'] }; // ✅ Ensure both genders appear in `mix`
//     }
//   }

//   console.log("Applying filter: ", filter); // ✅ Debugging

//   // ✅ Fetch players based on the filter
//   const players = await Player.find(filter)
//     .select('name cnic gender assigned_team assigned_team_name age contact')
//     .lean();

//   if (!players.length) {
//     throw new BadRequestError('No players found with the given criteria');
//   }

//   return players;
// };

// // ✅ Fetch Players Based on Query Params   - changed Params
export const getPlayersByFilter = async (
  clubId: string,
  teamName?: string,
  assignedStatus?: 'assigned' | 'unassigned',
  teamTypeKey?: string, // ✅ Changed from `teamType` to `teamTypeKey`
) => {
  let filter: any = { club: clubId };

  // ✅ If teamName is provided, get players of that specific team
  if (teamName) {
    const team = await Team.findOne({ team_name: teamName, club: clubId });
    if (!team) {
      throw new BadRequestError('Team not found or does not belong to your club');
    }
    filter.team = team._id;
    filter.assigned_team = 'assigned'; // ✅ Ensure only assigned players
  }

  // ✅ Fetch Unassigned Players Before Gender Filtering
  if (assignedStatus === 'unassigned') {
    filter.assigned_team = 'unassigned';
    filter.assigned_team_name = null;

    // ✅ Fetch Players Before Gender Filtering
    const allUnassignedPlayers = await Player.find(filter).lean();
    console.log('✅ All Unassigned Players: ', allUnassignedPlayers);

    if (teamTypeKey) {
      const team = await Team.findOne({ team_name: teamTypeKey, club: clubId });

      if (!team) {
        throw new BadRequestError('Team not found or does not belong to your club');
      }

      const teamType = team.team_type;

      // ✅ Apply Gender-Based Filtering
      if (teamType === 'women-only') {
        filter.gender = 'female';
      } else if (teamType === 'mix') {
        filter.gender = { $in: ['male', 'female'] };
      }
    }
  }

  // console.log('Applying filter: ', filter); // ✅ Debugging

  // ✅ Fetch players based on the filter
  const players = await Player.find(filter).select('name cnic gender assigned_team age contact fitness').lean();
  // console.log(players);

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
  // player.assigned_team_name = undefined;

  // ✅ Save the updated player
  await player.save();

  return { message: 'Player unassigned successfully', player };
};

// ✅ Check if the player is assigned to a team before deletion
export const checkPlayerAssignment = async (playerCnic: string, clubId: string) => {
  // ✅ Find the player by CNIC and Club ID
  const player = await Player.findOne({ cnic: playerCnic, club: clubId });
  if (!player) {
    throw new BadRequestError('Player not found or does not belong to your club');
  }

  // ✅ If the player is assigned to a team, return details
  if (player.team) {
    const team = await Team.findById(player.team);
    return {
      assigned: true,
      message: `Player is assigned to the team: ${team?.team_name}`,
      player: {
        name: player.name,
        cnic: player.cnic,
        team_name: team?.team_name,
      },
    };
  }

  // ✅ Player is unassigned and can be deleted
  return { assigned: false, message: 'Player is unassigned and can be deleted' };
};

// ✅ Delete Player Service
export const deletePlayerService = async (playerCnic: string, clubId: string) => {
  // ✅ Find the player by CNIC and club
  const player = await Player.findOne({ cnic: playerCnic, club: clubId });

  if (!player) {
    throw new BadRequestError('Player not found in your club');
  }

  // ✅ Check if the player is assigned to a team
  if (player.team) {
    const team = await Team.findById(player.team);
    if (team) {
      return {
        success: false,
        message: `Player '${player.name}' with CNIC '${player.cnic}' is assigned to team '${team.team_name}'. Please unassign the player before deletion.`,
      };
    }
  }

  // ✅ If unassigned, delete the player
  await Player.findByIdAndDelete(player._id);

  return {
    success: true,
    message: `Player '${player.name}' with CNIC '${player.cnic}' has been deleted successfully.`,
  };
};
