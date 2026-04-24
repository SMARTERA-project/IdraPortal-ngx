import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OidcUserInformationService } from './oidc-user-information.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private userInfoService: OidcUserInformationService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.userInfoService.getRole().pipe(
      map(roles => {
        const allowed = roles.includes('IDRA_ADMIN') || roles.includes('IDRA_EDITOR');
        if (!allowed) {
          this.router.navigate(['/']);
        }
        return allowed;
      })
    );
  }
}
