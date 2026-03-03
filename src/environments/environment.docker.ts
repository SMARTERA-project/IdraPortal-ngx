export const environment = {
  production: true,
  // Browser-facing Keycloak base URL (exposed by docker-compose on localhost:8180)
  idmBaseURL: "http://localhost:8180",
  idmRealmName: "smartera",
  authProfile: "oidc",
  // Public client for the Portal (see Idra/docker keycloak realm import)
  client_id: "urbanite",
  client_secret: "",
};
