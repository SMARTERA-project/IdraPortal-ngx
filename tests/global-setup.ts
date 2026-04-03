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
 * Credentials are read from environment variables:
 *   KEYCLOAK_USERNAME  (default: m.sajeva@hyperteck.it)
 *   KEYCLOAK_PASSWORD  (default: Eht2023!)
 */
async function globalSetup(_config: FullConfig) {
  const username = process.env.KEYCLOAK_USERNAME ?? 'm.sajeva@hyperteck.it';
  const password = process.env.KEYCLOAK_PASSWORD ?? 'Eht2023!';

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
  await page.goto('http://localhost:4200/keycloak-auth');

  // Wait for Angular to bootstrap and trigger the Keycloak redirect
  await page.waitForLoadState('networkidle', { timeout: 25000 });
  console.log('[global-setup] After networkidle, URL:', page.url());

  // If not yet on Keycloak, wait longer for the redirect
  if (!page.url().includes('dx-lab.it')) {
    console.log('[global-setup] Waiting for Keycloak redirect...');
    await page.waitForURL(/dx-lab\.it/, { timeout: 30000 });
  }
  console.log('[global-setup] Keycloak login page:', page.url());

  // Fill credentials and submit
  await page.waitForSelector('#username', { timeout: 10000 });
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('#kc-login');

  // Wait for Angular callback to process token and redirect to /pages
  await page.waitForURL(/localhost:4200/, { timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 20000 });
  console.log('[global-setup] Post-login URL:', page.url());

  // Verify we're authenticated (not redirected back to Keycloak or login)
  const finalUrl = page.url();
  if (finalUrl.includes('dx-lab.it') || finalUrl.includes('/keycloak-auth')) {
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
