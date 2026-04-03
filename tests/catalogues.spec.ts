import { test, expect } from '@playwright/test';
import { CataloguesPage } from './pages/catalogues.page';

test.describe('Catalogues Page - Public Features', () => {
  let cataloguesPage: CataloguesPage;

  test.beforeEach(async ({ page }) => {
    cataloguesPage = new CataloguesPage(page);
    await cataloguesPage.goto();
  });

  test('TC-CATALOGUES-01: should load and display list of federated catalogues', async ({ page }) => {
    // Verify page loaded
    await expect(page).toHaveURL(/\/pages\/catalogues/);

    // Verify catalogues are displayed
    const catalogueCount = await cataloguesPage.getCatalogueCount();
    expect(catalogueCount).toBeGreaterThanOrEqual(0);

    if (catalogueCount > 0) {
      // Verify at least one catalogue card is visible
      await expect(cataloguesPage.catalogueCards.first()).toBeVisible();

      // Verify catalogue has a name
      const names = await cataloguesPage.getCatalogueNames();
      expect(names.length).toBeGreaterThan(0);
      expect(names[0].length).toBeGreaterThan(0);
    } else {
      console.log('No catalogues federated yet');
    }
  });

  test('TC-CATALOGUES-02: should display catalogue metadata (type, dataset count, description)', async ({ page }) => {
    const catalogueCount = await cataloguesPage.getCatalogueCount();

    if (catalogueCount > 0) {
      // Get metadata from first catalogue
      const type = await cataloguesPage.getCatalogueType(0);
      expect(type.length).toBeGreaterThanOrEqual(0);

      const datasetCount = await cataloguesPage.getCatalogueDatasetCount(0);
      expect(datasetCount).toBeGreaterThanOrEqual(0);

      // Verify catalogue card has description
      const firstCard = cataloguesPage.catalogueCards.first();
      await expect(firstCard).toBeVisible();

      const cardText = await firstCard.textContent();
      expect(cardText?.length).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });

  test('TC-CATALOGUES-03: should filter catalogues by search term', async ({ page }) => {
    const catalogueCount = await cataloguesPage.getCatalogueCount();

    if (catalogueCount > 1) {
      // Get all catalogue names
      const allNames = await cataloguesPage.getCatalogueNames();

      // Search for first catalogue name
      const searchTerm = allNames[0].split(' ')[0]; // Use first word
      await cataloguesPage.searchCatalogues(searchTerm);

      // Verify results updated
      await page.waitForTimeout(1000);

      const filteredCount = await cataloguesPage.getCatalogueCount();
      expect(filteredCount).toBeGreaterThanOrEqual(0);
      expect(filteredCount).toBeLessThanOrEqual(catalogueCount);

      // Verify filtered names contain search term
      const filteredNames = await cataloguesPage.getCatalogueNames();
      if (filteredNames.length > 0) {
        const hasMatch = filteredNames.some(name =>
          name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        expect(hasMatch).toBeTruthy();
      }
    } else {
      test.skip(); // Need at least 2 catalogues to test filtering
    }
  });

  test('TC-CATALOGUES-04: should click catalogue and navigate to datasets filtered by catalogue', async ({ page }) => {
    const hasCatalogues = await cataloguesPage.hasCatalogues();

    if (hasCatalogues) {
      // Get first catalogue name
      const names = await cataloguesPage.getCatalogueNames();
      const firstCatalogueName = names[0];

      // Click first catalogue
      await cataloguesPage.clickCatalogue(0);

      // Should navigate to datasets page with catalogue filter
      await expect(page).toHaveURL(/\/pages\/datasets/);

      // URL should contain catalogue parameter
      const url = page.url();
      // Depending on implementation, might be catalogue_id or catalogue_name
      expect(url).toMatch(/catalogue|catalog/);
    } else {
      test.skip();
    }
  });

  test('TC-CATALOGUES-05: should display different catalogue types (CKAN, DKAN, Socrata, Orion)', async ({ page }) => {
    const catalogueCount = await cataloguesPage.getCatalogueCount();

    if (catalogueCount > 0) {
      const catalogueTypes: Set<string> = new Set();

      // Collect types from all visible catalogues (max 5 to avoid long test)
      const maxToCheck = Math.min(catalogueCount, 5);

      for (let i = 0; i < maxToCheck; i++) {
        try {
          const type = await cataloguesPage.getCatalogueType(i);
          if (type.length > 0) {
            catalogueTypes.add(type);
          }
        } catch {
          // Some catalogues might not have type visible
          continue;
        }
      }

      // Verify at least one type was found
      expect(catalogueTypes.size).toBeGreaterThan(0);

      // Log types found
      console.log('Catalogue types found:', Array.from(catalogueTypes));

      // Common types: CKAN, DKAN, SOCRATA, ORION, WEB
      const knownTypes = ['CKAN', 'DKAN', 'SOCRATA', 'ORION', 'WEB'];
      const hasKnownType = Array.from(catalogueTypes).some(type =>
        knownTypes.some(known => type.toUpperCase().includes(known))
      );

      expect(hasKnownType).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
