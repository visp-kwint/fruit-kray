"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const CreateSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1, 'Укажите заказ'),
    rating: zod_1.z.coerce.number().int().min(1).max(5, 'Рейтинг 1–5'),
    comment: zod_1.z.string().min(1, 'Напишите комментарий').max(1000),
});
// POST /api/delivery-reviews
router.post('/', auth_1.requireAuth, async (req, res) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
    }
    const { orderId, rating, comment } = parsed.data;
    const userId = req.user.userId;
    const order = await db_1.prisma.order.findFirst({
        where: { id: orderId, userId },
    });
    if (!order) {
        res.status(403).json({ error: 'Заказ не найден' });
        return;
    }
    const existing = await db_1.prisma.deliveryReview.findUnique({
        where: { orderId },
    });
    if (existing) {
        res.status(409).json({ error: 'Вы уже оставили отзыв на эту доставку' });
        return;
    }
    // Создаём отзыв и меняем статус заказа на DONE
    const [review] = await db_1.prisma.$transaction([
        db_1.prisma.deliveryReview.create({
            data: { orderId, userId, rating, comment },
            include: {
                user: { select: { name: true, email: true } },
                order: { select: { id: true, deliveryAddress: true, deliveryMinutes: true } },
            },
        }),
        db_1.prisma.order.update({
            where: { id: orderId },
            data: { status: 'DONE' },
        }),
    ]);
    res.status(201).json(review);
});
// GET /api/delivery-reviews/my — мои отзывы
router.get('/my', auth_1.requireAuth, async (req, res) => {
    const reviews = await db_1.prisma.deliveryReview.findMany({
        where: { userId: req.user.userId },
        include: {
            order: { select: { id: true, deliveryAddress: true, deliveryMinutes: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
});
// GET /api/delivery-reviews — все отзывы (админ)
router.get('/', auth_1.requireAuth, auth_1.requireAdmin, async (_req, res) => {
    const reviews = await db_1.prisma.deliveryReview.findMany({
        include: {
            user: { select: { name: true, email: true } },
            order: { select: { id: true, deliveryAddress: true, deliveryMinutes: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    const total = reviews.length;
    const avg = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0.0';
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
        rating: star,
        count: reviews.filter((r) => r.rating === star).length,
    }));
    res.json({ reviews, stats: { total, avg, distribution } });
});
exports.default = router;
//# sourceMappingURL=deliveryReviews.js.map