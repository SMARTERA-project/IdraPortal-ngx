import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from 'ngx-config-json';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  private apiEndpoint;

  constructor(
    private http: HttpClient,
    private config: ConfigService<Record<string, any>>,
  ) {
    this.apiEndpoint = this.config.config['idra_base_url'];
  }

  // HTTP errors are surfaced globally by HttpErrorInterceptor + ErrorService.
  getCatalogueList(): any {
    return new Promise((resolve, reject) => {
      this.http.get(`${this.apiEndpoint}/Idra/api/v1/client/cataloguesInfo`)
        .subscribe({
          next: (data: any) => resolve(data),
          error: (error) => reject(error),
        });
    });
  }

  getStatistics(startDate, endDate, catalogueIDs): any {
    return new Promise((resolve, reject) => {
      const catalogueIDsString = catalogueIDs.join(',');
      this.http.get(`${this.apiEndpoint}/Idra/api/v1/statistics?startDate=${startDate}&endDate=${endDate}&catalogueID=${catalogueIDsString}`)
        .subscribe({
          next: (data: any) => resolve(data),
          error: (error) => reject(error),
        });
    });
  }
}
