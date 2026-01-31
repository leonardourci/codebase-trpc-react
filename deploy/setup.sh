#!/bin/bash
set -e

# =============================================================================
# VPS Deploy Setup Script
#
# Usage:
#   chmod +x deploy/setup.sh
#   ./deploy/setup.sh <domain> <project_name>
#
# Example:
#   ./deploy/setup.sh meusite.com.br meusite
#
# Prerequisites:
#   - Ubuntu/Debian VPS with root or sudo access
#   - Domain pointing to VPS IP (DNS A record)
# =============================================================================

DOMAIN=${1:?"Usage: ./deploy/setup.sh <domain> <project_name>"}
PROJECT_NAME=${2:?"Usage: ./deploy/setup.sh <domain> <project_name>"}
PROJECT_DIR="/var/www/${PROJECT_NAME}"
CURRENT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "========================================="
echo " Deploy Setup"
echo " Domain:  ${DOMAIN}"
echo " Project: ${PROJECT_DIR}"
echo "========================================="

# --- 1. System dependencies ---
echo ""
echo "[1/8] Installing system dependencies..."
sudo apt update
sudo apt install -y curl gnupg2 ca-certificates lsb-release

# Node.js 20
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: $(node -v)"
fi

# PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
else
    echo "PostgreSQL already installed: $(psql --version)"
fi

# Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo apt install -y nginx
    sudo systemctl enable nginx
else
    echo "Nginx already installed: $(nginx -v 2>&1)"
fi

# PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    sudo npm install -g pm2
else
    echo "PM2 already installed: $(pm2 -v)"
fi

# --- 2. Project directory ---
echo ""
echo "[2/8] Setting up project directory at ${PROJECT_DIR}..."
sudo mkdir -p "${PROJECT_DIR}"
sudo chown -R "$USER:$USER" "${PROJECT_DIR}"

# Copy project files
echo "Copying project files..."
rsync -a --exclude='node_modules' --exclude='.git' --exclude='dist' \
    "${CURRENT_DIR}/" "${PROJECT_DIR}/"

# --- 3. Install dependencies ---
echo ""
echo "[3/8] Installing backend dependencies..."
cd "${PROJECT_DIR}/back-end"
npm ci --omit=dev

echo "Installing frontend dependencies..."
cd "${PROJECT_DIR}/front-end"
npm ci

# --- 4. Build backend ---
echo ""
echo "[4/8] Building backend..."
cd "${PROJECT_DIR}/back-end"
npm run build

# --- 5. Build frontend ---
echo ""
echo "[5/8] Building frontend..."
cd "${PROJECT_DIR}/front-end"
npm run build

# --- 6. Configure Nginx ---
echo ""
echo "[6/8] Configuring Nginx..."
NGINX_CONF="/etc/nginx/sites-available/${PROJECT_NAME}"

sudo cp "${PROJECT_DIR}/deploy/nginx/vps.conf" "${NGINX_CONF}"
sudo sed -i "s|YOUR_DOMAIN|${DOMAIN}|g" "${NGINX_CONF}"
sudo sed -i "s|YOUR_PROJECT_NAME|${PROJECT_NAME}|g" "${NGINX_CONF}"

# Enable site
sudo ln -sf "${NGINX_CONF}" "/etc/nginx/sites-enabled/${PROJECT_NAME}"

# Remove default if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# --- 7. Database migrations ---
echo ""
echo "[7/8] Running database migrations..."
cd "${PROJECT_DIR}/back-end"

if [ -f "${PROJECT_DIR}/.env.backend" ]; then
    export $(grep -v '^#' "${PROJECT_DIR}/.env.backend" | xargs)
fi

npx knex migrate:latest --knexfile dist/database/knexfile.js

# --- 8. Start with PM2 ---
echo ""
echo "[8/8] Starting application with PM2..."
cd "${PROJECT_DIR}"

# Update ecosystem config paths
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup | tail -1 | sudo bash || true

# --- Done ---
echo ""
echo "========================================="
echo " Deploy complete!"
echo "========================================="
echo ""
echo " App running at: http://${DOMAIN}"
echo " Project dir:    ${PROJECT_DIR}"
echo ""
echo " Next steps:"
echo "   1. Configure .env.backend at ${PROJECT_DIR}/.env.backend"
echo "   2. Setup PostgreSQL user and database"
echo "   3. Run SSL setup:"
echo "      sudo apt install certbot python3-certbot-nginx"
echo "      sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
echo " Useful commands:"
echo "   pm2 status        - check app status"
echo "   pm2 logs api      - view backend logs"
echo "   pm2 restart api   - restart backend"
echo "========================================="
