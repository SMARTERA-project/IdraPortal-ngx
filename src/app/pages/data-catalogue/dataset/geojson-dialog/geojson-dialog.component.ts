import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NbButtonModule, NbCardModule, NbDialogRef, NbDialogService, NbSpinnerModule, NbToastrService } from '@nebular/theme';
import { DCATDistribution } from '../../model/dcatdistribution';
import { DataCataglogueAPIService } from '../../services/data-cataglogue-api.service';
import * as L from "leaflet";
// declare let L;
import * as shp from "shpjs";
import * as toGeoJson from 'togeojson';
import proj4 from "proj4";
import { TranslateModule } from '@ngx-translate/core';
import { PreviewDialogComponent } from '../preview-dialog/preview-dialog.component';
import { firstValueFrom } from 'rxjs';
import { decodeBytesToText, extractPayloadEntries, ExtractedFileEntry, pickEntryByExtensions, pickFirstTextEntry } from '../utils/compressed-content.util';

@Component({
  imports: [NbCardModule, NbSpinnerModule, TranslateModule, NbButtonModule],
  selector: 'ngx-remoteCatalogue-dialog',
  templateUrl: 'geojson-dialog.component.html',
  styleUrls: ['geojson-dialog.component.scss'],
})
export class GeoJsonDialogComponent {

  close() {
    this.ref.close();
  }

  @Input() title: string;
  distribution: DCATDistribution;
  loading: boolean;
  type: string;
  text: string;

  constructor(protected ref: NbDialogRef<GeoJsonDialogComponent>,
    private restApi: DataCataglogueAPIService,
    private toastrService: NbToastrService,
    private dialogService: NbDialogService,
) {}

