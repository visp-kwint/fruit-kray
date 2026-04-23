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
  sort: z.enum(['popular', 'new', 'cheap', 'expensive', 'default']).optional().default('default'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

router.get('/', async (req: Request, res: Response) => {
  const parsed = FiltersSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Неверные параметры запроса' });
    return;
  }

  const { categorySlug, search, minPrice, maxPrice, sort, page, limit } = parsed.data;

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

  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = { createdAt: 'desc' };

  switch (sort) {
    case 'popular':
      orderBy = [{ isPopular: 'desc' }, { createdAt: 'desc' }];
      break;
    case 'new':
      orderBy = [{ isNew: 'desc' }, { createdAt: 'desc' }];
      break;
    case 'cheap':
      orderBy = { price: 'asc' };
      break;
    case 'expensive':
      orderBy = { price: 'desc' };
      break;
  }

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total, page, limit });
});

router.get('/admodal/by-product', async (req: Request, res: Response) => {
  const productId = req.query.productId as string | undefined;

  if (!productId) {
    res.status(400).json({ error: 'Укажите productId' });
    return;
  }

  const modal = await prisma.adModal.findFirst({
    where: {
      isActive: true,
      triggerProductId: productId,
    },
    include: {
      triggerProduct: true,
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