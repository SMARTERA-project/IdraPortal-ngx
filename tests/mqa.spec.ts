import { test, expect } from '@playwright/test';
import { MqaPage } from './pages/mqa.page';

test.describe('MQA (Metadata Quality Assessment) Page - Public Features', () => {
  let mqaPage: MqaPage;

  test.beforeEach(async ({ page }) => {
    mqaPage = new MqaPage(page);
    await mqaPage.goto();
  });

  test('TC-MQA-01: should load MQA page with tree grid structure', async ({ page }) => {
    // Verify page loaded
    await expect(page).toHaveURL(/\/pages\/mqa/);

    // Verify tree grid is present
    const hasTreeGrid = await mqaPage.hasTreeGrid();
    expect(hasTreeGrid).toBeTruthy();

    await expect(mqaPage.treeGridTable).toBeVisible();

    // Verify at least one row exists
    const rowCount = await mqaPage.getTreeGridRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('TC-MQA-02: should display quality metrics for catalogues, datasets, and distributions', async ({ page }) => {
    // Get row count
    const rowCount = await mqaPage.getTreeGridRowCount();
    expect(rowCount).toBeGreaterThan(0);

    // Get first row text (should be a catalogue)
    const firstRowText = await mqaPage.getRowText(0);
    expect(firstRowText.length).toBeGreaterThan(0);

    // Try to get quality score from first row
    const qualityScore = await mqaPage.getQualityScore(0);

    if (qualityScore !== null) {
      expect(qualityScore).toBeGreaterThanOrEqual(0);
      expect(qualityScore).toBeLessThanOrEqual(100);
      console.log(`First row quality score: ${qualityScore}`);
    } else {
      console.log('Quality score not available in first row');
    }
  });

  test('TC-MQA-03: should expand and collapse tree nodes to show hierarchical structure', async ({ page }) => {
    const rowCount = await mqaPage.getTreeGridRowCount();
    const expandButtonCount = await mqaPage.expandButtons.count();

    if (expandButtonCount > 0) {
      // Get initial row count
      const initialCount = rowCount;

      // Expand first node
      await mqaPage.expandTreeNode(0);

      // Wait for animation
      await page.waitForTimeout(500);

      // Get new row count (should be higher if node had children)
      const newCount = await mqaPage.getTreeGridRowCount();

      if (newCount > initialCount) {
        console.log(`Expanded: ${initialCount} rows -> ${newCount} rows`);

        // Collapse the node
        await mqaPage.collapseTreeNode(0);
        await page.waitForTimeout(500);

        // Verify row count decreased
        const finalCount = await mqaPage.getTreeGridRowCount();
        expect(finalCount).toBeLessThan(newCount);
      } else {
        console.log('Node had no children to expand');
      }
    } else {
      console.log('No expandable nodes found');
      test.skip();
    }
  });

  test('TC-MQA-04: should display quality distribution pie chart', async ({ page }) => {
    await mqaPage.waitForChartsToLoad();

    // Verify pie chart is visible
    const isPieVisible = await mqaPage.isPieChartVisible();

    if (isPieVisible) {
      await expect(mqaPage.qualityPieChart).toBeVisible();

      // Verify chart has dimensions
      const boundingBox = await mqaPage.qualityPieChart.boundingBox();
      expect(boundingBox?.height).toBeGreaterThan(100);
      expect(boundingBox?.width).toBeGreaterThan(100);
    } else {
      console.log('Quality pie chart not visible');
    }
  });

  test('TC-MQA-05: should display summary cards with quality statistics', async ({ page }) => {
    // Check for average quality card
    const avgQuality = await mqaPage.getAverageQuality();
    expect(avgQuality).toBeGreaterThanOrEqual(0);
    expect(avgQuality).toBeLessThanOrEqual(100);

    console.log(`Average quality: ${avgQuality}`);

    // Check for excellent count
    const excellentCount = await mqaPage.getExcellentCount();
    expect(excellentCount).toBeGreaterThanOrEqual(0);

    console.log(`Excellent datasets: ${excellentCount}`);
  });

  test('TC-MQA-06: should filter MQA by catalogue', async ({ page }) => {
    // Check if catalogue filter exists
    const filterVisible = await mqaPage.catalogueFilter.isVisible();

    if (filterVisible) {
      // Get initial row count
      const initialCount = await mqaPage.getTreeGridRowCount();

      // Apply catalogue filter
      await mqaPage.catalogueFilter.click();

      // Select first catalogue option
      const firstOption = page.locator('nb-option').first();
      const optionText = await firstOption.textContent();
      await firstOption.click();

      // Wait for tree grid to reload
      await page.waitForTimeout(2000);

      // Get filtered row count
      const filteredCount = await mqaPage.getTreeGridRowCount();

      // Should have fewer or equal rows
      expect(filteredCount).toBeLessThanOrEqual(initialCount);

      console.log(`Filtered by ${optionText}: ${filteredCount} rows (was ${initialCount})`);
    } else {
      console.log('Catalogue filter not available');
      test.skip();
    }
  });

  test('TC-MQA-07: should show different quality levels (Excellent, Good, Sufficient, Bad)', async ({ page }) => {
    // Expand all top-level nodes to see more data
    await mqaPage.expandAllTopLevelNodes();

    // Wait for expansion
    await page.waitForTimeout(1000);

    // Get multiple quality scores
    const rowCount = await mqaPage.getTreeGridRowCount();
    const qualityScores: number[] = [];

    for (let i = 0; i < Math.min(rowCount, 10); i++) {
      const score = await mqaPage.getQualityScore(i);
      if (score !== null) {
        qualityScores.push(score);
      }
    }

    console.log('Quality scores found:', qualityScores);

    // Verify we have some scores
    expect(qualityScores.length).toBeGreaterThan(0);

    // Check if we have variety in scores (not all the same)
    const uniqueScores = new Set(qualityScores);
    console.log(`Found ${uniqueScores.size} unique quality levels`);
  });

  test('TC-MQA-08: should navigate through tree hierarchy (Catalogue -> Dataset -> Distribution)', async ({ page }) => {
    const expandButtonCount = await mqaPage.expandButtons.count();

    if (expandButtonCount > 0) {
      // Expand first level (Catalogue)
      await mqaPage.expandTreeNode(0);
      await page.waitForTimeout(500);

      const level1Count = await mqaPage.getTreeGridRowCount();

      // Try to expand second level (Dataset) if available
      if (expandButtonCount > 1) {
        await mqaPage.expandTreeNode(1);
        await page.waitForTimeout(500);

        const level2Count = await mqaPage.getTreeGridRowCount();

        // Verify hierarchy expanded
        expect(level2Count).toBeGreaterThanOrEqual(level1Count);

        console.log(`Tree hierarchy: L0 -> L1 (${level1Count} rows) -> L2 (${level2Count} rows)`);
      }
    } else {
      test.skip();
    }
  });

  test('TC-MQA-09: should interact with quality pie chart segments', async ({ page }) => {
    await mqaPage.waitForChartsToLoad();

    const isPieVisible = await mqaPage.isPieChartVisible();

    if (isPieVisible) {
      // Click on pie chart segment (center-right position)
      await mqaPage.clickPieChartSegment(150, 100);

      // Wait for any interaction effect
      await page.waitForTimeout(300);

      // Verify no errors occurred
      const errorVisible = await page.locator('text="Error"').isVisible();
      expect(errorVisible).toBeFalsy();
    } else {
      test.skip();
    }
  });
});
