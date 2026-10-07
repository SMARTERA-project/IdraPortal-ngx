import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbCardModule, NbSpinnerModule, NbTagComponent, NbTagInputAddEvent, NbTagModule, NbListModule, NbIconModule, NbCheckboxModule, NbTooltipModule, NbButtonModule } from '@nebular/theme';
import { NgxPaginationModule } from 'ngx-pagination';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { DCATDataset,FormatCount } from '../model/dcatdataset';
import { ODMSCatalogueInfo } from '../model/odmscatalogue-info';
import { SearchFacet } from '../model/search-facet';
import { SearchFilter } from '../model/search-filter';
import { SearchRequest } from '../model/search-request';
import { SearchResult } from '../model/search-result';
import { DataCataglogueAPIService } from '../services/data-cataglogue-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MetadataLocalizationService } from '../services/metadata-localization.service';
import { SearchStateService } from '../services/search-state.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterModule,
    // Nebular UI modules used in template
    NbCardModule,
    NbSpinnerModule,
    NbTagModule,
    NbListModule,
    NbIconModule,
    NbCheckboxModule,
    NbTooltipModule,
    NbButtonModule,
    NbEvaIconsModule,
    // Third-party
    NgxPaginationModule,
  ],
  selector: 'ngx-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {


  searchResponse: SearchResult = new SearchResult();
  searchRequest: SearchRequest = new SearchRequest();

  cataloguesInfos: Array<ODMSCatalogueInfo> = []

  constructor(private restApi: DataCataglogueAPIService,
    public router: Router,
    private route: ActivatedRoute,
    public translation: TranslateService,
    private metadataLocalizationService: MetadataLocalizationService,
    private searchState: SearchStateService,
  ) {
    // read here: the navigation that created the component is still current only during construction
    this.isHistoryNavigation = this.router.currentNavigation()?.trigger === 'popstate';
  }

  // true when the page is reached with the browser back/forward buttons
  private readonly isHistoryNavigation: boolean;

  loading = false;

  facetLimits = {};
  page = 1;

  totalDatasets: number = 0;
  currentDatasets: number = 0;

  filters: Array<string> = [];
  // active filters shown as removable chips above the results
  filterChips: Array<{ field: string; value: string; label: string }> = [];
  isHVD_Dataset: boolean | null = null; // null = show all
  private languageSubscription?: Subscription;
  private selectedLanguage = 'en';
  // Query string the current search started from; null until the initial query params are processed.
  private searchOrigin: string | null = null;
  // Window scroll offset to reapply once the restored results are rendered.
  private pendingScrollY: number | null = null;

  ngOnDestroy() {
    this.saveSearchState(window.scrollY);
    this.languageSubscription?.unsubscribe();
  }

  ngOnInit(): void { 
    // Ensure stable defaults before first render
    this.searchRequest.rows = this.searchRequest.rows || 10;
    this.searchRequest.start = this.searchRequest.start || 0;
    this.searchResponse.facets = this.searchResponse.facets || [];
    (this.searchResponse as any).results = (this.searchResponse as any).results || [];
    (this.searchResponse as any).count = (this.searchResponse as any).count || 0;
    this.selectedLanguage = (this.translation.currentLang || 'en').toLowerCase();
    this.searchRequest.language = this.selectedLanguage;
    this.languageSubscription = this.translation.onLangChange.subscribe((event) => {
      this.selectedLanguage = (event?.lang || 'en').toLowerCase();
      this.searchRequest.language = this.selectedLanguage;
      this.searchDataset();
    });
    this.loading=true
    this.restApi.getCataloguesInfo().subscribe({
      next: (infos) =>{
        this.cataloguesInfos = infos;
        this.searchRequest.nodes = infos.map(x=>x.id)
        this.loading=false

        let searchParam = this.router.routerState.snapshot.root.queryParams

        const savedState = this.searchState.restore(searchParam, this.isHistoryNavigation);
        if (savedState) {
          this.searchOrigin = savedState.origin;
          this.searchRequest = Object.assign(new SearchRequest(), savedState.searchRequest);
          this.searchRequest.nodes = infos.map(x => x.id);
          this.filters = savedState.filters || [];
          this.isHVD_Dataset = savedState.isHVD_Dataset ?? null;
          this.page = savedState.page || 1;
          this.totalDatasets = savedState.totalDatasets || 0;
          this.facetLimits = savedState.facetLimits || {};
          this.pendingScrollY = savedState.scrollY || null;
          this.searchDataset();
          return;
        }
        this.searchOrigin = SearchStateService.originOf(searchParam);

        if(searchParam['advancedSearch'] == 'true'){
          this.searchRequest = JSON.parse(searchParam['params']);
          // Update the local HVD state from the search request
          if(this.searchRequest.hasHvdCategory) {
            this.isHVD_Dataset = true;
          }
          // this.filtersTags = searchParam['params'].filters.map(x=>x.value);
          this.searchDataset(true)
        } else{
          if(searchParam['type']!=undefined){
            this.searchRequest.filters.push(new SearchFilter('catalogues',SearchFilter.joinValues([searchParam.search_value])))
            this.searchDataset(true)
          }
          else if(searchParam['name']!=undefined){
            // this.filtersTags.push(searchParam.name)
            this.searchRequest.filters.push(new SearchFilter('tags',SearchFilter.joinValues([searchParam.search_value])))
            this.searchDataset(true)
          }
          else if(searchParam['text']!=undefined){
            // this.filtersTags.push(searchParam.value)
            this.searchRequest.filters.push(new SearchFilter('datasetThemes',SearchFilter.joinValues([searchParam.search_value])))
            this.searchDataset(true)
          }
          else if(searchParam['tags']!=undefined){
            let tags = searchParam.tags.split(',')
            // tags.forEach(element => {
            //   this.filtersTags.push(element)
            // });
            this.searchRequest.filters.push(new SearchFilter('tags',searchParam.tags))
            this.searchDataset(true)
          } 
          else if(searchParam['all']!=undefined){
            let tags = searchParam.all.split(',')
            this.searchRequest.filters.push(new SearchFilter('ALL',searchParam.all))
            this.searchDataset(true)
          } else{
            this.searchDataset(true)
          }
        }

      },error: err =>{ 
        console.log(err);
        this.loading=false;
      }
    });
  }

  updateFilters(tags) {
    this.filters = tags;
    this.searchDataset()
  }



  toggleHasHVDCategory(value: boolean) {
    if (this.isHVD_Dataset === value) {
      this.isHVD_Dataset = null;
    } else {
      this.searchRequest.hasHvdCategory = undefined;
      this.isHVD_Dataset = value;
    }
    this.searchRequest.hasHvdCategory = this.isHVD_Dataset;
    this.searchDataset();
  }

  pageChanged($event: number) {
    this.page = $event;
    this.searchRequest.start = ($event - 1) * this.searchRequest.rows;
    this.searchDataset()
  }

  searchDataset(isFirst = false): Observable<SearchResult> {
    this.loading = true
    this.filterChips = [];
    this.filters = [];
    this.searchRequest.language = this.selectedLanguage;
    this.keywordFilter();

    this.searchRequest.filters.forEach(x => {
      if (x.field == 'ALL') {
        SearchFilter.splitValues(x.value).forEach(y => {
          this.filterChips.push({ field: x.field, value: y, label: y });
          this.filters.push(y);
        })
      } else if (x.value != '') {
        // label from the i18n keys, not from the facets of the previous response (empty on first search)
        const titleKey = this.facetTitleKeys[x.field];
        const name = titleKey ? this.translation.instant(titleKey) : x.field;
        SearchFilter.splitValues(x.value).forEach(y => {
          const themeKey = this.themeFacetKey(x.field, y);
          const valueLabel = themeKey ? this.translation.instant(themeKey) : y;
          this.filterChips.push({ field: x.field, value: y, label: name + ': ' + valueLabel });
        })
      }
    })

    this.restApi.searchDatasets(this.searchRequest).subscribe({
      next: (res)=>{
        this.searchResponse=res
        this.currentDatasets = this.searchResponse.count;  
        if(isFirst){
          this.totalDatasets = this.searchResponse.count;  
        }
        this.saveSearchState();
        this.searchResponse.results.map((x: DCATDataset) => { this.processDataset(x) })
        this.loading = false;
        if (this.pendingScrollY !== null) {
          const scrollY = this.pendingScrollY;
          this.pendingScrollY = null;
          // wait for the results to be rendered before scrolling
          setTimeout(() => window.scrollTo(0, scrollY));
        }
      },
      error: (err)=>{
        console.log(err);
        this.loading=false;
      }
    });
// create an observable of this.searchResponse

    return new Observable<SearchResult>(observer => {
      observer.next(this.searchResponse);
      observer.complete();
    });
  }

  hasActiveFilters(): boolean {
    return this.filterChips.length > 0 || this.isHVD_Dataset !== null;
  }

  clearFilters(): void {
    const request = new SearchRequest();
    request.nodes = this.cataloguesInfos.map(x => x.id);
    request.rows = this.searchRequest.rows;
    this.searchRequest = request;
    this.filters = [];
    this.isHVD_Dataset = null;
    this.page = 1;
    this.facetLimits = {};
    // drop entry-point query params (e.g. ?tags=...) so they are not reapplied on the next visit
    this.searchOrigin = '';
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    this.searchDataset();
  }

  private saveSearchState(scrollY = 0): void {
    if (this.searchOrigin === null) return;
    this.searchState.save({
      origin: this.searchOrigin,
      searchRequest: this.searchRequest,
      filters: this.filters,
      isHVD_Dataset: this.isHVD_Dataset,
      page: this.page,
      totalDatasets: this.totalDatasets,
      facetLimits: this.facetLimits,
      scrollY,
    });
  }

  onTagRemove(tagToRemove: NbTagComponent): void {
    this.removeKeyword(tagToRemove.text);
  }

  // The free-text keywords live in the 'ALL' filter; the backend rejects a request without it,
  // so it is emptied but never removed.
  private keywordFilter(): SearchFilter {
    let filter = this.searchRequest.filters.find(x => x.field == 'ALL');
    if (!filter) {
      filter = new SearchFilter();
      this.searchRequest.filters.unshift(filter);
    }
    return filter;
  }

  private removeKeyword(keyword: string): void {
    const filter = this.keywordFilter();
    filter.value = SearchFilter.joinValues(SearchFilter.splitValues(filter.value).filter(x => x != keyword));
    this.page = 1;
    this.searchRequest.start = 0;
    this.searchDataset();
  }

  onTagAdd({ value, input }: NbTagInputAddEvent): void {
    //added timeout since comma doesn't desapear from input
    setTimeout(() => {
      if (input != undefined)
        input.nativeElement.value = ''
      if (value) {
        const filter = this.keywordFilter();
        filter.value = SearchFilter.joinValues([...SearchFilter.splitValues(filter.value), value]);
        this.page = 1;
        this.searchRequest.start = 0;
        this.searchDataset()
      }
    }, 50);


  }


  getFacetsLimit(facet) {
    if (this.facetLimits[facet] == undefined) {
      this.facetLimits[facet] = 10;
    }
    return this.facetLimits[facet];
  }

  setFacetsLimit(facet, value) {
    this.facetLimits[facet] = value;
  }


  processDataset(dataset: DCATDataset): DCATDataset {
    this.metadataLocalizationService.applyDatasetLocalization(dataset, this.selectedLanguage);

    let tmp = [];
    dataset.distributionFormats = [];
    for (let d of (dataset.distributions || [])) {
      if (tmp.indexOf(d.format) < 0) {
        let fC = new FormatCount();
        fC.format = d.format;
        fC.count = 1;
        dataset.distributionFormats.push(fC);
        tmp.push(d.format);
      } else {
        dataset.distributionFormats[tmp.indexOf(d.format)].count++;
      }
    }

    const descriptionValue = (dataset.description || '').toString();
    dataset.description = descriptionValue.replace(/\*/g, '').replace(/\\n/g, '')
      .replace(/\(http.*\)/g, '').replace(/##\s*/g, '')
      .replace(/<.*>(.*)<\/.*>/g, '$1')
      .replace(/>/g, '').replace(/\[|\]/g, '');

    return dataset;
  }

  getColor(format: string): string {
    switch (format.toLowerCase()) {
      case 'csv':
        return '#dfb100';
      case 'html':
        return '#55a1ce';
      case 'json':
      case 'xml':
        return '#ef7100';
      case 'text':
      case 'txt':
        return '#74cbec';
      case 'xls':
      case 'xlsx':
        return '#2db55d';
      case 'zip':
        return '#686868';
      case 'api':
        return 'ec96be';
      case 'pdf':
        return '#e0051e';
      case 'rdf':
      case 'nquad':
      case 'turtle':
      case 'ntriples':
        return '#0b4498';
      case 'fiware':
      case 'ngsi':
      case 'ngsi-ld':
      case 'fiware-ngsi':
      case 'fiware-ngsi-ld':
        return '#65c3d1';
      default:
        return 'default';
    }
  }

  onFilterRemove(filter: NbTagComponent): void {
    const chip = this.filterChips.find(x => x.label == filter.text);
    if (!chip) return;
    if (chip.field == 'ALL') {
      this.removeKeyword(chip.value);
      return;
    }
    const value = chip.value;
    let index = this.searchRequest.filters.findIndex(x => x.field == chip.field);
    if (index < 0) return;
    let filterTag = this.searchRequest.filters[index];
    filterTag.value = SearchFilter.joinValues(SearchFilter.splitValues(filterTag.value).filter(x => x != value));
    if (filterTag.value == '') {
      this.searchRequest.filters.splice(index, 1);
    }
    this.page = 1;
    this.searchRequest.start = 0;
    this.searchDataset()
  }

  getDatasetByFacet(search_parameter, newValue) {
    this.page = 1;
    this.searchRequest.start = 0;
    let index = this.searchRequest.filters.findIndex(x => x.field === search_parameter);
    if (index < 0) {
      this.searchRequest.filters.push(new SearchFilter(search_parameter, SearchFilter.joinValues([newValue])));
    } else {
      let filter = this.searchRequest.filters[index];
      this.searchRequest.filters.splice(index, 1)
      filter.value = SearchFilter.joinValues([...SearchFilter.splitValues(filter.value), newValue]);
      this.searchRequest.filters.push(filter);
    }
    this.searchDataset()
  }

  displayFacet(search_parameter, value) {
    let index = this.searchRequest.filters.findIndex(x => x.field === search_parameter);
    if (index < 0) return true;
    else {
      let values = SearchFilter.splitValues(this.searchRequest.filters[index].value);
      let vIndex = values.findIndex(x => x === value)
      if (vIndex < 0) return true;
    }
    return false;
  }

  filterFacets(search_parameter, values: SearchFacet[]) {
    let index = this.searchRequest.filters.findIndex(x => x.field === search_parameter);
    if (index < 0) return values;
    else {
      let usedValues = SearchFilter.splitValues(this.searchRequest.filters[index].value);
      return values.filter(x => usedValues.indexOf(x.search_value) < 0);
    }
  }

  // i18n keys for the filter card titles, keyed by the stable backend `search_parameter`.
  // Titles reuse existing keys where available; the rest are FACET_* keys in the translations repo.
  private readonly facetTitleKeys: { [searchParameter: string]: string } = {
    HVDCategory: 'FACET_HVD_CATEGORIES',
    tags: 'HOME_TAGS',
    distributionFormats: 'FACET_FORMATS',
    distributionLicenses: 'FACET_LICENSES',
    catalogues: 'Catalogues',
    datasetThemes: 'HOME_CATEGORIES',
  };

  // DCAT theme abbreviation (facet search_value) -> i18n key (already present in the translations repo).
  private readonly dcatThemeKeys: { [abbr: string]: string } = {
    AGRI: 'AGRICULTURE',
    ECON: 'ECONOMY',
    EDUC: 'EDUCATION',
    ENER: 'ENERGY',
    ENVI: 'ENVIRONMENT',
    GOVE: 'GOVERNMENT',
    HEAL: 'HEALTH',
    INTR: 'INTERNATIONAL',
    JUST: 'JUSTICE',
    REGI: 'REGIONS',
    SOCI: 'SOCIETY',
    TECH: 'TECHNOLOGY',
    TRAN: 'TRANSPORTATION',
  };

  // Returns the i18n key for a facet card title, falling back to the raw backend displayName.
  facetTitleKey(facet: { search_parameter?: string; displayName?: string }): string {
    return this.facetTitleKeys[facet?.search_parameter] || facet?.displayName || '';
  }

  // Returns the i18n key for a DCAT theme facet value, or null if it should be shown raw.
  // Only the "Categories" facet (datasetThemes) is translated; other facet values are dataset data.
  themeFacetKey(searchParameter: string, searchValue: string): string | null {
    if (searchParameter !== 'datasetThemes' || !searchValue) return null;
    return this.dcatThemeKeys[searchValue.toUpperCase()] || null;
  }

  // Extracts the trailing "(N)" count the backend appends to a facet label (e.g. "Environment (5)" -> "5").
  facetCount(facetLabel: string): string {
    const match = /\((\d+)\)\s*$/.exec(facetLabel || '');
    return match ? match[1] : '';
  }
}
