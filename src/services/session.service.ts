import { Session, ISession, SessionResponse } from '../models/session.model';
import { generateSessionId } from '../utils/jwt.utils';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h

export const createSession = async (
  data: Partial<ISession> = {},
): Promise<SessionResponse> => {
  try {
    const sessionId = generateSessionId();
    const session = await Session.create({
      sessionId,
      data: {
        ...data,
        lastActivity: new Date(),
      },
      expires: new Date(Date.now() + SESSION_DURATION),
      isAuthenticated: false,
    });

    return {
      success: true,
      data: session.toObject(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getSession = async (
  sessionId: string,
): Promise<SessionResponse> => {
  try {
    const session = await Session.findOne({ sessionId }).exec();

    if (!session) return { success: false, error: 'Session not found' };

    return {
      success: true,
      data: session.toObject(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const updateSession = async (
  sessionId: string,
  updateData: Partial<ISession>,
): Promise<SessionResponse> => {
  try {
    const updateObject: any = {};

    if (updateData?.data) {
      Object.keys(updateData.data).forEach((key) => {
        updateObject[`data.${key}`] = updateData.data![key];
      });
    }

    updateObject['data.lastActivity'] = new Date();
    updateObject['expires'] = new Date(Date.now() + SESSION_DURATION);

    if (updateData.isAuthenticated !== undefined) {
      updateObject.isAuthenticated = updateData.isAuthenticated;
    }
    if (updateData.userId) {
      updateObject.userId = updateData.userId;
    }
    if (updateData.cartId) {
      updateObject.cartId = updateData.cartId;
    }

    const session = await Session.findOneAndUpdate(
      { sessionId },
      { $set: updateObject },
      { new: true, runValidators: true },
    ).populate('cart');

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    return {
      success: true,
      data: session.toObject(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const convertToAuthSession = async (
  sessionId: string,
  userId: string,
): Promise<SessionResponse> => {
  try {
    const session = await Session.findOneAndUpdate(
      { sessionId },
      {
        userId,
        isAuthenticated: true,
        'data.lastActivity': new Date(),
        expires: new Date(Date.now() + SESSION_DURATION),
      },
      { new: true },
    ).populate('cart');

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    return {
      success: true,
      data: session.toObject(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const deleteSession = async (
  sessionId: string,
): Promise<SessionResponse> => {
  try {
    const session = await Session.findOneAndDelete({ sessionId });
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    return {
      success: true,
      data: session.toObject(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
