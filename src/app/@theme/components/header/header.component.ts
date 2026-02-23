import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService, NbMenuItem, NB_WINDOW, NbIconModule, NbSelectModule, NbActionsModule, NbUserModule, NbButtonModule, NbContextMenuModule, NbThemeModule } from '@nebular/theme';


import { LayoutService } from '../../../@core/utils';
import {filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { UserClaims } from '../../../pages/auth/oidc/oidc';
import { Router } from '@angular/router';
import { OidcUserInformationService } from '../../../pages/auth/services/oidc-user-information.service';
import { ConfigService } from 'ngx-config-json';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NbAuthJWTToken, NbAuthService } from '@nebular/auth';
import { Observable } from 'rxjs';
import { SharedService } from '../../../pages/services/shared.service';



@Component({
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    NbIconModule,
    NbSelectModule,
    NbActionsModule,
    NbUserModule,
    NbButtonModule,
    NbContextMenuModule,
  ],
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();
  private readonly THEME_STORAGE_KEY = 'idraTheme';
  userPictureOnly: boolean = false;
  user: UserClaims;
  userMenuDefault: NbMenuItem[] = [];
  authenticationEnabled:boolean=false;
  typeLogin = "";
  userMenu: NbMenuItem[] = [];
  public idraUserLanguage: string;
  public readonly materialTheme$: Observable<boolean>;
  public languages = [];
  public themes = [
    {
      value: 'material-smartera',
      name: 'SmartEra',
    },
    // {
    //   value: 'default',
    //   name: 'Light',
    // },
    {
      value: 'dark',
      name: 'Dark',
    },
    {
      value: 'cosmic',
      name: 'Cosmic',
    },
    // {
    //   value: 'corporate',
    //   name: 'Corporate',
    // },
  ];
  public currentTheme: string = 'material-smartera';
  public logoPath: string = 'assets/images/Smart_Era_X_Idra.png';
  authenticated: boolean = false;

  constructor(private sidebarService: NbSidebarService,
              private menuService: NbMenuService,
              private themeService: NbThemeService,
              private userService: OidcUserInformationService,
              private layoutService: LayoutService,
              private configService: ConfigService<Record<string, any>>,
              @Inject(NB_WINDOW) private window,
              private breakpointService: NbMediaBreakpointsService,
              private router: Router,
              private authService: NbAuthService,
              private translate: TranslateService,
              private sharedService: SharedService,
              ) {
    this.typeLogin = this.configService.config["authenticationMethod"];
    this.materialTheme$ = this.themeService.onThemeChange()
      .pipe(map(theme => {
        const themeName: string = theme?.name || '';
        return themeName.startsWith('material');
      }));

    this.authService.onTokenChange()
      .subscribe((token: NbAuthJWTToken) => {
        if (token.isValid()) {
          this.authenticated = true;
        } else {
          this.authenticated = false;
        }
      });
  }
  
  ngOnInit() {
    const savedTheme = this.window?.localStorage?.getItem(this.THEME_STORAGE_KEY);
    if (savedTheme && this.themes.some(t => t.value === savedTheme)) {
      this.currentTheme = savedTheme;
    }
    this.changeTheme(this.currentTheme);
    this.idraUserLanguage = 'en';

    let lan = this.configService.config['languages'];

    lan.forEach(x => {
      let f = x;
      if (x == 'en') f = 'gb'
      if (x == 'sp') f = 'es'
      //this.languages.push({lan:x,flag: `flag-icon flag-icon-${f} flag-icon-squared` })
      this.languages.push({ lan: x, flag: f, picture: `assets/flags/${f}.svg` })
    })
    this.translate.use(this.idraUserLanguage);
    this.sharedService.propagateDialogSelectedLanguage(this.idraUserLanguage);

    if(this.typeLogin.toLowerCase() === "keycloak"){
    this.currentTheme = this.themeService.currentTheme;
    console.log(this.user);
    this.authenticationEnabled=this.configService.config["enableAuthentication"];
       this.userMenuDefault = [
      {
        title: "Login",
        data: { tag: "login" },
       url: `${this.configService.config['dashboardBaseURL']}/keycloak-auth/`
      },
    ];
    this.userMenu = [
      { title: 'Profile', url: `${this.configService.config['keyCloakBaseURL']}/auth/realms/${this.configService.config['keyCloakRealmName']}/account`,target:'_blank' },
      { title: 'Log out', data: { tag: "logout" }, url:`${this.configService.config['dashboardBaseURL']}/keycloak-auth/logout` }
    ]

    this.userService.onUserChange()
    .subscribe((user: any) => {this.user = user; console.log(this.user);  console.log("updateUser");
    });

    const { xl } = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);

    this.themeService.onThemeChange()
      .pipe(
        map(({ name }) => name),
        takeUntil(this.destroy$),
      )
      .subscribe(themeName => {
        this.currentTheme = themeName;
        try { this.window?.localStorage?.setItem(this.THEME_STORAGE_KEY, themeName); } catch (e) {}
      });
      this.menuService.onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'user-menu'),
        map(({ item: { data } }) => data),
      )
      .subscribe(res => {
        if (res["tag"] == "logout") {
          this.router.navigate([`${this.configService.config['dashboardBaseURL']}/keycloak-auth/logout`]);
        }
      });
    }
  }


  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeTheme(themeName: string) {
    this.currentTheme = themeName;
    this.themeService.changeTheme(themeName);
    this.updateLogo(themeName);
    try { this.window?.localStorage?.setItem(this.THEME_STORAGE_KEY, themeName); } catch (e) {}
  }

  private updateLogo(themeName: string) {
    if (themeName === 'material-smartera') {
      this.logoPath = 'assets/images/Smart_Era_X_Idra.png';
    } else {
      this.logoPath = 'assets/images/idra_logo.png';
    }
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();

    return false;
  }

  navigateHome() {
    this.router.navigate(['/pages/home']);
    return false;
  }

  changeLang(event) {
    this.translate.use(event);
    this.sharedService.propagateDialogSelectedLanguage(event);
  }
}
