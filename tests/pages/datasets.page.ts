import { Page, Locator } from '@playwright/test';
import { waitForAngularReady, waitForAngularHttp } from '../helpers/angular.helper';

/**
 * Page Object Model for Datasets Search Page
 *
 * URL: /pages/datasets
 * Features:
 * - Search input with filters
 * - Facet filters (catalogues, categories, licenses, formats, countries, EuroVoc)
 * - Results grid with pagination
 * - Sorting controls
 */
export class DatasetsPage {
  readonly page: Page;

  // Search components
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly sortBySelect: Locator;

  // Facet filters
  readonly catalogueFacets: Locator;
  readonly categoryFacets: Locator;
  readonly licenseFacets: Locator;
  readonly formatFacets: Locator;
  readonly countryFacets: Locator;
  readonly eurovocFacets: Locator;

  // Results
  readonly resultsContainer: Locator;
  readonly datasetCards: Locator;
  readonly resultsCount: Locator;

  // Pagination
  readonly paginationContainer: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;
  readonly pageNumbers: Locator;

  constructor(page: Page) {
    this.page = page;

    // Search
    this.searchInput = page.locator('input[type="text"]').first();
    this.searchButton = page.locator('button:has-text("Search")').first();
    this.sortBySelect = page.locator('nb-select[placeholder*="Sort"]');

    // Facets (nb-accordion items)
    this.catalogueFacets = page.locator('nb-accordion-item:has-text("Catalogues")');
    this.categoryFacets = page.locator('nb-accordion-item:has-text("Categories")');
    this.licenseFacets = page.locator('nb-accordion-item:has-text("Licenses")');
    this.formatFacets = page.locator('nb-accordion-item:has-text("Formats")');
    this.countryFacets = page.locator('nb-accordion-item:has-text("Countries")');
    this.eurovocFacets = page.locator('nb-accordion-item:has-text("EuroVoc")');

    // Results
    this.resultsContainer = page.locator('div.row.search-results');
    this.datasetCards = page.locator('nb-card.result-card');
    this.resultsCount = page.locator('h5:has-text("results")');

    // Pagination
    this.paginationContainer = page.locator('pagination-controls');
    this.nextPageButton = page.locator('a[aria-label="Next"]');
    this.prevPageButton = page.locator('a[aria-label="Previous"]');
    this.pageNumbers = page.locator('pagination-controls li.page-number');
  }

  async goto() {
    await this.page.goto('/pages/datasets');
    await waitForAngularReady(this.page);
    await waitForAngularHttp(this.page);
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await waitForAngularHttp(this.page);
  }

  async getResultsCount(): Promise<number> {
    const text = await this.resultsCount.textContent();
    const match = text?.match(/(\d+)\s+results/);
    return match ? parseInt(match[1]) : 0;
  }

  async expandFacet(facetName: 'Catalogues' | 'Categories' | 'Licenses' | 'Formats' | 'Countries' | 'EuroVoc') {
    const facetMap = {
      'Catalogues': this.catalogueFacets,
      'Categories': this.categoryFacets,
      'Licenses': this.licenseFacets,
      'Formats': this.formatFacets,
      'Countries': this.countryFacets,
      'EuroVoc': this.eurovocFacets
    };

    const facet = facetMap[facetName];
    const header = facet.locator('nb-accordion-item-header');
    await header.click();
    await this.page.waitForTimeout(300); // Accordion animation
  }

  async selectFacetValue(facetName: 'Catalogues' | 'Categories' | 'Licenses' | 'Formats' | 'Countries' | 'EuroVoc', value: string) {
    const facetMap = {
      'Catalogues': this.catalogueFacets,
      'Categories': this.categoryFacets,
      'Licenses': this.licenseFacets,
      'Formats': this.formatFacets,
      'Countries': this.countryFacets,
      'EuroVoc': this.eurovocFacets
    };

    const facet = facetMap[facetName];

    // Ensure facet is expanded
    await this.expandFacet(facetName);

    // Click checkbox for the value
    const checkbox = facet.locator(`nb-checkbox:has-text("${value}")`);
    await checkbox.click();
    await waitForAngularHttp(this.page);
  }

  async sortBy(option: string) {
    await this.sortBySelect.click();
    await this.page.locator(`nb-option:has-text("${option}")`).click();
    await waitForAngularHttp(this.page);
  }

  async getDatasetTitles(): Promise<string[]> {
    const titles: string[] = [];
    const cards = await this.datasetCards.all();

    for (const card of cards) {
      const titleElement = card.locator('nb-card-header h6');
      const title = await titleElement.textContent();
      if (title) titles.push(title.trim());
    }

    return titles;
  }

  async clickDataset(index: number = 0) {
    const card = this.datasetCards.nth(index);
    await card.click();
    await waitForAngularHttp(this.page);
  }

  async goToNextPage() {
    await this.nextPageButton.click();
    await waitForAngularHttp(this.page);
  }

  async goToPrevPage() {
    await this.prevPageButton.click();
    await waitForAngularHttp(this.page);
  }

  async goToPage(pageNumber: number) {
    await this.page.locator(`pagination-controls a:has-text("${pageNumber}")`).click();
    await waitForAngularHttp(this.page);
  }

  async getCurrentPage(): Promise<number> {
    const activePage = this.page.locator('pagination-controls li.current a');
    const text = await activePage.textContent();
    return text ? parseInt(text) : 1;
  }
}

/**
 * Page Object Model for Dataset Detail Page
 *
 * URL: /pages/datasets/:id
 * Features:
 * - Dataset metadata display
 * - Distributions list
 * - Download/access links
 * - Map visualization (if geospatial)
 */
export class DatasetDetailPage {
  readonly page: Page;

  // Metadata sections
  readonly title: Locator;
  readonly description: Locator;
  readonly publisher: Locator;
  readonly themes: Locator;
  readonly keywords: Locator;
  readonly license: Locator;

  // Distributions
  readonly distributionsTab: Locator;
  readonly distributionCards: Locator;
  readonly downloadButtons: Locator;

  // Map (if geospatial)
  readonly mapContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Metadata
    this.title = page.locator('h3, h4').first();
    this.description = page.locator('p.description, div.description');
    this.publisher = page.locator('div:has-text("Publisher")').locator('..').locator('span, p').first();
    this.themes = page.locator('div:has-text("Themes")');
    this.keywords = page.locator('div:has-text("Keywords")');
    this.license = page.locator('div:has-text("License")');

    // Distributions
    this.distributionsTab = page.locator('nb-tab[tabTitle*="Distribution"]');
    this.distributionCards = page.locator('nb-card.distribution-card');
    this.downloadButtons = page.locator('button:has-text("Download"), a:has-text("Access")');

    // Map
    this.mapContainer = page.locator('div.leaflet-container');
  }

  async goto(datasetId: string) {
    await this.page.goto(`/pages/datasets/${datasetId}`);
    await waitForAngularReady(this.page);
    await waitForAngularHttp(this.page);
  }

  async getTitle(): Promise<string> {
    return (await this.title.textContent()) || '';
  }

  async getDescription(): Promise<string> {
    return (await this.description.textContent()) || '';
  }

  async clickDistributionsTab() {
    await this.distributionsTab.click();
    await this.page.waitForTimeout(300);
  }

  async getDistributionCount(): Promise<number> {
    await this.clickDistributionsTab();
    return await this.distributionCards.count();
  }

  async hasMap(): Promise<boolean> {
    return await this.mapContainer.isVisible();
  }

  async downloadDistribution(index: number = 0) {
    await this.clickDistributionsTab();
    const button = this.downloadButtons.nth(index);
    await button.click();
  }
}
