#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-iox-exchange}"
APP_ROOT="${APP_ROOT:-/var/www/${APP_NAME}}"
DOMAIN="${DOMAIN:-example.com}"
NODE_MAJOR="${NODE_MAJOR:-20}"

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg nginx

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo npm install -g pm2

sudo mkdir -p "${APP_ROOT}/shared/logs" "${APP_ROOT}/shared/uploads" "${APP_ROOT}/releases"
sudo chown -R "$USER:$USER" "${APP_ROOT}"

sudo cp "$(dirname "$0")/nginx.conf" "/etc/nginx/sites-available/${APP_NAME}"
sudo sed -i "s/__DOMAIN__/${DOMAIN}/g; s#__APP_ROOT__#${APP_ROOT}#g" "/etc/nginx/sites-available/${APP_NAME}"
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sfn "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
sudo nginx -t
sudo systemctl reload nginx

pm2 startup systemd -u "$USER" --hp "$HOME" || true

cat <<EOF
Bootstrap complete.

Next:
1. Create ${APP_ROOT}/shared/backend.env with production backend environment variables.
2. Add GitHub Actions secrets.
3. Push to main or run the Deploy to AWS EC2 workflow manually.
EOF
