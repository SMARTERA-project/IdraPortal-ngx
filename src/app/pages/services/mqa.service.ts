import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NbGlobalPhysicalPosition, NbToastRef, NbToastrService } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class MqaService {

  private mqaEndpoint;

  constructor(
    private http: HttpClient,
    private toastr: NbToastrService,
    private config:ConfigService<Record<string, any>>,
    private translateService: TranslateService
  ) {
    this.mqaEndpoint=this.config.config["mqa_base_url"];
  }

  getOne(id: String): any {
    return new Promise((resolve,reject)=>{
      this.http.get(`${this.mqaEndpoint}/get/analisys/`+id, {
        headers: {
          'Content-Type':  'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET',
        },
      },
      
      )
      .subscribe({
        next: (data: any) => {
          if(data?.created_at != null){
            const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_RESULTS_FOUND'), this.translateService.instant('TOAST_SUCCESS'), { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
          } else {
            const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_ANALYSIS_NOT_READY'), this.translateService.instant('TOAST_WARNING'), { status: 'warning', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
          }
          resolve(data)
          return data
        },
        error: error => {
          const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_GENERIC_ERROR'), this.translateService.instant('TOAST_ERROR'), { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});

          reject(error)
          return error
        }
      })
    })
  }

  deleteOne(id: String): any {
    return new Promise((resolve,reject)=>{
      this.http.delete(`${this.mqaEndpoint}/delete/element/`+id, {
        headers: {
          'Content-Type':  'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET',
        },
      },
      
      )
      .subscribe({
        next: (data: any) => {
          const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_DELETED_SUCCESS'), this.translateService.instant('TOAST_SUCCESS'), { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
          
          resolve(data)
          return data
        },
        error: error => {
          const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_GENERIC_ERROR'), this.translateService.instant('TOAST_ERROR'), { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
          
          reject(error)
          return error
        }
      })
    })
  }
    
    getFiltered(id: String, jsonData : Object): any {
      return new Promise((resolve,reject)=>{
        this.http.post(`${this.mqaEndpoint}/get/analisys/`+id, jsonData, {
          headers: {
            'Content-Type':  'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST',
          },
        },
        
        )
        .subscribe({
          next: (data: any) => {
            resolve(data)
            return data
          },
          error: error => {
            const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_GENERIC_ERROR'), this.translateService.instant('TOAST_ERROR'), { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
            
            reject(error)
            return error
          }
        })
      })
    }

    getAll(): any {
      return new Promise((resolve,reject)=>{
        this.http.get(`${this.mqaEndpoint}/get/all`, {
          headers: {
            'Content-Type':  'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET',
          },
        },
        
        )
        .subscribe({
          next: (data: any) => {
            resolve(data)
            return data
          },
          error: error => {
            const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_GENERIC_ERROR'), this.translateService.instant('TOAST_ERROR'), { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
            
            reject(error)
            return error
          }
        })
      })
    }


    async submitAnalisysJSON(xml: String): Promise<any> {
      let json = {
        "file_url": xml,
      }
      return new Promise((resolve,reject)=>{
        this.http.post(`${this.mqaEndpoint}/submit`, json, {
          headers: {
            'Content-Type':  'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST',
          },
        },
        
        )
        .subscribe({
          next: (data: any) => {
            if(data?.message != null){
              const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_ANALYSIS_SUBMITTED'), this.translateService.instant('TOAST_SUCCESS'), { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
              resolve(data)
              return data
            } else {
              const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_GENERIC_ERROR'), this.translateService.instant('TOAST_ERROR'), { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
              reject(data)
              return data
            }
          },
          error: error => {
            const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_GENERIC_ERROR'), this.translateService.instant('TOAST_ERROR'), { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
            
            reject(error)
            return error
          }
        })
      })
    }

    async submitAnalisysFile(rdf: File): Promise<any> {
      let fd = new FormData();
      fd.append("file", rdf);
      
      return new Promise((resolve,reject)=>{
        this.http.post(`${this.mqaEndpoint}/submit/file`, fd, {
        },
        
        )
        .subscribe({
          next: (data: any) => {
            if(data?.message != null){
              const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_ANALYSIS_SUBMITTED'), this.translateService.instant('TOAST_SUCCESS'), { status: 'success', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
              resolve(data)
              return data
            } else {
              const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_GENERIC_ERROR'), this.translateService.instant('TOAST_ERROR'), { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
              reject(data)
              return data
            }
          },
            error: error => {
            const toastRef: NbToastRef = this.toastr.show(this.translateService.instant('TOAST_GENERIC_ERROR'), this.translateService.instant('TOAST_ERROR'), { status: 'danger', duration: 3000, destroyByClick: true, position: NbGlobalPhysicalPosition.TOP_RIGHT});
            
            reject(error)
            return error
          }
        })
      })
    }
}
