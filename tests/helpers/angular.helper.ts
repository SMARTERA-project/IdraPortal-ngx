import { Page } from '@playwright/test';

/**
 * Angular Wait Helpers
 *
 * Utilities to synchronize Playwright with Angular's asynchronous operations
 * including zone.js stabilization, HTTP requests, and Nebular components.
 */

/**
 * Wait for Angular zone to stabilize
 *
 * This ensures all microtasks and macrotasks are completed before proceeding.
 * Essential for Angular SPAs where DOM updates happen asynchronously.
 */
export async function waitForAngularReady(page: Page, timeout: number = 5000): Promise<void> {
  try {
    await page.waitForFunction(
      () => {
        const zone = (window as any).Zone;
        if (!zone) return true; // Zone.js not loaded yet, consider ready

        // Check if all async tasks are complete
        const context = zone.current;
        return !context._properties || !context._properties['queue'] || context._properties['queue'].length === 0;
      },
      { timeout }
    );

    // Additional wait for any pending animations
    await page.waitForTimeout(100);
  } catch (error) {
    console.warn('waitForAngularReady timeout - proceeding anyway');
  }
}

/**
 * Wait for all HTTP requests to complete
 *
 * Useful after triggering actions that fetch data from Idra backend.
 */
export async function waitForAngularHttp(page: Page, timeout: number = 10000): Promise<void> {
  try {
    // Wait for network to be idle (no more than 2 connections for 500ms)
    await page.waitForLoadState('networkidle', { timeout });
  } catch (error) {
    console.warn('waitForAngularHttp timeout - proceeding anyway');
  }
}

/**
 * Wait for Nebular spinner to disappear
 *
 * Nebular components often show a spinner during loading.
 * This helper waits for [nbSpinner] overlay to be detached.
 */
export async function waitForNebularLoading(page: Page, timeout: number = 10000): Promise<void> {
  try {
    // Wait for spinner overlay to be hidden
    await page.waitForSelector('nb-layout-spinner', { state: 'hidden', timeout });
  } catch (error) {
    // Spinner might not exist or already gone
    console.warn('waitForNebularLoading - spinner not found or already hidden');
  }
}

/**
 * Wait for ECharts to render
 *
 * ECharts graphs need time to initialize and render.
 */
export async function waitForEChartsReady(page: Page, selector: string = 'div[echarts]', timeout: number = 5000): Promise<void> {
  try {
    // Wait for echarts container to exist
    await page.waitForSelector(selector, { state: 'visible', timeout });

    // Wait for echarts instance to be initialized
    await page.waitForFunction(
      (sel) => {
        const container = document.querySelector(sel);
        if (!container) return false;

        // Check if echarts instance exists on the container
        const instance = (window as any).echarts?.getInstanceByDom(container);
        return !!instance;
      },
      selector,
      { timeout }
    );

    // Additional wait for rendering
    await page.waitForTimeout(300);
  } catch (error) {
    console.warn('waitForEChartsReady timeout - chart may not be ready');
  }
}

/**
 * Wait for Monaco Editor to load
 *
 * Monaco editor (used in SPARQL page) needs time to initialize.
 */
export async function waitForMonacoReady(page: Page, timeout: number = 5000): Promise<void> {
  try {
    // Wait for monaco editor container
    await page.waitForSelector('div.monaco-editor', { state: 'visible', timeout });

    // Wait for monaco to be fully loaded
    await page.waitForFunction(
      () => {
        const monaco = (window as any).monaco;
        return monaco && monaco.editor;
      },
      { timeout }
    );

    // Additional wait for editor initialization
    await page.waitForTimeout(300);
  } catch (error) {
    console.warn('waitForMonacoReady timeout - editor may not be ready');
  }
}

/**
 * Wait for Nebular Tree Grid to render
 *
 * Nebular Tree Grid (used in MQA page) needs time to build tree structure.
 */
export async function waitForTreeGridReady(page: Page, timeout: number = 5000): Promise<void> {
  try {
    // Wait for tree grid table
    await page.waitForSelector('table[nbtreegrid]', { state: 'visible', timeout });

    // Wait for at least one row to be rendered
    await page.waitForSelector('table[nbtreegrid] tbody tr', { state: 'visible', timeout });

    // Additional wait for tree expansion icons
    await page.waitForTimeout(300);
  } catch (error) {
    console.warn('waitForTreeGridReady timeout - tree grid may not be ready');
  }
}
