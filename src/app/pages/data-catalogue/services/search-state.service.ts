import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { SearchRequest } from '../model/search-request';

export interface SearchState {
  // Query string the search page was opened with: the state is restored only for the same entry point.
  origin: string;
  searchRequest: SearchRequest;
  filters: Array<string>;
  isHVD_Dataset: boolean | null;
  page: number;
  totalDatasets: number;
  facetLimits: { [facet: string]: number };
  // Window scroll offset when leaving the search page.
  scrollY?: number;
}

// Keeps the last dataset search (keywords, facets, page) so that coming back from a dataset page,
// via browser back or the "Data Catalogue" menu entry, shows the same results.
@Injectable({ providedIn: 'root' })
export class SearchStateService {

  private static readonly STORAGE_KEY = 'idra.datasetSearchState';

  static originOf(queryParams: Params): string {
    return Object.keys(queryParams || {}).sort()
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');
  }

  save(state: SearchState): void {
    try {
      sessionStorage.setItem(SearchStateService.STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable (private mode, quota): restore is a best-effort convenience
    }
  }

  // Returns the saved state when the page is reopened without query params (menu link)
  // or, with browser back/forward, with the same query params it was first opened with.
  // A new link with query params (e.g. a tag clicked on the home page) always starts a fresh search.
  restore(queryParams: Params, isHistoryNavigation: boolean): SearchState | null {
    let state: SearchState | null = null;
    try {
      const raw = sessionStorage.getItem(SearchStateService.STORAGE_KEY);
      state = raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
    if (!state?.searchRequest) return null;
    const origin = SearchStateService.originOf(queryParams);
    return origin === '' || (isHistoryNavigation && origin === state.origin) ? state : null;
  }
}
