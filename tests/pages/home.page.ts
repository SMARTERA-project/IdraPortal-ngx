import { Page, Locator } from '@playwright/test';
import { waitForAngularReady, waitForAngularHttp } from '../helpers/angular.helper';

/**
 * Page Object Model for Home Page
 *
 * URL: /pages/home
 * Features:
 * - Dataset count display
 * - Basic search input with tags
 * - Advanced search form (collapsible)
 * - Tag cloud navigation
 * - DCAT-AP category grid
 */
export class HomePage {
  readonly page: Page;

  // Search components
  readonly searchInput: Locator;
  readonly searchIcon: Locator;
  readonly advancedSearchToggle: Locator;
  readonly advancedSearchCard: Locator;

  // Advanced search form fields
  readonly advancedSearchEuroVocInput: Locator;
  readonly advancedSearchLicenseSelect: Locator;
  readonly advancedSearchPublisherInput: Locator;
  readonly advancedSearchCountrySelect: Locator;
  readonly advancedSearchFormatInput: Locator;
  readonly advancedSearchButton: Locator;

  // Page elements
  readonly heading: Locator;
  readonly tagCloud: Locator;
  readonly categoryGrid: Locator;

  constructor(page: Page) {
    this.page = page;

    // Search components
    this.searchInput = page.locator('nb-tag-list input[nbTagInput]');
    this.searchIcon = page.locator('nb-icon[icon="search-outline"]').first();
    this.advancedSearchToggle = page.locator('nb-icon[icon*="arrow-ios"]').first();
    this.advancedSearchCard = page.locator('nb-card nb-card-body').nth(1);

    // Advanced search form
    this.advancedSearchEuroVocInput = page.locator('nb-tag-list input[placeholder*="EuroVoc"]');
    this.advancedSearchLicenseSelect = page.locator('nb-select[placeholder*="license"]');
    this.advancedSearchPublisherInput = page.locator('input[placeholder*="publisher"]');
    this.advancedSearchCountrySelect = page.locator('nb-select[placeholder*="Country"]');
    this.advancedSearchFormatInput = page.locator('nb-tag-list input[placeholder*="format"]');
    this.advancedSearchButton = page.locator('button:has-text("Search")');

    // Page elements
    this.heading = page.locator('h2.jumbotron-heading');
    this.tagCloud = page.locator('div.tags');
    this.categoryGrid = page.locator('div.category-icon');
  }

  async goto() {
    await this.page.goto('/pages/home');
    await waitForAngularReady(this.page);
  }

  async getDatasetCount(): Promise<number> {
    const headingText = await this.heading.textContent();
    const match = headingText?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async searchBasic(term: string) {
    await this.searchInput.fill(term);
    await this.searchInput.press('Enter');
    await waitForAngularHttp(this.page);
  }

  async clickSearchIcon() {
    await this.searchIcon.click();
    await waitForAngularHttp(this.page);
  }

  async toggleAdvancedSearch() {
    await this.advancedSearchToggle.click();
    await this.page.waitForTimeout(300); // Animation
  }

  async searchAdvanced(options: {
    euroVoc?: string;
    license?: string;
    publisher?: string;
    country?: string;
    format?: string;
  }) {
    // Open advanced search if not visible
    const isVisible = await this.advancedSearchCard.isVisible();
    if (!isVisible) {
      await this.toggleAdvancedSearch();
    }

    if (options.euroVoc) {
      await this.advancedSearchEuroVocInput.fill(options.euroVoc);
      await this.advancedSearchEuroVocInput.press('Enter');
    }

    if (options.license) {
      await this.advancedSearchLicenseSelect.click();
      await this.page.locator(`nb-option:has-text("${options.license}")`).click();
    }

    if (options.publisher) {
      await this.advancedSearchPublisherInput.fill(options.publisher);
    }

    if (options.country) {
      await this.advancedSearchCountrySelect.click();
      await this.page.locator(`nb-option:has-text("${options.country}")`).click();
    }

    if (options.format) {
      await this.advancedSearchFormatInput.fill(options.format);
      await this.advancedSearchFormatInput.press('Enter');
    }

    await this.advancedSearchButton.click();
    await waitForAngularHttp(this.page);
  }

  async clickTagInCloud(tagText: string) {
    await this.page.locator(`div.tags a:has-text("${tagText}")`).first().click();
    await waitForAngularHttp(this.page);
  }

  async getFirstTagText(): Promise<string> {
    const firstTag = this.page.locator('div.tags a').first();
    await firstTag.waitFor({ state: 'visible' });
    return (await firstTag.textContent()) || '';
  }

  async clickCategory(categoryName: string) {
    await this.page.locator(`div.category-icon:has-text("${categoryName}")`).first().click();
    await waitForAngularHttp(this.page);
  }

  async getCategoryCount(): Promise<number> {
    return await this.categoryGrid.count();
  }
}
