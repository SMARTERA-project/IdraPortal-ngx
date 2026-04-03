import { Page, Locator } from '@playwright/test';
import { waitForAngularReady, waitForAngularHttp, waitForMonacoReady } from '../helpers/angular.helper';

/**
 * Page Object Model for SPARQL Query Page
 *
 * URL: /pages/sparql
 * Features:
 * - Monaco code editor for SPARQL queries
 * - Execute query button
 * - Results table
 * - Download results (CSV, JSON, XML)
 * - Sample queries
 */
export class SparqlPage {
  readonly page: Page;

  // Editor
  readonly editorContainer: Locator;
  readonly editorTextarea: Locator;

  // Controls
  readonly executeButton: Locator;
  readonly clearButton: Locator;
  readonly downloadCSVButton: Locator;
  readonly downloadJSONButton: Locator;
  readonly downloadXMLButton: Locator;

  // Sample queries
  readonly sampleQueriesDropdown: Locator;

  // Results
  readonly resultsTable: Locator;
  readonly resultsRows: Locator;
  readonly resultsMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Monaco Editor
    this.editorContainer = page.locator('div.monaco-editor');
    this.editorTextarea = page.locator('div.monaco-editor textarea.inputarea');

    // Controls
    this.executeButton = page.locator('button:has-text("Execute"), button:has-text("Run")');
    this.clearButton = page.locator('button:has-text("Clear")');
    this.downloadCSVButton = page.locator('button:has-text("CSV"), a[download*=".csv"]');
    this.downloadJSONButton = page.locator('button:has-text("JSON"), a[download*=".json"]');
    this.downloadXMLButton = page.locator('button:has-text("XML"), a[download*=".xml"]');

    // Sample queries
    this.sampleQueriesDropdown = page.locator('nb-select[placeholder*="Sample"], nb-select[placeholder*="Example"]');

    // Results
    this.resultsTable = page.locator('table.results-table, nb-card table');
    this.resultsRows = page.locator('table tbody tr');
    this.resultsMessage = page.locator('div.results-message, p.results-info');
  }

  async goto() {
    await this.page.goto('/pages/sparql');
    await waitForAngularReady(this.page);
    await waitForMonacoReady(this.page);
  }

  async isEditorReady(): Promise<boolean> {
    return await this.editorContainer.isVisible();
  }

  async setQueryText(query: string) {
    // Clear existing query
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.press('Delete');

    // Type new query
    await this.editorTextarea.focus();
    await this.page.keyboard.type(query);
    await this.page.waitForTimeout(300);
  }

  async getQueryText(): Promise<string> {
    // Get text from Monaco editor
    return await this.page.evaluate(() => {
      const monaco = (window as any).monaco;
      if (!monaco || !monaco.editor) return '';

      const editors = monaco.editor.getEditors();
      if (editors.length === 0) return '';

      return editors[0].getValue();
    });
  }

  async executeQuery() {
    await this.executeButton.click();
    await waitForAngularHttp(this.page);
  }

  async clearQuery() {
    await this.clearButton.click();
    await this.page.waitForTimeout(200);
  }

  async selectSampleQuery(sampleName: string) {
    await this.sampleQueriesDropdown.click();
    await this.page.locator(`nb-option:has-text("${sampleName}")`).click();
    await this.page.waitForTimeout(500); // Wait for query to load
  }

  async getResultsRowCount(): Promise<number> {
    try {
      await this.resultsTable.waitFor({ state: 'visible', timeout: 2000 });
      return await this.resultsRows.count();
    } catch {
      return 0;
    }
  }

  async hasResults(): Promise<boolean> {
    return await this.resultsTable.isVisible();
  }

  async getResultsMessage(): Promise<string> {
    try {
      await this.resultsMessage.waitFor({ state: 'visible', timeout: 2000 });
      return (await this.resultsMessage.textContent()) || '';
    } catch {
      return '';
    }
  }

  async downloadResults(format: 'CSV' | 'JSON' | 'XML') {
    const buttonMap = {
      'CSV': this.downloadCSVButton,
      'JSON': this.downloadJSONButton,
      'XML': this.downloadXMLButton
    };

    const button = buttonMap[format];

    // Start waiting for download before clicking
    const downloadPromise = this.page.waitForEvent('download', { timeout: 10000 });
    await button.click();

    return await downloadPromise;
  }

  async getResultsTableHeaders(): Promise<string[]> {
    const headers: string[] = [];
    const headerElements = await this.resultsTable.locator('thead th').all();

    for (const header of headerElements) {
      const text = await header.textContent();
      if (text) headers.push(text.trim());
    }

    return headers;
  }
}
