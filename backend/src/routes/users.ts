import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// ── GET /api/users/profile ─────────────────────────────────────────
router.get('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user!.userId },
    select: {
      id:          true,
      email:       true,
      name:        true,
      role:        true,
      lastAddress: true,
      lastLat:     true,
      lastLng:     true,
      createdAt:   true,
    },
  });

  if (!user) {
    res.status(401).json({ error: 'Пользователь не найден' });
    return;
  }

  res.json(user);
});

// ── PUT /api/users/profile ─────────────────────────────────────────
const UpdateSchema = z.object({
  email:    z.string().email('Неверный email').optional(),
  name:     z.string().min(1, 'Имя не может быть пустым').max(100, 'Максимум 100 символов').optional(),
  password: z.string().min(6, 'Пароль минимум 6 символов').optional(),
}).refine(
  (data) => data.email !== undefined || data.name !== undefined || data.password !== undefined,
  { message: 'Укажите хотя бы одно поле для изменения' },
);

router.put('/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const { email, name, password } = parsed.data;
  const updateData: Record<string, string> = {};

  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.user!.userId) {
      res.status(409).json({ error: 'Email уже используется' });
      return;
    }
    updateData.email = email;
  }

  if (name !== undefined) {
    updateData.name = name;
  }

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id: req.user!.userId },
    data:  updateData,
  });

  res.json({ message: 'Профиль успешно обновлён' });
});

export default router;