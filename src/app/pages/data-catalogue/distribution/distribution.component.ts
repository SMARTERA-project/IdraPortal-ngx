import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbCardModule, NbDialogRef } from '@nebular/theme';
import { DCATDistribution } from '../model/dcatdistribution';
import { DCTStandard } from '../model/dctstandard';
import { SKOSConcept } from '../model/skosconcept';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MetadataLocalizationService } from '../services/metadata-localization.service';

@Component({
  standalone: true,
  imports: [NbCardModule, CommonModule, TranslateModule],
  selector: 'ngx-distribution',
  templateUrl: './distribution.component.html',
  styleUrls: ['./distribution.component.scss']
})
export class DistributionComponent implements OnInit, OnDestroy {

  distribution:DCATDistribution;
  private languageSubscription?: Subscription;
  private selectedLanguage = 'en';

  constructor(
    protected dialogRef: NbDialogRef<DistributionComponent>,
    private translateService: TranslateService,
    private metadataLocalizationService: MetadataLocalizationService,
  ) { }

  ngOnInit(): void {
    this.selectedLanguage = (this.translateService.currentLang || 'en').toLowerCase();
    this.applyLocalizedMetadata();
    this.languageSubscription = this.translateService.onLangChange.subscribe((event) => {
      this.selectedLanguage = (event?.lang || 'en').toLowerCase();
      this.applyLocalizedMetadata();
    });
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
  }

  close() {
    this.dialogRef.close();
  }

  showDate(date){
		if(date=='1970-01-01T00:00:00Z') return false;
		return true;
	}

  printStandard(arr:DCTStandard[]){
    return arr.filter(x=> x.title!='' && x.title!=undefined).map(x=>x.title).join(',');
  }

  printConcepts(v: SKOSConcept){
    let ar=[];
    v.prefLabel.map( y =>{ if(y.value!='') ar.push(y.value) } );
    return ar.join(',')
  }

  private applyLocalizedMetadata(): void {
    this.metadataLocalizationService.applyDistributionLocalization(this.distribution, this.selectedLanguage);
    const hasTaggedDetails = Array.isArray(this.distribution?.distributionDetails)
      && this.distribution.distributionDetails.some((detail) =>
        !!detail?.language && detail.language.trim().length > 0);

    if (!hasTaggedDetails) {
      const translatedDownload = this.translateService.instant('DOWNLOAD');
      const normalizedFormat = (this.distribution?.format || '').trim();
      if (normalizedFormat) {
        this.distribution.title = `${translatedDownload} ${normalizedFormat}`;
      } else if (translatedDownload) {
        this.distribution.title = translatedDownload;
      }
    }
  }
}
