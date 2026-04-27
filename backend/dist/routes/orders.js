"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const OrderItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'ID товара обязателен'),
    name: zod_1.z.string().min(1),
    price: zod_1.z.number().positive(),
    quantity: zod_1.z.number().int().positive(),
});
const CreateOrderSchema = zod_1.z.object({
    items: zod_1.z.array(OrderItemSchema).min(1, 'Корзина пуста'),
    deliveryAddress: zod_1.z.string().min(3, 'Укажите адрес доставки'),
    deliveryLat: zod_1.z.number().default(0),
    deliveryLng: zod_1.z.number().default(0),
});
// ── Границы Ростовской области (приблизительные) ─────────────────
const ROSTOV_BOUNDS = {
    minLat: 45.85,
    maxLat: 50.35,
    minLng: 38.05,
    maxLng: 43.35,
};
function isInRostovOblast(lat, lng) {
    return (lat >= ROSTOV_BOUNDS.minLat &&
        lat <= ROSTOV_BOUNDS.maxLat &&
        lng >= ROSTOV_BOUNDS.minLng &&
        lng <= ROSTOV_BOUNDS.maxLng);
}
router.post('/', auth_1.requireAuth, async (req, res) => {
    const parsed = CreateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
    }
    const { items, deliveryAddress, deliveryLat, deliveryLng } = parsed.data;
    const userId = req.user.userId;
    // ── Проверка: только Ростовская область ─────────────────────────
    if (!isInRostovOblast(deliveryLat, deliveryLng)) {
        res.status(400).json({
            error: 'Доставка возможна только в пределах Ростовской области',
        });
        return;
    }
    // ── Проверяем, что все товары из корзины ещё существуют в БД ──
    const productIds = items.map((i) => i.productId);
    const existingProducts = await db_1.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
    });
    const existingIds = new Set(existingProducts.map((p) => p.id));
    const missing = productIds.find((id) => !existingIds.has(id));
    if (missing) {
        res.status(400).json({
            error: 'Один из товаров в корзине больше не существует. Обновите корзину.',
        });
        return;
    }
    const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryMinutes = Math.floor(Math.random() * 51) + 10; // ← 10–60 мин
    const order = await db_1.prisma.$transaction(async (tx) => {
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
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                    })),
                },
            },
            include: { items: true },
        });
        await tx.user.update({
            where: { id: userId },
            data: { lastAddress: deliveryAddress, lastLat: deliveryLat, lastLng: deliveryLng },
        });
        return newOrder;
    });
    res.status(201).json({
        order,
        deliveryMinutes,
        message: 'Заказ оформлен! Ожидайте доставку.',
    });
});
router.get('/', auth_1.requireAuth, async (req, res) => {
    const orders = await db_1.prisma.order.findMany({
        where: { userId: req.user.userId },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
});
router.get('/frequent', auth_1.requireAuth, async (req, res) => {
    const userId = req.user.userId;
    const frequent = await db_1.prisma.orderItem.groupBy({
        by: ['productId', 'name', 'price'],
        where: { order: { userId } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 6,
    });
    const withImages = await Promise.all(frequent.map(async (item) => {
        const product = await db_1.prisma.product.findUnique({
            where: { id: item.productId },
            select: { imageUrl: true, category: true },
        });
        return {
            productId: item.productId,
            name: item.name,
            price: item.price,
            totalQty: item._sum.quantity ?? 0,
            imageUrl: product?.imageUrl ?? '',
            category: product?.category ?? '',
        };
    }));
    res.json({ frequentProducts: withImages });
});
exports.default = router;
//# sourceMappingURL=orders.js.map