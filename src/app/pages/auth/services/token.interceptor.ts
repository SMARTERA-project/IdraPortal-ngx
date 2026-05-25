import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { NbAuthOAuth2JWTToken, NbAuthOAuth2Token, NbAuthService } from '@nebular/auth';
import { switchMap, tap } from 'rxjs/operators';
import { ConfigService } from 'ngx-config-json';
@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(public auth: NbAuthService, private config: ConfigService<Record<string, any>>) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const skipAuthEndpoints = [
      '/oauth2/token',
      '/openid-connect/token',
      '/api/menu-blocks',
      '/public/dashboards',
      '/Idra/api/v1/client/downloadFromUri',
    ];

    if (req.url.indexOf('/assets/') > -1) {
      return next.handle(req);
    }

    // if (req.url.includes('/IdraPortal-ngx-Translations')) {
    //   const clonedReq = req.clone({
    //     headers: req.headers.delete('Authorization')
    //   });
    //   console.log('Request to IdraPortal-ngx-Translations, removing Authorization header.');
    //   return next.handle(clonedReq);
    // }

    if (skipAuthEndpoints.some((endpoint) => req.url.includes(endpoint))) {
      return next.handle(req);
    }


    /*if( (req.url.indexOf('/api/v1/') > -1 
      || req.url.indexOf('/home') > -1 
      || req.url.indexOf('/login') > -1 
      || req.url.indexOf('/static') > -1) &&  this.config.config["authenticationMethod"].toLowerCase() === "keycloak") {
      let crsftoken = localStorage.getItem('crsftoken');
      let headers = req.headers;
      headers = headers.set("X-CSRF-TOKEN", crsftoken || "");
      req = req.clone({ headers: headers });
      console.log('Request to API v1, home, login, or static, adding CSRF token.');
      return next.handle(req);
    }*/
    
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
          let newHeaders = req.headers;
          if (!req.url.includes('/IdraPortal-ngx-Translations')) {
            newHeaders = newHeaders.set('Authorization', `Bearer ${accessToken}`);
          }
          return next.handle(req.clone({ headers: newHeaders }));
        }

        // Access token expired: only attempt /token refresh if refresh_token is still valid.
        if (!TokenInterceptor.isJwtNotExpired(refreshToken)) {
          return next.handle(req);
        }

        return this.auth.isAuthenticatedOrRefresh().pipe(
          switchMap(() => this.auth.getToken().pipe(
            switchMap((x: NbAuthOAuth2JWTToken) => {
              const t =
                x.getValue?.() ||
                x.getPayload()?.access_token ||
                sessionStorage.getItem('token') ||
                undefined;
              let newHeaders = req.headers;
              if (t && !req.url.includes('/IdraPortal-ngx-Translations')) {
                newHeaders = newHeaders.set('Authorization', `Bearer ${t}`);
              }
              return next.handle(req.clone({ headers: newHeaders }));
            })
          ))
        );
      })
    );
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
