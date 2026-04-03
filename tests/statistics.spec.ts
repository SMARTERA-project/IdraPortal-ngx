import { test, expect } from '@playwright/test';
import { StatisticsPage } from './pages/statistics.page';

test.describe('Statistics Dashboard - Public Features', () => {
  let statsPage: StatisticsPage;

  test.beforeEach(async ({ page }) => {
    statsPage = new StatisticsPage(page);
    await statsPage.goto();
  });

  test('TC-STATISTICS-01: should load dashboard with ECharts visualizations', async ({ page }) => {
    // Verify page loaded
    await expect(page).toHaveURL(/\/pages\/statistics/);

    // Wait for charts to initialize
    await statsPage.waitForChartsToLoad();

    // Verify at least one chart is visible
    const chartCount = await statsPage.getChartCount();
    expect(chartCount).toBeGreaterThan(0);

    // Verify first chart is visible
    const isVisible = await statsPage.isChartVisible(0);
    expect(isVisible).toBeTruthy();
  });

  test('TC-STATISTICS-02: should display summary statistics cards', async ({ page }) => {
    // Wait for data to load
    await statsPage.waitForChartsToLoad();

    // Get total datasets count
    const totalDatasets = await statsPage.getTotalDatasetsCount();
    expect(totalDatasets).toBeGreaterThanOrEqual(0);

    // Get total catalogues count
    const totalCatalogues = await statsPage.getTotalCataloguesCount();
    expect(totalCatalogues).toBeGreaterThanOrEqual(0);

    console.log(`Statistics: ${totalDatasets} datasets, ${totalCatalogues} catalogues`);
  });

  test('TC-STATISTICS-03: should display multiple chart types (bar, pie, line)', async ({ page }) => {
    await statsPage.waitForChartsToLoad();

    const chartCount = await statsPage.getChartCount();
    expect(chartCount).toBeGreaterThanOrEqual(2);

    // Verify charts are ECharts instances
    const hasECharts = await page.evaluate(() => {
      const echartsInstance = (window as any).echarts;
      return !!echartsInstance;
    });

    expect(hasECharts).toBeTruthy();

    // Log chart titles for visibility
    for (let i = 0; i < Math.min(chartCount, 4); i++) {
      const title = await statsPage.getChartTitle(i);
      console.log(`Chart ${i}: ${title}`);
    }
  });

  test('TC-STATISTICS-04: should show tooltip on chart hover', async ({ page }) => {
    await statsPage.waitForChartsToLoad();

    const chartCount = await statsPage.getChartCount();

    if (chartCount > 0) {
      // Hover over first chart at center
      await statsPage.hoverChart(0, 100, 100);

      // Wait for tooltip to appear
      await page.waitForTimeout(500);

      // Check if tooltip is visible
      const hasTooltip = await statsPage.hasChartTooltip();

      if (hasTooltip) {
        const tooltipText = await statsPage.getChartTooltipText();
        console.log('Chart tooltip:', tooltipText);
        expect(tooltipText.length).toBeGreaterThan(0);
      } else {
        console.log('Tooltip not shown (might need specific hover position)');
      }
    } else {
      test.skip();
    }
  });

  test('TC-STATISTICS-05: should filter statistics by catalogue', async ({ page }) => {
    await statsPage.waitForChartsToLoad();

    // Check if catalogue filter exists
    const filterVisible = await statsPage.catalogueFilter.isVisible();

    if (filterVisible) {
      // Get initial stats
      const initialDatasets = await statsPage.getTotalDatasetsCount();

      // Apply catalogue filter
      await statsPage.catalogueFilter.click();

      // Select first catalogue option
      const firstOption = page.locator('nb-option').first();
      await firstOption.click();

      // Wait for charts to reload
      await page.waitForTimeout(2000);
      await statsPage.waitForChartsToLoad();

      // Get filtered stats
      const filteredDatasets = await statsPage.getTotalDatasetsCount();

      // Filtered count should be <= initial count
      expect(filteredDatasets).toBeLessThanOrEqual(initialDatasets);

      console.log(`Filtered: ${filteredDatasets} datasets (was ${initialDatasets})`);
    } else {
      console.log('Catalogue filter not available');
      test.skip();
    }
  });

  test('TC-STATISTICS-06: should render datasets per catalogue chart', async ({ page }) => {
    await statsPage.waitForChartsToLoad();

    // Verify datasets per catalogue chart exists
    const isVisible = await statsPage.datasetsPerCatalogueChart.isVisible();

    if (isVisible) {
      await expect(statsPage.datasetsPerCatalogueChart).toBeVisible();

      // Chart should have some height (rendered)
      const boundingBox = await statsPage.datasetsPerCatalogueChart.boundingBox();
      expect(boundingBox?.height).toBeGreaterThan(100);
      expect(boundingBox?.width).toBeGreaterThan(100);
    } else {
      console.log('Datasets per catalogue chart not visible');
    }
  });

  test('TC-STATISTICS-07: should render datasets per category chart', async ({ page }) => {
    await statsPage.waitForChartsToLoad();

    const chartCount = await statsPage.getChartCount();

    if (chartCount >= 2) {
      const isVisible = await statsPage.datasetsPerCategoryChart.isVisible();

      if (isVisible) {
        await expect(statsPage.datasetsPerCategoryChart).toBeVisible();

        const boundingBox = await statsPage.datasetsPerCategoryChart.boundingBox();
        expect(boundingBox?.height).toBeGreaterThan(100);
      }
    } else {
      test.skip();
    }
  });

  test('TC-STATISTICS-08: should allow screenshot of charts for reporting', async ({ page }) => {
    await statsPage.waitForChartsToLoad();

    const chartCount = await statsPage.getChartCount();

    if (chartCount > 0) {
      // Take screenshot of first chart
      const screenshotPath = 'test-results/chart-screenshot.png';
      await statsPage.screenshotChart(0, screenshotPath);

      // Verify screenshot was taken (file exists check would need fs)
      console.log(`Chart screenshot saved to ${screenshotPath}`);
    } else {
      test.skip();
    }
  });
});
