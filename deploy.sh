#!/bin/bash
set -e

PROJECT_DIR="/root/fruit-kray"
echo "🚀 Деплой Фрукт Край на fruitedge.ru..."

cd "$PROJECT_DIR"
git pull origin main

# Backend
cd "$PROJECT_DIR/backend"
npm ci
npx prisma generate
npx prisma db push --accept-data-loss
npm run build
mkdir -p uploads
chmod 755 uploads

# Frontend
cd "$PROJECT_DIR/frontend"
npm ci
npm run build

# Restart
systemctl restart fruit-kray
systemctl restart nginx

echo "✅ Деплой завершён! https://fruitedge.ru"