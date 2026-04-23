import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const CartItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  imageUrl: z.string().default(''),
  categoryName: z.string().default(''),
  categorySlug: z.string().default(''),
});

const SyncSchema = z.object({
  items: z.array(CartItemSchema),
});

// GET /api/cart
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ items });
});

// PUT /api/cart — полная синхронизация
router.put('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = SyncSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Неверные данные корзины' });
    return;
  }

  const userId = req.user!.userId;
  const { items } = parsed.data;

  // Проверяем, что все товары существуют в БД
  const productIds = items.map((i) => i.productId);
  if (productIds.length > 0) {
    const existing = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const existingIds = new Set(existing.map((p) => p.id));
    const missing = productIds.find((id) => !existingIds.has(id));
    if (missing) {
      res.status(400).json({ error: 'Товар в корзине больше не существует. Обновите корзину.' });
      return;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({ where: { userId } });
    if (items.length > 0) {
      await tx.cartItem.createMany({
        data: items.map((item) => ({
          userId,
          ...item,
        })),
      });
    }
  });

  const updated = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });

  res.json({ items: updated });
});

// DELETE /api/cart/:productId
router.delete('/:productId', requireAuth, async (req: AuthRequest, res: Response) => {
  await prisma.cartItem.deleteMany({
    where: {
      userId: req.user!.userId,
      productId: req.params.productId,
    },
  });
  res.json({ message: 'Удалено' });
});

// DELETE /api/cart — очистить всё
router.delete('/', requireAuth, async (req: AuthRequest, res: Response) => {
  await prisma.cartItem.deleteMany({
    where: { userId: req.user!.userId },
  });
  res.json({ message: 'Корзина очищена' });
});

export default router;