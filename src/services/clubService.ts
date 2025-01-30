import Club from '../models/Club';

export const createClub = async (name: string, description: string, phoneNumber: string, club_name: string, address?: string) => {
  const existingClub = await Club.findOne({ club_name });
  if (existingClub) {
    throw new Error('Club with this name already exists');
  }

  const club = new Club({ name, description, phoneNumber, club_name, address});
  return await club.save();
};
