"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ── GET /api/users/profile ─────────────────────────────────────────
router.get('/profile', auth_1.requireAuth, async (req, res) => {
    const user = await db_1.prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            lastAddress: true,
            lastLat: true,
            lastLng: true,
            createdAt: true,
        },
    });
    if (!user) {
        res.status(401).json({ error: 'Пользователь не найден' });
        return;
    }
    res.json(user);
});
// ── PUT /api/users/profile ─────────────────────────────────────────
const UpdateSchema = zod_1.z.object({
    email: zod_1.z.string().email('Неверный email').optional(),
    name: zod_1.z.string().min(1, 'Имя не может быть пустым').max(100, 'Максимум 100 символов').optional(),
    password: zod_1.z.string().min(6, 'Пароль минимум 6 символов').optional(),
}).refine((data) => data.email !== undefined || data.name !== undefined || data.password !== undefined, { message: 'Укажите хотя бы одно поле для изменения' });
router.put('/profile', auth_1.requireAuth, async (req, res) => {
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
    }
    const { email, name, password } = parsed.data;
    const updateData = {};
    if (email) {
        const existing = await db_1.prisma.user.findUnique({ where: { email } });
        if (existing && existing.id !== req.user.userId) {
            res.status(409).json({ error: 'Email уже используется' });
            return;
        }
        updateData.email = email;
    }
    if (name !== undefined) {
        updateData.name = name;
    }
    if (password) {
        updateData.passwordHash = await bcryptjs_1.default.hash(password, 10);
    }
    await db_1.prisma.user.update({
        where: { id: req.user.userId },
        data: updateData,
    });
    res.json({ message: 'Профиль успешно обновлён' });
});
exports.default = router;
//# sourceMappingURL=users.js.map