import { Response } from 'express';
import * as AuthService from '../services/auth.service';
import { verifyToken } from '../utils/jwt.utils';
import {
  // setSessionCookie,
  setAuthTokenCookie,
  clearAllAuthCookies,
} from '../utils/cookie.utils';
import { updateUser } from '../services/auth.service';
import { AuthRequest } from '../models/auth.model';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/user.model';
import bcrypt from 'bcrypt';
import {
  generateToken,
  generateRefreshToken,
  storeRefreshToken,
} from '../utils/jwt.utils';
import * as SessionService from '../services/session.service';

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
    //
    // // Session Cookie setzen, falls neue Session erstellt wurde
    // if (result.data.sessionId) {
    //   setSessionCookie(res, result.sessionId);
    // }

    // Auth Token Cookie setzen
    if (result.data.token) {
      setAuthTokenCookie(res, result.data.token);
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

    // // Session Cookie setzen
    // if (result.sessionId) {
    //   setSessionCookie(res, result.sessionId);
    // }

    // Auth Token Cookie setzen
    if (result.data.token) {
      setAuthTokenCookie(res, result.data.token);
    }

    res.status(200).json({
      ...result,
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
    if (result.data.token) {
      setAuthTokenCookie(res, result.data.token);
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
      (req.headers.authorization &&
        typeof req.headers.authorization === 'string' &&
        req.headers.authorization.split(' ')[1]);

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
      (req.headers.authorization &&
        typeof req.headers.authorization === 'string' &&
        req.headers.authorization.split(' ')[1]);

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
      (req.headers.authorization &&
        typeof req.headers.authorization === 'string' &&
        req.headers.authorization.split(' ')[1]);

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

export const googleLogin = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { credential } = req.body;
    const sessionId = req.cookies?.sessionId;

    if (!credential) {
      res.status(400).json({
        success: false,
        error: 'Google credential is required',
      });
      return;
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        res.status(401).json({
          success: false,
          error: 'Invalid Google token',
        });
        return;
      }

      const {
        sub: googleId,
        email,
        given_name: firstName,
        family_name: lastName,
      } = payload;

      if (!email || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: 'Incomplete user information from Google',
        });
        return;
      }

      // Check if user exists with googleId or email
      let user = await User.findOne({
        $or: [{ googleId }, { email }],
      });

      if (!user) {
        // Create new user with Google data
        const hashedPassword = await bcrypt.hash(googleId, 10);

        user = new User({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          googleId,
          authProvider: 'google',
          role: 'customer',
          tokenVersion: 0,
        });

        await user.save();
      } else if (!user.googleId) {
        // Link existing account with Google
        user.googleId = googleId;
        user.authProvider = 'google';
        await user.save();
      }

      // Generate tokens
      const token = generateToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        id: user._id.toString(),
        tokenVersion: user.tokenVersion || 0,
      });

      await storeRefreshToken(user._id.toString(), refreshToken);

      // Handle session
      let finalSessionId = sessionId;
      if (!finalSessionId) {
        const sessionResponse = await SessionService.createSession({
          userId: user._id.toString(),
        });
        if (sessionResponse.success && sessionResponse.data) {
          finalSessionId = sessionResponse.data._id.toString();
        }
      } else {
        await SessionService.convertToAuthSession(
          finalSessionId,
          user._id.toString(),
        );
      }

      // Set auth token cookie
      setAuthTokenCookie(res, token);

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            authProvider: user.authProvider,
          },
          refreshToken,
          token: token,
        },
      });
    } catch (error) {
      console.error('Google token verification error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid Google token',
      });
    }
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      error: 'Error during Google login',
    });
  }
};
