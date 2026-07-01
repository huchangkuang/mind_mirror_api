#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

APP_NAME="${APP_NAME:-mind-mirror-api}"
NODE_ENV="${NODE_ENV:-production}"
PRUNE_DEV="${PRUNE_DEV:-true}"

echo "==> Deploying ${APP_NAME} (NODE_ENV=${NODE_ENV})..."

if [[ ! -f .env ]]; then
  echo "Error: .env not found. Copy .env.example to .env and configure it first."
  exit 1
fi

echo "==> Installing dependencies..."
npm ci

echo "==> Generating Prisma client..."
npm run prisma:generate

echo "==> Applying database migrations..."
npm run prisma:migrate:deploy

echo "==> Building application..."
npm run build

if [[ "${PRUNE_DEV}" == "true" ]]; then
  echo "==> Pruning dev dependencies..."
  npm prune --omit=dev
fi

if command -v pm2 >/dev/null 2>&1; then
  echo "==> Restarting with PM2..."
  if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
    pm2 restart "${APP_NAME}" --update-env
  else
    pm2 start dist/main.js --name "${APP_NAME}" --env "${NODE_ENV}"
  fi
  pm2 save
else
  echo "==> Build complete. Start manually with:"
  echo "    NODE_ENV=${NODE_ENV} npm start"
fi

echo "==> Deploy finished."
