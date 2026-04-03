import { Page, Locator } from '@playwright/test';
import { waitForAngularReady, waitForAngularHttp } from '../helpers/angular.helper';

/**
 * Page Object Model for Admin Catalogues List
 *
 * URL: /pages/administration/adminCatalogues
 * Features:
 * - Tree grid listing all federated catalogues
 * - Search/filter input
 * - Toggle active/inactive per catalogue
 * - Actions: sync, edit, delete, MQA analysis, download dump
 * - Add catalogue button (navigates to addCatalogue form)
 * - Remote catalogues list button
 */
export class AdminCataloguesPage {
  readonly page: Page;

  readonly searchInput: Locator;
  readonly cataloguesTable: Locator;
  readonly tableRows: Locator;
  readonly heading: Locator;
  readonly addCatalogueIcon: Locator;
  readonly remoteCataloguesIcon: Locator;
  readonly downloadDumpIcon: Locator;

  constructor(page: Page) {
    this.page = page;

    this.searchInput = page.locator('input[nbFilterInput]').first();
    // Nebular renders [nbTreeGrid] as 'nbtreegrid' attribute (lowercase), but
    // we target via the nb-card context to avoid selector ambiguity
    this.cataloguesTable = page.locator('nb-card table').first();
    this.tableRows = page.locator('nb-card table tbody tr');
    this.heading = page.locator('h2.jumbotron-heading');
    this.addCatalogueIcon = page.locator('nb-icon[icon="plus-circle-outline"]');
    this.remoteCataloguesIcon = page.locator('nb-icon[icon="list-outline"]');
    this.downloadDumpIcon = page.locator('nb-icon[icon="download-outline"]').first();
  }

  async goto() {
    await this.page.goto('/pages/administration/adminCatalogues');
    await waitForAngularReady(this.page);
    await waitForAngularHttp(this.page);
  }

  async waitForTableReady(timeout = 15000) {
    try {
      await this.cataloguesTable.waitFor({ state: 'visible', timeout });
    } catch {
      // table may be empty or no catalogues loaded
    }
  }

  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  async searchCatalogues(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(400); // debounce
  }

  async clearSearch() {
    await this.searchInput.fill('');
    await this.page.waitForTimeout(400);
  }

  async getColumnHeaders(): Promise<string[]> {
    const headers = this.page.locator('nb-card table th');
    const count = await headers.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).textContent())?.trim() ?? '';
      if (text) texts.push(text);
    }
    return texts;
  }

  async getTotalCataloguesFromHeading(): Promise<number> {
    const text = await this.heading.textContent();
    const match = text?.match(/\((\d+)\)/);
    return match ? parseInt(match[1]) : 0;
  }

  async getFirstRowName(): Promise<string> {
    const firstNameCell = this.page.locator('nb-card table tbody tr td a').first();
    return (await firstNameCell.textContent())?.trim() ?? '';
  }
}
