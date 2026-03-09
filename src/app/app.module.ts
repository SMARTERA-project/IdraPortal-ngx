/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClient, HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ConfigModule } from 'ngx-config-json';
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import { AppRoutingModule } from './app-routing.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NbDatepickerModule,
  NbDialogModule,
  NbMenuModule,
  NbSidebarModule,
  NbToastrModule,
  NbWindowModule,
  NbAlertModule,
  NbButtonModule,
  NbCheckboxModule,
  NbInputModule,
  NbSidebarService,
  NbOverlayContainerAdapter
} from '@nebular/theme';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { NbSecurityModule } from '@nebular/security';
import { MarkdownModule } from 'ngx-markdown';
import { RouterModule } from '@angular/router';
import { NgxEchartsModule } from 'ngx-echarts';
import { provideCodeEditor } from '@ngstack/code-editor';
import { NbAuthModule,  NbOAuth2AuthStrategy, NbOAuth2ClientAuthMethod, NbOAuth2GrantType, NbOAuth2ResponseType } from '@nebular/auth';
import { OidcJWTToken } from './pages/auth/oidc/oidc';
import { TokenInterceptor } from './pages/auth/services/token.interceptor';
import { JwtHelperService, JwtModule } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';
import { SmartEraOverlayContainerAdapter } from './@theme/overlay/smartera-overlay-container-adapter';
class GenericConfig<T> {
  constructor(public config: T) {}
}

const URL = 'https://raw.githubusercontent.com/BeOpen-project/IdraPortal-ngx-Translations';
const DEFAULT_AUTH_PROFILE = 'oidc';
const DEFAULT_CLIENT_ID = 'data-platform';
const DEFAULT_CLIENT_SECRET = '';
const DEFAULT_BASE_ENDPOINT = 'http://localhost/auth/realms/smartera/protocol/openid-connect';

export class CustomTranslateLoader implements TranslateLoader {
  
  constructor(private httpClient: HttpClient) { }

  getTranslation(lang: string): Observable<any> {
    const url = `${URL}/main/v1.0/${lang}.json`;
    let idra = this.httpClient.get(url);
   return idra;
  }
}

@NgModule({
  imports: [
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
    CommonModule,
    FormsModule,
    RouterModule,
    BrowserAnimationsModule,
    NbAlertModule,
    NbInputModule,
    NbButtonModule,
    NbCheckboxModule,
    BrowserModule,
    AppRoutingModule,
    NbSidebarModule.forRoot(),
    NbMenuModule.forRoot(),
    NbDatepickerModule.forRoot(),
    NbDialogModule.forRoot(),
    NbWindowModule.forRoot(),
    NbToastrModule.forRoot(),
    CoreModule.forRoot(),
    ThemeModule.forRoot(),
    MarkdownModule.forRoot(),
    ConfigModule.forRoot({
      pathToConfig: 'assets/config.json',
      configType: GenericConfig
    }),
    TranslateModule.forRoot({
      fallbackLang: 'en',
      loader: {
        provide: TranslateLoader,
        useClass: CustomTranslateLoader,
        deps: [HttpClient],
      },
    }),

    NbSecurityModule.forRoot({
      accessControl: {
        IDRA_ADMIN: {
          view: '*'
        },
        IDRA_EDITOR: {
          view: ['home', 'sparql', 'catalogues', 'mqa', 'statistics', 'datasets', 'administration']	
        },
        IDRA_VIEWER: {
          view: ['home', 'sparql', 'catalogues', 'datasets', 'mqa', 'statistics', 'administration']
        },
        IDRA_USER: {
          view: ['home', 'sparql', 'catalogues', 'datasets', 'mqa', 'statistics']
        }
      },
    }),
    JwtModule.forRoot({
      config: {
        tokenGetter: () => {
          return localStorage.getItem('token');

        }
      }
    }),
    NbAuthModule.forRoot({
      strategies: [
        NbOAuth2AuthStrategy.setup({
          name: DEFAULT_AUTH_PROFILE,
          clientId: DEFAULT_CLIENT_ID,
          clientSecret: DEFAULT_CLIENT_SECRET,
          baseEndpoint: DEFAULT_BASE_ENDPOINT,
          clientAuthMethod: NbOAuth2ClientAuthMethod.NONE,
          token: {
            endpoint: '/token',
            redirectUri: `/keycloak-auth/callback`,
            class: OidcJWTToken,
          },
          authorize: {
            endpoint: '/auth',
            scope: 'openid',
            redirectUri: `/keycloak-auth/callback`,
            responseType: NbOAuth2ResponseType.CODE
          },
          redirect: {
            success: '/pages', // welcome page path
            failure: null, // stay on the same page
          },
          refresh: {
            endpoint: '/token',
            grantType: NbOAuth2GrantType.REFRESH_TOKEN,
            scope:'openid'
          } 
          
        }),
        
      ],forms: {}}),
  ],
  providers: [
    NbSidebarService,
    provideHttpClient(withInterceptorsFromDi()),
    provideCodeEditor(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: NbOverlayContainerAdapter,
      useClass: SmartEraOverlayContainerAdapter,
    },
    JwtHelperService,
  ]
})
export class AppModule {
}
