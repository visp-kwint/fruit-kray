#!/bin/bash
set -e

# Определяем директорию, где лежит этот скрипт
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Деплой Фрукт Край на fruitedge.ru..."
echo "📁 Рабочая директория: $SCRIPT_DIR"

cd "$SCRIPT_DIR"
git pull origin main

# Backend
cd "$SCRIPT_DIR/backend"
npm ci
npx prisma generate
npx prisma db push --accept-data-loss
npm run build
mkdir -p uploads
chmod 755 uploads

# Frontend
cd "$SCRIPT_DIR/frontend"
npm ci
npm run build

# Restart
systemctl restart fruit-kray
systemctl restart nginx

echo "✅ Деплой завершён! https://fruitedge.ru"