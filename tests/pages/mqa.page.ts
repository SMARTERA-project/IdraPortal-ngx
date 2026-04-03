import { Page, Locator } from '@playwright/test';
import { waitForAngularReady, waitForAngularHttp, waitForTreeGridReady, waitForEChartsReady } from '../helpers/angular.helper';

/**
 * Page Object Model for MQA (Metadata Quality Assessment) Page
 *
 * URL: /pages/mqa
 * Features:
 * - Tree grid with hierarchical MQA metrics (Catalogue -> Dataset -> Distribution)
 * - Quality score visualization
 * - Pie chart showing quality distribution
 * - Expand/collapse tree nodes
 * - Filter by catalogue
 */
export class MqaPage {
  readonly page: Page;

  // Tree grid
  readonly treeGridTable: Locator;
  readonly treeGridRows: Locator;
  readonly expandButtons: Locator;

  // Quality pie chart
  readonly qualityPieChart: Locator;

  // Filters
  readonly catalogueFilter: Locator;

  // Summary cards
  readonly averageQualityCard: Locator;
  readonly excellentCountCard: Locator;
  readonly goodCountCard: Locator;
  readonly sufficientCountCard: Locator;
  readonly badCountCard: Locator;

  constructor(page: Page) {
    this.page = page;

    // Nebular Tree Grid
    this.treeGridTable = page.locator('table[nbtreegrid]');
    this.treeGridRows = page.locator('table[nbtreegrid] tbody tr');
    this.expandButtons = page.locator('table[nbtreegrid] button[nbTreeGridRowToggle]');

    // Pie chart
    this.qualityPieChart = page.locator('div[echarts]').first();

    // Filters
    this.catalogueFilter = page.locator('nb-select[placeholder*="Catalogue"]');

    // Summary cards
    this.averageQualityCard = page.locator('nb-card:has-text("Average Quality")');
    this.excellentCountCard = page.locator('nb-card:has-text("Excellent")');
    this.goodCountCard = page.locator('nb-card:has-text("Good")');
    this.sufficientCountCard = page.locator('nb-card:has-text("Sufficient")');
    this.badCountCard = page.locator('nb-card:has-text("Bad")');
  }

  async goto() {
    await this.page.goto('/pages/mqa');
    await waitForAngularReady(this.page);
    await waitForAngularHttp(this.page);
    await waitForTreeGridReady(this.page);
  }

  async waitForChartsToLoad() {
    await waitForEChartsReady(this.page, 'div[echarts]');
  }

  async getTreeGridRowCount(): Promise<number> {
    return await this.treeGridRows.count();
  }

  async expandTreeNode(rowIndex: number) {
    const expandButton = this.expandButtons.nth(rowIndex);

    // Check if node is already expanded
    const isExpanded = await expandButton.getAttribute('aria-expanded');
    if (isExpanded === 'true') {
      return; // Already expanded
    }

    await expandButton.click();
    await this.page.waitForTimeout(500); // Animation
  }

  async collapseTreeNode(rowIndex: number) {
    const expandButton = this.expandButtons.nth(rowIndex);

    // Check if node is collapsed
    const isExpanded = await expandButton.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      return; // Already collapsed
    }

    await expandButton.click();
    await this.page.waitForTimeout(500); // Animation
  }

  async getRowText(rowIndex: number): Promise<string> {
    const row = this.treeGridRows.nth(rowIndex);
    return (await row.textContent()) || '';
  }

  async getQualityScore(rowIndex: number): Promise<number | null> {
    const row = this.treeGridRows.nth(rowIndex);
    const scoreCell = row.locator('td').nth(1); // Assuming quality score is in second column
    const text = await scoreCell.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  async filterByCatalogue(catalogueName: string) {
    await this.catalogueFilter.click();
    await this.page.locator(`nb-option:has-text("${catalogueName}")`).click();
    await waitForAngularHttp(this.page);
    await waitForTreeGridReady(this.page);
  }

  async getAverageQuality(): Promise<number> {
    try {
      const card = this.averageQualityCard;
      await card.waitFor({ state: 'visible', timeout: 5000 });
      const text = await card.textContent();
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  async getExcellentCount(): Promise<number> {
    try {
      const card = this.excellentCountCard;
      await card.waitFor({ state: 'visible', timeout: 5000 });
      const text = await card.textContent();
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  async isPieChartVisible(): Promise<boolean> {
    return await this.qualityPieChart.isVisible();
  }

  async clickPieChartSegment(x: number, y: number) {
    await this.qualityPieChart.click({ position: { x, y } });
    await this.page.waitForTimeout(300);
  }

  async hasTreeGrid(): Promise<boolean> {
    return await this.treeGridTable.isVisible();
  }

  async expandAllTopLevelNodes() {
    const expandButtonsCount = await this.expandButtons.count();

    for (let i = 0; i < Math.min(expandButtonsCount, 5); i++) {
      try {
        await this.expandTreeNode(i);
      } catch {
        // Node might not be expandable or already expanded
        continue;
      }
    }
  }

  async getTreeNodeLevel(rowIndex: number): Promise<number> {
    const row = this.treeGridRows.nth(rowIndex);

    // Get indentation level from tree grid structure
    // Nebular tree grid uses CSS classes or data attributes for levels
    const levelAttr = await row.getAttribute('data-level');
    if (levelAttr) {
      return parseInt(levelAttr);
    }

    // Alternative: count padding/margin
    const paddingLeft = await row.evaluate((el) => {
      const firstCell = el.querySelector('td');
      if (!firstCell) return '0';
      return window.getComputedStyle(firstCell).paddingLeft;
    });

    // Estimate level from padding (usually 20px per level)
    const paddingValue = parseInt(paddingLeft);
    return Math.floor(paddingValue / 20);
  }
}
