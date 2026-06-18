import { Component, OnInit } from '@angular/core';
import { NbCardModule, NbDialogRef, NbSpinnerModule } from '@nebular/theme';
import { AppConfigService } from '../../../@core/services/app-config.service';
import { SafePipe } from '../../../@theme/pipes';

@Component({
  imports: [NbCardModule, NbSpinnerModule, SafePipe],
  selector: 'ngx-datalet-iframe',
  templateUrl: './datalet-iframe.component.html',
  styleUrls: ['./datalet-iframe.component.scss']
})
export class DataletIframeComponent implements OnInit {

  datasetID:string;
  format:string;
  nodeID:string;
  distributionID:string;
  url:string;
  loading: boolean = true;

  private dataletBaseUrl:string;

  iframeUrl:string;

  constructor(
    protected dialogRef: NbDialogRef<DataletIframeComponent>,
    private configService: AppConfigService
    ) {
      this.dataletBaseUrl = this.configService.config["datalet_base_url"];
     }

  ngOnInit(): void {
    this.iframeUrl=`${this.dataletBaseUrl}?ln=en&format=${this.format}&nodeID=${this.nodeID}&distributionID=${this.distributionID}&datasetID=${this.datasetID}&url=${encodeURIComponent(this.url)}`
    // Load/error state is driven by the iframe's (load)/(error) template bindings.
  }

  onIframeSettled(): void {
    this.loading = false;
  }

  close() {
    this.dialogRef.close();
  }

}
