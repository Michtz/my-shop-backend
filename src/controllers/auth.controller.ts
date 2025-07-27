import { Response } from 'express';
import * as AuthService from '../services/auth.service';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt.utils';
import {
  setSessionCookie,
  setAuthTokenCookie,
  clearAllAuthCookies,
} from '../utils/cookie.utils';
import { updateUser } from '../services/auth.service';

export const register = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // SessionId aus Cookie holen, falls vorhanden
    const sessionId = req.cookies?.sessionId;

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

    // Session Cookie setzen, falls neue Session erstellt wurde
    if (result.sessionId) {
      setSessionCookie(res, result.sessionId);
    }

    // Auth Token Cookie setzen
    if (result.token) {
      setAuthTokenCookie(res, result.token);
    }

    res.status(201).json({
      ...result,
      // Token und SessionId aus Response entfernen (sind jetzt in Cookies)
      token: undefined,
      sessionId: undefined,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error registering user',
    });
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // SessionId aus Cookie holen, falls vorhanden
    const sessionId = req.cookies?.sessionId;

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

    // Session Cookie setzen
    if (result.sessionId) {
      setSessionCookie(res, result.sessionId);
    }

    // Auth Token Cookie setzen
    if (result.token) {
      setAuthTokenCookie(res, result.token);
    }

    res.status(200).json({
      ...result,
      // Token und SessionId aus Response entfernen (sind jetzt in Cookies)
      token: undefined,
      sessionId: undefined,
    });
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

    // Neuen Token als Cookie setzen
    if (result.token) {
      setAuthTokenCookie(res, result.token);
    }

    res.status(200).json({
      ...result,
      token: undefined, // Token aus Response entfernen
    });
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
    // Token aus Cookie oder Authorization Header holen
    const authToken =
      req.cookies?.authToken ||
      (req.headers.authorization && typeof req.headers.authorization === 'string' && req.headers.authorization.split(' ')[1]);

    // SessionId aus Cookie holen
    const sessionId = req.cookies?.sessionId;

    if (!authToken) {
      res.status(400).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const result = await AuthService.logout(authToken, sessionId);

    // Alle Auth-Cookies löschen, auch wenn Logout-Service fehlschlägt
    clearAllAuthCookies(res);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    // Cookies trotzdem löschen bei Fehlern
    clearAllAuthCookies(res);

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
    // Token aus Cookie oder Authorization Header holen
    const authToken =
      req.cookies?.authToken ||
      (req.headers.authorization && typeof req.headers.authorization === 'string' && req.headers.authorization.split(' ')[1]);

    if (!authToken) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const decodedToken = verifyToken(authToken);
    if (!decodedToken) {
      clearAllAuthCookies(res); // Ungültiges Token -> Cookies löschen
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

export const updateUserController = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const updateData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!updateData || Object.keys(updateData).length === 0) {
      res.status(400).json({
        success: false,
        error: 'Update data is required',
      });
      return;
    }

    const result = await updateUser(userId, updateData.userInfo);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error updating user',
    });
  }
};

export const validateToken = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    // Token aus Cookie oder Authorization Header holen
    const authToken =
      req.cookies?.authToken ||
      (req.headers.authorization && typeof req.headers.authorization === 'string' && req.headers.authorization.split(' ')[1]);

    if (!authToken) {
      res.status(401).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }

    const result = await AuthService.validateToken(authToken);

    if (!result.success) {
      clearAllAuthCookies(res); // Ungültiges Token -> Cookies löschen
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
