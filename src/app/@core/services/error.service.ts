import { Injectable } from '@angular/core';
import { NbToastrService, NbComponentStatus } from '@nebular/theme';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { AppError, ErrorContext, ErrorSeverity } from './error.model';

// Master switch for the unified error system.
// Plan-18 stripped all direct toastr.show() calls from component HTTP error paths,
// so flipping this to true means the global ErrorService now drives every error
// notification. Inline success/warning toasts (operation outcomes, form validation)
// remain in components — they don't route through this service.
const ERROR_SERVICE_ENABLED = true;

@Injectable({ providedIn: 'root' })
export class ErrorService {
  private inline$ = new Subject<AppError>();
  readonly inlineErrors = this.inline$.asObservable();

  constructor(
    private toastr: NbToastrService,
    private translate: TranslateService,
    private router: Router,
  ) {}

  handle(error: AppError, context: ErrorContext = {}): void {
    console.warn(
      '[ErrorService]',
      error.code,
      'http=' + error.httpStatus,
      error.correlationId ? 'cid=' + error.correlationId : '',
      context.source ? 'src=' + context.source : '',
    );

    if (!ERROR_SERVICE_ENABLED) return;
    if (context.silent) return;

    // On 401 the session is gone — send the user to the Keycloak login route.
    if (error.httpStatus === 401) {
      this.router.navigate(['/keycloak-auth']);
    }

    const severity: ErrorSeverity = context.severity ?? this.defaultSeverity(error);
    const message = this.translate.instant(error.i18nKey, error.params ?? {});

    switch (severity) {
      case 'toast':
        this.toastr.show(message, this.translate.instant('ERR.TITLE'), {
          status: this.toastStatus(error.httpStatus),
          duration: 5000,
        });
        break;
      case 'inline':
        this.inline$.next(error);
        break;
      case 'page':
        this.router.navigate(['/error'], {
          queryParams: { code: error.code, correlationId: error.correlationId ?? '' },
        });
        break;
    }
  }

  private defaultSeverity(_error: AppError): ErrorSeverity {
    return 'toast';
  }

  private toastStatus(httpStatus: number): NbComponentStatus {
    if (httpStatus >= 500 || httpStatus === 0) return 'danger';
    if (httpStatus >= 400) return 'warning';
    return 'info';
  }
}
