import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { OidcJWTToken, UserClaims } from '../oidc/oidc';
import { NbAuthService } from '@nebular/auth';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class OidcUserInformationService {

  user: UserClaims;
  protected user$: BehaviorSubject<any> = new BehaviorSubject(null);

  constructor(
    private http: HttpClient,
    private authService: NbAuthService,
    private jwtHelper: JwtHelperService,
  ) {

    // this.idmUrl = configService.getSettings("idmBaseURL");
    this.authService.onTokenChange()
      .subscribe((token: any) => {
        if (!token || typeof token.isValid !== 'function' || !token.isValid()) {
          return;
        }

        // Prefer Nebular's OAuth2 JWT token API when available
        if (typeof token.getAccessTokenPayload === 'function') {
          this.user = token.getAccessTokenPayload() as UserClaims;
          this.publishUser(this.user);
          return;
        }

        // Fallback: try to decode access token if present
        try {
          const payloadSource = typeof token.getPayload === 'function' ? token.getPayload() : undefined;
          const accessToken: string | undefined = payloadSource?.access_token
            || (typeof token.getValue === 'function' ? token.getValue() : undefined);

          if (accessToken && accessToken.split('.').length === 3) {
            const decoded = this.jwtHelper.decodeToken(accessToken) as UserClaims;
            this.user = decoded;
            this.publishUser(this.user);
          }
        } catch {
          // ignore decode errors; no user info can be derived from this token
        }
      });

  }

  getRole(): Observable<string[]> {
    // Derive the role from the auth token rather than the `this.user` snapshot:
    // on a hard reload / deep-link the snapshot may not be populated yet, which
    // previously bounced a legitimate admin to '/'.
    //
    // isAuthenticatedOrRefresh() triggers a silent /token refresh when the access
    // token has expired but the refresh_token is still valid, THEN we read the
    // (refreshed) token. Without this, the short-lived access token expiring made
    // rolesFromToken() return ANONYMOUS and the AdminGuard kicked the user out
    // after a few minutes / on reload, even though the session was still alive.
    return this.authService.isAuthenticatedOrRefresh().pipe(
      switchMap(() => this.authService.getToken()),
      take(1),
      map(token => this.rolesFromToken(token)),
    );
  }

  private rolesFromToken(token: any): string[] {
    if (!token || typeof token.isValid !== 'function' || !token.isValid()) {
      return ['ANONYMOUS'];
    }

    let claims: UserClaims | undefined;
    if (typeof token.getAccessTokenPayload === 'function') {
      claims = token.getAccessTokenPayload() as UserClaims;
    } else {
      try {
        const payloadSource = typeof token.getPayload === 'function' ? token.getPayload() : undefined;
        const accessToken: string | undefined = payloadSource?.access_token
          || (typeof token.getValue === 'function' ? token.getValue() : undefined);
        if (accessToken && accessToken.split('.').length === 3) {
          claims = this.jwtHelper.decodeToken(accessToken) as UserClaims;
        }
      } catch {
        // ignore decode errors
      }
    }

    if (!claims) {
      return ['IDRA_USER'];
    }
    if (claims.roles != undefined) {
      return claims.roles.map(role => role.toUpperCase());
    }
    if (claims.realm_access != undefined && claims.realm_access.roles != undefined) {
      return claims.realm_access.roles.map(role => role.toUpperCase());
    }
    return ['IDRA_USER'];
  }

  getUser(): Observable<UserClaims> {
    return of(this.user);
  }

  private publishUser(user: any) {
    this.user$.next(user)
  }

  onUserChange(): Observable<any> {
    return this.user$;
  }



}
