import corsLib from 'cors';

const allowedOrigins = [
  'https://fruitedge.ru',
  'http://fruitedge.ru',
  'http://localhost:3000',
];

export const cors = corsLib({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});