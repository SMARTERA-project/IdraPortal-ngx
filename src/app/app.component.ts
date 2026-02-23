/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component } from '@angular/core';
import { ConfigService } from 'ngx-config-json';
import { environment } from '../environments/environment';
import { NbOAuth2AuthStrategy, NbOAuth2ClientAuthMethod, NbOAuth2GrantType, NbOAuth2ResponseType } from '@nebular/auth';
import { OidcJWTToken } from './pages/auth/oidc/oidc';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
@Component({
  standalone: true,
  imports: [RouterOutlet],
  selector: 'ngx-app',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent {

  constructor(
    oauthStrategy: NbOAuth2AuthStrategy,
    private config:ConfigService<Record<string, any>>,
    private translate: TranslateService,
    ) {
    this.translate.addLangs(['en']);
    this.translate.setFallbackLang('en');
    this.translate.use('en');

    if (this.config.config['authenticationMethod']?.toLowerCase() !== 'keycloak') {
      throw new Error('Only keycloak authentication is supported.');
    }

    // Remove legacy BASIC auth local storage artifacts.
    localStorage.removeItem('username');

    oauthStrategy.setOptions({
      name: environment.authProfile,
      clientId: environment.client_id,
      clientSecret: environment.client_secret,
      baseEndpoint: `${this.config.config["keyCloakBaseURL"]}/auth/realms/${environment.idmRealmName}/protocol/openid-connect`,
      clientAuthMethod: NbOAuth2ClientAuthMethod.NONE,
      token: {
        endpoint: '/token',
        redirectUri: `${this.config.config["dashboardBaseURL"]}/keycloak-auth/callback`,
        class: OidcJWTToken,
      },
      authorize: {
        endpoint: '/auth',
        scope: 'openid',
        redirectUri: `${this.config.config["dashboardBaseURL"]}/keycloak-auth/callback`,
        responseType: NbOAuth2ResponseType.CODE
      },
      redirect: {
        success: '/pages',
        failure: null,
      },
      refresh: {
        endpoint: '/token',
        grantType: NbOAuth2GrantType.REFRESH_TOKEN,
        scope: 'openid'
      }
    });
  }
}
