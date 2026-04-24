import { Component, OnDestroy, OnInit } from '@angular/core';
import type { EChartsCoreOption as EChartsOption } from 'echarts/core';
import { CoolTheme } from './cool-theme';
import { StatisticsService } from '../services/statistics.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NbSelectModule } from '@nebular/theme';
import { NgxEchartsModule } from 'ngx-echarts';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  imports: [TranslateModule, NbSelectModule, NgxEchartsModule, CommonModule],
  selector: 'ngx-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss']
})
export class StatisticsComponent implements OnInit, OnDestroy {

  constructor(
    private statisticsService : StatisticsService,
    public translation: TranslateService,
  ) { }

  options: EChartsOption = {
    legend: {},
    tooltip: {},
    // Declare an x-axis (category axis).
    // The category map the first column in the dataset by default.
    xAxis: { type: 'category' },	
    // Declare a y-axis (value axis).
    yAxis: {  },
    // Declare several 'bar' series,
    // every series will auto-map to each column by default.
    series: [{ type: 'bar' }],
  };

  optionsMostActive: EChartsOption = {
    legend: {},
    tooltip: {},
    // Declare an x-axis (category axis).
    // The category map the first column in the dataset by default.
    xAxis: { type: 'category' },	
    // Declare a y-axis (value axis).
    yAxis: {  },
    // Declare several 'bar' series,
    // every series will auto-map to each column by default.
    series: [{ type: 'bar' }, { type: 'bar' }],
  };

  
  optionsCircle: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} ({d}%)',
    },
    legend: {
      align: 'auto',
      bottom: 10,
    },
    calculable: true,
    series: [
      {
        name: 'area',
        type: 'pie',
        radius: [30, 110],
        roseType: 'area',
      },
    ],
  };

  dataMostActive: EChartsOption;
  dataTop10: EChartsOption;
  dataTechnologies: EChartsOption;
  dataThemes: EChartsOption;
  dataFormats: EChartsOption;
  dataLicenses: EChartsOption;
  mostActiveHasValues = true;
  coolTheme = CoolTheme;

  catalogueList: Array<any> = [];
  selectedCatalogues: Array<number> = [0];
  dateInterval: any = [new Date(), new Date(new Date().getTime() - 8*24*60*60*1000)];
  selectedInterval: number = 0;
  private latestRequestToken = 0;
  private cataloguesChangeTimer: any;

  onCataloguesChange(selected: number[] | number): void {
    // Normalize selected values for multiple select
    if (Array.isArray(selected)) {
      this.selectedCatalogues = selected as number[];
    } else if (typeof selected === 'number') {
      const set = new Set(this.selectedCatalogues);
      if (set.has(selected)) {
        set.delete(selected);
      } else {
        set.add(selected);
      }
      this.selectedCatalogues = Array.from(set);
    }

    // Debounce rapid selection changes
    if (this.cataloguesChangeTimer) {
      clearTimeout(this.cataloguesChangeTimer);
    }
    this.cataloguesChangeTimer = setTimeout(() => this.getStatistics(), 300);
  }

  getStatistics(): void {
    if(this.selectedInterval == 0){
      this.dateInterval = [new Date(), new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 7)];
    } else if(this.selectedInterval == 1){
      this.dateInterval = [new Date(), new Date(new Date().getFullYear(), new Date().getMonth() -1, new Date().getDate())];
    } else if(this.selectedInterval == 2){
      this.dateInterval = [new Date(), new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate())];
    }

    let startDate = this.dateInterval[1].toISOString();
    let endDate = this.dateInterval[0].toISOString();

    // Compute selected catalogues: if 'All' (0) is selected, use all IDs; otherwise, use explicit selection
    const slcCatalogues: number[] = this.selectedCatalogues.includes(0)
      ? this.catalogueList.map(c => c.id)
      : [...this.selectedCatalogues];

    // Create a token to ensure only the latest request updates the view
    const token = ++this.latestRequestToken;
    
    this.statisticsService.getStatistics(startDate, endDate, slcCatalogues ).then((data: any)=>{
      // Ignore out-of-order responses
      if (token !== this.latestRequestToken) {
        return;
      }
      const asArray = (value: any): any[] => Array.isArray(value) ? value : [];
      const catalogueStats = data?.cataloguesStatistics ?? {};
      const facetStats = data?.facetsStatistics ?? {};

      let dataTop10 = { dataset: { source: [['Datasets', 'Datasets'] ] } };
      asArray(catalogueStats.datasetCountStatistics).forEach((element) => {
        dataTop10.dataset.source.push([element.name, element.datasetCount]);
      });
      this.dataTop10 = dataTop10;

      let dataMostActive = {dataset: {source: [['Datasets', 'New Datasets', 'Updated Datasets'] ] } };
      this.mostActiveHasValues = false;
      asArray(catalogueStats.datasetUpdatedStat).forEach((element) => {
        if ((element.added ?? 0) > 0 || (element.updated ?? 0) > 0) {
          this.mostActiveHasValues = true;
        }
        dataMostActive.dataset.source.push([element.name, element.added, element.updated]);
      });
      this.dataMostActive = dataMostActive;

      let dataTechnologies = { dataset: { source: [ ['Technologies', 'Technologies'] ] } };
      asArray(catalogueStats.technologiesStat).forEach((element) => {
        dataTechnologies.dataset.source.push([element.type, element.count]);
      });
      this.dataTechnologies = dataTechnologies;

      let dataThemes = { dataset: { source: [ ['Themes', 'Themes'] ] } };
      asArray(facetStats.themesStatistics).forEach((element) => {
        dataThemes.dataset.source.push([element.theme, element.cnt]);
      });
      this.dataThemes = dataThemes;

      let dataFormats = { dataset: { source: [ ['Formats', 'Formats'] ] } };
      asArray(facetStats.formatsStatistics).forEach((element) => {
        dataFormats.dataset.source.push([element.format, element.cnt]);
      });
      this.dataFormats = dataFormats;

      let dataLicenses = { dataset: { source: [ ['Licenses', 'Licenses'] ] } };
      asArray(facetStats.licensesStatistics).forEach((element) => {
        dataLicenses.dataset.source.push([element.license, element.cnt]);
      });
      this.dataLicenses = dataLicenses;

    });
  }

  ngOnDestroy(): void {
    if (this.cataloguesChangeTimer) {
      clearTimeout(this.cataloguesChangeTimer);
    }
    // Invalidate any in-flight requests
    this.latestRequestToken++;
  }

  ngOnInit(): void {
    this.statisticsService.getCatalogueList().then((data)=>{
      this.catalogueList = data;
      this.getStatistics();
    });
  }

}
