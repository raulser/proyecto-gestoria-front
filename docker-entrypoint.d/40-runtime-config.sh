#!/bin/sh
set -eu

escape_js() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

legal_name=$(escape_js "${GESTORIA_LEGAL_NAME:-Proveedor pendiente de configurar}")
legal_nif=$(escape_js "${GESTORIA_LEGAL_NIF:-NIF pendiente de configurar}")
privacy_email=$(escape_js "${GESTORIA_PRIVACY_EMAIL:-privacidad@example.com}")
support_email=$(escape_js "${GESTORIA_SUPPORT_EMAIL:-soporte@example.com}")
support_hours=$(escape_js "${GESTORIA_SUPPORT_HOURS:-Laborables de 09:00 a 18:00 (Europe/Madrid)}")
privacy_version=$(escape_js "${GESTORIA_PRIVACY_VERSION:-2026-08-13}")

cat > /usr/share/nginx/html/config.js <<EOF
window.__GESTORIA_CONFIG__ = {
  urlApi: "${GESTORIA_API_URL-}",
  urlKeycloak: "${GESTORIA_KEYCLOAK_URL:-http://localhost:8081}",
  reinoKeycloak: "${GESTORIA_KEYCLOAK_REALM:-gestoria}",
  idClienteKeycloak: "${GESTORIA_KEYCLOAK_CLIENT_ID:-gestoria-web}",
  nombreProveedor: "$legal_name",
  nifProveedor: "$legal_nif",
  emailPrivacidad: "$privacy_email",
  emailSoporte: "$support_email",
  horarioSoporte: "$support_hours",
  versionPrivacidad: "$privacy_version"
};
EOF
