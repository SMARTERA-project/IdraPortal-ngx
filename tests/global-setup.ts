import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup — Keycloak OAuth2 Login
 *
 * Performs a real browser-based Keycloak login:
 *  1. Navigate to /keycloak-auth (triggers Angular OAuth2 redirect to Keycloak)
 *  2. Fill credentials on Keycloak login page
 *  3. Wait for callback back to Angular (token exchange happens in-browser)
 *  4. Save storage state to .auth/admin.json
 *
 * Configuration is read from environment variables:
 *   KEYCLOAK_USERNAME  Keycloak login username (required, no default)
 *   KEYCLOAK_PASSWORD  Keycloak login password (required, no default)
 *   KEYCLOAK_HOST      host of the Keycloak/OIDC server (default: dx-lab.eng.it)
 *   APP_BASE_URL       base URL of the Angular app under test (default: http://localhost:4200)
 */

/** Escapes a string so it can be used as a literal inside a RegExp. */
function toHostPattern(host: string): RegExp {
  return new RegExp(host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

async function globalSetup(_config: FullConfig) {
  const username = process.env.KEYCLOAK_USERNAME;
  const password = process.env.KEYCLOAK_PASSWORD;
  if (!username || !password) {
    throw new Error(
      '[global-setup] KEYCLOAK_USERNAME and KEYCLOAK_PASSWORD must be set '
      + '(e.g. via a .env file or CI secrets) to run the authenticated E2E suite.'
    );
  }

  // Host of the Keycloak server, used to detect the redirect to the login page.
  // Configurable so the suite is not tied to a specific deployment domain.
  const keycloakHost = process.env.KEYCLOAK_HOST ?? 'dx-lab.eng.it';
  const keycloakHostPattern = toHostPattern(keycloakHost);

  // Base URL of the Angular app under test (should match Playwright's baseURL).
  const appBaseUrl = process.env.APP_BASE_URL ?? 'http://localhost:4200';
  const appHostPattern = toHostPattern(new URL(appBaseUrl).host);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
  });
  const page = await context.newPage();

  // Navigate to Angular login trigger — AuthLoginComponent calls authService.authenticate()
  // which redirects the browser to Keycloak
  console.log('[global-setup] Navigating to /keycloak-auth...');
  await page.goto(`${appBaseUrl}/keycloak-auth`);

  // Wait for Angular to bootstrap and trigger the Keycloak redirect
  await page.waitForLoadState('networkidle', { timeout: 25000 });
  console.log('[global-setup] After networkidle, URL:', page.url());

  // If not yet on Keycloak, wait longer for the redirect
  if (!page.url().includes(keycloakHost)) {
    console.log('[global-setup] Waiting for Keycloak redirect...');
    await page.waitForURL(keycloakHostPattern, { timeout: 30000 });
  }
  console.log('[global-setup] Keycloak login page:', page.url());

  // Fill credentials and submit
  await page.waitForSelector('#username', { timeout: 10000 });
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('#kc-login');

  // Wait for Angular callback to process token and redirect to /pages
  await page.waitForURL(appHostPattern, { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 20000 });
  console.log('[global-setup] Post-login URL:', page.url());

  // Verify we're authenticated (not redirected back to Keycloak or login)
  const finalUrl = page.url();
  if (finalUrl.includes(keycloakHost) || finalUrl.includes('/keycloak-auth')) {
    // Dump localStorage for debugging
    const lsKeys = await page.evaluate(() => Object.keys(localStorage));
    console.log('[global-setup] localStorage keys:', lsKeys);
    throw new Error(`[global-setup] Login failed — ended up at: ${finalUrl}`);
  }

  // Log localStorage keys to verify token is present
  const lsKeys = await page.evaluate(() => Object.keys(localStorage));
  console.log('[global-setup] localStorage keys:', lsKeys);

  // Save storage state for admin tests
  await context.storageState({ path: '.auth/admin.json' });
  console.log('[global-setup] Storage state saved to .auth/admin.json');

  await browser.close();
}

export default globalSetup;
