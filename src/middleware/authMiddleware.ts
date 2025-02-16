// import { Request, Response, NextFunction } from 'express';
// import jwt, { JwtPayload } from 'jsonwebtoken';
// import { UnauthorizedError } from '../utils/apiError';

// //  Define an extended interface for Express Request
// interface AuthenticatedRequest extends Request {
//   club?: {
//     id: string;
//     club_name: string;
  
//   };
  
//   files?: any; //  Added files property to support file uploads
// }

// const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//   let token;

//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//     token = req.headers.authorization.split(' ')[1]; // Extract token
//   } else {
//     throw new UnauthorizedError('Not authorized, token missing');
//   }

//   try {
//     // Verify token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
//     req.club = {
//       id: decoded.id,
//       club_name: decoded.club_name,
//     };

//     next();
//   } catch (error) {
//     throw new UnauthorizedError('Not authorized, invalid token');
//   }
// };

// export { protect, AuthenticatedRequest };

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/apiError';

// ✅ Define an extended interface for Express Request
interface AuthenticatedRequest extends Request {
  club?: {
    id: string;
    club_name: string;
    role?: 'admin' | 'club';
  };
  files?: any;
}

// ✅ Middleware to Protect Routes (Extracts JWT Token)
const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // Extract token
  } else {
    throw new UnauthorizedError('Not authorized, token missing');
  }

  try {
    // Verify JWT Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    
    req.club = {
      id: decoded.id,
      club_name: decoded.club_name,
      role: decoded.role || 'club', // ✅ Default role is 'club'
    };

    next();
  } catch (error) {
    throw new UnauthorizedError('Not authorized, invalid token');
  }
};

// ✅ Middleware to Restrict Access to Admins Only
const adminOnly = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.club || req.club.role !== 'admin') {
    throw new UnauthorizedError('Access denied! Admins only');
  }
  next();
};

export { protect, adminOnly, AuthenticatedRequest };
