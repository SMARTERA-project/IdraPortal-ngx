import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NbGlobalPhysicalPosition, NbToastrService } from '@nebular/theme';
import { AppConfigService } from '../../@core/services/app-config.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class MqaService {

  private mqaEndpoint;

  constructor(
    private http: HttpClient,
    private toastr: NbToastrService,
    private config:AppConfigService,
    private translateService: TranslateService
  ) {
    this.mqaEndpoint=this.config.config["mqa_base_url"];
  }

  // HTTP error toasts are surfaced globally by HttpErrorInterceptor + ErrorService.
  // Success/warning toasts here remain (they describe operation outcome, not HTTP errors).

  getOne(id: String): any {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.mqaEndpoint}/get/analisys/` + id, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET',
        },
      })
      .subscribe({
        next: (data: any) => {
          if (data?.created_at != null) {
            this.toastr.show(this.translateService.instant('TOAST_RESULTS_FOUND'), this.translateService.instant('TOAST_SUCCESS'), { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT });
          } else {
            this.toastr.show(this.translateService.instant('TOAST_ANALYSIS_NOT_READY'), this.translateService.instant('TOAST_WARNING'), { status: 'warning', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT });
          }
          resolve(data);
        },
        error: (error) => reject(error),
      });
    });
  }

  deleteOne(id: String): any {
    return new Promise((resolve, reject) => {
      this.http.delete(`${this.mqaEndpoint}/delete/element/` + id, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET',
        },
      })
      .subscribe({
        next: (data: any) => {
          this.toastr.show(this.translateService.instant('TOAST_DELETED_SUCCESS'), this.translateService.instant('TOAST_SUCCESS'), { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT });
          resolve(data);
        },
        error: (error) => reject(error),
      });
    });
  }

  getFiltered(id: String, jsonData: Object): any {
    return new Promise((resolve, reject) => {
      this.http.post(`${this.mqaEndpoint}/get/analisys/` + id, jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST',
        },
      })
      .subscribe({
        next: (data: any) => resolve(data),
        error: (error) => reject(error),
      });
    });
  }

  getAll(): any {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.mqaEndpoint}/get/all`, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET',
        },
      })
      .subscribe({
        next: (data: any) => resolve(data),
        error: (error) => reject(error),
      });
    });
  }

  async submitAnalisysJSON(xml: String): Promise<any> {
    const json = { 'file_url': xml };
    return new Promise((resolve, reject) => {
      this.http.post(`${this.mqaEndpoint}/submit`, json, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST',
        },
      })
      .subscribe({
        next: (data: any) => {
          if (data?.message != null) {
            this.toastr.show(this.translateService.instant('TOAST_ANALYSIS_SUBMITTED'), this.translateService.instant('TOAST_SUCCESS'), { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT });
            resolve(data);
          } else {
            // Backend returned 200 but with an empty/error body — surface as a local error.
            this.toastr.show(this.translateService.instant('TOAST_GENERIC_ERROR'), this.translateService.instant('TOAST_ERROR'), { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT });
            reject(data);
          }
        },
        error: (error) => reject(error),
      });
    });
  }

  async submitAnalisysFile(rdf: File): Promise<any> {
    const fd = new FormData();
    fd.append('file', rdf);
    return new Promise((resolve, reject) => {
      this.http.post(`${this.mqaEndpoint}/submit/file`, fd, {})
      .subscribe({
        next: (data: any) => {
          if (data?.message != null) {
            this.toastr.show(this.translateService.instant('TOAST_ANALYSIS_SUBMITTED'), this.translateService.instant('TOAST_SUCCESS'), { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT });
            resolve(data);
          } else {
            this.toastr.show(this.translateService.instant('TOAST_GENERIC_ERROR'), this.translateService.instant('TOAST_ERROR'), { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT });
            reject(data);
          }
        },
        error: (error) => reject(error),
      });
    });
  }
}
