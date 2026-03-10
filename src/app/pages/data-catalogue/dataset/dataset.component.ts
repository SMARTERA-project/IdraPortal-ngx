import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NbActionsModule, NbCardModule, NbDialogService, NbListModule, NbSpinnerModule, NbTagModule, NbToastrService, NbTooltipModule } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';
import { DataletIframeComponent } from '../datalet-iframe/datalet-iframe.component';
import { DistributionComponent } from '../distribution/distribution.component';
import { DCATDataset } from '../model/dcatdataset';
import { DCATDistribution } from '../model/dcatdistribution';
import { SKOSConcept } from '../model/skosconcept';
import { DataCataglogueAPIService } from '../services/data-cataglogue-api.service';
import { ShowDataletsComponent } from '../show-datalets/show-datalets.component';
import * as URLParse from 'url-parse';
import { PreviewDialogComponent } from './preview-dialog/preview-dialog.component';
import { GeoJsonDialogComponent } from './geojson-dialog/geojson-dialog.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { MarkdownModule } from 'ngx-markdown';
import { Subscription } from 'rxjs';
import { MetadataLocalizationService } from '../services/metadata-localization.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    // Nebular
    NbSpinnerModule,
    NbCardModule,
    NbActionsModule,
    NbTooltipModule,
    NbListModule,
    NbTagModule,
    // Third-party
    MarkdownModule,
    NgxPaginationModule,
  ],
  selector: 'ngx-dataset',
  templateUrl: './dataset.component.html',
  styleUrls: ['./dataset.component.scss']
})
export class DatasetComponent implements OnInit, OnDestroy {

  id:string;
  dataset:DCATDataset=new DCATDataset();
  loading=false;

  licenses:Array<any>=[];

  distributionPage:number =1;
  distributionPerPage:number =6;

  dataletBaseUrl=undefined;
  enableDatalet=true;

