import { Component, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { forkJoin, from, Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, map, mergeMap, switchMap, tap, toArray } from 'rxjs/operators';
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


interface CatalogueSource {
  id: string;
  name: string;
  catalogues: any[];
}

const LOCAL_SOURCE_ID = 'local';
const LOCAL_SOURCE_LABEL_KEY = 'REMOTE_CATALOGUE_ADMIN_LOCAL_FILE';
const SOURCE_STORAGE_KEY = 'idra.remoteCatalogues.source';

// localStorage can be unavailable (private mode, blocked site data): never let it break the page.
function readSavedSource(): string | null {
  try { return localStorage.getItem(SOURCE_STORAGE_KEY); } catch { return null; }
}

function saveSource(id: string): void {
  try { localStorage.setItem(SOURCE_STORAGE_KEY, id); } catch { /* ignore */ }
}

@Component({
	standalone: true,
	imports: [AsyncPipe, NbCardModule, TranslateModule, NbTreeGridModule, NbSelectModule, NbInputModule, RouterModule, NbActionsModule, NbButtonModule, NbSpinnerModule, NbIconModule, NbTooltipModule],
	selector: 'ngx-remote-catalogues',
	templateUrl: './remote-catalogues.component.html',
	styleUrls: ['./remote-catalogues.component.scss']
})
export class RemoteCataloguesComponent implements OnInit, OnDestroy {
	private static readonly MAX_CONCURRENT_CHECKS = 4;
	private checkSubscription?: Subscription;
	
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
	/** Selectable sources of the remote catalogue list, filled with the reachable ones. */
	catalogueSources: CatalogueSource[] = [];
	selectedSourceId: string = LOCAL_SOURCE_ID;
	sourcesLoading = false;
	readonly localSourceId = LOCAL_SOURCE_ID;
	localSourceLabel$: Observable<string>;
	allRemCatJson: any[] = (remoteCatalogueData as any).default ?? (remoteCatalogueData as any);
	private localCatalogues: any[] = this.allRemCatJson;
	private federatedCatalogues: any[] = [];
	private sourcesSubscription?: Subscription;

	constructor(private dataSourceBuilder: NbTreeGridDataSourceBuilder<FSEntry>,
		private restApi:CataloguesServiceService,
		private router: Router,
		public translation: TranslateService,
		private oidcUserInformationService: OidcUserInformationService) { }

	ngOnInit(): void {
		this.oidcUserInformationService.getRole().subscribe(roles => {
			this.canManageAdministration = roles.includes('IDRA_ADMIN') || roles.includes('IDRA_EDITOR');
		});
		// Falls back to English until the key reaches the published translations.
		this.localSourceLabel$ = this.translation.stream(LOCAL_SOURCE_LABEL_KEY).pipe(
			map((label: string) => label === LOCAL_SOURCE_LABEL_KEY ? 'Local file' : label));
		this.sourcesLoading = true;
		// Federated catalogues (to flag rows already loaded) + reachable remote lists.
		this.sourcesSubscription = forkJoin({
			federated: this.restApi.getAllCataloguesInfo().pipe(catchError(() => of([]))),
			sources: this.loadAvailableSources(),
		}).pipe(
			finalize(() => { this.sourcesLoading = false; }),
		).subscribe(({ federated, sources }) => {
			this.federatedCatalogues = Array.isArray(federated) ? federated : [];
			this.catalogueSources = [...sources, { id: LOCAL_SOURCE_ID, name: 'Local file', catalogues: this.localCatalogues }];
			// Saved choice if still available, otherwise the first reachable list (or the local file).
			const saved = readSavedSource();
			const initial = this.catalogueSources.find(src => src.id === saved) ?? this.catalogueSources[0];
			this.applySource(initial);
		});
	}

	/** Fetches every configured remote list and keeps only the reachable, well-formed ones. */
	private loadAvailableSources(): Observable<CatalogueSource[]> {
		return this.restApi.getAllRemCat().pipe(
			catchError(() => of([])),
			switchMap((remotes: any[]) => {
				if (!Array.isArray(remotes) || remotes.length === 0) { return of([]); }
				return from(remotes).pipe(
					mergeMap((remote: any) => this.fetchRemoteList(remote).pipe(
						map((list) => Array.isArray(list) && list.length > 0
							? { id: String(remote.id), name: remote.catalogueName, catalogues: list } as CatalogueSource
							: null),
						catchError(() => of(null)),
					), RemoteCataloguesComponent.MAX_CONCURRENT_CHECKS),
					toArray(),
					// Keep the configuration order so "first of the list" is deterministic.
					map((found) => remotes
						.map(remote => found.find(src => src?.id === String(remote.id)))
						.filter((src): src is CatalogueSource => !!src)),
				);
			}),
		);
	}

	private fetchRemoteList(remote: any): Observable<any> {
		const isIdra = remote.isIdra === true || remote.isIdra === 'true' || remote.isIdra === '1';
		if (isIdra) {
			// Remote Idra instances are read through the backend, which logs in with the stored credentials.
			return remote.username ? this.restApi.getSelectedRemCat(remote.id) : of(null);
		}
		return remote.URL ? this.restApi.getSelectedRemCatNotIdra(remote.URL) : of(null);
	}

	onSourceChange(sourceId: string): void {
		const source = this.catalogueSources.find(src => src.id === sourceId);
		if (!source) { return; }
		saveSource(source.id);
		this.applySource(source);
	}

	private applySource(source: CatalogueSource): void {
		this.selectedSourceId = source.id;
		this.allRemCatJson = source.catalogues;
		this.healthStatuses = {};
		this.remoteDatasetCounts = {};
		this.buildTable();
		this.checkAllRemoteCatalogues();
	}

	private buildTable(): void {
		this.data = this.allRemCatJson.map((cat: any, index: number) => {
			const federated = this.federatedCatalogues.find(fed => fed.host == cat.host);
			return {
				data: { Name: cat.name, Country: cat.country, Type: cat.nodeType, Level: this.getLevel(cat.nodeType), Host: cat.host, Datasets: federated ? federated.datasetCount : null, index, alreadyLoaded: !!federated }
			};
		});
		this.dataSource = this.dataSourceBuilder.create(this.data);
	}

	ngOnDestroy(): void {
		this.sourcesSubscription?.unsubscribe();
		this.checkSubscription?.unsubscribe();
	}

	checkAllRemoteCatalogues(): void {
		if (!this.allRemCatJson || this.allRemCatJson.length === 0) { return; }
		// Re-clicking "Check Status" restarts the scan instead of stacking a second one.
		this.checkSubscription?.unsubscribe();
		this.checkLoading = true;
		this.allRemCatJson.forEach((cat: any) => { this.checkPending[cat.host] = true; });
		// Limit concurrent probes: each one makes Idra contact the remote catalogue, and
		// firing all of them at once saturates the backend and slows down every page.
		this.checkSubscription = from(this.allRemCatJson).pipe(
			mergeMap((cat: any) => this.checkRemoteCatalogue(cat), RemoteCataloguesComponent.MAX_CONCURRENT_CHECKS),
			finalize(() => { this.checkLoading = false; }),
		).subscribe();
	}

	private checkRemoteCatalogue(cat: any): Observable<unknown> {
		return this.restApi.checkRemoteCatalogueHealth(cat.host).pipe(
			map((result) => result?.status || 'UNKNOWN'),
			catchError(() => of('OFFLINE')),
			tap((status) => { this.healthStatuses[cat.host] = status; }),
			switchMap((status) => status === 'ONLINE'
				? this.restApi.getRemoteCatalogueDatasetCount(cat.host, cat.nodeType, cat.APIKey || '').pipe(
					map((countResult) => (countResult && countResult.count != null) ? countResult.count : null),
					catchError(() => of(null)))
				: of(null)),
			tap((count) => { this.remoteDatasetCounts[cat.host] = count; }),
			finalize(() => { this.checkPending[cat.host] = false; }),
		);
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
			case 'GEONETWORK_ISO19139':	
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
	if (object.image) { delete object.image.imageId; }
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
