import { AuthResponse } from '../models/auth.model';
import { IUser, User } from '../models/user.model';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  storeRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
  JwtPayload,
  JwtRefreshPayload,
} from '../utils/jwt.utils';
import * as SessionService from './session.service';
import bcrypt from 'bcrypt';

export const register = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  sessionId?: string,
): Promise<AuthResponse> => {
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return {
        success: false,
        error: 'Email already in use',
      };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user: IUser | null = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'customer',
    });

    await user.save();

    const tokenPayload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const refreshPayload: JwtRefreshPayload = {
      id: user._id.toString(),
      tokenVersion: 0,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(refreshPayload);

    await storeRefreshToken(user._id.toString(), refreshToken);

    if (sessionId) {
      await SessionService.convertToAuthSession(sessionId, user._id.toString());
    }

    return {
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error during registration',
    };
  }
};

export const login = async (
  email: string,
  password: string,
  sessionId?: string,
): Promise<AuthResponse> => {
  try {
    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    const tokenPayload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const refreshPayload: JwtRefreshPayload = {
      id: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(refreshPayload);

    await storeRefreshToken(user._id.toString(), refreshToken);

    if (sessionId) {
      await SessionService.convertToAuthSession(sessionId, user._id.toString());
    }

    return {
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error during login',
    };
  }
};

export const refreshToken = async (
  refreshToken: string,
): Promise<AuthResponse> => {
  try {
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      return {
        success: false,
        error: 'Invalid refresh token',
      };
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return {
        success: false,
        error: 'Invalid refresh token',
      };
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    if ((user.tokenVersion || 0) !== payload.tokenVersion) {
      return {
        success: false,
        error: 'Token version mismatch',
      };
    }

    const tokenPayload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const refreshPayload: JwtRefreshPayload = {
      id: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    };

    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(refreshPayload);

    await storeRefreshToken(user._id.toString(), newRefreshToken);

    return {
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error refreshing token',
    };
  }
};

export const logout = async (
  token: string,
  sessionId?: string,
): Promise<AuthResponse> => {
  try {
    const result = await blacklistToken(token);
    if (!result) {
      return {
        success: false,
        error: 'Error blacklisting token',
      };
    }

    if (sessionId) {
      await SessionService.updateSession(sessionId, {
        isAuthenticated: false,
        userId: undefined,
      });
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error during logout',
    };
  }
};

export const getCurrentUser = async (userId: string): Promise<AuthResponse> => {
  try {
    const user: IUser | null = await User.findById(userId).select(
      '-password -refreshToken',
    );
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error fetching user',
    };
  }
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<AuthResponse> => {
  try {
    const user: IUser | null = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const tokenPayload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const refreshPayload: JwtRefreshPayload = {
      id: user._id.toString(),
      tokenVersion: user.tokenVersion,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(refreshPayload);

    await storeRefreshToken(user._id.toString(), refreshToken);

    return {
      success: true,
      data: {
        token,
        refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error changing password',
    };
  }
};

export const validateToken = async (token: string): Promise<AuthResponse> => {
  try {
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return {
        success: false,
        error: 'Token is invalid',
      };
    }

    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error validating token',
    };
  }
};
