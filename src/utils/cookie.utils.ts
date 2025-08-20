import { Response } from 'express';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden

export const setSessionCookie = (res: Response, sessionId: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const, // Always 'none' for cross-origin support
    maxAge: SESSION_DURATION,
    path: '/',
  };

  console.log('[COOKIE] Setting session cookie with options:', {
    sessionId,
    ...cookieOptions,
    nodeEnv: process.env.NODE_ENV,
  });

  res.cookie('sessionId', sessionId, cookieOptions);
};

export const setAuthTokenCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none' as const, // Always 'none' for cross-origin support
    maxAge: SESSION_DURATION,
    path: '/',
  });
};

export const clearSessionCookie = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none' as const, // Always 'none' for cross-origin support
    path: '/',
  });
};

export const clearAuthTokenCookie = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none' as const, // Always 'none' for cross-origin support
    path: '/',
  });
};

export const clearAllAuthCookies = (res: Response): void => {
  clearSessionCookie(res);
  clearAuthTokenCookie(res);
};
