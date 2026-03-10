import { Component, OnDestroy, OnInit } from '@angular/core';
import { DataCataglogueAPIService } from '../data-catalogue/services/data-cataglogue-api.service';
import { ODMSCatalogueInfo } from '../data-catalogue/model/odmscatalogue-info';
import { SearchRequest } from '../data-catalogue/model/search-request';
import { SearchResult } from '../data-catalogue/model/search-result';
import { Router } from '@angular/router';
import { NbButton, NbButtonModule, NbCheckboxModule, NbDatepickerModule, NbIconModule, NbInputModule, NbListModule, NbSelectModule, NbTabsetModule, NbTagComponent, NbTagInputAddEvent, NbTagModule, NbTooltipModule } from '@nebular/theme';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { error } from 'console';
import { Subscription } from 'rxjs';

@Component({
  standalone: true,
  imports: [NbTagModule, NbIconModule, TranslateModule, NbTooltipModule, NbTabsetModule, NbListModule, CommonModule, NbButtonModule, NbSelectModule, NbInputModule, NbDatepickerModule, NbCheckboxModule],
  selector: 'ngx-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  constructor(private restApi:DataCataglogueAPIService,
    private router: Router,
    public translation: TranslateService
  ) { }

  cataloguesInfos: Array<ODMSCatalogueInfo>=[]
  totalDatasets:number=0;
  tags: Array<any> = [];
  classes: Array<string> = [];
  searchResponse:SearchResult=new SearchResult();
  searchRequest:SearchRequest=new SearchRequest();
  advancedSearch:boolean=false;
  lastKeyPressed: string | null = null;
  searchToggleIcon:string="arrow-ios-downward-outline";
  Filters: Array<any> = [{type: 'ALL', tags: []}];
  selectableOptions: Array<string> = [];
  options: Array<any> = ['description', 'tags', 'title'];

  releasedDate: Array<String> = [];
  updatedDate: Array<String> = [];
  
  catalogueList: Array<any> = [];
  selectedCatalogues: Array<number> = [0];
  selectedCatalogues_prev: Array<number> = [0];
  sourceLanguage: string = "";
  targetsLanguage: Array<string> = [];
  languages: Array<any> = [{"value":"BG" ,"text": "Български" },
    {"value":"ES" ,"text":"Español"},{"value":"CS" ,"text":"Čeština" },
    {"value": "DA" ,"text": "Dansk" },{"value": "DE" ,"text": "Deutsch" },
    {"value": "ET" ,"text": "Eesti" },{"value": "EL" ,"text": "λληνικά"  },
    {"value": "EN" ,"text": "English" },{"value": "FR" ,"text": "Français" },
    {"value": "GA" ,"text": "Gaeilge" },{"value": "HR" ,"text": "Hrvatski" },
    {"value": "IT" ,"text": "Italiano" },{"value": "LV" ,"text": "Latviešu" },{"value": "LT" ,"text": "Lietuvių" },
    {"value": "HU" ,"text": "Magyar" }, {"value": "MT" ,"text": "Malti" },{"value": "NL" ,"text": "Nederlands" },
    {"value": "PL" ,"text": "Polski" },{"value": "PT" ,"text": "Português" },{"value": "RO" ,"text": "Română" },
    {"value": "SK" ,"text": "Slovenčina" },{"value": "SL" ,"text": "Slovenščina" },{"value": "FI" ,"text": "Suomi" },
    {"value": "SV" ,"text": "Svenska" },{"value": "MK" ,"text": "Македонски" },{"value": "SQ" ,"text": "Shqip" },{"value": "SR" ,"text": "Српски" }];

  maxResultPerPage: number = 25;
  sortyBy: number = 4;
  order: number = 0;
  multiLanguageChecked = false;
  isHVD_Dataset = false;
  private languageSubscription?: Subscription;
  private selectedLanguage = 'en';

  toggleMultiLanguage(checked: boolean) {
    this.multiLanguageChecked = checked;
  }

  toggleHasHVDCategory(checked: boolean) {
    if (checked) {
      this.isHVD_Dataset = true;
    }
    else {
      this.isHVD_Dataset = false;
    }
  }

  toggleAdvancedSearch(){
    this.advancedSearch = !this.advancedSearch;
    if(this.advancedSearch){
      this.searchToggleIcon = "arrow-ios-upward-outline";
    } else {
      this.searchToggleIcon = "arrow-ios-downward-outline";
    }
  }

  addFilter(){
    if(this.Filters.length < 4){
      let diff = this.options.filter(x => !this.Filters.map(y=>y.type).includes(x));
      let type = diff[0];
      this.Filters.push({type: type, tags: []});
      this.selectableOptions = diff;
    }
  }

  removeFilter(index:number){
    if(this.Filters.length>1){
      this.Filters.splice(index,1);
      this.selectableOptions = this.options.filter(x => !this.Filters.map(y=>y.type).includes(x));
      this.selectableOptions.push(this.Filters[index-1].type);
    }
  }
  
  onTagRemoveOnFilter(tagToRemove: NbTagComponent, index: number): void {
    this.Filters[index].tags = this.Filters[index].tags.filter(x => x!=tagToRemove.text);
  }

  onTagAddOnFilter({ value, input }: NbTagInputAddEvent, index: number): void {
    setTimeout(() => {
      if (input != undefined)
        input.nativeElement.value = '';
      if (value) {
        this.Filters[index].tags.push(value);
        if (this.lastKeyPressed === 'Enter') {
          this.advancedSearchReq();
        }
      }
    }, 50);
  }

  advancedSearchReq(){
    if(!this.advancedSearch){
      this.router.navigate(['/pages/datasets'], {
        queryParams:{
          all: this.tagsFilter.join(','),
          advancedSearch: false
        }
      })
    } else{
      let filters = [];
      this.Filters.forEach(filter => {
        if(filter.tags.length > 0){
          filters.push({field: filter.type, value: filter.tags.join(',')});
        }
      });
      if(this.Filters.length == 1 && this.Filters[0].type == 'ALL' && this.Filters[0].tags.length == 0){
        filters.push({field: 'ALL', value: ''});
      }
      let selectedCatalogues
      if(this.selectedCatalogues.includes(0)){
        selectedCatalogues = this.selectedCatalogues.filter(x=>x!=0);
      }
      let sort
      switch(this.sortyBy){
        case 0:
          sort = 'releaseDate';
          break;
        case 1:
          sort = 'updateDate';
          break;
        case 2:
          sort = 'nodeID';
          break;
        case 3:
          sort = 'contactPoint_fn';
          // sort = 'publisherName';
          break;
        case 4:
          sort = 'title';
          break;
        default:
          sort = 'title';
          break;
      }
      let params = {
        live: false,
        filters: filters,
        sort: {
          field: sort,
          mode: this.order ? 'desc' : 'asc'
        },
        rows: this.maxResultPerPage,
        start: 0,
        nodes: selectedCatalogues,
        language: this.selectedLanguage,
        euroVocFilter: {
          euroVoc: this.multiLanguageChecked,
          sourceLanguage: '',
          targetLanguages: []
        }
      }
      if(this.isHVD_Dataset){
        params['hasHvdCategory'] = true;
      }
      if(this.multiLanguageChecked){
        params.euroVocFilter.sourceLanguage = this.sourceLanguage;
        params.euroVocFilter.targetLanguages = this.targetsLanguage;
      }
      console.log("dates: ",this.releasedDate, this.updatedDate)
      if(this.releasedDate.length > 0){
        params['releaseDate'] = {
          start: this.releasedDate[0],
          end: this.releasedDate[1]
        }
      }
      if(this.updatedDate.length > 0){
        params['updateDate'] = {
          start: this.updatedDate[0],
          end: this.updatedDate[1]
        }
      }
      console.log("params: ", params)
      this.router.navigate(['/pages/datasets'], {
        queryParams: { params: JSON.stringify(params), advancedSearch: true }
      })

    }
  }

  updateDate(event:any, type:number){
    let start = new Date(event.start);
    let end = new Date(event.end);
    let start_string = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0)).toISOString();
    let end_string = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0)).toISOString();
    if(type == 0){
      this.releasedDate = [start_string, end_string];
    } else {
      this.updatedDate = [start_string, end_string];
    }
  }

  handleCataloguesChange(event:any){
    if(event.includes(0) && !this.selectedCatalogues_prev.includes(0)){
      this.selectedCatalogues = this.cataloguesInfos.map(x=>x.id);
      this.selectedCatalogues.unshift(0);
    } else if(!event.includes(0) && this.selectedCatalogues_prev.includes(0)){
      this.selectedCatalogues = [];
    } else if(event.length -1 < this.cataloguesInfos.length && event.includes(0)){
      this.selectedCatalogues = this.selectedCatalogues.filter(x=>x!=0);
    } else if(event.length == this.cataloguesInfos.length && !event.includes(0)){
      this.selectedCatalogues.unshift(0);
    }
    this.selectedCatalogues_prev = this.selectedCatalogues;
  }

	// dcatThemes=[{value:"AGRI",icon:"agri",text:"Agriculture"},
	// 	{value:"ECON",icon:"econ",text:"Economy"},
	// 	{value:"EDUC",icon:"educ",text:"Education"},
	// 	{value:"ENER",icon:"ener",text:"Energy"},
	// 	{value:"ENVI",icon:"envi",text:"Environment"},
	// 	{value:"GOVE",icon:"gove",text:"Government"},
	// 	{value:"HEAL",icon:"heal",text:"Health"},
	// 	{value:"INTR",icon:"intr",text:"International"},
	// 	{value:"JUST",icon:"just",text:"Justice"},
	// 	{value:"REGI",icon:"regi",text:"Regions"},
	// 	{value:"SOCI",icon:"soci",text:"Population"},
	// 	{value:"TECH",icon:"tech",text:"Technology"},
	// 	{value:"TRAN",icon:"tran",text:"Transport"}];

	dcatThemes=[{value:"Agriculture, fisheries, forestry and food",icon:"agri",text:"Agriculture"}, //maybe ?
		{value:"Economy and finance",icon:"econ",text:"Economy"}, //ok
		{value:"Education, culture and sport",icon:"educ",text:"Education"}, //not ok -> ok
		{value:"Energy",icon:"ener",text:"Energy"}, //ok
		{value:"Environment",icon:"envi",text:"Environment"}, //ok
		{value:"Government and public sector",icon:"gove",text:"Government"}, //ok
		{value:"Health",icon:"heal",text:"Health"}, //maybe ?
		{value:"International issues",icon:"intr",text:"International"}, //maybe ?
		{value:"Justice, legal system and public safety",icon:"just",text:"Justice"}, //not ok -> ok
		{value:"Regions and cities",icon:"regi",text:"Regions"}, //ok
		{value:"Population and society",icon:"soci",text:"Population"}, //ok
		{value:"Science and technology",icon:"tech",text:"Technology"}, //ok
		{value:"Transport",icon:"tran",text:"Transport"}]; //ok

    
  ngOnInit(): void {
    this.selectedLanguage = (this.translation.currentLang || 'en').toLowerCase();
    this.searchRequest.language = this.selectedLanguage;
    this.languageSubscription = this.translation.onLangChange.subscribe((event) => {
      this.selectedLanguage = (event?.lang || 'en').toLowerCase();
      this.searchRequest.language = this.selectedLanguage;
      if (this.cataloguesInfos.length > 0) {
        this.loadTagCloud();
      }
    });

    this.restApi.getCataloguesInfo().subscribe({
      next: (infos) =>{
        this.cataloguesInfos = infos;
        this.searchRequest.nodes = infos.map(x=>x.id)
        this.selectedCatalogues = infos.map(x=>x.id);
        this.selectedCatalogues.unshift(0);
        this.selectedCatalogues_prev = this.selectedCatalogues;
        this.loadTagCloud();
      },
      error: (err)=>{
        console.log(err);
      }
    })
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
  }

  private loadTagCloud(): void {
    this.searchRequest.language = this.selectedLanguage;
    this.restApi.searchDatasets(this.searchRequest).subscribe({
      next: (res) => {
        this.totalDatasets = res.count;
        const tagsFacet = res.facets?.find((x) => x.displayName === 'Tags');
        let tags = (tagsFacet?.values || []).map((x) => ({ name: x.keyword, search_value: x.search_value }));
        for (let i = tags.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * i);
          const temp = tags[i];
          tags[i] = tags[j];
          tags[j] = temp;
        }
        this.tags = tags.slice(0, 30);
        this.classes = this.tags.map((x) => this.randomClass());
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  tagsFilter: string[] = [];
  
  onTagRemove(tagToRemove: NbTagComponent): void {
    this.tagsFilter = this.tagsFilter.filter(x => x!=tagToRemove.text);
  }

  onTagAdd({ value, input }: NbTagInputAddEvent): void {
    setTimeout(() => {
      if (input != undefined)
        input.nativeElement.value = '';
      if (value) {
        this.tagsFilter.push(value);
        if (this.lastKeyPressed === 'Enter') {
          this.advancedSearchReq();
        }
      }
    }, 50);
  }

  randomClass(){
    let classes = ['tag-1','tag-2','tag-3','tag-4','tag-5','tag-6','tag-7']
    return classes[this.randomNumber(classes.length-1)];
  }

  randomNumber(max:number){
    return Math.floor(Math.random() * max + 1);
  }

  getClass(index:number){
    return this.classes[index];
  }

  searchTag(i:number){
    let search_parameter = this.tags[i]
    this.router.navigate(['/pages/datasets'], {queryParams:{search_value: search_parameter.search_value, name: this.tags[i].name}})
  }

  searchCategory(category:any){
    console.log(category)
    this.router.navigate(['/pages/datasets'], {queryParams:{search_value: category.value, text: category.text}})
  }
}
