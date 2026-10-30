#!/bin/sh
set -eu

config_file="/usr/share/nginx/html/assets/assets/config/app-config.json"

cat > "$config_file" <<EOF
{
  "apiUrl": "${APP_API_URL:-${GESTORIA_API_URL:-}}",
  "keycloakUrl": "${APP_KEYCLOAK_URL:-${GESTORIA_KEYCLOAK_URL:-http://localhost:8081}}",
  "keycloakRealm": "${APP_KEYCLOAK_REALM:-${GESTORIA_KEYCLOAK_REALM:-gestoria}}",
  "keycloakClientId": "${APP_KEYCLOAK_CLIENT_ID:-${GESTORIA_KEYCLOAK_CLIENT_ID:-gestoria-web}}",
  "organizationName": "${APP_ORGANIZATION_NAME:-${GESTORIA_ORGANIZATION_NAME:-Savia}}",
  "supportEmail": "${APP_SUPPORT_EMAIL:-${GESTORIA_SUPPORT_EMAIL:-}}"
}
EOF
