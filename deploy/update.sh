#!/bin/bash
set -e

# =============================================================================
# VPS Update Script - redeploy after code changes
#
# Usage:
#   ./deploy/update.sh <project_name>
#
# Example:
#   ./deploy/update.sh meusite
# =============================================================================

PROJECT_NAME=${1:?"Usage: ./deploy/update.sh <project_name>"}
PROJECT_DIR="/var/www/${PROJECT_NAME}"

echo "========================================="
echo " Updating ${PROJECT_NAME}"
echo "========================================="

# Backend
echo ""
echo "[1/4] Building backend..."
cd "${PROJECT_DIR}/back-end"
npm ci --omit=dev
npm run build

# Migrations
echo ""
echo "[2/4] Running migrations..."
if [ -f "${PROJECT_DIR}/.env.backend" ]; then
    export $(grep -v '^#' "${PROJECT_DIR}/.env.backend" | xargs)
fi
npx knex migrate:latest --knexfile dist/database/knexfile.js

# Frontend
echo ""
echo "[3/4] Building frontend..."
cd "${PROJECT_DIR}/front-end"
npm ci
npm run build

# Restart
echo ""
echo "[4/4] Restarting API..."
pm2 restart api

echo ""
echo " Update complete! App is running."
