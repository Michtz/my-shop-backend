import { Request, Response } from 'express';
import * as SessionService from '../services/session.service';
import { SessionRequest } from '../models/session.model';
import { setSessionCookie } from '../utils/cookie.utils';

export const createSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await SessionService.createSession(req.body.data);

    if (result.success) {
      if (result.success) {
        setSessionCookie(res, result.data.sessionId, req);
      }
    }

    const status = result.success ? 201 : 400;
    res.status(status).json(result);
  } catch (error) {
    console.error('[SESSION] Server error while creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while creating session',
    });
  }
};

export const getSession = async (
  req: SessionRequest,
  res: Response,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
    }

    const result = await SessionService.getSession(sessionId);
    setSessionCookie(res, result.data.sessionId);
    const status = result.success
      ? 200
      : result.error === 'Session not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while fetching session',
    });
  }
};

export const getAllSessions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.cookies?.sessionId;

    if (!sessionId) {
      const createResult = await SessionService.createSession({});

      if (createResult.success) {
        setSessionCookie(res, createResult.data.sessionId);
        res.status(200).json({
          success: true,
          data: [createResult.data],
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create session',
        });
      }
      return;
    }

    const sessionResult = await SessionService.getSession(sessionId);

    if (sessionResult.success) {
      res.status(200).json({
        success: true,
        data: [sessionResult.data],
      });
    } else {
      const createResult = await SessionService.createSession({});

      if (createResult.success) {
        setSessionCookie(res, createResult.data.sessionId);
        res.status(200).json({
          success: true,
          data: [createResult.data],
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create session',
        });
      }
    }
  } catch (error) {
    console.error('[SESSION] Server error while fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching sessions',
    });
  }
};
export const updateSession = async (
  req: SessionRequest,
  res: Response,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
    }

    const currentSession = await SessionService.getSession(sessionId);
    if (!currentSession.success) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
      });
      return;
    }

    const currentData = currentSession.data.data || {};
    const currentPreferences = currentData.preferences || {};

    const updatedPreferences = {
      ...currentPreferences,
      ...req.body.data.preferences,
    };

    if (req.body.data.language) {
      updatedPreferences.language = req.body.data.language;
    }
    if (req.body.data.theme) {
      updatedPreferences.theme = req.body.data.theme;
    }

    const updateData = {
      data: {
        ...currentData,
        preferences: updatedPreferences,
        lastActivity: new Date(),
      },
    };

    const result = await SessionService.updateSession(sessionId, updateData);

    setSessionCookie(res, result.data.sessionId);

    const status = result.success
      ? 200
      : result.error === 'Session not found'
        ? 404
        : 500;

    res.status(status).json(result);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while updating session',
    });
  }
};

export const convertToAuthSession = async (
  req: SessionRequest,
  res: Response,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    if (!sessionId || !userId) {
      res.status(400).json({
        success: false,
        error: 'Session ID and User ID are required',
      });
      return;
    }

    const result = await SessionService.convertToAuthSession(sessionId, userId);
    const status = result.success
      ? 200
      : result.error === 'Session not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while converting session',
    });
  }
};

export const deleteSession = async (
  req: SessionRequest,
  res: Response,
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
      return;
    }

    const result = await SessionService.deleteSession(sessionId);
    const status = result.success
      ? 200
      : result.error === 'Session not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting session',
    });
  }
};

export const getCurrentSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.cookies?.sessionId;

    if (!sessionId) {
      res.status(200).json({
        success: false,
        error: 'no session cookie found',
      });
      return;
    }

    const result = await SessionService.getSession(sessionId);

    const status = result.success
      ? 200
      : result.error === 'Session not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    console.error(
      '[SESSION] Server error while fetching current session:',
      error,
    );
    res.status(500).json({
      success: false,
      error: 'Server error while fetching current session',
    });
  }
};

export const updateCurrentSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.cookies?.sessionId;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'No session cookie found',
      });
      return;
    }

    const result = await SessionService.updateSession(sessionId, req.body);
    const status = result.success
      ? 200
      : result.error === 'Session not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while updating current session',
    });
  }
};

export const deleteCurrentSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const sessionId = req.cookies?.sessionId;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'No session cookie found',
      });
      return;
    }

    const result = await SessionService.deleteSession(sessionId);
    const status = result.success
      ? 200
      : result.error === 'Session not found'
        ? 404
        : 500;
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error while deleting current session',
    });
  }
};
