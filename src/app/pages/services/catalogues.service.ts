import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'ngx-config-json';

@Injectable({
  providedIn: 'root'
})
export class CataloguesService {

  private apiEndpoint;

  constructor(
    private http: HttpClient,
    private config: ConfigService<Record<string, any>>,
  ) {
    this.apiEndpoint = this.config.config['idra_base_url'];
  }

  getCatalogueList(): any {
    return new Promise((resolve, reject) => {
      // HTTP errors are surfaced by HttpErrorInterceptor + ErrorService.
      this.http.get(`${this.apiEndpoint}/Idra/api/v1/client/catalogues?withImage=true&orderBy=name&orderType=asc`)
        .subscribe({
          next: (data: any) => {
            resolve(data);
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }
}
