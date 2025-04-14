import { Response } from 'express';
import * as AuthService from '../services/auth.service';
import { AuthRequest } from '../models/auth.model';
import { verifyToken } from '../utils/jwt.utils';
import authRoutes from '../routes/auth.routes';

export const register = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, sessionId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: 'Email, password, firstName, and lastName are required',
      });
      return;
    }

    const result = await AuthService.register(
      email,
      password,
      firstName,
      lastName,
      sessionId,
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error registering user',
    });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, sessionId } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    const result = await AuthService.login(email, password, sessionId);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error logging in',
    });
  }
};

export const refreshToken = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token is required',
      });
      return;
    }

    const result = await AuthService.refreshToken(refreshToken);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error refreshing token',
    });
  }
};

export const logout = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    const { sessionId } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }

    const result = await AuthService.logout(token, sessionId);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error logging out',
    });
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    const result = await AuthService.getCurrentUser(decodedToken.id);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching current user',
    });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
      return;
    }

    const result = await AuthService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error changing password',
    });
  }
};

export const validateToken = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log(req.headers);
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }

    const result = await AuthService.validateToken(token);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error validating token',
    });
  }
};
