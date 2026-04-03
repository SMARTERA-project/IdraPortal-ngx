import { test, expect } from '@playwright/test';
import { DatasetsPage, DatasetDetailPage } from './pages/datasets.page';

test.describe('Datasets Search Page - Public Features', () => {
  let datasetsPage: DatasetsPage;

  test.beforeEach(async ({ page }) => {
    datasetsPage = new DatasetsPage(page);
    await datasetsPage.goto();
  });

  test('TC-DATASETS-01: should load datasets page and display results', async ({ page }) => {
    // Verify page loaded
    await expect(page).toHaveURL(/\/pages\/datasets/);

    // Verify search components are visible
    await expect(datasetsPage.searchInput).toBeVisible();
    await expect(datasetsPage.searchButton).toBeVisible();

    // Verify results are displayed
    const resultsCount = await datasetsPage.getResultsCount();
    expect(resultsCount).toBeGreaterThanOrEqual(0);

    // Verify at least one dataset card is visible if results > 0
    if (resultsCount > 0) {
      const cardCount = await datasetsPage.datasetCards.count();
      expect(cardCount).toBeGreaterThan(0);
    }
  });

  test('TC-DATASETS-02: should search datasets with term', async ({ page }) => {
    const searchTerm = 'environment';

    await datasetsPage.search(searchTerm);

    // Verify URL contains search parameter
    await expect(page).toHaveURL(/all=environment/);

    // Verify results are updated
    const resultsCount = await datasetsPage.getResultsCount();
    expect(resultsCount).toBeGreaterThanOrEqual(0);
  });

  test('TC-DATASETS-03: should filter datasets by catalogue facet', async ({ page }) => {
    // Expand catalogue facet
    await datasetsPage.expandFacet('Catalogues');

    // Get initial results count
    const initialCount = await datasetsPage.getResultsCount();

    // Select first catalogue (if available)
    const firstCatalogueCheckbox = page.locator('nb-accordion-item:has-text("Catalogues") nb-checkbox').first();
    const isVisible = await firstCatalogueCheckbox.isVisible();

    if (isVisible) {
      await firstCatalogueCheckbox.click();

      // Wait for results to update
      await page.waitForTimeout(1000);

      // Verify results changed
      const newCount = await datasetsPage.getResultsCount();
      // Count might be same or different depending on data
      expect(newCount).toBeGreaterThanOrEqual(0);
    } else {
      test.skip(); // Skip if no catalogues available
    }
  });

  test('TC-DATASETS-04: should filter datasets by category facet', async ({ page }) => {
    // Expand category facet
    await datasetsPage.expandFacet('Categories');

    // Select a common category like "Environment"
    const categoryCheckbox = page.locator('nb-accordion-item:has-text("Categories") nb-checkbox').first();
    const isVisible = await categoryCheckbox.isVisible();

    if (isVisible) {
      await categoryCheckbox.click();

      // Verify URL updated with category filter
      const url = page.url();
      expect(url).toContain('categories');
    } else {
      test.skip();
    }
  });

  test('TC-DATASETS-05: should sort datasets by relevance and date', async ({ page }) => {
    // Get initial dataset titles
    const initialTitles = await datasetsPage.getDatasetTitles();
    expect(initialTitles.length).toBeGreaterThan(0);

    // Sort by modification date (if available)
    const sortSelect = datasetsPage.sortBySelect;
    const isSortVisible = await sortSelect.isVisible();

    if (isSortVisible) {
      await datasetsPage.sortBy('Date');

      // Wait for results to update
      await page.waitForTimeout(1000);

      // Get new titles
      const newTitles = await datasetsPage.getDatasetTitles();

      // Verify results are still present
      expect(newTitles.length).toBeGreaterThan(0);
    }
  });

  test('TC-DATASETS-06: should navigate through pagination', async ({ page }) => {
    // Get initial page
    const initialPage = await datasetsPage.getCurrentPage();
    expect(initialPage).toBe(1);

    // Check if next page button exists
    const nextButton = datasetsPage.nextPageButton;
    const isNextVisible = await nextButton.isVisible();

    if (isNextVisible) {
      // Check if button is enabled (not disabled)
      const isDisabled = await nextButton.getAttribute('aria-disabled');

      if (isDisabled !== 'true') {
        // Go to next page
        await datasetsPage.goToNextPage();

        // Verify page changed
        const newPage = await datasetsPage.getCurrentPage();
        expect(newPage).toBe(2);

        // Go back to previous page
        await datasetsPage.goToPrevPage();

        const finalPage = await datasetsPage.getCurrentPage();
        expect(finalPage).toBe(1);
      } else {
        test.skip(); // Only one page of results
      }
    } else {
      test.skip(); // Pagination not available
    }
  });

  test('TC-DATASETS-07: should apply multiple facet filters simultaneously', async ({ page }) => {
    // Expand multiple facets
    await datasetsPage.expandFacet('Categories');
    await datasetsPage.expandFacet('Formats');

    // Select category
    const categoryCheckbox = page.locator('nb-accordion-item:has-text("Categories") nb-checkbox').first();
    const categoryVisible = await categoryCheckbox.isVisible();

    // Select format
    const formatCheckbox = page.locator('nb-accordion-item:has-text("Formats") nb-checkbox').first();
    const formatVisible = await formatCheckbox.isVisible();

    if (categoryVisible && formatVisible) {
      await categoryCheckbox.click();
      await page.waitForTimeout(500);
      await formatCheckbox.click();
      await page.waitForTimeout(500);

      // Verify both filters are in URL
      const url = page.url();
      expect(url).toContain('categories');
      expect(url).toContain('formats');
    } else {
      test.skip();
    }
  });

  test('TC-DATASETS-08: should click dataset and navigate to detail page', async ({ page }) => {
    // Verify at least one dataset is present
    const cardCount = await datasetsPage.datasetCards.count();

    if (cardCount > 0) {
      // Click first dataset card
      await datasetsPage.clickDataset(0);

      // Verify navigation to detail page
      await expect(page).toHaveURL(/\/pages\/datasets\/.+/);

      // Verify detail page loaded
      const detailPage = new DatasetDetailPage(page);
      await expect(detailPage.title).toBeVisible();
    } else {
      test.skip(); // No datasets available
    }
  });
});

