import { test, expect } from '@playwright/test';
import { AdminConfigurationPage } from './pages/admin-configuration.page';

/**
 * Admin Configuration Tests (requires IDRA_ADMIN role)
 *
 * All tests are READ-ONLY — no data is modified (no Apply button clicks).
 * Covered: TC-ADMIN-CONFIG-01 .. TC-ADMIN-CONFIG-05
 */
test.describe('Admin Configuration - Management Features', () => {

  test('TC-ADMIN-CONFIG-01: should load configuration page with accordion sections', async ({ page }) => {
    const configPage = new AdminConfigurationPage(page);
    await configPage.goto();

    await expect(configPage.accordion).toBeVisible();
    const count = await configPage.getAccordionCount();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('TC-ADMIN-CONFIG-02: should display four expected accordion sections', async ({ page }) => {
    const configPage = new AdminConfigurationPage(page);
    await configPage.goto();

    const headers = await configPage.getAccordionHeaders();
    const headersLower = headers.map(h => h.toLowerCase());

    // Catalogues section
    expect(headersLower.some(h => h.includes('catalogue') || h.includes('catalogo'))).toBeTruthy();
    // SPARQL section
    expect(headersLower.some(h => h.includes('sparql'))).toBeTruthy();
    // Remote catalogue section
    expect(headersLower.some(h => h.includes('remote') || h.includes('remot'))).toBeTruthy();
    // Context Broker section
    expect(headersLower.some(h => h.includes('broker') || h.includes('context'))).toBeTruthy();
  });

  test('TC-ADMIN-CONFIG-03: should expand Catalogues accordion and show refresh period select', async ({ page }) => {
    const configPage = new AdminConfigurationPage(page);
    await configPage.goto();

    await configPage.expandAccordion(0);
    await expect(configPage.refreshPeriodSelect).toBeVisible();
  });

  test('TC-ADMIN-CONFIG-04: should expand SPARQL accordion and show prefixes table', async ({ page }) => {
    const configPage = new AdminConfigurationPage(page);
    await configPage.goto();

    // SPARQL is accordion index 1
    await configPage.expandAccordion(1);
    await page.waitForTimeout(500);

    await expect(configPage.sparqlTable).toBeVisible();
    const rowCount = await configPage.getSparqlPrefixRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('TC-ADMIN-CONFIG-05: should expand Context Broker accordion and show enable checkbox', async ({ page }) => {
    const configPage = new AdminConfigurationPage(page);
    await configPage.goto();

    // Context Broker is accordion index 3
    await configPage.expandAccordion(3);
    await page.waitForTimeout(500);

    const cbCheckbox = page.locator('nb-accordion-item').nth(3).locator('nb-checkbox').first();
    await expect(cbCheckbox).toBeVisible();
  });

});
