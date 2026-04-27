"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function slugify(input) {
    const map = {
        а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
        и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
        с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
        ь: '', ы: 'y', ъ: '', э: 'e', ю: 'yu', я: 'ya',
    };
    return input
        .toLowerCase()
        .trim()
        .split('')
        .map((ch) => map[ch] ?? ch)
        .join('')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
router.get('/', async (_req, res) => {
    const categories = await db_1.prisma.category.findMany({
        orderBy: { name: 'asc' },
    });
    res.json(categories);
});
router.post('/', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    const Schema = zod_1.z.object({
        name: zod_1.z.string().min(2, 'Название слишком короткое'),
    });
    const parsed = Schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
    }
    const name = parsed.data.name.trim();
    const slug = slugify(name);
    const exists = await db_1.prisma.category.findFirst({
        where: {
            OR: [{ name }, { slug }],
        },
    });
    if (exists) {
        res.status(409).json({ error: 'Такая категория уже существует' });
        return;
    }
    const category = await db_1.prisma.category.create({
        data: { name, slug },
    });
    res.status(201).json(category);
});
router.delete('/:id', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        await db_1.prisma.category.delete({ where: { id: req.params.id } });
        res.json({ message: 'Категория удалена' });
    }
    catch {
        res.status(400).json({ error: 'Нельзя удалить категорию, если к ней привязаны товары' });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map