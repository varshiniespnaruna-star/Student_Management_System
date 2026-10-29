import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { Role } from './types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ssms-super-secret-dev-key-2026-safe-production-env';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: Role;
  full_name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function generateToken(user: { id: string; email: string; role: Role; full_name: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUserPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
    return;
  }

  // Verify user still exists and is active in database
  const user = db.findUserById(payload.id);
  if (!user || user.status === 'inactive') {
    res.status(401).json({ error: 'User account not found or has been deactivated.' });
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
  };

  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access forbidden. Action requires one of: [${roles.join(', ')}]. Your role is ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}
