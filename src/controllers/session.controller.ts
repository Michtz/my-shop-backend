import { Request, Response } from 'express';
import * as SessionService from '../services/session.service';
import { SessionRequest } from '../models/session.model';
import { setSessionCookie } from '../utils/cookie.utils';

export const createSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    console.log('[SESSION] Creating new session...');
    const result = await SessionService.createSession(req.body.data);

    if (result.success) {
      if (result.success) {
        setSessionCookie(res, result.data.sessionId, req);
      }
      console.log(
        '[SESSION] Cookie set with sessionId:',
        result.data.sessionId,
      );
    } else {
      console.error('[SESSION] Failed to create session:', result.error);
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
    console.log('[SESSION] Getting all sessions...');
    console.log('[SESSION] Available cookies:', Object.keys(req.cookies || {}));
    const sessionId = req.cookies?.sessionId;

    if (!sessionId) {
      console.log(
        '[SESSION] No sessionId cookie found, creating new session...',
      );
      const createResult = await SessionService.createSession({});

      if (createResult.success) {
        console.log(
          '[SESSION] New session created:',
          createResult.data.sessionId,
        );
        setSessionCookie(res, createResult.data.sessionId);
        res.status(200).json({
          success: true,
          data: [createResult.data],
        });
      } else {
        console.error(
          '[SESSION] Failed to create session:',
          createResult.error,
        );
        res.status(500).json({
          success: false,
          error: 'Failed to create session',
        });
      }
      return;
    }

    console.log('[SESSION] Found sessionId:', sessionId);
    const sessionResult = await SessionService.getSession(sessionId);

    if (sessionResult.success) {
      console.log('[SESSION] Existing session found');
      res.status(200).json({
        success: true,
        data: [sessionResult.data],
      });
    } else {
      console.log('[SESSION] Session not found, creating new session...');
      const createResult = await SessionService.createSession({});

      if (createResult.success) {
        console.log(
          '[SESSION] New session created:',
          createResult.data.sessionId,
        );
        setSessionCookie(res, createResult.data.sessionId);
        res.status(200).json({
          success: true,
          data: [createResult.data],
        });
      } else {
        console.error(
          '[SESSION] Failed to create session:',
          createResult.error,
        );
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

    const result = await SessionService.updateSession(sessionId, req.body);
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
    console.log('[SESSION] Getting current session...');
    console.log('[SESSION] Available cookies:', Object.keys(req.cookies || {}));
    const sessionId = req.cookies?.sessionId;

    if (!sessionId) {
      console.log('[SESSION] No sessionId cookie found');
      res.status(200).json({
        success: false,
        error: req,
      });
      return;
    }

    console.log('[SESSION] Found sessionId:', sessionId);
    const result = await SessionService.getSession(sessionId);

    if (result.success) {
      console.log('[SESSION] Session found successfully');
    } else {
      console.log('[SESSION] Session not found or error:', result.error);
    }

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
