"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.requireAuth, auth_1.requireAdmin);
const ProductSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Название обязательно'),
    description: zod_1.z.string().default(''),
    details: zod_1.z.string().default(''),
    price: zod_1.z.coerce.number().positive('Цена должна быть положительной'),
    imageUrl: zod_1.z.string().default(''),
    categoryId: zod_1.z.string().min(1, 'Категория обязательна'),
    stock: zod_1.z.coerce.number().int().nonnegative().default(0),
    isNew: zod_1.z.boolean().default(false),
    isDiscount: zod_1.z.boolean().default(false),
    isPopular: zod_1.z.boolean().default(false),
    isDayItem: zod_1.z.boolean().default(false),
});
const AdModalSchema = zod_1.z.object({
    triggerProductId: zod_1.z.string().min(1, 'Товар-триггер обязателен'),
    title: zod_1.z.string().min(1, 'Заголовок обязателен'),
    description: zod_1.z.string().default(''),
    productId: zod_1.z.string().min(1, 'Товар обязателен'),
    isActive: zod_1.z.boolean().default(true),
});
router.post('/products', async (req, res) => {
    const parsed = ProductSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
    }
    const category = await db_1.prisma.category.findUnique({
        where: { id: parsed.data.categoryId },
    });
    if (!category) {
        res.status(404).json({ error: 'Категория не найдена' });
        return;
    }
    const product = await db_1.prisma.product.create({
        data: parsed.data,
        include: { category: true },
    });
    res.status(201).json(product);
});
router.put('/products/:id', async (req, res) => {
    const parsed = ProductSchema.partial().safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
    }
    const exists = await db_1.prisma.product.findUnique({ where: { id: req.params.id } });
    if (!exists) {
        res.status(404).json({ error: 'Товар не найден' });
        return;
    }
    if (parsed.data.categoryId) {
        const category = await db_1.prisma.category.findUnique({
            where: { id: parsed.data.categoryId },
        });
        if (!category) {
            res.status(404).json({ error: 'Категория не найдена' });
            return;
        }
    }
    const updated = await db_1.prisma.product.update({
        where: { id: req.params.id },
        data: parsed.data,
        include: { category: true },
    });
    res.json(updated);
});
router.delete('/products/:id', async (req, res) => {
    const exists = await db_1.prisma.product.findUnique({ where: { id: req.params.id } });
    if (!exists) {
        res.status(404).json({ error: 'Товар не найден' });
        return;
    }
    await db_1.prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Товар удалён' });
});
router.get('/admodals', async (_req, res) => {
    const modals = await db_1.prisma.adModal.findMany({
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
router.post('/admodals', async (req, res) => {
    const parsed = AdModalSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
    }
    const triggerProduct = await db_1.prisma.product.findUnique({
        where: { id: parsed.data.triggerProductId },
    });
    if (!triggerProduct) {
        res.status(404).json({ error: 'Товар-триггер не найден' });
        return;
    }
    const product = await db_1.prisma.product.findUnique({
        where: { id: parsed.data.productId },
    });
    if (!product) {
        res.status(404).json({ error: 'Рекламируемый товар не найден' });
        return;
    }
    const modal = await db_1.prisma.adModal.create({
        data: parsed.data,
        include: {
            triggerProduct: true,
            product: { include: { category: true } },
        },
    });
    res.status(201).json(modal);
});
router.delete('/admodals/:id', async (req, res) => {
    const exists = await db_1.prisma.adModal.findUnique({ where: { id: req.params.id } });
    if (!exists) {
        res.status(404).json({ error: 'Попап не найден' });
        return;
    }
    await db_1.prisma.adModal.delete({ where: { id: req.params.id } });
    res.json({ message: 'Попап удалён' });
});
exports.default = router;
//# sourceMappingURL=admin.js.map