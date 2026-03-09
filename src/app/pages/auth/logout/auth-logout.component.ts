import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NbAuthResult, NbAuthService } from '@nebular/auth';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NB_WINDOW } from '@nebular/theme';
import { ConfigService } from 'ngx-config-json';


@Component({
  selector: 'nb-oauth2-logout',
  template: ``
})
export class AuthLogoutComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  constructor(private authService: NbAuthService,
    private router: Router,
    private config: ConfigService<Record<string, any>>,
    @Inject(NB_WINDOW) private window: Window) {
  }


  async ngOnInit(): Promise<void> {

    try {
      this.authService.logout(this.config.config["authProfile"])
        .pipe(takeUntil(this.destroy$))
        .subscribe((authResult: NbAuthResult) => {
          if (authResult.isSuccess()) {
            const keycloakBaseUrl = this.config.config["keyCloakBaseURL"] || this.config.config["idmBaseURL"] || '';
            const keycloakRealm = this.config.config["keyCloakRealmName"] || this.config.config["idmRealmName"] || 'smartera';
            const dashboardBaseUrl = this.config.config['dashboardBaseURL'] || this.window.location.origin;
            const clientId = this.config.config["client_id"] || 'data-platform';
            this.window.location.href =
              `${keycloakBaseUrl}/auth/realms/${keycloakRealm}/protocol/openid-connect/logout?post_logout_redirect_uri=${dashboardBaseUrl}/pages&client_id=${clientId}`
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
