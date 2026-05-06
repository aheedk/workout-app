import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../utils/jwt';

const IS_PROD = process.env.NODE_ENV === 'production';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: (IS_PROD ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 180 * 24 * 60 * 60 * 1000, // 180 days
  path: '/',
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.status(201).json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.json({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, _next: NextFunction) {
  try {
    // Prefer the HttpOnly cookie, but fall back to body or Authorization header
    // so clients (e.g. iOS PWAs) where Safari ITP drops cookies can still
    // refresh using a token persisted in localStorage.
    const headerAuth = req.headers.authorization;
    const headerToken = headerAuth?.startsWith('Bearer ') ? headerAuth.slice(7) : null;
    const token = req.cookies?.refreshToken || req.body?.refreshToken || headerToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token', statusCode: 401 });
    }

    const payload = verifyRefreshToken(token);
    const nextPayload = { userId: payload.userId, email: payload.email };
    const accessToken = generateAccessToken(nextPayload);
    const refreshToken = generateRefreshToken(nextPayload);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    return res.json({ accessToken, refreshToken });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token', statusCode: 401 });
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
  return res.json({ message: 'Logged out' });
}
