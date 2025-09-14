import { AuthResponse } from '../models/auth.model';
import { UpdateUserData, User } from '../models/user.model';
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

const SALT_ROUNDS = 10;

const validatePassword = (password: unknown): string => {
  if (typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be a string with at least 6 characters');
  }
  return password;
};

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

    const validPassword = validatePassword(password);
    const hashedPassword = await bcrypt.hash(validPassword, SALT_ROUNDS);

    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'customer',
      tokenVersion: 0,
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
    console.error('Registration error:', error);
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
    const user = await User.findOne({ email });
    if (!user) {
      return {
        success: false,
        error: 'Invalid credentials',
      };
    }

    const validPassword = validatePassword(password);
    const storedHash = String(user.password);

    const isPasswordValid = await bcrypt.compare(validPassword, storedHash);
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
    console.error('Login error:', error);
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
    console.error('Token refresh error:', error);
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
    const user = await User.findById(userId).select('-password -refreshToken');
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
          phoneNumber: user.phoneNumber,
          addresses: user.addresses,
          role: user.role,
        },
      },
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error fetching user',
    };
  }
};

export const updateUser = async (
  userId: string,
  updateData: UpdateUserData,
): Promise<AuthResponse> => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    if (updateData.email !== undefined) user.email = updateData.email;
    if (updateData.firstName !== undefined)
      user.firstName = updateData.firstName;
    if (updateData.lastName !== undefined) user.lastName = updateData.lastName;
    if (updateData.phoneNumber !== undefined)
      user.phoneNumber = updateData.phoneNumber;
    if (updateData.addresses !== undefined)
      user.addresses = updateData.addresses;
    if (updateData.paymentInfo !== undefined)
      user.paymentInfo = updateData.paymentInfo;
    await user.save();

    return {
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          addresses: user.addresses,
          paymentInfo: user.paymentInfo,
        },
      },
    };
  } catch (error) {
    console.error('Update user error:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error updating user',
    };
  }
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<AuthResponse> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const validCurrentPassword = validatePassword(currentPassword);
    const validNewPassword = validatePassword(newPassword);
    const storedHash = String(user.password);

    const isPasswordValid = await bcrypt.compare(
      validCurrentPassword,
      storedHash,
    );
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Current password is incorrect',
      };
    }

    user.password = await bcrypt.hash(validNewPassword, SALT_ROUNDS);

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
    console.error('Change password error:', error);
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
    console.error('Token validation error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error validating token',
    };
  }
};
