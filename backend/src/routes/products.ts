import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { Prisma } from '@prisma/client';

const router = Router();

const FiltersSchema = z.object({
  categorySlug: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),  // ← max: 200
});

router.get('/', async (req: Request, res: Response) => {
  const parsed = FiltersSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Неверные параметры запроса' });
    return;
  }

  const { categorySlug, search, minPrice, maxPrice, page, limit } = parsed.data;

  const where: Prisma.ProductWhereInput = {
    ...(categorySlug && {
      category: { slug: categorySlug },
    }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
        { details: { contains: search } },
      ],
    }),
    ...((minPrice !== undefined || maxPrice !== undefined) && {
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    }),
  };

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total, page, limit });
});

router.get('/admodal/by-category', async (req: Request, res: Response) => {
  const categoryId = req.query.categoryId as string | undefined;
  const categorySlug = req.query.categorySlug as string | undefined;

  if (!categoryId && !categorySlug) {
    res.status(400).json({ error: 'Укажите categoryId или categorySlug' });
    return;
  }

  const modal = await prisma.adModal.findFirst({
    where: {
      isActive: true,
      ...(categoryId
        ? { triggerCategoryId: categoryId }
        : { triggerCategory: { slug: categorySlug! } }),
    },
    include: {
      triggerCategory: true,
      product: {
        include: { category: true },
      },
    },
  });

  if (!modal) {
    res.status(404).json({ error: 'Активный попап не найден' });
    return;
  }

  res.json(modal);
});

router.get('/:id', async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });

  if (!product) {
    res.status(404).json({ error: 'Товар не найден' });
    return;
  }

  res.json(product);
});

export default router;