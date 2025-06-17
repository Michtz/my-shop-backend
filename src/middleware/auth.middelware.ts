import { Response, NextFunction } from 'express';
import { verifyToken, isTokenBlacklisted } from '../utils/jwt.utils';
import { AuthRequest } from '../models/auth.model';
import { clearAllAuthCookies } from '../utils/cookie.utils';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies?.authToken;

    const token = headerToken || cookieToken;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      clearAllAuthCookies(res);
      res.status(401).json({
        success: false,
        error: 'Token is no longer valid',
      });
      return;
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      clearAllAuthCookies(res);
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    req.user = {
      id: decodedToken.id,
      email: decodedToken.email,
      role: decodedToken.role,
    };

    next();
  } catch (error) {
    clearAllAuthCookies(res);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const sessionMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const sessionId = req.cookies?.sessionId;

    if (!sessionId) {
      res.status(401).json({
        success: false,
        error: 'Session required',
      });
      return;
    }

    req.sessionId = sessionId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Session validation failed',
    });
  }
};
