import corsLib from 'cors';

const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:3000';

export const cors = corsLib({
  origin:      CLIENT_URL,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});