import { Page, Locator } from '@playwright/test';
import { waitForAngularReady, waitForAngularHttp } from '../helpers/angular.helper';

/**
 * Page Object Model for Admin Configuration Page
 *
 * URL: /pages/administration/configuration
 * Features:
 * - Accordion: Catalogues (refresh period, RDF toggle)
 * - Accordion: SPARQL prefixes (list, add, edit, delete)
 * - Accordion: Remote Catalogues list
 * - Accordion: Context Broker (enable toggle, URL input)
 */
export class AdminConfigurationPage {
  readonly page: Page;

  readonly accordion: Locator;
  readonly accordionItems: Locator;
  readonly cataloguesAccordionHeader: Locator;
  readonly sparqlAccordionHeader: Locator;
  readonly remoteCatalogueAccordionHeader: Locator;
  readonly contextBrokerAccordionHeader: Locator;
  readonly refreshPeriodSelect: Locator;
  readonly rdfCheckbox: Locator;
  readonly applyButton: Locator;
  readonly sparqlTable: Locator;
  readonly addSparqlPrefixButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.accordion = page.locator('nb-accordion');
    this.accordionItems = page.locator('nb-accordion-item');
    this.cataloguesAccordionHeader = page.locator('nb-accordion-item-header').nth(0);
    this.sparqlAccordionHeader = page.locator('nb-accordion-item-header').nth(1);
    this.remoteCatalogueAccordionHeader = page.locator('nb-accordion-item-header').nth(2);
    this.contextBrokerAccordionHeader = page.locator('nb-accordion-item-header').nth(3);
    this.refreshPeriodSelect = page.locator('nb-select').first();
    this.rdfCheckbox = page.locator('nb-checkbox').first();
    this.applyButton = page.locator('button:has-text("Apply"), button:has-text("APPLY")').first();
    this.sparqlTable = page.locator('nb-card table').first();
    this.addSparqlPrefixButton = page.locator('button').filter({ hasText: /add prefix/i }).first();
  }

  async goto() {
    await this.page.goto('/pages/administration/configuration');
    await waitForAngularReady(this.page);
    await waitForAngularHttp(this.page);
  }

  async getAccordionCount(): Promise<number> {
    return await this.accordionItems.count();
  }

  async expandAccordion(index: number) {
    const header = this.page.locator('nb-accordion-item-header').nth(index);
    await header.click();
    await this.page.waitForTimeout(300); // animation
  }

  async getAccordionHeaders(): Promise<string[]> {
    const headers = this.page.locator('nb-accordion-item-header');
    const count = await headers.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).textContent())?.trim() ?? '';
      if (text) texts.push(text);
    }
    return texts;
  }

  async getSparqlPrefixRowCount(): Promise<number> {
    try {
      const rows = this.page.locator('nb-card table tbody tr');
      return await rows.count();
    } catch {
      return 0;
    }
  }
}
