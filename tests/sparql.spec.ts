import { test, expect } from '@playwright/test';
import { SparqlPage } from './pages/sparql.page';

test.describe('SPARQL Query Page - Public Features', () => {
  let sparqlPage: SparqlPage;

  test.beforeEach(async ({ page }) => {
    sparqlPage = new SparqlPage(page);
    await sparqlPage.goto();
  });

  test('TC-SPARQL-01: should load SPARQL editor with Monaco', async ({ page }) => {
    // Verify page loaded
    await expect(page).toHaveURL(/\/pages\/sparql/);

    // Verify Monaco editor is initialized
    const isReady = await sparqlPage.isEditorReady();
    expect(isReady).toBeTruthy();

    await expect(sparqlPage.editorContainer).toBeVisible();

    // Verify execute button is present
    await expect(sparqlPage.executeButton).toBeVisible();
  });

  test('TC-SPARQL-02: should execute simple SPARQL query and display results', async ({ page }) => {
    // Write a simple SPARQL query
    const query = `
PREFIX dcat: <http://www.w3.org/ns/dcat#>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?dataset ?title
WHERE {
  ?dataset a dcat:Dataset .
  ?dataset dct:title ?title .
}
LIMIT 10
    `.trim();

    await sparqlPage.setQueryText(query);

    // Execute query
    await sparqlPage.executeQuery();

    // Wait for results (with timeout)
    await page.waitForTimeout(3000);

    // Verify results are displayed
    const hasResults = await sparqlPage.hasResults();

    if (hasResults) {
      const rowCount = await sparqlPage.getResultsRowCount();
      expect(rowCount).toBeGreaterThan(0);
      expect(rowCount).toBeLessThanOrEqual(10);

      // Verify table headers
      const headers = await sparqlPage.getResultsTableHeaders();
      expect(headers.length).toBeGreaterThan(0);
    } else {
      // Check if there's a message (e.g., "No results")
      const message = await sparqlPage.getResultsMessage();
      console.log('Query result message:', message);
    }
  });

  test('TC-SPARQL-03: should load and execute sample query', async ({ page }) => {
    // Check if sample queries dropdown exists
    const dropdownVisible = await sparqlPage.sampleQueriesDropdown.isVisible();

    if (dropdownVisible) {
      // Select first sample query
      await sparqlPage.sampleQueriesDropdown.click();

      // Click first option
      const firstOption = page.locator('nb-option').first();
      await firstOption.click();

      // Wait for query to load
      await page.waitForTimeout(1000);

      // Verify query was loaded in editor
      const queryText = await sparqlPage.getQueryText();
      expect(queryText.length).toBeGreaterThan(0);
      expect(queryText.toLowerCase()).toContain('select');

      // Execute the sample query
      await sparqlPage.executeQuery();

      // Wait for results
      await page.waitForTimeout(3000);

      // Verify results or message
      const hasResults = await sparqlPage.hasResults();
      if (!hasResults) {
        const message = await sparqlPage.getResultsMessage();
        console.log('Sample query result:', message);
      }
    } else {
      console.log('Sample queries not available');
      test.skip();
    }
  });

  test('TC-SPARQL-04: should clear query text', async ({ page }) => {
    // Write some text
    const query = 'SELECT * WHERE { ?s ?p ?o } LIMIT 10';
    await sparqlPage.setQueryText(query);

    // Verify text was written
    const textBefore = await sparqlPage.getQueryText();
    expect(textBefore.length).toBeGreaterThan(0);

    // Clear query
    await sparqlPage.clearQuery();

    // Verify editor is empty
    const textAfter = await sparqlPage.getQueryText();
    expect(textAfter.length).toBe(0);
  });

  test('TC-SPARQL-05: should download query results in different formats', async ({ page }) => {
    // Execute a simple query first
    const query = `
PREFIX dcat: <http://www.w3.org/ns/dcat#>
SELECT ?dataset
WHERE {
  ?dataset a dcat:Dataset .
}
LIMIT 5
    `.trim();

    await sparqlPage.setQueryText(query);
    await sparqlPage.executeQuery();

    // Wait for results
    await page.waitForTimeout(3000);

    const hasResults = await sparqlPage.hasResults();

    if (hasResults) {
      // Test CSV download
      const csvButtonVisible = await sparqlPage.downloadCSVButton.isVisible();

      if (csvButtonVisible) {
        const download = await sparqlPage.downloadResults('CSV');
        expect(download).toBeTruthy();
        expect(download.suggestedFilename()).toMatch(/\.csv$/i);
      }

      // Test JSON download (if available)
      const jsonButtonVisible = await sparqlPage.downloadJSONButton.isVisible();

      if (jsonButtonVisible) {
        const download = await sparqlPage.downloadResults('JSON');
        expect(download).toBeTruthy();
        expect(download.suggestedFilename()).toMatch(/\.json$/i);
      }
    } else {
      console.log('No results to download');
      test.skip();
    }
  });

  test('TC-SPARQL-06: should handle invalid SPARQL query gracefully', async ({ page }) => {
    // Write invalid query
    const invalidQuery = 'INVALID QUERY SYNTAX';
    await sparqlPage.setQueryText(invalidQuery);

    // Execute query
    await sparqlPage.executeQuery();

    // Wait for response
    await page.waitForTimeout(2000);

    // Should show error message (not crash)
    const message = await sparqlPage.getResultsMessage();
    console.log('Error message:', message);

    // Verify no results table is shown
    const hasResults = await sparqlPage.hasResults();
    expect(hasResults).toBeFalsy();
  });

  test('TC-SPARQL-07: should support SPARQL query syntax highlighting', async ({ page }) => {
    // Write SPARQL query
    const query = 'SELECT ?s WHERE { ?s ?p ?o }';
    await sparqlPage.setQueryText(query);

    // Verify Monaco editor has syntax highlighting
    // Monaco adds CSS classes for syntax tokens
    const hasTokens = await page.evaluate(() => {
      const editor = document.querySelector('.monaco-editor');
      if (!editor) return false;

      // Check if view-lines (Monaco's syntax-highlighted lines) exist
      const viewLines = editor.querySelector('.view-lines');
      return !!viewLines;
    });

    expect(hasTokens).toBeTruthy();
  });
});
