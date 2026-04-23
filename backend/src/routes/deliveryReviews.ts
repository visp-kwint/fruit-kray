import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const CreateSchema = z.object({
  orderId: z.string().min(1, 'Укажите заказ'),
  rating:  z.coerce.number().int().min(1).max(5, 'Рейтинг 1–5'),
  comment: z.string().min(1, 'Напишите комментарий').max(1000),
});

// POST /api/delivery-reviews
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const { orderId, rating, comment } = parsed.data;
  const userId = req.user!.userId;

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) {
    res.status(403).json({ error: 'Заказ не найден' });
    return;
  }

  const existing = await prisma.deliveryReview.findUnique({
    where: { orderId },
  });

  if (existing) {
    res.status(409).json({ error: 'Вы уже оставили отзыв на эту доставку' });
    return;
  }

  // Создаём отзыв и меняем статус заказа на DONE
  const [review] = await prisma.$transaction([
    prisma.deliveryReview.create({
      data: { orderId, userId, rating, comment },
      include: {
        user:  { select: { name: true, email: true } },
        order: { select: { id: true, deliveryAddress: true, deliveryMinutes: true } },
      },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: 'DONE' },
    }),
  ]);

  res.status(201).json(review);
});

// GET /api/delivery-reviews/my — мои отзывы
router.get('/my', requireAuth, async (req: AuthRequest, res: Response) => {
  const reviews = await prisma.deliveryReview.findMany({
    where: { userId: req.user!.userId },
    include: {
      order: { select: { id: true, deliveryAddress: true, deliveryMinutes: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ reviews });
});

// GET /api/delivery-reviews — все отзывы (админ)
router.get('/', requireAuth, requireAdmin, async (_req: AuthRequest, res: Response) => {
  const reviews = await prisma.deliveryReview.findMany({
    include: {
      user:  { select: { name: true, email: true } },
      order: { select: { id: true, deliveryAddress: true, deliveryMinutes: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const total = reviews.length;
  const avg   = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0.0';

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    rating: star,
    count:  reviews.filter((r) => r.rating === star).length,
  }));

  res.json({ reviews, stats: { total, avg, distribution } });
});

export default router;