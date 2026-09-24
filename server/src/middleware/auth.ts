import { Request, Response, NextFunction } from 'express';
import { UserRepository } from '../models/storage.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'AUTHENTICATION_REQUIRED', message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const payload = UserRepository.verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'SESSION_EXPIRED', message: 'Your session has expired or is invalid. Please log in again.' });
    return;
  }

  req.userId = payload.userId;
  req.userEmail = payload.email;
  next();
}