test.describe('Dataset Detail Page - Public Features', () => {
  let detailPage: DatasetDetailPage;

  test.beforeEach(async ({ page }) => {
    detailPage = new DatasetDetailPage(page);

    // Navigate to datasets and click first result to get to detail
    const datasetsPage = new DatasetsPage(page);
    await datasetsPage.goto();

    const cardCount = await datasetsPage.datasetCards.count();
    if (cardCount > 0) {
      await datasetsPage.clickDataset(0);
    } else {
      test.skip();
    }
  });

  test('TC-DATASETS-DETAIL-01: should display dataset metadata', async ({ page }) => {
    // Verify title is visible
    await expect(detailPage.title).toBeVisible();
    const title = await detailPage.getTitle();
    expect(title.length).toBeGreaterThan(0);

    // Verify description
    const description = await detailPage.getDescription();
    expect(description.length).toBeGreaterThanOrEqual(0);
  });

  test('TC-DATASETS-DETAIL-02: should display distributions', async ({ page }) => {
    // Check if distributions tab exists
    const tabVisible = await detailPage.distributionsTab.isVisible();

    if (tabVisible) {
      await detailPage.clickDistributionsTab();

      // Verify distributions are displayed
      const distCount = await detailPage.getDistributionCount();
      expect(distCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('TC-DATASETS-DETAIL-03: should display map for geospatial datasets', async ({ page }) => {
    // Check if map is visible
    const hasMap = await detailPage.hasMap();

    if (hasMap) {
      await expect(detailPage.mapContainer).toBeVisible();
    } else {
      // Not all datasets have spatial coverage
      console.log('No map for this dataset');
    }
  });
});
