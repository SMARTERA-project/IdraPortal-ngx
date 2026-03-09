import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
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
    return this.user
    ? (
        this.user.roles != undefined
        ? of(this.user.roles.map(role => role.toUpperCase()))
              : (this.user.realm_access != undefined && this.user.realm_access.roles != undefined
              ? of(this.user.realm_access.roles.map(role => role.toUpperCase()))
              : of(['IDRA_USER'])
          )
      )
    : of(['ANONYMOUS']);
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
