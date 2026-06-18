import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NbAuthService, NbAuthOAuth2JWTToken } from '@nebular/auth';
import { AppConfigService } from '../../../@core/services/app-config.service';



@Component({
  selector: 'nb-oauth2-login',
  template: ``,
})
export class AuthLoginComponent implements OnDestroy {
  token: NbAuthOAuth2JWTToken;
  private destroy$ = new Subject<void>();

  constructor(private authService: NbAuthService, private config:AppConfigService,) {
    this.login();
    this.authService.onTokenChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((token: NbAuthOAuth2JWTToken) => {
        this.token = null;
        if (token && token.isValid()) {
          this.token = token;
        }
      });
  }

  login() {
    this.authService
      .authenticate(this.config.config["authProfile"]) 
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        // No-op: subscribing triggers the redirect side-effect
        next: () => {},
        error: () => {},
      });
  }

  logout() {
    this.authService
      .logout(this.config.config["authProfile"]) 
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {},
        error: () => {},
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
