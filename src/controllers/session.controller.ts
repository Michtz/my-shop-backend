// controllers/session.controller.ts
import { Request, Response } from 'express';
import * as SessionService from '../services/session.service';
import { SessionRequest } from '../models/session.model';

export const createSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await SessionService.createSession(req.body.data);
    const status = result.success ? 201 : 400;
    res.status(status).json(result);
  } catch (error) {
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
    const result = await SessionService.getAllSessions();
    res.status(200).json(result);
  } catch (error) {
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
