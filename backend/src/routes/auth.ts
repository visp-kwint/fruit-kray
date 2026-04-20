import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { signToken } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';
import { Role } from '../types';

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Пароль минимум 6 символов'),
});

const LoginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email уже используется' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.USER,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role as any,
  });

  res.status(201).json({ token, user });
});

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Неверный email или пароль' });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: 'Неверный email или пароль' });
    return;
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role as any,
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      lastAddress: user.lastAddress,
      lastLat: user.lastLat,
      lastLng: user.lastLng,
    },
  });
});

export default router;