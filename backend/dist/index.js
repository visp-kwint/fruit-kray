"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = require("./middleware/cors");
const rateLimit_1 = require("./middleware/rateLimit");
const db_1 = require("./db");
const auth_1 = __importDefault(require("./routes/auth"));
const categories_1 = __importDefault(require("./routes/categories"));
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const users_1 = __importDefault(require("./routes/users"));
const admin_1 = __importDefault(require("./routes/admin"));
const upload_1 = __importDefault(require("./routes/upload"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const deliveryReviews_1 = __importDefault(require("./routes/deliveryReviews"));
const cart_1 = __importDefault(require("./routes/cart"));
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT ?? 8080);
app.use(cors_1.cors);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(rateLimit_1.globalLimiter);
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.use('/api/auth', auth_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/products', products_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/users', users_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/delivery-reviews', deliveryReviews_1.default);
app.use('/api/cart', cart_1.default);
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Фрукт Край API' });
});
// Serve React build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(process.cwd(), '../frontend/build')));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(process.cwd(), '../frontend/build', 'index.html'));
    });
}
app.use((_req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
});
async function start() {
    try {
        await db_1.prisma.$connect();
        console.log('Prisma подключена к БД');
        console.log('DATABASE_URL =', process.env.DATABASE_URL);
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\nФрукт Край API запущен`);
            console.log(`   http://0.0.0.0:${PORT}\n`);
        });
    }
    catch (err) {
        console.error('Ошибка запуска:', err);
        process.exit(1);
    }
}
start();
process.on('SIGINT', () => db_1.prisma.$disconnect().then(() => process.exit(0)));
process.on('SIGTERM', () => db_1.prisma.$disconnect().then(() => process.exit(0)));
//# sourceMappingURL=index.js.map