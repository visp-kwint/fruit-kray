import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload, Role } from '../types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-change-this';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '72h' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный или истёкший токен' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  const role = req.user?.role;
  if (role !== Role.ADMIN && role !== Role.MODERATOR) {
    res.status(403).json({ error: 'Доступ запрещён' });
    return;
  }

  next();
}