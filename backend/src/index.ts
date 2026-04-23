import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { cors } from './middleware/cors';
import { globalLimiter } from './middleware/rateLimit';
import { prisma } from './db';

import authRouter            from './routes/auth';
import categoriesRouter      from './routes/categories';
import productsRouter        from './routes/products';
import ordersRouter          from './routes/orders';
import usersRouter           from './routes/users';
import adminRouter           from './routes/admin';
import uploadRouter          from './routes/upload';
import reviewsRouter         from './routes/reviews';
import deliveryReviewsRouter from './routes/deliveryReviews';
import cartRouter            from './routes/cart';

const app  = express();
const PORT = process.env.PORT ?? 8080;

app.use(cors);
app.use(express.json({ limit: '10mb' }));
app.use(globalLimiter);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth',             authRouter);
app.use('/api/categories',       categoriesRouter);
app.use('/api/products',         productsRouter);
app.use('/api/orders',           ordersRouter);
app.use('/api/users',            usersRouter);
app.use('/api/admin',            adminRouter);
app.use('/api/upload',           uploadRouter);
app.use('/api/reviews',          reviewsRouter);
app.use('/api/delivery-reviews', deliveryReviewsRouter);
app.use('/api/cart',             cartRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: '🍒 Фрукт Край API' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('❌ Unhandled error:', err.message);
    res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
  }
);

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma подключена к БД');
    console.log('📁 DATABASE_URL =', process.env.DATABASE_URL);

    app.listen(PORT, () => {
      console.log(`\n🍒 Фрукт Край API запущен`);
      console.log(`   http://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error('❌ Ошибка запуска:', err);
    process.exit(1);
  }
}

start();

process.on('SIGINT',  () => prisma.$disconnect().then(() => process.exit(0)));
process.on('SIGTERM', () => prisma.$disconnect().then(() => process.exit(0)));