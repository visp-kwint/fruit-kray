#!/bin/bash
set -e

# Определяем директорию, где лежит этот скрипт
SCRIPT_DIR="$(cd "$(dirname "$0") && pwd)"

echo "Деплой Фрукт Край на fruitedge.ru..."
echo "Рабочая директория: $SCRIPT_DIR"

cd "$SCRIPT_DIR"

# Сбрасываем локальные изменения перед pull
echo "Сбрасываем локальные изменения..."
git reset --hard HEAD
git clean -fd
git pull origin main

# Backend
cd "$SCRIPT_DIR/backend"
echo "Устанавливаем зависимости backend..."
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run build
mkdir -p uploads
chmod 755 uploads

# Frontend
cd "$SCRIPT_DIR/frontend"
echo "Устанавливаем зависимости frontend..."
npm install
npm run build

# Restart
echo "Перезапускаем сервисы..."
systemctl restart fruit-kray
systemctl restart nginx

echo "Деплой завершён! https://fruitedge.ru"