  ngOnInit() {
    this.loading = true;
    L.Icon.Default.mergeOptions({ iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png', iconUrl: 'assets/leaflet/marker-icon.png', shadowUrl: 'assets/leaflet/marker-shadow.png' })
    this.openMap(this.distribution);
  }

  map: any;
  @ViewChild('geoJsonMap', { static: false }) geoJsonMap: ElementRef;
  private loadGeoJson(data: string): void {
    this.loading = true;
    
    if (this.map) {
      this.map.remove(); // Rimuovi la mappa esistente se presente
    }
    const geoJsonData = JSON.parse(data) as GeoJSON.GeoJsonObject;
    this.text = data;
    // console.log(geoJsonData);
    globalThis.file_content = data;

    // Creazione mappa Leaflet
    // cicle to find the attribute coordinates
    let latLng = [0, 0];
    // if(geoJsonData['features'][0]['geometry']['coordinates'] != undefined){
    //   latLng[0] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][1];
    //   latLng[1] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0];
    // } else if(geoJsonData['features'][0][0]['geometry']['coordinates'] != undefined){
      // latLng[0] += geoJsonData['features'][0][0]['geometry']['coordinates'][1];
      // latLng[1] += geoJsonData['features'][0][0]['geometry']['coordinates'][0];
    // }
    
    try {
      let featuresLenght = Math.floor(geoJsonData['features'].length/2);
      if(typeof geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0] == 'number'){
        latLng[0] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][1];
        latLng[1] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0];
      } else if(typeof geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0][0] == 'number'){
        latLng[0] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][1];
        latLng[1] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][0];
      } else if(typeof geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0][0][0] == 'number'){
        latLng[0] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)][1];
        latLng[1] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)][0];
      } else if(typeof geoJsonData['features'][featuresLenght]['geometry']['coordinates'][0][0][0][0] == 'number'){
        latLng[0] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)].length/2)][1];
        latLng[1] += geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'][Math.floor(geoJsonData['features'][featuresLenght]['geometry']['coordinates'].length/2)].length/2)].length/2)][0];
      } else {
        latLng[0] = 0;
        latLng[1] = 0;
      }
    } catch (error) {
      latLng[0] = 0;
      latLng[1] = 0;
      this.toastrService.danger("Could not determine center coordinates, defaulting to [0,0]", "Warning");
      this.close();
      this.dialogService.open(PreviewDialogComponent, {
        context: {
          title: this.title,
          text: this.text,
        },
      })
    }
    this.map = L.map(this.geoJsonMap.nativeElement).setView(L.latLng(latLng[0], latLng[1]), 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    L.geoJSON(geoJsonData, {
      onEachFeature: this.onEachFeature
    }).addTo(this.map);
    this.loading = false;
  }
  
  async openMap(distribution:DCATDistribution){
    try {
      const entries = await this.downloadDistributionPayload(distribution);

      if (this.type == 'geojson') {
        await this.handleGeoJsonEntries(entries);
        return;
      }

      if (this.type == 'kml') {
        await this.handleKmlEntries(entries);
        return;
      }

      if (this.type == 'shp') {
        await this.handleShapeEntries(entries);
        return;
      }

      throw new Error('Format not valid');
    } catch (error) {
      console.log(error);
      if (this.isHttpStatus(error, 413)) {
        this.toastrService.danger("File size too large to preview, but you can still download it.", "Error");
      } else {
        this.toastrService.danger("Could not load the file", "Error");
      }
      this.loading = false;

      if (this.text) {
        this.close();
        this.dialogService.open(PreviewDialogComponent, {
          context: {
            title: this.title,
            text: this.text,
          },
        });
      }
    }
  }

  private isHttpStatus(error: unknown, status: number): boolean {
    const maybeError = error as { status?: number } | null;
    return !!maybeError && maybeError.status === status;
  }

  private async downloadDistributionPayload(distribution: DCATDistribution): Promise<ExtractedFileEntry[]> {
    const response = await firstValueFrom(this.restApi.downloadFromUriAsBlob(distribution));
    const payloadBlob = response.body;

    if (!payloadBlob) {
      throw new Error('Could not load the file');
    }

    const payloadBuffer = await payloadBlob.arrayBuffer();
    const suggestedName = distribution.downloadURL || distribution.accessURL || this.title || 'payload';
    const extracted = await extractPayloadEntries(payloadBuffer, suggestedName);
    return extracted.entries;
  }

  private async handleGeoJsonEntries(entries: ExtractedFileEntry[]): Promise<void> {
    const selectedEntry = pickEntryByExtensions(entries, ['geojson', 'json']) || pickFirstTextEntry(entries, ['geojson', 'json']);
    if (!selectedEntry) {
      throw new Error('No GeoJSON content found');
    }

    const content = decodeBytesToText(selectedEntry.bytes);
    this.loadGeoJson(content);
    this.text = content;
  }

  private async handleKmlEntries(entries: ExtractedFileEntry[]): Promise<void> {
    const selectedEntry = pickEntryByExtensions(entries, ['kml', 'xml']) || pickFirstTextEntry(entries, ['kml', 'xml']);
    if (!selectedEntry) {
      throw new Error('No KML content found');
    }

    const kml = new DOMParser().parseFromString(decodeBytesToText(selectedEntry.bytes), 'text/xml');
    const data = toGeoJson.kml(kml);
    const geoJsonText = JSON.stringify(data);
    this.loadGeoJson(geoJsonText);
    this.text = geoJsonText;
  }

  private async handleShapeEntries(entries: ExtractedFileEntry[]): Promise<void> {
    const groupedFiles = new Map<string, { shp?: Uint8Array; dbf?: Uint8Array; prj?: string }>();

    entries.forEach((entry) => {
      const normalizedName = entry.name.replace(/\\/g, '/');
      if (normalizedName.toLowerCase().includes('__macosx/')) {
        return;
      }

      const lastDot = normalizedName.lastIndexOf('.');
      if (lastDot < 0) {
        return;
      }

      const extension = normalizedName.slice(lastDot + 1).toLowerCase();
      const baseName = normalizedName.slice(0, lastDot);
      const current = groupedFiles.get(baseName) || {};

      if (extension === 'shp') {
        current.shp = entry.bytes;
      } else if (extension === 'dbf') {
        current.dbf = entry.bytes;
      } else if (extension === 'prj') {
        current.prj = decodeBytesToText(entry.bytes);
      }

      groupedFiles.set(baseName, current);
    });

    const allFeatures = [];

    for (const grouped of groupedFiles.values()) {
      if (!grouped.shp || !grouped.dbf) {
        continue;
      }

      let projection;
      if (grouped.prj) {
        try {
          projection = proj4(grouped.prj);
        } catch (_error) {
          projection = undefined;
        }
      }

      const parsedShp = projection
        ? await shp.parseShp(this.toArrayBuffer(grouped.shp), projection)
        : await shp.parseShp(this.toArrayBuffer(grouped.shp));
      const parsedDbf = await shp.parseDbf(this.toArrayBuffer(grouped.dbf));
      const combined = shp.combine([parsedShp, parsedDbf]);

      if (combined && combined.features && combined.features.length) {
        allFeatures.push(...combined.features);
      }
    }

    if (!allFeatures.length) {
      throw new Error('Not a shapefile');
    }

    this.text = JSON.stringify(allFeatures);
    this.loadShapeFile(allFeatures);
  }

  private toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return Uint8Array.from(bytes).buffer;
  }

  public loadShapeFile(file: any) {

    const geoJsonArray = file;
    // console.log('Response Shape File: ' + geoJsonArray);

    if (this.map) {
      this.map.remove();
    }

    const geoJsonData = geoJsonArray[0];
    globalThis.file_content = geoJsonArray[0];

    // console.log("DATA");
    // console.log(geoJsonData);

    // Creazione mappa Leaflet
    let latLng = [0, 0];
    // let featuresLenght = Math.floor(geoJsonData['features'].length/2);

    try {
      if(typeof geoJsonData['geometry']['coordinates'][0] == 'number'){
        latLng[0] += geoJsonData['geometry']['coordinates'][1];
        latLng[1] += geoJsonData['geometry']['coordinates'][0];
      } else if(typeof geoJsonData['geometry']['coordinates'][0][0] == 'number'){
        latLng[0] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][1];
        latLng[1] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][0];
      } else if(typeof geoJsonData['geometry']['coordinates'][0][0][0] == 'number'){
        latLng[0] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][1];
        latLng[1] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][0];
      } else if(typeof geoJsonData['geometry']['coordinates'][0][0][0][0] == 'number'){
        latLng[0] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)].length/2)][1];
        latLng[1] += geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)][Math.floor(geoJsonData['geometry']['coordinates'][Math.floor(geoJsonData['geometry']['coordinates'].length/2)].length/2)].length/2)][0];
      } else {
        latLng[0] = 0;
        latLng[1] = 0;
      }
    } catch (error) {
      latLng[0] = 0;
      latLng[1] = 0;
      this.toastrService.danger("Could not determine center coordinates, defaulting to [0,0]", "Warning");
      this.close();
      this.dialogService.open(PreviewDialogComponent, {
        context: {
          title: this.title,
          text: this.text,
        },
      })
    }
    
    this.map = L.map(this.geoJsonMap.nativeElement).setView(L.latLng(latLng[0], latLng[1]), 9);

    // if (this.addToBucket.active) {
    //   this.map = L.map(this.geoJsonMap.nativeElement).setView([0, 0], 2);
    // } else if (this.privateBucket.active) {
    //   this.map = L.map(this.geoJsonMapBucket.nativeElement).setView([0, 0], 2);
    // } else if (this.pilotBucket.active) {
    //   this.map = L.map(this.geoJsonMapPilotBucket.nativeElement).setView([0, 0], 2);
    // } else if (this.publicBucket.active) {
    //   this.map = L.map(this.geoJsonMapPublicBucket.nativeElement).setView([0, 0], 2);
    // }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    geoJsonArray.forEach(geoJson => {
      L.geoJSON(geoJson, {
        // pointToLayer: function (feature, latlng) {
        // return new L.CircleMarker(latlng, {radius: 5, 
        //     fillOpacity: 1, 
        //     color: 'black', 
        //     fillColor: 'blue', 
        //     weight: 1,});
        // },
        onEachFeature: this.onEachFeature
    }
      ).addTo(this.map);
    });

    this.loading = false;
  }
  onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    if (feature.properties) {
      // map json properties to popup
      let popupContent = "<p>";
      for (const key in feature.properties) {
        popupContent += "- "+ key + ": " + feature.properties[key] + "<br>";
      }
      popupContent += "</p>";
      layer.bindPopup(popupContent);
    }
  }
}
