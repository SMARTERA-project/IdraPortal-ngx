import { test, expect } from '@playwright/test';
import { AdminCataloguesPage } from './pages/admin-catalogues.page';

/**
 * Admin Catalogues Tests (requires IDRA_ADMIN role)
 *
 * All tests are READ-ONLY to avoid modifying production data.
 * Covered: TC-ADMIN-CAT-01 .. TC-ADMIN-CAT-06
 */
test.describe('Admin Catalogues - Management Features', () => {

  test('TC-ADMIN-CAT-01: should load admin catalogues page with tree grid', async ({ page }) => {
    const adminPage = new AdminCataloguesPage(page);
    await adminPage.goto();
    await adminPage.waitForTableReady();

    // Heading must be visible and show total count
    await expect(adminPage.heading).toBeVisible();
    const total = await adminPage.getTotalCataloguesFromHeading();
    expect(total).toBeGreaterThanOrEqual(0);

    // Table must be present (even if empty)
    await adminPage.waitForTableReady();
    await expect(adminPage.cataloguesTable).toBeVisible();
  });

  test('TC-ADMIN-CAT-02: should display expected table columns', async ({ page }) => {
    const adminPage = new AdminCataloguesPage(page);
    await adminPage.goto();
    await adminPage.waitForTableReady();

    const headers = await adminPage.getColumnHeaders();

    // Verify key columns are present (translated labels may vary — check key ones)
    const headersLower = headers.map(h => h.toLowerCase());
    expect(headersLower.some(h => h.includes('name') || h.includes('nome'))).toBeTruthy();
    expect(headersLower.some(h => h.includes('type') || h.includes('tipo'))).toBeTruthy();
    expect(headersLower.some(h => h.includes('dataset'))).toBeTruthy();
  });

  test('TC-ADMIN-CAT-03: should filter catalogues by search term', async ({ page }) => {
    const adminPage = new AdminCataloguesPage(page);
    await adminPage.goto();
    await adminPage.waitForTableReady();

    const totalBefore = await adminPage.getRowCount();
    if (totalBefore === 0) {
      test.skip();
      return;
    }

    // Get name of first catalogue then search for it
    const firstName = await adminPage.getFirstRowName();
    if (!firstName) {
      test.skip();
      return;
    }

    const searchTerm = firstName.substring(0, Math.min(5, firstName.length));
    await adminPage.searchCatalogues(searchTerm);

    const rowsAfter = await adminPage.getRowCount();
    expect(rowsAfter).toBeGreaterThan(0);
    expect(rowsAfter).toBeLessThanOrEqual(totalBefore);
  });

  test('TC-ADMIN-CAT-04: should clear search and restore full list', async ({ page }) => {
    const adminPage = new AdminCataloguesPage(page);
    await adminPage.goto();
    await adminPage.waitForTableReady();

    const totalBefore = await adminPage.getRowCount();
    if (totalBefore === 0) {
      test.skip();
      return;
    }

    await adminPage.searchCatalogues('xyz_nonexistent_9999');
    await adminPage.clearSearch();

    const totalAfter = await adminPage.getRowCount();
    expect(totalAfter).toBe(totalBefore);
  });

  test('TC-ADMIN-CAT-05: should display action icons for admin user', async ({ page }) => {
    const adminPage = new AdminCataloguesPage(page);
    await adminPage.goto();
    await adminPage.waitForTableReady();

    // Add catalogue and remote catalogues icons must be visible for IDRA_ADMIN
    await expect(adminPage.addCatalogueIcon).toBeVisible();
    await expect(adminPage.remoteCataloguesIcon).toBeVisible();
    await expect(adminPage.downloadDumpIcon).toBeVisible();
  });

  test('TC-ADMIN-CAT-06: should navigate to add catalogue form', async ({ page }) => {
    const adminPage = new AdminCataloguesPage(page);
    await adminPage.goto();
    await adminPage.waitForTableReady();

    await adminPage.addCatalogueIcon.click();
    await page.waitForURL(/addCatalogue/, { timeout: 5000 });

    // Form heading should be visible
    const heading = page.locator('h4.jumbotron-heading');
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text?.toLowerCase()).toMatch(/add|aggiungi/i);
  });

});
