import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for IdraPortal-ngx E2E Testing
 *
 * Projects:
 *  - setup:           Authenticates with Keycloak and saves storage state
 *  - chromium:        Public features (no auth required)
 *  - admin-chromium:  Admin features (depends on setup, reuses saved session)
 *
 * Assumes:
 * - Angular app running on http://localhost:4200
 * - Idra backend available on http://localhost:8080
 * - Keycloak available on https://dx-lab.it
 */
export default defineConfig({
  testDir: './tests',

  // Maximum time one test can run for
  timeout: 30000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 1,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : 3,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:4200',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Browser context options
    viewport: { width: 1920, height: 1080 },

    // Emulate timezone
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
  },

  // Global setup: authenticates with Keycloak before any test run
  globalSetup: './tests/global-setup.ts',

  // Configure projects for major browsers
  projects: [
    // --- Public features (no auth) ---
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /admin.*\.spec\.ts/,
    },

    // --- Admin features (requires Keycloak session saved by globalSetup) ---
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      testMatch: /admin.*\.spec\.ts/,
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    timeout: 300000,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
