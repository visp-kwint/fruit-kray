import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();
router.use(requireAuth, requireAdmin);

const ProductSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().default(''),
  details: z.string().default(''),
  price: z.coerce.number().positive('Цена должна быть положительной'),
  imageUrl: z.string().default(''),
  categoryId: z.string().min(1, 'Категория обязательна'),
  stock: z.coerce.number().int().nonnegative().default(0),
  isNew: z.boolean().default(false),
  isDiscount: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  isDayItem: z.boolean().default(false),
});

const AdModalSchema = z.object({
  triggerProductId: z.string().min(1, 'Товар-триггер обязателен'),
  title: z.string().min(1, 'Заголовок обязателен'),
  description: z.string().default(''),
  productId: z.string().min(1, 'Товар обязателен'),
  isActive: z.boolean().default(true),
});

router.post('/products', async (req: AuthRequest, res: Response) => {
  const parsed = ProductSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });

  if (!category) {
    res.status(404).json({ error: 'Категория не найдена' });
    return;
  }

  const product = await prisma.product.create({
    data: parsed.data,
    include: { category: true },
  });

  res.status(201).json(product);
});

router.put('/products/:id', async (req: AuthRequest, res: Response) => {
  const parsed = ProductSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const exists = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!exists) {
    res.status(404).json({ error: 'Товар не найден' });
    return;
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
    });

    if (!category) {
      res.status(404).json({ error: 'Категория не найдена' });
      return;
    }
  }

  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { category: true },
  });

  res.json(updated);
});

router.delete('/products/:id', async (req: AuthRequest, res: Response) => {
  const exists = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!exists) {
    res.status(404).json({ error: 'Товар не найден' });
    return;
  }

  await prisma.product.delete({ where: { id: req.params.id } });
  res.json({ message: 'Товар удалён' });
});

router.get('/admodals', async (_req: AuthRequest, res: Response) => {
  const modals = await prisma.adModal.findMany({
    include: {
      triggerProduct: true,
      product: {
        include: { category: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(modals);
});

router.post('/admodals', async (req: AuthRequest, res: Response) => {
  const parsed = AdModalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const triggerProduct = await prisma.product.findUnique({
    where: { id: parsed.data.triggerProductId },
  });
  if (!triggerProduct) {
    res.status(404).json({ error: 'Товар-триггер не найден' });
    return;
  }

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!product) {
    res.status(404).json({ error: 'Рекламируемый товар не найден' });
    return;
  }

  const modal = await prisma.adModal.create({
    data: parsed.data,
    include: {
      triggerProduct: true,
      product: { include: { category: true } },
    },
  });

  res.status(201).json(modal);
});

router.delete('/admodals/:id', async (req: AuthRequest, res: Response) => {
  const exists = await prisma.adModal.findUnique({ where: { id: req.params.id } });
  if (!exists) {
    res.status(404).json({ error: 'Попап не найден' });
    return;
  }

  await prisma.adModal.delete({ where: { id: req.params.id } });
  res.json({ message: 'Попап удалён' });
});

export default router;