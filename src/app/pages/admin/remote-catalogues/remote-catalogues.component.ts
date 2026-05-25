import { Component, OnInit } from '@angular/core';
import { NbActionsModule, NbButtonModule, NbCardModule, NbIconModule, NbInputModule, NbSelectModule, NbSortDirection, NbSortRequest, NbSpinnerModule, NbTooltipModule, NbTreeGridDataSource, NbTreeGridDataSourceBuilder, NbTreeGridModule } from '@nebular/theme';
import { CataloguesServiceService } from '../../services/catalogues-service.service';
import { ODMSCatalogueInfo } from '../../data-catalogue/model/odmscatalogue-info';
import { ODMSCatalogue } from '../../data-catalogue/model/odmscatalogue';

import * as remoteCatalogueData from '../../../../assets/remoteCatalogues.json';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OidcUserInformationService } from '../../auth/services/oidc-user-information.service';


interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  Name: string;
  Country: string;
  Type: string;
  Level: string;
  Host: string;
  Datasets: number | null;
  index: number;
  alreadyLoaded: boolean;
}


@Component({
	standalone: true,
	imports: [NbCardModule, TranslateModule, NbTreeGridModule, NbSelectModule, NbInputModule, RouterModule, NbActionsModule, NbButtonModule, NbSpinnerModule, NbIconModule, NbTooltipModule],
	selector: 'ngx-remote-catalogues',
	templateUrl: './remote-catalogues.component.html',
	styleUrls: ['./remote-catalogues.component.scss']
})
export class RemoteCataloguesComponent implements OnInit {
	
	cataloguesInfos: Array<ODMSCatalogueInfo>=[]
	loading=false;
	id=0;
	healthStatuses: { [key: string]: string } = {};
	remoteDatasetCounts: { [host: string]: number | null } = {};
	checkPending: { [host: string]: boolean } = {};
	checkLoading = false;

	totalCatalogues;
	cataloguesMoreInfos: ODMSCatalogue
	data: TreeNode<FSEntry>[] = [];

	activeMode = [{text:'',value:true},{text:'',value:false}];
	canManageAdministration = false;
	allRemCat = []
	//    allRemCatJson = [];
	allRemCatJson: any = remoteCatalogueData

	constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>,
		private restApi:CataloguesServiceService,
		private router: Router,
		public translation: TranslateService,
		private oidcUserInformationService: OidcUserInformationService) { }

	ngOnInit(): void {
		this.oidcUserInformationService.getRole().subscribe(roles => {
			this.canManageAdministration = roles.includes('IDRA_ADMIN') || roles.includes('IDRA_EDITOR');
		});
		// GET REM CATALOGUES LIST
		this.restApi.getRemoteNodesJson().subscribe({
			next: (infos) => {
				console.log("\nCHIAMATA API GET ALL REM CAT. infos:", infos);
				// normalize possible shapes (module with .default or plain array/object)
				this.allRemCat = infos;
			},
			error: (err) => {
				console.error('Failed to load remote catalogues from API, falling back to local JSON', err);
			}
		});
		
		this.allRemCatJson = this.allRemCatJson.default
		// console.log("\nREM CAT 1: "+this.allRemCatJson[0].name);

		let allCatalogues = [];
		this.restApi.getAllCataloguesInfo().subscribe({
			next: (infos) =>{
				allCatalogues = infos;
				for (let k = 0; k < this.allRemCatJson.length; k++) {
						
				// console.log("\nLOCATION: "+this.allRemCatJson[k].host);
				//let nameHost = "<a href=\""+infos2.host+"\\\">"+infos2.name+"<a/>";
				
				let level = this.getLevel(this.allRemCatJson[k].nodeType);
				
				let  alreadyLoaded = false;
				let datasetCount: number | null = null;
				for (let i = 0; i < allCatalogues.length; i++) {
					if(allCatalogues[i].host == this.allRemCatJson[k].host){
						alreadyLoaded = true;
						datasetCount = allCatalogues[i].datasetCount;
						break;
					}
				}

				let data2 = [
						{
						data: { Name: this.allRemCatJson[k].name, Country: this.allRemCatJson[k].country, Type: this.allRemCatJson[k].nodeType, Level: level, Host: this.allRemCatJson[k].host, Datasets: datasetCount, index: k, alreadyLoaded: alreadyLoaded}
					}
					];

				if(this.data.length==0){

					this.data = [
						{
						data: { Name: this.allRemCatJson[k].name, Country: this.allRemCatJson[k].country, Type: this.allRemCatJson[k].nodeType, Level: level, Host: this.allRemCatJson[k].host, Datasets: datasetCount, index: k, alreadyLoaded: alreadyLoaded}
					}
					];
				}
				else{
					this.data = this.data.concat(data2);
					
				}
				
				//costrutisco la tabella
				this.dataSource = this.dataSourceBuilder.create(this.data);

				}
			this.checkAllRemoteCatalogues();
			},
			error: (err) =>{
				console.log(err);
			}
		});
	}

	checkAllRemoteCatalogues(): void {
		if (!this.allRemCatJson || this.allRemCatJson.length === 0) { return; }
		this.checkLoading = true;
		let pending = this.allRemCatJson.length;
		const finishRow = (host: string) => {
			this.checkPending[host] = false;
			if (--pending === 0) { this.checkLoading = false; }
		};
		this.allRemCatJson.forEach((cat: any) => {
			this.checkPending[cat.host] = true;
			this.restApi.checkRemoteCatalogueHealth(cat.host).subscribe({
				next: (result) => {
					const status = result?.status || 'UNKNOWN';
					this.healthStatuses[cat.host] = status;
					if (status === 'ONLINE') {
						this.restApi.getRemoteCatalogueDatasetCount(cat.host, cat.nodeType, cat.APIKey || '').subscribe({
							next: (countResult) => {
								this.remoteDatasetCounts[cat.host] = (countResult && countResult.count != null) ? countResult.count : null;
								finishRow(cat.host);
							},
							error: () => {
								this.remoteDatasetCounts[cat.host] = null;
								finishRow(cat.host);
							}
						});
					} else {
						this.remoteDatasetCounts[cat.host] = null;
						finishRow(cat.host);
					}
				},
				error: () => {
					this.healthStatuses[cat.host] = 'OFFLINE';
					this.remoteDatasetCounts[cat.host] = null;
					finishRow(cat.host);
				}
			});
		});
	}

	isCheckPending(host: string): boolean {
		return !!this.checkPending[host];
	}

	getHealthStatus(host: string): string {
		return this.healthStatuses[host] || 'UNKNOWN';
	}

	getRemoteDatasetCount(host: string): number | null {
		return this.remoteDatasetCounts[host] ?? null;
	}

