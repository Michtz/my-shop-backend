import { Response, Request } from 'express';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24h

export const setSessionCookie = (
  res: Response,
  sessionId: string,
  req?: Request,
): void => {
  const origin = req?.get('Origin') || '';
  const isLocalhost = origin.includes('localhost');

  console.log('[DEBUG] Origin:', origin, 'isLocalhost:', isLocalhost);

  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    maxAge: SESSION_DURATION,
    path: '/',
  };

  res.cookie('sessionId', sessionId, cookieOptions);
};

export const setAuthTokenCookie = (res: Response, token: string): void => {
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    maxAge: SESSION_DURATION,
    path: '/',
  });
};

export const clearSessionCookie = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  });
};

export const clearAuthTokenCookie = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
  });
};

export const clearAllAuthCookies = (res: Response): void => {
  clearSessionCookie(res);
  clearAuthTokenCookie(res);
};
