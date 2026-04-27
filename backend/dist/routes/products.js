"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const router = (0, express_1.Router)();
const FiltersSchema = zod_1.z.object({
    categorySlug: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    minPrice: zod_1.z.coerce.number().nonnegative().optional(),
    maxPrice: zod_1.z.coerce.number().nonnegative().optional(),
    sort: zod_1.z.enum(['popular', 'new', 'cheap', 'expensive', 'default']).optional().default('default'),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(200).default(20),
});
router.get('/', async (req, res) => {
    const parsed = FiltersSchema.safeParse(req.query);
    if (!parsed.success) {
        res.status(400).json({ error: 'Неверные параметры запроса' });
        return;
    }
    const { categorySlug, search, minPrice, maxPrice, sort, page, limit } = parsed.data;
    const where = {
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
    let orderBy = { createdAt: 'desc' };
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
        db_1.prisma.product.findMany({
            where,
            include: { category: true },
            skip,
            take: limit,
            orderBy,
        }),
        db_1.prisma.product.count({ where }),
    ]);
    res.json({ products, total, page, limit });
});
router.get('/admodal/by-product', async (req, res) => {
    const productId = req.query.productId;
    if (!productId) {
        res.status(400).json({ error: 'Укажите productId' });
        return;
    }
    const modal = await db_1.prisma.adModal.findFirst({
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
router.get('/:id', async (req, res) => {
    const product = await db_1.prisma.product.findUnique({
        where: { id: req.params.id },
        include: { category: true },
    });
    if (!product) {
        res.status(404).json({ error: 'Товар не найден' });
        return;
    }
    res.json(product);
});
exports.default = router;
//# sourceMappingURL=products.js.map