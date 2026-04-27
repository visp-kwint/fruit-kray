"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLimiter = exports.globalLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// ── Общий лимит ───────────────────────────────────────────────────
exports.globalLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 минута
    max: 120, // 120 запросов в минуту
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Слишком много запросов. Подождите минуту.' },
});
// ── Строгий лимит для auth-эндпоинтов ────────────────────────────
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 10, // 10 попыток
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
});
//# sourceMappingURL=rateLimit.js.map