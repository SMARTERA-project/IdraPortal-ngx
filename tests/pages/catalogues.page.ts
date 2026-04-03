import { Page, Locator } from '@playwright/test';
import { waitForAngularReady, waitForAngularHttp } from '../helpers/angular.helper';

/**
 * Page Object Model for Catalogues Page
 *
 * URL: /pages/catalogues
 * Features:
 * - List of federated ODMS catalogues
 * - Catalogue cards with metadata
 * - Filter/search catalogues
 * - View catalogue details
 */
export class CataloguesPage {
  readonly page: Page;

  // Search/filter
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  // Catalogues list
  readonly catalogueCards: Locator;
  readonly catalogueNames: Locator;
  readonly catalogueDescriptions: Locator;

  // Catalogue metadata
  readonly catalogueTypes: Locator;
  readonly datasetCounts: Locator;

  constructor(page: Page) {
    this.page = page;

    // Search
    this.searchInput = page.locator('input[type="text"], input[placeholder*="Search"]').first();
    this.searchButton = page.locator('button:has-text("Search")').first();

    // Catalogues
    this.catalogueCards = page.locator('nb-card.catalogue-card, nb-card');
    this.catalogueNames = page.locator('nb-card-header h5, nb-card-header h6');
    this.catalogueDescriptions = page.locator('nb-card-body p');

    // Metadata
    this.catalogueTypes = page.locator('span:has-text("Type:"), div:has-text("Type:")');
    this.datasetCounts = page.locator('span:has-text("Datasets:"), div:has-text("Datasets:")');
  }

  async goto() {
    await this.page.goto('/pages/catalogues');
    await waitForAngularReady(this.page);
    await waitForAngularHttp(this.page);
  }

  async getCatalogueCount(): Promise<number> {
    return await this.catalogueCards.count();
  }

  async getCatalogueNames(): Promise<string[]> {
    const names: string[] = [];
    const elements = await this.catalogueNames.all();

    for (const element of elements) {
      const name = await element.textContent();
      if (name) names.push(name.trim());
    }

    return names;
  }

  async searchCatalogues(term: string) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await waitForAngularHttp(this.page);
  }

  async getCatalogueType(index: number = 0): Promise<string> {
    const card = this.catalogueCards.nth(index);
    const typeElement = card.locator('span:has-text("Type:"), div:has-text("Type:")').first();
    const text = await typeElement.textContent();
    return text?.replace('Type:', '').trim() || '';
  }

  async getCatalogueDatasetCount(index: number = 0): Promise<number> {
    const card = this.catalogueCards.nth(index);
    const countElement = card.locator('span:has-text("Datasets:"), div:has-text("Datasets:")').first();
    const text = await countElement.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async clickCatalogue(index: number = 0) {
    const card = this.catalogueCards.nth(index);
    await card.click();
    await waitForAngularHttp(this.page);
  }

  async clickCatalogueByName(name: string) {
    await this.page.locator(`nb-card:has-text("${name}")`).first().click();
    await waitForAngularHttp(this.page);
  }

  async hasCatalogues(): Promise<boolean> {
    return (await this.getCatalogueCount()) > 0;
  }
}
