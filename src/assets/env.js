// Runtime configuration for IdraPortal-ngx.
// Loaded synchronously by index.html BEFORE the Angular bundles, so the app
// can read window.__env without any async fetch.
//
// This file holds the localhost defaults used by `ng serve`. In Docker it is
// OVERWRITTEN at container startup by /docker-entrypoint.d/40-generate-env.sh,
// which renders the same structure from the PORTAL_* environment variables
// (see Idra/docker/.env.example).
(function (window) {
  window.__env = {
    enableAuthentication: true,
    authenticationMethod: 'keycloak',
    keyCloakBaseURL: 'http://localhost:8180',
    keyCloakRealmName: 'smartera',
    dashboardBaseURL: 'http://localhost:4200',
    client_id: 'data-platform',
    authProfile: 'oidc',
    idra_base_url: 'http://localhost:8080',
    enable_datalet: true,
    datalet_base_url: 'http://localhost:80/deep/deep-components/creator.html',
    mqa_base_url: 'http://localhost:8000',
    idra_docker_url: 'http://idra:8080',
    languages: ['en', 'de', 'fr', 'it', 'sp', 'gr', 'pt', 'lt'],
    'idra.orion.manager.url': true,
    translations_base_url: 'https://raw.githubusercontent.com/OPSILab/IdraPortal-ngx-Translations',
  };
}(window));
