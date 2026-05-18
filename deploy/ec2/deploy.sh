#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-iox-exchange}"
APP_ROOT="${APP_ROOT:-/var/www/${APP_NAME}}"
RELEASES_DIR="${APP_ROOT}/releases"
SHARED_DIR="${APP_ROOT}/shared"
RELEASE_ID="$(date +%Y%m%d%H%M%S)"
NEW_RELEASE="${RELEASES_DIR}/${RELEASE_ID}"
BACKEND_ENV="${BACKEND_ENV:-${SHARED_DIR}/backend.env}"

if [[ ! -f "${BACKEND_ENV}" ]]; then
  echo "Missing backend env file: ${BACKEND_ENV}"
  echo "Create it from backend/.env.example before deploying."
  exit 1
fi

mkdir -p "${RELEASES_DIR}" "${SHARED_DIR}/logs" "${SHARED_DIR}/uploads"
mkdir -p "${NEW_RELEASE}"

cp -R backend frontend "${NEW_RELEASE}/"

cd "${NEW_RELEASE}/backend"
npm ci --omit=dev

rm -rf logs uploads .env
ln -s "${SHARED_DIR}/logs" logs
ln -s "${SHARED_DIR}/uploads" uploads
ln -s "${BACKEND_ENV}" .env

ln -sfn "${NEW_RELEASE}" "${APP_ROOT}/current"

pm2 describe "${APP_NAME}-backend" >/dev/null 2>&1 \
  && pm2 reload "${APP_NAME}-backend" --update-env \
  || pm2 start "${APP_ROOT}/current/backend/src/server.js" \
    --name "${APP_NAME}-backend" \
    --cwd "${APP_ROOT}/current/backend" \
    --time

pm2 save

find "${RELEASES_DIR}" -mindepth 1 -maxdepth 1 -type d | sort | head -n -5 | xargs -r rm -rf

echo "Deployed ${APP_NAME} release ${RELEASE_ID}"
