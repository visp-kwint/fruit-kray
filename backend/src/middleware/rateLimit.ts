import rateLimit from 'express-rate-limit';

// ── Общий лимит ───────────────────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 минута
  max:      120,          // 120 запросов в минуту
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Слишком много запросов. Подождите минуту.' },
});

// ── Строгий лимит для auth-эндпоинтов ────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max:      10,              // 10 попыток
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
});