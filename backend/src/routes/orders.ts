import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

const OrderItemSchema = z.object({
  productId: z.string().min(1, 'ID товара обязателен'),
  name:      z.string().min(1),
  price:     z.number().positive(),
  quantity:  z.number().int().positive(),
});

const CreateOrderSchema = z.object({
  items:           z.array(OrderItemSchema).min(1, 'Корзина пуста'),
  deliveryAddress: z.string().min(3, 'Укажите адрес доставки'),
  deliveryLat:     z.number().default(0),
  deliveryLng:     z.number().default(0),
});

// ── POST /api/orders ───────────────────────────────────────────────
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = CreateOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0]?.message });
    return;
  }

  const { items, deliveryAddress, deliveryLat, deliveryLng } = parsed.data;
  const userId = req.user!.userId;

  const totalPrice      = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryMinutes = Math.floor(Math.random() * 56) + 5;

  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        totalPrice,
        status: 'PENDING',
        deliveryAddress,
        deliveryLat,
        deliveryLng,
        deliveryMinutes,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name:      item.name,
            price:     item.price,
            quantity:  item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    await tx.user.update({
      where: { id: userId },
      data:  { lastAddress: deliveryAddress, lastLat: deliveryLat, lastLng: deliveryLng },
    });

    return newOrder;
  });

  res.status(201).json({
    order,
    deliveryMinutes,
    message: 'Заказ оформлен! Ожидайте доставку.',
  });
});

// ── GET /api/orders ────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where:   { userId: req.user!.userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ orders });
});

// ── GET /api/orders/frequent ───────────────────────────────────────
router.get('/frequent', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  const frequent = await prisma.orderItem.groupBy({
    by:      ['productId', 'name', 'price'],
    where:   { order: { userId } },
    _sum:    { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take:    6,
  });

  const withImages = await Promise.all(
    frequent.map(async (item) => {
      const product = await prisma.product.findUnique({
        where:  { id: item.productId },
        select: { imageUrl: true, category: true },
      });
      return {
        productId: item.productId,
        name:      item.name,
        price:     item.price,
        totalQty:  item._sum.quantity ?? 0,
        imageUrl:  product?.imageUrl  ?? '',
        category:  product?.category  ?? '',
      };
    }),
  );

  res.json({ frequentProducts: withImages });
});

export default router;