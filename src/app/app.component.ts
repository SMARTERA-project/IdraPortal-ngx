/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Component } from '@angular/core';
import { AppConfigService } from './@core/services/app-config.service';
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
  private static readonly LANGUAGE_STORAGE_KEY = 'idraUserLanguage';

  constructor(
    oauthStrategy: NbOAuth2AuthStrategy,
    private config:AppConfigService,
    private translate: TranslateService,
    ) {
    const configuredLanguages = ((this.config.config['languages'] || []) as string[])
      .map((lang: string) => (lang || '').toString().trim().toLowerCase())
      .filter((lang: string) => lang.length > 0);
    const uniqueConfiguredLanguages = Array.from(new Set(configuredLanguages));
    const availableLanguages = uniqueConfiguredLanguages.length > 0
      ? uniqueConfiguredLanguages
      : ['en'];
    const fallbackLanguage = availableLanguages.includes('en') ? 'en' : availableLanguages[0];

    const storedLanguage = (localStorage.getItem(AppComponent.LANGUAGE_STORAGE_KEY) || '')
      .trim()
      .toLowerCase();
    const initialLanguage = availableLanguages.includes(storedLanguage)
      ? storedLanguage
      : fallbackLanguage;

    this.translate.addLangs(availableLanguages);
    this.translate.setFallbackLang('en');
    this.translate.use(initialLanguage);

    if (this.config.config['authenticationMethod']?.toLowerCase() !== 'keycloak') {
      throw new Error('Only keycloak authentication is supported.');
    }

    // Remove legacy BASIC auth local storage artifacts.
    localStorage.removeItem('username');

    const keycloakBaseUrl =
      this.config.config['keyCloakBaseURL'] ||
      this.config.config['idmBaseURL'] ||
      'http://localhost';
    const keycloakRealm =
      this.config.config['keyCloakRealmName'] ||
      this.config.config['idmRealmName'] ||
      'smartera';
    const dashboardBaseUrl =
      this.config.config['dashboardBaseURL'] || window.location.origin;
    const keycloakClientId =
      this.config.config['client_id'] || 'data-platform';
    const authProfile = this.config.config['authProfile'] || 'oidc';

    const keycloakOidcBase =
      `${keycloakBaseUrl}/auth/realms/${keycloakRealm}/protocol/openid-connect`;
    const idraBaseUrl = this.config.config['idra_base_url'] || '';
    // BFF token endpoint: the confidential client_secret lives only in Idra, which
    // performs the code/refresh exchange. The browser never holds the secret.
    const bffTokenEndpoint = `${idraBaseUrl}/Idra/api/v1/administration/oauth/token`;

    oauthStrategy.setOptions({
      name: authProfile,
      clientId: keycloakClientId,
      // baseEndpoint empty: authorize goes to Keycloak, token/refresh go to the
      // Idra BFF — both endpoints are absolute URLs below.
      baseEndpoint: '',
      clientAuthMethod: NbOAuth2ClientAuthMethod.NONE,
      token: {
        endpoint: bffTokenEndpoint,
        redirectUri: `${dashboardBaseUrl}/keycloak-auth/callback`,
        class: OidcJWTToken,
      },
      authorize: {
        endpoint: `${keycloakOidcBase}/auth`,
        scope: 'openid',
        redirectUri: `${dashboardBaseUrl}/keycloak-auth/callback`,
        responseType: NbOAuth2ResponseType.CODE
      },
      redirect: {
        success: '/pages',
        failure: null,
      },
      refresh: {
        endpoint: bffTokenEndpoint,
        grantType: NbOAuth2GrantType.REFRESH_TOKEN,
        scope: 'openid'
      }
    });
  }
}
