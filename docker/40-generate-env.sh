#!/bin/sh
# Generates assets/env.js from PORTAL_* environment variables at container
# startup (runs automatically from /docker-entrypoint.d/ in the nginx image).
# Defaults below match local docker-compose development; override via the
# stack .env file. Values are written as strings: AppConfigService normalizes
# booleans ('true'/'false') and the comma-separated languages list.
set -e

ENV_JS=/usr/share/nginx/html/assets/env.js

cat > "$ENV_JS" <<EOF
// Generated at container startup by 40-generate-env.sh — do not edit.
(function (window) {
  window.__env = {
    enableAuthentication: '${PORTAL_ENABLE_AUTHENTICATION:-true}',
    authenticationMethod: '${PORTAL_AUTHENTICATION_METHOD:-keycloak}',
    keyCloakBaseURL: '${PORTAL_KEYCLOAK_BASE_URL:-http://localhost:8180}',
    keyCloakRealmName: '${PORTAL_KEYCLOAK_REALM:-smartera}',
    dashboardBaseURL: '${PORTAL_DASHBOARD_BASE_URL:-http://localhost:4200}',
    client_id: '${PORTAL_CLIENT_ID:-data-platform}',
    authProfile: '${PORTAL_AUTH_PROFILE:-oidc}',
    idra_base_url: '${PORTAL_IDRA_BASE_URL:-http://localhost:8080}',
    enable_datalet: '${PORTAL_ENABLE_DATALET:-true}',
    datalet_base_url: '${PORTAL_DATALET_BASE_URL:-http://localhost:80/deep/deep-components/creator.html}',
    mqa_base_url: '${PORTAL_MQA_BASE_URL:-http://localhost:8000}',
    idra_docker_url: '${PORTAL_IDRA_DOCKER_URL:-http://idra:8080}',
    languages: '${PORTAL_LANGUAGES:-en,de,fr,it,sp,gr,pt,lt}',
    'idra.orion.manager.url': '${PORTAL_ORION_MANAGER_ENABLED:-true}',
    translations_base_url: '${PORTAL_TRANSLATIONS_BASE_URL:-https://raw.githubusercontent.com/OPSILab/IdraPortal-ngx-Translations}'
  };
}(window));
EOF

echo "40-generate-env.sh: generated $ENV_JS"
