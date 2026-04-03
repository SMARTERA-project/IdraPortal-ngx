import { test, expect } from '@playwright/test';
import { HomePage } from './pages/home.page';

test.describe('Home Page - Public Features', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('TC-HOME-01: should load with dataset count and search components', async ({ page }) => {
    // Verify heading with dataset count
    await expect(homePage.heading).toBeVisible();
    const headingText = await homePage.heading.textContent();
    expect(headingText).toMatch(/\d+/); // Contains number

    const datasetCount = await homePage.getDatasetCount();
    expect(datasetCount).toBeGreaterThanOrEqual(0);

    // Verify search input is visible
    await expect(homePage.searchInput).toBeVisible();
    await expect(homePage.searchIcon).toBeVisible();

    // Verify tag cloud is present
    await expect(homePage.tagCloud).toBeVisible();
    const tags = page.locator('div.tags a');
    const tagCount = await tags.count();
    expect(tagCount).toBeGreaterThan(0);

    // Verify DCAT-AP categories grid
    const categoryCount = await homePage.getCategoryCount();
    expect(categoryCount).toBeGreaterThan(0);
  });

  test('TC-HOME-02: should search with basic term and navigate to datasets page', async ({ page }) => {
    const searchTerm = 'water';

    await homePage.searchBasic(searchTerm);

    // Verify navigation to datasets page with search parameter
    await expect(page).toHaveURL(/\/pages\/datasets/);
    await expect(page).toHaveURL(/all=water/);
  });

  test('TC-HOME-03: should click tag from cloud and navigate with tag filter', async ({ page }) => {
    // Get first visible tag text
    const tagText = await homePage.getFirstTagText();
    expect(tagText.length).toBeGreaterThan(0);

    await homePage.clickTagInCloud(tagText);

    // Verify navigation to datasets page with search_value parameter
    await expect(page).toHaveURL(/\/pages\/datasets/);
    await expect(page).toHaveURL(/search_value=/);
  });

  test('TC-HOME-04: should toggle advanced search form', async ({ page }) => {
    // Initially advanced search should be hidden
    await expect(homePage.advancedSearchCard).not.toBeVisible();

    // Toggle open
    await homePage.toggleAdvancedSearch();
    await expect(homePage.advancedSearchCard).toBeVisible();

    // Verify advanced search fields are present
    await expect(homePage.advancedSearchEuroVocInput).toBeVisible();
    await expect(homePage.advancedSearchLicenseSelect).toBeVisible();

    // Toggle close
    await homePage.toggleAdvancedSearch();
    await expect(homePage.advancedSearchCard).not.toBeVisible();
  });

  test('TC-HOME-05: should perform advanced search with multiple filters', async ({ page }) => {
    await homePage.searchAdvanced({
      euroVoc: 'environment',
      publisher: 'European Agency',
      format: 'CSV'
    });

    // Verify navigation to datasets page with advanced search parameters
    await expect(page).toHaveURL(/\/pages\/datasets/);

    // URL should contain advanced search parameters
    const url = page.url();
    expect(url).toContain('euroVoc');
  });

  test('TC-HOME-06: should navigate to datasets when clicking category', async ({ page }) => {
    // Get category count to ensure categories are loaded
    const categoryCount = await homePage.getCategoryCount();
    expect(categoryCount).toBeGreaterThan(0);

    // Click first category (usually "Agriculture, fisheries, forestry and food")
    const firstCategory = page.locator('div.category-icon').first();
    await firstCategory.click();

    // Verify navigation to datasets page with category filter
    await expect(page).toHaveURL(/\/pages\/datasets/);
  });
});
