"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const JWT_SECRET = process.env.JWT_SECRET ?? 'fallback-secret-change-this';
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '72h' });
}
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Требуется авторизация' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(header.slice(7), JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ error: 'Недействительный или истёкший токен' });
    }
}
function requireAdmin(req, res, next) {
    const role = req.user?.role;
    if (role !== types_1.Role.ADMIN && role !== types_1.Role.MODERATOR) {
        res.status(403).json({ error: 'Доступ запрещён' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map