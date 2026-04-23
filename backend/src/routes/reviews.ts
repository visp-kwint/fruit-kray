import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const CreateReviewSchema = z.object({
  productId: z.string().min(1, 'Укажите товар'),
  orderId:   z.string().min(1, 'Укажите заказ'),
  rating:    z.coerce.number().int().min(1).max(5, 'Рейтинг от 1 до 5'),
  comment:   z.string().min(1, 'Напишите текст отзыва').max(1000, 'Максимум 1000 символов'),
});

// POST /api/reviews — создать отзыв
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = CreateReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const { productId, orderId, rating, comment } = parsed.data;
  const userId = req.user!.userId;

  // Проверяем, что заказ выполнен и принадлежит пользователю
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: 'DONE' },
    include: { items: true },
  });

  if (!order) {
    res.status(403).json({ error: 'Заказ не найден или ещё не выполнен' });
    return;
  }

  // Проверяем, что товар был в заказе
  const hasProduct = order.items.some((item) => item.productId === productId);
  if (!hasProduct) {
    res.status(400).json({ error: 'Этого товара не было в заказе' });
    return;
  }

  // Проверяем, не оставлял ли уже отзыв
  const existing = await prisma.review.findUnique({
    where: {
      user_product_order_unique: {
        userId,
        productId,
        orderId,
      },
    },
  });

  if (existing) {
    res.status(409).json({ error: 'Вы уже оставили отзыв на этот товар из этого заказа' });
    return;
  }

  const review = await prisma.review.create({
    data: { userId, productId, orderId, rating, comment },
    include: {
      user:    { select: { name: true, email: true } },
      product: { select: { name: true, imageUrl: true } },
      order:   { select: { id: true } },
    },
  });

  res.status(201).json(review);
});

// GET /api/reviews/my — мои отзывы
router.get('/my', requireAuth, async (req: AuthRequest, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { userId: req.user!.userId },
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
      order:   { select: { id: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ reviews });
});

// GET /api/reviews/product/:productId — отзывы на товар
router.get('/product/:productId', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { productId: req.params.productId },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ reviews });
});

export default router;