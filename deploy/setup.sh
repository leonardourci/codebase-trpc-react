#!/bin/bash
set -e

# Usage:   ./deploy/setup.sh <domain> <port>
# Example: ./deploy/setup.sh meusite.com.br 3000
#
# Each project needs a unique port for its backend (3000, 3001, 3002...).
# Prerequisites: Ubuntu/Debian VPS, domain A record pointing to this machine.

DOMAIN=${1:?"Usage: ./deploy/setup.sh <domain> <port>"}
PORT=${2:?"Usage: ./deploy/setup.sh <domain> <port>"}
CURRENT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_NAME="$(basename "${CURRENT_DIR}")"
PROJECT_DIR="/var/www/${PROJECT_NAME}"

echo "Domain:  ${DOMAIN}"
echo "Port:    ${PORT}"
echo "Project: ${PROJECT_DIR}"

# --- Install system dependencies (skips if already installed) ---

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi

if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
fi

if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# --- Copy project to /var/www ---

sudo mkdir -p "${PROJECT_DIR}"
sudo chown -R "$USER:$USER" "${PROJECT_DIR}"
rsync -a --exclude='node_modules' --exclude='.git' --exclude='dist' \
    "${CURRENT_DIR}/" "${PROJECT_DIR}/"

# --- Install dependencies and build ---

cd "${PROJECT_DIR}/back-end" && npm ci --omit=dev && npm run build
cd "${PROJECT_DIR}/front-end" && npm ci && npm run build

# --- Configure Nginx ---

NGINX_CONF="/etc/nginx/sites-available/${PROJECT_NAME}"
sudo cp "${PROJECT_DIR}/deploy/nginx/vps.conf" "${NGINX_CONF}"
sudo sed -i "s|YOUR_DOMAIN|${DOMAIN}|g"       "${NGINX_CONF}"
sudo sed -i "s|YOUR_PROJECT_NAME|${PROJECT_NAME}|g" "${NGINX_CONF}"
sudo sed -i "s|YOUR_PORT|${PORT}|g"            "${NGINX_CONF}"

sudo ln -sf "${NGINX_CONF}" "/etc/nginx/sites-enabled/${PROJECT_NAME}"
sudo nginx -t && sudo systemctl reload nginx

# --- Run database migrations ---

cd "${PROJECT_DIR}/back-end"
[ -f "${PROJECT_DIR}/.env.backend" ] && export $(grep -v '^#' "${PROJECT_DIR}/.env.backend" | xargs)
npx knex migrate:latest --knexfile dist/database/knexfile.js

# --- Start with PM2 ---

cd "${PROJECT_DIR}"
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup | tail -1 | sudo bash || true

echo ""
echo "Done. Running at http://${DOMAIN}"
echo "Next: set up .env.backend, create the PostgreSQL database, then run certbot for HTTPS."
