import { Injectable, Injector } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorService } from '../services/error.service';
import { AppError, SUPPRESS_GLOBAL_ERROR_HEADER } from '../services/error.model';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  // Lazy-resolve ErrorService via Injector to break the circular DI:
  //   HttpErrorInterceptor -> ErrorService -> TranslateService -> HttpClient (-> interceptors).
  // Eager constructor injection of ErrorService here caused TranslateService to
  // initialize with a half-built HttpClient chain, leaving the translation
  // loader silently emitting nothing on success.
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const suppress = req.headers.has(SUPPRESS_GLOBAL_ERROR_HEADER);
    // Strip the marker so it never reaches the server.
    const outgoing = suppress
      ? req.clone({ headers: req.headers.delete(SUPPRESS_GLOBAL_ERROR_HEADER) })
      : req;

    return next.handle(outgoing).pipe(
      catchError((err: HttpErrorResponse) => {
        const appError = normalize(err);
        if (!suppress) {
          this.injector.get(ErrorService).handle(appError);
        }
        return throwError(() => appError);
      }),
    );
  }
}

function normalize(err: HttpErrorResponse): AppError {
  if (err.status === 0) {
    return {
      code: 'NETWORK_OFFLINE',
      httpStatus: 0,
      i18nKey: 'ERR.NETWORK.OFFLINE',
      correlationId: readCorrelationId(err),
      raw: err,
    };
  }
  const body: any = err.error ?? {};
  const code: string = body.errorCode || fallbackCodeFromStatus(err.status);
  return {
    code,
    httpStatus: err.status,
    i18nKey: codeToI18nKey(code),
    correlationId: body.correlationId || readCorrelationId(err),
    raw: err,
  };
}

function readCorrelationId(err: HttpErrorResponse): string | undefined {
  return err.headers?.get?.('X-Correlation-Id') ?? undefined;
}

function fallbackCodeFromStatus(status: number): string {
  if (status === 401) return 'ERR_UNAUTHORIZED';
  if (status === 403) return 'ERR_FORBIDDEN';
  if (status === 404) return 'ERR_NOT_FOUND';
  if (status === 409) return 'ERR_CONFLICT';
  if (status === 504) return 'ERR_TIMEOUT';
  if (status >= 500) return 'ERR_INTERNAL';
  if (status >= 400) return 'ERR_BAD_REQUEST';
  return 'ERR_INTERNAL';
}

const CLIENT_CODE_MAP: Record<string, string> = {
  NETWORK_OFFLINE: 'ERR.NETWORK.OFFLINE',
  CLIENT_TIMEOUT: 'ERR.NETWORK.TIMEOUT',
};

function codeToI18nKey(code: string): string {
  if (code.startsWith('ERR_')) {
    return 'ERR.' + code.substring(4).replace(/_/g, '.');
  }
  return CLIENT_CODE_MAP[code] ?? 'ERR.GENERIC.INTERNAL';
}
