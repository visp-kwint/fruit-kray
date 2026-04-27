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
const rateLimit_1 = require("../middleware/rateLimit");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email('Неверный формат email'),
    password: zod_1.z.string().min(6, 'Пароль минимум 6 символов'),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Неверный формат email'),
    password: zod_1.z.string().min(1, 'Пароль обязателен'),
});
router.post('/register', rateLimit_1.authLimiter, async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
    }
    const { email, password } = parsed.data;
    const existing = await db_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        res.status(409).json({ error: 'Email уже используется' });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await db_1.prisma.user.create({
        data: {
            email,
            passwordHash,
            role: types_1.Role.USER,
        },
        select: {
            id: true,
            email: true,
            role: true,
        },
    });
    const token = (0, auth_1.signToken)({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    res.status(201).json({ token, user });
});
router.post('/login', rateLimit_1.authLimiter, async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0]?.message });
        return;
    }
    const { email, password } = parsed.data;
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ error: 'Неверный email или пароль' });
        return;
    }
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ error: 'Неверный email или пароль' });
        return;
    }
    const token = (0, auth_1.signToken)({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            lastAddress: user.lastAddress,
            lastLat: user.lastLat,
            lastLng: user.lastLng,
        },
    });
});
exports.default = router;
//# sourceMappingURL=auth.js.map