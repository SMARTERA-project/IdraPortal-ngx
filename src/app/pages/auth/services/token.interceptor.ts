import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { NbAuthOAuth2JWTToken, NbAuthService } from '@nebular/auth';
import { finalize, shareReplay, switchMap } from 'rxjs/operators';
import { AppConfigService } from '../../../@core/services/app-config.service';
@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  // Shared refresh observable so concurrent expired requests trigger a single /token call.
  private refreshInFlight$?: Observable<NbAuthOAuth2JWTToken>;

  constructor(public auth: NbAuthService, private config: AppConfigService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // Public Idra endpoints that must NOT carry an Authorization header.
    const skipAuthEndpoints = [
      '/oauth2/token',
      '/openid-connect/token',
      // BFF token exchange: login/refresh must NOT carry a Bearer header
      // (and must not recurse through the refresh logic below).
      '/administration/oauth/token',
      '/api/menu-blocks',
      '/public/dashboards',
      '/Idra/api/v1/client/downloadFromUri',
    ];

    if (req.url.indexOf('/assets/') > -1) {
      return next.handle(req);
    }

    if (skipAuthEndpoints.some((endpoint) => req.url.includes(endpoint))) {
      return next.handle(req);
    }

    // Allowlist: only attach the Bearer token to requests targeting the Idra backend.
    // Everything else (MQA service, the i18n CDN, datalet hosts, arbitrary remote
    // catalogue URLs) must never receive the user's Keycloak token.
    const idraBaseUrl = this.config.config['idra_base_url'];
    if (!idraBaseUrl || !req.url.startsWith(idraBaseUrl)) {
      return next.handle(req);
    }

    return this.auth.getToken().pipe(
      switchMap((token: NbAuthOAuth2JWTToken) => {
        const accessToken = token?.getValue?.() || undefined;
        const tokenIsValid = typeof token?.isValid === 'function' && token.isValid();
        const payload = typeof token?.getPayload === 'function' ? token.getPayload() : null;
        const refreshToken = (payload as any)?.refresh_token;

        // Never logged in (no stored token at all): do not contact Keycloak.
        if (!accessToken && !refreshToken) {
          return next.handle(req);
        }

        // Access token still valid: attach header, no /token call needed.
        if (tokenIsValid) {
          return next.handle(this.withAuth(req, accessToken));
        }

        // Access token expired: only attempt /token refresh if refresh_token is still valid.
        if (!TokenInterceptor.isJwtNotExpired(refreshToken)) {
          return next.handle(req);
        }

        return this.refreshToken().pipe(
          switchMap((x: NbAuthOAuth2JWTToken) => {
            const t = x?.getValue?.() || (x?.getPayload() as any)?.access_token || undefined;
            return next.handle(t ? this.withAuth(req, t) : req);
          })
        );
      })
    );
  }

  private withAuth(req: HttpRequest<any>, token: string | undefined): HttpRequest<any> {
    if (!token) {
      return req;
    }
    return req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) });
  }

  private refreshToken(): Observable<NbAuthOAuth2JWTToken> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.auth.isAuthenticatedOrRefresh().pipe(
        switchMap(() => this.auth.getToken() as Observable<NbAuthOAuth2JWTToken>),
        finalize(() => { this.refreshInFlight$ = undefined; }),
        shareReplay(1),
      );
    }
    return this.refreshInFlight$;
  }

  private static isJwtNotExpired(jwt: string | undefined | null): boolean {
    if (!jwt || typeof jwt !== 'string') return false;
    const parts = jwt.split('.');
    if (parts.length !== 3) return false;
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return !!payload?.exp && (payload.exp * 1000) > Date.now();
    } catch {
      return false;
    }
  }
}
