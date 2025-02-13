import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/apiError';

// ✅ Define an extended interface for Express Request
interface AuthenticatedRequest extends Request {
  club?: {
    id: string;
    club_name: string;
  
  };
  
  files?: any; // ✅ Added files property to support file uploads
}

const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Extract token
  } else {
    throw new UnauthorizedError('Not authorized, token missing');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
    req.club = {
      id: decoded.id,
      club_name: decoded.club_name,
    };

    next();
  } catch (error) {
    throw new UnauthorizedError('Not authorized, invalid token');
  }
};

export { protect, AuthenticatedRequest };