  samedomain=false;
  private languageSubscription?: Subscription;
  private selectedLanguage = 'en';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private restApi: DataCataglogueAPIService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
    private configService: ConfigService<Record<string, any>>,
    private translateService: TranslateService,
    private metadataLocalizationService: MetadataLocalizationService,
    ) { 
      this.dataletBaseUrl = this.configService.config["datalet_base_url"];
      this.enableDatalet = this.configService.config["enable_datalet"];
    }


  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
  }


  ngOnInit(): void {
    let dataletOrigin = new URLParse(this.dataletBaseUrl);
    if(location.origin==dataletOrigin.origin){
      this.samedomain=true;
    }
    this.selectedLanguage = (this.translateService.currentLang || 'en').toLowerCase();
    this.languageSubscription = this.translateService.onLangChange.subscribe((event) => {
      this.selectedLanguage = (event?.lang || 'en').toLowerCase();
      this.applyLocalizedMetadata();
    });

    this.route.paramMap.subscribe(params => {
      this.id = params.get('id'); 
      if (this.id) {
        this.getDataset();
      }else{
        this.loading=false;
        this.router.navigate(['/pages/datasets']);
      }
    })
  }

  getDataset(){
    this.loading=true;
    this.restApi.getDatasetById(this.id).subscribe({
      next: (res)=>{ 
        this.dataset=res;
        this.applyLocalizedMetadata();
        this.licenses = [];
        let tmpLic = [];
        (this.dataset.distributions || []).forEach( x => {
          if(x.license!=undefined && x.license.name!='' && tmpLic.indexOf(x.license.name)<0){
           tmpLic.push(x.license.name);
           this.licenses.push({"name":x.license.name, "uri":x.license.uri});
          }
        })
        this.loading=false;
     },
      error: (err)=>{
         this.loading=false;
         this.toastrService.danger(err.error.userMessage,"Error")
         this.router.navigate(['/pages/datasets']);
       }
    });
  }

  private applyLocalizedMetadata(): void {
    this.metadataLocalizationService.applyDatasetLocalization(this.dataset, this.selectedLanguage);
  }

  openDistributionDetails(distribution:DCATDistribution){
    distribution.title = this.getLocalizedDistributionTitle(distribution);
    this.dialogService.open(DistributionComponent, {
      context: {
        distribution: distribution
      },
    });
  }

  getLocalizedDistributionTitle(distribution: DCATDistribution): string {
    if (!distribution) {
      return '';
    }
    this.metadataLocalizationService.applyDistributionLocalization(distribution, this.selectedLanguage);
    const hasTaggedDetails = Array.isArray(distribution.distributionDetails)
      && distribution.distributionDetails.some((detail) => !!detail?.language && detail.language.trim().length > 0);

    if (!hasTaggedDetails) {
      const translatedDownload = this.translateService.instant('DOWNLOAD');
      const normalizedFormat = (distribution.format || '').trim();
      if (normalizedFormat) {
        return `${translatedDownload} ${normalizedFormat}`;
      }
      return translatedDownload || distribution.title || '';
    }

    const localizedTitle = (distribution.title || '').trim();
    const normalizedFormat = (distribution.format || '').trim();
    if (!localizedTitle) {
      if (normalizedFormat) {
        const translatedDownload = this.translateService.instant('DOWNLOAD');
        return `${translatedDownload} ${normalizedFormat}`;
      }
      return '';
    }

    if (!normalizedFormat) {
      return localizedTitle;
    }

    return localizedTitle.toLowerCase().includes(normalizedFormat.toLowerCase())
      ? localizedTitle
      : `${localizedTitle} ${normalizedFormat}`;
  }

  downloadUrl(distribution:DCATDistribution){
    let url = distribution.downloadURL;
    if((distribution.downloadURL==undefined || distribution.downloadURL=='') && (distribution.accessURL!=undefined && distribution.accessURL!='')){
      url = distribution.accessURL;
    }
    // download file
    if(url!=undefined && url!=''){
      window.open(url);
    } else {
      this.toastrService.danger("No download URL found for this distribution","Error")
    }
  }

  printConcepts(themes: SKOSConcept[]){
    let ar=[];
    themes.map(x=> x.prefLabel.map( y =>{ if(y.value!='') ar.push(y.value) } ) );
    return ar.join(',')
  }

  showDate = function(date){
		if(date=='1970-01-01T00:00:00Z') return false;
		return true;
	}
  
  checkDistributionDatalet(distribution:DCATDistribution){
    let parameter=undefined;

    if(distribution.format!=undefined && distribution.format!=""){
			parameter=distribution.format;
		}else if(distribution.mediaType!=undefined && distribution.mediaType!=""){
			if(distribution.mediaType.indexOf("/")>0)
				parameter=distribution.mediaType.split("/")[1];
			else
				parameter=distribution.mediaType;
		}

    if(parameter!=undefined){
      switch(parameter.toLowerCase()){
        case 'xml':
        case 'csv':
        case 'json':
        case 'application/json':
        case 'text/json':
        case 'text/csv':
        case 'geojson':
        case 'fiware-ngsi':
        case 'kml':
          return true;
        default:
          if(parameter.toLowerCase().includes("csv")){
            return true;
          }
          return false;
        }
    }else{
      return false;
    }
  }

  dataletCreate(distribution: DCATDistribution) {

    var parameter = undefined;

    if (distribution.format != undefined && distribution.format != "") {
      parameter = distribution.format;
      if (parameter == 'fiware-ngsi') parameter = 'json';
    } else if (distribution.mediaType != undefined && distribution.mediaType != "") {
      if (distribution.mediaType.indexOf("/") > 0)
        parameter = distribution.mediaType.split("/")[1];
      else
        parameter = distribution.mediaType;
    }

    this.loading = true;
    if (this.samedomain) {
      this.restApi.downloadFromUri(distribution).subscribe({
        next: (res) => {
          this.loading = false;

          this.dialogService.open(DataletIframeComponent, {
            context: {
              distributionID: distribution.id,
              datasetID: this.dataset.id,
              nodeID: this.dataset.nodeID,
              format: parameter,
              url: distribution.downloadURL
            }
          })
            .onClose.subscribe(
              closeCallback => {
                this.getDataset()
              }
            );

        },
        error: err => {
          this.loading = false;
          this.toastrService.danger("File with url " + distribution.downloadURL + " returned " + err.status + "!", "Unable to create Datalet");
        }
      });
    } else {
      this.restApi.downloadFromUri(distribution).subscribe({
        next: (res) => {
          this.loading = false;
          window.open(`${this.dataletBaseUrl}?ln=en&format=${parameter}&nodeID=${this.dataset.nodeID}&distributionID=${distribution.id}&datasetID=${this.dataset.id}&url=${encodeURIComponent(distribution.downloadURL)}`)
        },
        error: err => {
          this.loading = false;
          this.toastrService.danger("File with url " + distribution.downloadURL + " returned " + err.status + "!", "Unable to create Datalet");
        }
      });
    }
  }

  openExistingDatalet(distribution:DCATDistribution){
    if(this.checkDistributionFormat(distribution.format)){
      this.dialogService.open(ShowDataletsComponent, {
        context: {
          distributionID: distribution.id,
          datasetID:this.dataset.id,
          nodeID:this.dataset.nodeID
        }
      });
    }
  }


	handlePreviewFileOpenModal(distribution: DCATDistribution) {
    // check if the distribution format is one of the following: CSV,JSON,XML,GEOJSON,RDF,KML,PDF
    let formatLower = distribution.format.replace(/\s/g, "").toLowerCase();
    const localizedDistributionTitle = this.getLocalizedDistributionTitle(distribution);
    if(formatLower == "geojson" || formatLower == "kml"  || formatLower == "shp"){
      this.dialogService.open(GeoJsonDialogComponent, {
        context: {
          title: localizedDistributionTitle,
          distribution: distribution,
          type: formatLower,
        },
      })
      return;
    }
    else{
      if(this.checkDistributionFormat(distribution.format)){
        if(formatLower == "rdf"){
          this.restApi.downloadRDFfromUrl(distribution).subscribe({
            next: (res : string) => {
              console.log(res);
              this.dialogService.open(PreviewDialogComponent, {
                context: {
                  title: localizedDistributionTitle,
                  text: res,
                },
              })
            },
            error: err => {
              this.toastrService.danger("Could not load the file", "Error");
            }
          })
        } else {
          this.dialogService.open(PreviewDialogComponent, {
            context: {
              title: localizedDistributionTitle,
              url: distribution.downloadURL || distribution.accessURL,
              distribution: distribution,
            },
          })
        }
      }
    }
	}

  checkDistributionFormat(format:string){
    // remove white spaces and convert to lower case
    let formatLower = format.replace(/\s/g, "").toLowerCase();
    if(formatLower == "csv" || formatLower == "json" || formatLower == "xml" || formatLower == "geojson" || formatLower == "rdf" || formatLower == "kml" || formatLower == "pdf" || formatLower == "shp"  || formatLower == "txt" || formatLower == "tsv")
      return true;
    else
      return false;
    }


}



