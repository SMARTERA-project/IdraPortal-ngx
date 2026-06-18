import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { NbAuthService, NbAuthResult } from '@nebular/auth';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { AppConfigService } from '../../../@core/services/app-config.service';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'nb-playground-oauth2-callback',
  template: ``,
})
export class AuthCallbackComponent implements OnDestroy {

  private destroy$ = new Subject<void>();
  private static readonly LANGUAGE_STORAGE_KEY = 'idraUserLanguage';

  constructor(
    private authService: NbAuthService,
    private router: Router,
    private config:AppConfigService,
    public translateService: TranslateService,
    private http: HttpClient,
  ) {
    try {
      this.authService.authenticate(this.config.config["authProfile"])
        .pipe(takeUntil(this.destroy$))
        .subscribe((authResult: NbAuthResult) => {
          if (authResult.isSuccess()) {
            // Ensure Idra provisions the authenticated user in DB (JIT provisioning happens on /administration/*).
            const idraBaseUrl = this.config.config["idra_base_url"];
            if (idraBaseUrl) {
              // Fire-and-forget: NOT bound to destroy$, otherwise the navigateByUrl below
              // destroys this component and aborts the request before provisioning completes.
              this.http.get(`${idraBaseUrl}/Idra/api/v1/administration/me`)
                .subscribe({
                  next: (me: any) => {
                    try {
                      localStorage.setItem("idra.me", JSON.stringify(me));
                    } catch (_) {}
                  },
                  error: () => {
                    // Non-blocking: portal navigation must continue even if provisioning fails.
                  }
                });
            }
            this.router.navigateByUrl('/pages');
            const storedLanguage = (localStorage.getItem(AuthCallbackComponent.LANGUAGE_STORAGE_KEY) || 'en')
              .toLowerCase();
            this.translateService.use(storedLanguage || 'en');
          } else {
            this.router.navigateByUrl('');
          }
          
        });
    } catch (error) {
      console.log(error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
