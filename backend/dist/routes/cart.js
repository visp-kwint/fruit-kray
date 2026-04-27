"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const CartItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    price: zod_1.z.number().positive(),
    quantity: zod_1.z.number().int().positive(),
    imageUrl: zod_1.z.string().default(''),
    categoryName: zod_1.z.string().default(''),
    categorySlug: zod_1.z.string().default(''),
});
const SyncSchema = zod_1.z.object({
    items: zod_1.z.array(CartItemSchema),
});
// GET /api/cart
router.get('/', auth_1.requireAuth, async (req, res) => {
    const items = await db_1.prisma.cartItem.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'asc' },
    });
    res.json({ items });
});
// PUT /api/cart — полная синхронизация
router.put('/', auth_1.requireAuth, async (req, res) => {
    const parsed = SyncSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Неверные данные корзины' });
        return;
    }
    const userId = req.user.userId;
    const { items } = parsed.data;
    // Проверяем, что все товары существуют в БД
    const productIds = items.map((i) => i.productId);
    if (productIds.length > 0) {
        const existing = await db_1.prisma.product.findMany({
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
    await db_1.prisma.$transaction(async (tx) => {
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
    const updated = await db_1.prisma.cartItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
    });
    res.json({ items: updated });
});
// DELETE /api/cart/:productId
router.delete('/:productId', auth_1.requireAuth, async (req, res) => {
    await db_1.prisma.cartItem.deleteMany({
        where: {
            userId: req.user.userId,
            productId: req.params.productId,
        },
    });
    res.json({ message: 'Удалено' });
});
// DELETE /api/cart — очистить всё
router.delete('/', auth_1.requireAuth, async (req, res) => {
    await db_1.prisma.cartItem.deleteMany({
        where: { userId: req.user.userId },
    });
    res.json({ message: 'Корзина очищена' });
});
exports.default = router;
//# sourceMappingURL=cart.js.map