import { Page, Locator } from '@playwright/test';
import { waitForAngularReady, waitForAngularHttp, waitForEChartsReady } from '../helpers/angular.helper';

/**
 * Page Object Model for Statistics Page
 *
 * URL: /pages/statistics
 * Features:
 * - Dashboard with ECharts visualizations
 * - Datasets per catalogue chart
 * - Datasets per category chart
 * - Datasets per country chart
 * - Temporal distribution chart
 * - Interactive chart filtering
 */
export class StatisticsPage {
  readonly page: Page;

  // Chart containers
  readonly datasetsPerCatalogueChart: Locator;
  readonly datasetsPerCategoryChart: Locator;
  readonly datasetsPerCountryChart: Locator;
  readonly temporalDistributionChart: Locator;

  // All charts (generic selector)
  readonly allCharts: Locator;

  // Summary cards
  readonly summaryCards: Locator;
  readonly totalDatasetsCard: Locator;
  readonly totalCataloguesCard: Locator;

  // Filters
  readonly dateRangeFilter: Locator;
  readonly catalogueFilter: Locator;

  constructor(page: Page) {
    this.page = page;

    // Charts - using echarts attribute selector
    this.allCharts = page.locator('div[echarts]');
    this.datasetsPerCatalogueChart = page.locator('div[echarts]').nth(0);
    this.datasetsPerCategoryChart = page.locator('div[echarts]').nth(1);
    this.datasetsPerCountryChart = page.locator('div[echarts]').nth(2);
    this.temporalDistributionChart = page.locator('div[echarts]').nth(3);

    // Summary cards
    this.summaryCards = page.locator('nb-card.summary-card');
    this.totalDatasetsCard = page.locator('nb-card:has-text("Total Datasets")');
    this.totalCataloguesCard = page.locator('nb-card:has-text("Total Catalogues")');

    // Filters
    this.dateRangeFilter = page.locator('input[type="date"]');
    this.catalogueFilter = page.locator('nb-select[placeholder*="Catalogue"]');
  }

  async goto() {
    await this.page.goto('/pages/statistics');
    await waitForAngularReady(this.page);
    await waitForAngularHttp(this.page);
  }

  async waitForChartsToLoad() {
    // Wait for all echarts to be initialized
    await waitForEChartsReady(this.page, 'div[echarts]');

    // Additional wait for data to render
    await this.page.waitForTimeout(1000);
  }

  async getChartCount(): Promise<number> {
    return await this.allCharts.count();
  }

  async isChartVisible(chartIndex: number): Promise<boolean> {
    const chart = this.allCharts.nth(chartIndex);
    return await chart.isVisible();
  }

  async getTotalDatasetsCount(): Promise<number> {
    try {
      const card = this.totalDatasetsCard;
      await card.waitFor({ state: 'visible', timeout: 5000 });
      const text = await card.textContent();
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  async getTotalCataloguesCount(): Promise<number> {
    try {
      const card = this.totalCataloguesCard;
      await card.waitFor({ state: 'visible', timeout: 5000 });
      const text = await card.textContent();
      const match = text?.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  async clickChart(chartIndex: number, x: number = 0, y: number = 0) {
    const chart = this.allCharts.nth(chartIndex);
    await chart.waitFor({ state: 'visible' });

    // If x and y are provided, click at specific position
    // Otherwise click center
    if (x === 0 && y === 0) {
      await chart.click();
    } else {
      await chart.click({ position: { x, y } });
    }

    await this.page.waitForTimeout(300);
  }

  async hoverChart(chartIndex: number, x: number, y: number) {
    const chart = this.allCharts.nth(chartIndex);
    await chart.waitFor({ state: 'visible' });
    await chart.hover({ position: { x, y } });
    await this.page.waitForTimeout(300);
  }

  async hasChartTooltip(): Promise<boolean> {
    // ECharts tooltip has class 'echarts-tooltip'
    const tooltip = this.page.locator('div.echarts-tooltip, div[class*="tooltip"]');
    return await tooltip.isVisible();
  }

  async getChartTooltipText(): Promise<string> {
    const tooltip = this.page.locator('div.echarts-tooltip, div[class*="tooltip"]');
    try {
      await tooltip.waitFor({ state: 'visible', timeout: 2000 });
      return (await tooltip.textContent()) || '';
    } catch {
      return '';
    }
  }

  async filterByCatalogue(catalogueName: string) {
    await this.catalogueFilter.click();
    await this.page.locator(`nb-option:has-text("${catalogueName}")`).click();
    await waitForAngularHttp(this.page);
    await this.waitForChartsToLoad();
  }

  async getChartTitle(chartIndex: number): Promise<string> {
    // Chart title is usually in nb-card-header preceding the chart
    const chart = this.allCharts.nth(chartIndex);
    const card = chart.locator('xpath=ancestor::nb-card');
    const header = card.locator('nb-card-header');

    try {
      const text = await header.textContent();
      return text?.trim() || '';
    } catch {
      return '';
    }
  }

  async screenshotChart(chartIndex: number, path: string) {
    const chart = this.allCharts.nth(chartIndex);
    await chart.screenshot({ path });
  }
}
