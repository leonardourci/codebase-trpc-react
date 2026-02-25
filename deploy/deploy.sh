#!/bin/bash
set -e

# Requires on the VPS: Node.js 20, Nginx, PM2, PostgreSQL
# (install those once manually on the machine, not per project)
#
# First deploy:  ./deploy/deploy.sh <domain>
# Updates:       ./deploy/deploy.sh

PROJECT_DIR="/var/www/$(basename "$(cd "$(dirname "$0")/.." && pwd)")"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
DOMAIN="${1:-}"

# Build
echo "[1/3] Building..."
cd "$PROJECT_DIR/back-end" && npm ci --omit=dev && npm run build
cd "$PROJECT_DIR/front-end" && npm ci && npm run build

# Migrate
echo "[2/3] Running migrations..."
set -a; source "$PROJECT_DIR/.env.backend"; set +a
cd "$PROJECT_DIR/back-end" && npx knex migrate:latest --knexfile dist/database/knexfile.js

# Nginx — only on first deploy when domain is provided
if [ -n "$DOMAIN" ]; then
  echo "Configuring Nginx for $DOMAIN..."
  CONF="/etc/nginx/sites-available/$PROJECT_NAME"
  sudo cp "$PROJECT_DIR/deploy/nginx.conf" "$CONF"
  sudo sed -i "s|YOUR_DOMAIN|$DOMAIN|g" "$CONF"
  sudo sed -i "s|YOUR_PROJECT_NAME|$PROJECT_NAME|g" "$CONF"
  sudo ln -sf "$CONF" "/etc/nginx/sites-enabled/$PROJECT_NAME"
  sudo nginx -t && sudo systemctl reload nginx
fi

# PM2
echo "[3/3] Starting/restarting API..."
cd "$PROJECT_DIR" && pm2 startOrRestart deploy/ecosystem.config.cjs && pm2 save

echo "Done. App running at ${DOMAIN:-$PROJECT_NAME}."
