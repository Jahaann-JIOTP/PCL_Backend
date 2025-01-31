import jwt from 'jsonwebtoken';

const generateToken = (id: string, club_name: string): string => {
  const jwtSecret: string | undefined = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }

  return jwt.sign({ id, club_name }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export default generateToken;