getLevel(nodeType: string): string {
		switch(nodeType){
			case 'CKAN':
			case 'ZENODO':
				//federationLevel='LEVEL_3';
				return "3";
			case 'DKAN':
			case 'SOCRATA':
			case 'SPOD':
			case 'WEB':
			case 'OPENDATASOFT':
			case 'JUNAR':	
				//node.federationLevel='LEVEL_2';
				return "2";
			case 'DCATDUMP':
				//if(node.dumpURL!=''){
					//node.federationLevel='LEVEL_2';
					return "2";
				//}
				//else{
					//node.federationLevel='LEVEL_4';
					//return "4";
				//}
			case 'ORION':
			case 'SPARQL':
				//node.federationLevel='LEVEL_4';
				return "4";
			default:
				break;
			}
}

  // ------------------------- TABLE
  iconColumn = 'Actions';
  defaultColumns = [ 'Name', 'Country', 'Type', 'Level', 'Host', 'Status', 'Datasets', 'Actions'];
  allColumns = [ ...this.defaultColumns ];

  dataSource: NbTreeGridDataSource<FSEntry>;

  sortColumn: string;
  sortDirection: NbSortDirection = NbSortDirection.NONE;


  updateSort(sortRequest: NbSortRequest): void {
    this.sortColumn = sortRequest.column;
    this.sortDirection = sortRequest.direction;
  }

  getSortDirection(column: string): NbSortDirection {
    if (this.sortColumn === column) {
      return this.sortDirection;
    }
    return NbSortDirection.NONE;
  }

  addRemoteCatalogue(index: number){
	
	var fd = new FormData();   
	fd.append("dump",'');
	// remove attribute image.imageId from json
	let object = this.allRemCatJson[index];
	delete object.image.imageId;
	object.isActive = false;
	fd.append("node",JSON.stringify(object));
	this.restApi.addODMSNode(fd).subscribe({
		next: (infos) =>{
			console.log("\nCHIAMATA API AGGIUNTA NODO. infos: "+infos);
			this.router.navigate(['/pages/administration/adminCatalogues']);
		},
		error: (err) =>{
			console.log(err);
		}
  	});
  }

  getShowOn(index: number) {
    const minWithForMultipleColumns = 400;
    const nextColumnStep = 100;
    return minWithForMultipleColumns + (nextColumnStep * index);
  }
  //-------------------------------------------------------------

}
