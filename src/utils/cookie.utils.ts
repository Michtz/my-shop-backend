import { Response } from 'express';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden

export const setSessionCookie = (res: Response, sessionId: string): void => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  };
  
  console.log('[COOKIE] Setting session cookie with options:', {
    sessionId,
    ...cookieOptions,
    nodeEnv: process.env.NODE_ENV
  });
  
  res.cookie('sessionId', sessionId, cookieOptions);
};

export const setAuthTokenCookie = (res: Response, token: string): void => {
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
};

export const clearSessionCookie = (res: Response): void => {
  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

export const clearAuthTokenCookie = (res: Response): void => {
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
};

export const clearAllAuthCookies = (res: Response): void => {
  clearSessionCookie(res);
  clearAuthTokenCookie(res);
};
